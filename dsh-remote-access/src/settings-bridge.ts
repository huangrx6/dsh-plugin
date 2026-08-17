/**
 * 设置桥 host 端：把设置平面的读写从 loopback-only 的官方 /api 通道，
 * 代理到本插件自己的 trusted-host RPC 通道，让远程浏览器（手机）成为
 * 完整的配置客户端。
 *
 * 为什么需要：dsh 官方在 dsh-client-connection 里把整个 settings 平面
 * 硬编码进 PRIVILEGED_METHODS（loopback-only，且 trusted 表硬编码为空，
 * 注释明说"保持到真正的认证层存在"）。远程浏览器因此连 settings.describe
 * 都 403，官方设置页在手机上退化为不可用。
 *
 * 本桥不绕过任何官方机制：host 进程内调用 ctx.settings 是合法的进程内
 * 服务消费（与 dsh-host-apiproxy 转发 /api/settings.* 到同一服务完全
 * 同源）；桥自身的 RPC 通道走 trusted-host 权威（Tailscale 设备级认证
 * 兜底，与 dsh-layout 88c743b 同模式）。
 *
 * 透传面与官方 apiproxy 同构（describe/update/replace/mutate；openDocument
 * 是"打开宿主本地文件"，远程端无意义，不代理）：
 *  - describe → { writable, hasDocument, namespaces:[namespaceView...] }
 *    （namespaceView 映射逐字段对齐 apiproxy：ns/schema/value/base?/user?/
 *     applies/secrets[{path,set}]/revision；redactSecrets:true 永远开，
 *     secret 值永不出网）
 *  - update/replace/mutate → 官方 revision 并发协议原样透传，冲突映射
 *    settings-conflict，其余 settings-rejected（错误码与官方一致）
 *
 * 白名单：settingsBridge.namespaces 支持 '*'（暴露进程内全部 namespace，
 * 即"全部配置"）；默认即 '*'（本仓库是个人插件，用户明确要求全量）。
 * 收窄（如 ['ui-theme']）在插件 config 里覆盖即可。
 *
 * 推送半边白送：官方 api-remotes 的 FORWARDED_EVENTS 已包含
 * settings/document-updated，远程端现成可听——桥只补读+写两个方向。
 */
import type { Context } from '@deepseek-ai/cordis'
import { SettingsConflictError } from '@deepseek-ai/dsh-settings'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'

/** 插件配置（bundle patch 行 config，用户可在自己的 patch 层覆盖）。 */
export interface SettingsBridgeConfig {
  /** 桥总开关；false 时 bridge endpoint 报错并提示。 */
  readonly enabled: boolean
  /** 允许代理的 namespace 白名单；'*' = 全部（全部配置面）。 */
  readonly namespaces: readonly string[]
}

export const DEFAULT_BRIDGE_CONFIG: SettingsBridgeConfig = {
  enabled: true,
  namespaces: ['*'],
}

/** 官方 settings.describe 返回的 namespace 描述符（apiproxy 同构）。 */
export interface SettingsDescriptor {
  readonly ns: string
  readonly schema: unknown
  readonly value: unknown
  readonly base?: unknown
  readonly user?: unknown
  readonly applies?: unknown
  readonly secrets?: readonly { readonly path: readonly string[]; readonly set: boolean }[]
  readonly revision: number | undefined
}

/** apiproxy namespaceView 同构（客户端 UNARY_VALUE_SCHEMAS 依赖这些字段）。 */
export interface BridgeNamespaceView {
  readonly ns: string
  readonly schema: unknown
  readonly value: unknown
  readonly base?: unknown
  readonly user?: unknown
  readonly applies?: unknown
  readonly secrets: readonly { readonly path: readonly string[]; readonly set: boolean }[]
  readonly revision: number | undefined
}

export interface BridgeDescribeView {
  readonly writable: boolean
  readonly hasDocument: boolean
  readonly namespaces: readonly BridgeNamespaceView[]
}

/** 旧窄桥的 list 响应（保留兼容既有测试与状态面板）。 */
export interface BridgeListView {
  readonly namespaces: Readonly<Record<string, { readonly value: unknown; readonly revision: number | undefined }>>
}

/** 进程内 settings 服务的最小面（保持结构化以利单测注入）。 */
export interface SettingsLike {
  readonly writable: boolean
  readonly documentPath: string | undefined
  describe(options?: { redactSecrets?: boolean }): SettingsDescriptor[]
  get(ns: string): unknown
  /** 旧窄桥 set 用；官方 update/replace/mutate 之外的自有形态。 */
  write(ns: string, input: Record<string, unknown>, mode: 'merge', expectedRevision: number | undefined): Promise<void>
  update(ns: string, patch: unknown, expectedRevision: number | undefined): Promise<void>
  replace(ns: string, section: unknown, expectedRevision: number | undefined): Promise<void>
  mutate(ns: string, ops: readonly unknown[], expectedRevision: number | undefined): Promise<void>
}

function ok(value: unknown): RpcResult<unknown> { return { ok: true, value } }
function bad(message: string): RpcResult<unknown> {
  return { ok: false, error: { code: 'bad-request', message, details: { issues: [] } } }
}
function rejected(code: string, message: string, details: Record<string, unknown>): RpcResult<unknown> {
  return { ok: false, error: { code: code as RpcResult<unknown> extends { ok: false; error: { code: infer C } } ? C : never, message, details } }
}

/** apiproxy namespaceView 的逐字段镜像。 */
function namespaceView(descriptor: SettingsDescriptor): BridgeNamespaceView {
  return {
    ns: String(descriptor.ns),
    schema: descriptor.schema,
    value: descriptor.value,
    ...(descriptor.base === undefined ? {} : { base: descriptor.base }),
    ...(descriptor.user === undefined ? {} : { user: descriptor.user }),
    applies: descriptor.applies,
    secrets: (descriptor.secrets ?? []).map(secret => ({
      path: [...secret.path],
      set: secret.set,
    })),
    revision: descriptor.revision,
  }
}

/**
 * 桥端点实现。op 面：
 *  - 'describe' / 'update' / 'replace' / 'mutate'：官方 apiproxy 同构透传；
 *  - 'list' / 'set'：旧窄桥（白名单值级读写），保留兼容。
 * 纯函数化注入 settings，单测无需真服务。
 */
export function createBridgeHandler(settings: SettingsLike, config: SettingsBridgeConfig) {
  const allowAll = config.namespaces.includes('*')
  const allowed = (ns: string): boolean => allowAll || config.namespaces.includes(ns)

  const descriptorOf = (ns: string): SettingsDescriptor | undefined =>
    settings.describe({ redactSecrets: true }).find(candidate => candidate.ns === ns)

  /** 官方 settingsWrite 的错误折叠镜像（conflict / rejected）。
   *  判定优先官方稳定机器码 SETTINGS_CONFLICT（dsh-settings 源码注释：
   *  "Stable machine code for wire layers mapping this to their own
   *  taxonomy"）——插件与宿主可能各自解析一份 dsh-settings 模块，跨实例
   *  instanceof 不可靠，机器码是官方设计的跨层识别方式。 */
  const isConflict = (error: unknown): error is { message: string; expected: number; actual: number } =>
    error instanceof SettingsConflictError
    || (typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'SETTINGS_CONFLICT')

  const writeRejected = (ns: string, error: unknown): RpcResult<unknown> => {
    if (isConflict(error)) {
      const conflict = error as { message: string; expected?: number; actual?: number }
      return rejected('settings-conflict', conflict.message ?? String(error), { ns, expected: conflict.expected, actual: conflict.actual })
    }
    return rejected('settings-rejected', error instanceof Error ? error.message : String(error), { ns })
  }

  return async (operation: string, payload: unknown): Promise<RpcResult<unknown>> => {
    if (!config.enabled) return bad('设置桥已在配置中关闭（settingsBridge.enabled=false）。')
    const body = payload as {
      ns?: unknown; fields?: unknown; revision?: unknown
      patch?: unknown; section?: unknown; ops?: unknown; expectedRevision?: unknown
    } | null
    const revisionFrom = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined)

    if (operation === 'describe') {
      const namespaces = settings.describe({ redactSecrets: true })
        .filter(entry => allowed(entry.ns))
        .map(namespaceView)
      return ok({ writable: settings.writable, hasDocument: settings.documentPath !== undefined, namespaces } satisfies BridgeDescribeView)
    }

    if (operation === 'update' || operation === 'replace' || operation === 'mutate') {
      const inner = (payload as { payload?: { ns?: unknown; patch?: unknown; section?: unknown; ops?: unknown; expectedRevision?: unknown } } | null)?.payload ?? {}
      const ns = typeof inner.ns === 'string' ? inner.ns : ''
      if (ns === '') return bad('缺少 namespace')
      if (!allowed(ns)) return bad(`namespace "${ns}" 不在桥白名单中`)
      const expectedRevision = revisionFrom(inner.expectedRevision)
      const arg = operation === 'update' ? inner.patch : operation === 'replace' ? inner.section : inner.ops
      try {
        if (operation === 'update') await settings.update(ns, arg, expectedRevision)
        else if (operation === 'replace') await settings.replace(ns, arg, expectedRevision)
        else await settings.mutate(ns, arg as readonly unknown[], expectedRevision)
      } catch (error) {
        return writeRejected(ns, error)
      }
      const descriptor = descriptorOf(ns)
      if (descriptor === undefined) return rejected('internal', `settings namespace "${ns}" 在写入后消失`, {})
      return ok(namespaceView(descriptor))
    }

    if (operation === 'list') {
      const out: Record<string, { value: unknown; revision: number | undefined }> = {}
      for (const entry of settings.describe({ redactSecrets: true })) {
        if (!allowed(entry.ns)) continue
        let value: unknown
        try { value = settings.get(entry.ns) } catch { value = undefined }
        out[entry.ns] = { value, revision: entry.revision }
      }
      return ok({ namespaces: out } satisfies BridgeListView)
    }

    if (operation === 'set') {
      const ns = typeof body?.ns === 'string' ? body.ns : ''
      if (ns === '') return bad('缺少 namespace')
      if (!allowed(ns)) return bad(`namespace "${ns}" 不在桥白名单中`)
      const fields = body?.fields
      if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) {
        return bad('fields 必须是对象')
      }
      try {
        await settings.write(ns, fields as Record<string, unknown>, 'merge', revisionFrom(body?.revision))
      } catch (error) {
        return bad(`写入失败：${error instanceof Error ? error.message : String(error)}`)
      }
      return ok({ ns, revision: descriptorOf(ns)?.revision })
    }

    return bad(`未知操作：${operation}`)
  }
}

/** 从 ctx 提取进程内 settings 服务；缺失时返回 undefined（组合根据此跳过桥）。 */
export function settingsOf(ctx: Context): SettingsLike | undefined {
  return (ctx as unknown as { settings?: SettingsLike }).settings
}
