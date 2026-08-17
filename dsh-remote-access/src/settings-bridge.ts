/**
 * 设置桥（窄桥）host 端：把白名单 namespace 的设置读写从 loopback-only
 * 的官方 /api 通道，代理到本插件自己的 trusted-host RPC 通道。
 *
 * 为什么需要：dsh 官方在 dsh-client-connection 里把整个 settings 平面
 * 硬编码进 PRIVILEGED_METHODS（loopback-only，注释明说"保持到真正的
 * 认证层存在"）。远程浏览器（手机）的 SettingsScope 因此退化为纯内存，
 * PC 与手机的外观偏好互不可见。本桥**不绕过官方通道**——host 进程内
 * 调用 ctx.settings 是合法的进程内服务消费，不经过任何 fence；桥自己
 * 的 RPC 通道走 trusted-host 权威（与 dsh-layout 88c743b 同模式）。
 *
 * 推送半边白送：官方 api-remotes 的 FORWARDED_EVENTS 已包含
 * settings/document-updated，远程端 ctx.remote.$on 现成可听——桥只补
 * "读 + 写"两个方向，变更通知复用官方转发，不自造广播。
 *
 * 安全边界自持：
 *  - 只代理白名单 namespace（默认 ui-theme / ui-onboarding 这类无害
 *    外观偏好），credentials.* 与其余配置面**永不出现在桥上**；
 *  - 总开关 + 白名单都是插件 config（cordis.patch.yml 可覆盖），
 *    关闭即 bridge endpoint 报错退场；
 *  - 写入走官方 ctx.settings.write 的 revision 并发协议，冲突即报错。
 */
import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-settings'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'

/** 插件配置（bundle patch 行 config，用户可在自己的 patch 层覆盖）。 */
export interface SettingsBridgeConfig {
  /** 桥总开关；false 时 bridge endpoint 报错并提示。 */
  readonly enabled: boolean
  /** 允许代理的 settings namespace 白名单。 */
  readonly namespaces: readonly string[]
}

export const DEFAULT_BRIDGE_CONFIG: SettingsBridgeConfig = {
  enabled: true,
  namespaces: ['ui-theme', 'ui-onboarding'],
}

export interface BridgeNamespaceView {
  readonly value: unknown
  readonly revision: number | undefined
}

export interface BridgeListView {
  readonly namespaces: Readonly<Record<string, BridgeNamespaceView>>
}

/** 进程内 settings 服务的最小面（保持结构化以利单测注入）。 */
export interface SettingsLike {
  get(ns: string): unknown
  write(ns: string, input: Record<string, unknown>, mode: 'merge', expectedRevision: number | undefined): Promise<void>
  describe(options?: { redactSecrets?: boolean }): { ns: string; revision: number | undefined }[]
}

function ok(value: unknown): RpcResult<unknown> { return { ok: true, value } }
function bad(message: string): RpcResult<unknown> {
  return { ok: false, error: { code: 'bad-request', message, details: { issues: [] } } }
}

/**
 * 桥端点实现：`bridge.list`（读全部白名单 namespace）/ `bridge.set`
 * （写一个 namespace 的若干字段）。纯函数化注入 settings，单测无需真服务。
 */
export function createBridgeHandler(settings: SettingsLike, config: SettingsBridgeConfig) {
  const allowed = (ns: string): boolean => config.namespaces.includes(ns)

  return async (operation: string, payload: unknown): Promise<RpcResult<unknown>> => {
    if (!config.enabled) return bad('设置桥已在配置中关闭（settingsBridge.enabled=false）。')
    const body = payload as { ns?: unknown; fields?: unknown; revision?: unknown } | null

    if (operation === 'list') {
      const out: Record<string, BridgeNamespaceView> = {}
      for (const entry of settings.describe({ redactSecrets: true })) {
        if (!allowed(entry.ns)) continue
        out[entry.ns] = { value: safeGet(settings, entry.ns), revision: entry.revision }
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
      const revision = typeof body?.revision === 'number' ? body.revision : undefined
      try {
        await settings.write(ns, fields as Record<string, unknown>, 'merge', revision)
      } catch (error) {
        return bad(`写入失败：${error instanceof Error ? error.message : String(error)}`)
      }
      return ok({ ns, revision: revisionOf(settings, ns) })
    }

    return bad(`未知操作：${operation}`)
  }
}

/** 从 ctx 提取进程内 settings 服务；缺失时返回 undefined（组合根据此跳过桥）。 */
export function settingsOf(ctx: Context): SettingsLike | undefined {
  return (ctx as unknown as { settings?: SettingsLike }).settings
}

function safeGet(settings: SettingsLike, ns: string): unknown {
  try { return settings.get(ns) } catch { return undefined }
}

function revisionOf(settings: SettingsLike, ns: string): number | undefined {
  try {
    const entry = settings.describe().find(d => d.ns === ns)
    return entry?.revision
  } catch { return undefined }
}
