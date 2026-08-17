/**
 * 设置桥 client 端（远程浏览器侧）：让手机端的外观跟随 Mac 上的白名单
 * 设置，并在手机端修改时写回。
 *
 * 机制（全部复用官方链路，无自造协议）：
 *  - 初拉：RPC bridge.list → 白名单 namespace 的值 + revision；
 *  - 跟随：官方 api-remotes 的 FORWARDED_EVENTS 已含
 *    settings/document-updated——远程端 ctx.remote.$on 现成可听，
 *    Mac 上任何设置变化都会推送（ns, revision）→ 命中白名单即重拉该 ns；
 *  - 应用：外观（ui-theme.preference）经官方 ctx.theme 服务 setTheme()
 *    采纳（进程内内存态，ThemeRuntime.adopt 同语义）；
 *  - 写回：手机端修改 → bridge.set（revision 并发协议）→ 官方事件广播
 *    → Mac 端 SettingsScope 自动刷新。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle, ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { DSH_REMOTE_ACCESS_CHANNEL } from '../contracts.ts'

interface ThemeLike {
  setTheme(id: string): void
}

interface RemoteLike {
  $on(event: string, listener: (...args: unknown[]) => void): () => void
}

interface BridgeListView {
  readonly namespaces: Readonly<Record<string, { value: unknown; revision: number | undefined }>>
}

async function rpcCall(rpc: ClientConnectionRpc, op: string, payload: unknown): Promise<BridgeListView | { ns: string }> {
  const result = await rpc.call(DSH_REMOTE_ACCESS_CHANNEL, 'bridge', { op, ...payload as object })
  if (!result.ok) throw new Error(result.error.message)
  return result.value as BridgeListView
}

export class SettingsBridgeClient {
  private revisions = new Map<string, number | undefined>()
  private lastPreference: string | undefined
  private disposers: (() => void)[] = []

  constructor(
    private readonly rpc: ClientConnectionRpc,
    private readonly theme: ThemeLike | undefined,
    private readonly remote: RemoteLike | undefined,
  ) {}

  install(): () => void {
    void this.refresh()
    // 官方转发事件：payload = (ns, revision)。命中已跟踪的 ns 就重拉。
    if (this.remote !== undefined) {
      this.disposers.push(this.remote.$on('settings/document-updated', (...args) => {
        const ns = typeof args[0] === 'string' ? args[0] : undefined
        if (ns !== undefined && this.revisions.has(ns)) void this.refresh(ns)
      }))
    }
    return () => {
      for (const dispose of this.disposers) dispose()
      this.disposers = []
    }
  }

  /** 拉取（默认全量）白名单 namespace 并应用外观。 */
  private async refresh(only?: string): Promise<void> {
    try {
      const view = await rpcCall(this.rpc, 'list', {}) as BridgeListView
      for (const [ns, entry] of Object.entries(view.namespaces)) {
        this.revisions.set(ns, entry.revision)
        if (ns === 'ui-theme') this.applyTheme(entry.value)
      }
      void only
    } catch {
      // 桥不可用（宿主未装本插件 / 已关 / RPC 失败）：静默退化为原生行为。
    }
  }

  /** 手机端改外观 → 写回 Mac。 */
  async setThemePreference(preference: string): Promise<void> {
    const revision = this.revisions.get('ui-theme')
    await rpcCall(this.rpc, 'set', { ns: 'ui-theme', fields: { preference }, revision })
  }

  private applyTheme(value: unknown): void {
    const preference = (value as { preference?: unknown } | undefined)?.preference
    if (typeof preference !== 'string') return
    if (preference === this.lastPreference) return
    this.lastPreference = preference
    try {
      this.theme?.setTheme(preference)
    } catch {
      // 未知主题 id（自定义主题未注册等）：忽略，保持当前外观。
    }
  }
}

/** 组合入口：从 ClientContext 提取依赖并安装桥。 */
export function installSettingsBridgeClient(ctx: ClientContext): (() => void) | undefined {
  const connection = (ctx as unknown as { connection?: ConnectionHandle }).connection
  const theme = (ctx as unknown as { theme?: ThemeLike }).theme
  const remote = (ctx as unknown as { remote?: RemoteLike }).remote
  if (connection === undefined || theme === undefined) return undefined
  return new SettingsBridgeClient(connection.rpc, theme, remote).install()
}
