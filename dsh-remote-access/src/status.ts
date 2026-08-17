/**
 * 用例层：把领域数据（tailscale 状态 + serve 状态 + dsh 运行时事实）
 * 组装成面向 UI 的单一 {@link RemoteAccessStatus} 投影。
 *
 * 组装规则全部集中在此，host 入口（index.ts）只做分发，面板只做渲染
 * —— 三方都不各自拼装状态，避免同一判定散落多处。
 */
import type { Context } from '@deepseek-ai/cordis'
import type { RemoteAccessStatus } from './contracts.ts'
import {
  checkInstalled,
  composeHttpsUrl,
  fetchServeStatus,
  fetchStatus,
  type TailRunner,
} from './tailscale.ts'

/** DSH_WEB_PORT 从 contracts 引入会造成环（contracts 不依赖任何模块），这里按用例需要重申。 */
import { DSH_WEB_PORT } from './contracts.ts'

interface WebServerLike {
  readonly host?: string | undefined
}

interface InventoryLike {
  list?: () => { entries?: readonly { readonly moduleName?: unknown }[] } | undefined
}

/**
 * browse picker 是否真的挂在当前运行树里。
 *
 * bundle patch（cordis.patch.yml）在安装时静态完成切换，本探针只做
 * 诚实汇报：如果有人手动改掉了 patch，面板会显示「未检测到」而不是
 * 谎报已启用。读取 pluginInventory 失败时保守返回 false。
 */
export function pickerBrowseMounted(ctx: Context): boolean {
  try {
    const inventory = (ctx as unknown as { pluginInventory?: InventoryLike }).pluginInventory
    const entries = inventory?.list?.()?.entries ?? []
    return entries.some(entry => {
      const module = typeof entry.moduleName === 'string' ? entry.moduleName : ''
      return module.endsWith('dsh-host-directory-picker-browse')
    })
  } catch {
    return false
  }
}

/**
 * 采集并组装完整状态。任何 tailscale 侧的失败都被折叠为带 issue 的
 * 部分状态而非异常 —— 面板永远能渲染出「装没装 / 登没登 / 通没通」
 * 的最小真相，诊断信息随之给出。
 */
export async function buildStatus(ctx: Context, run: TailRunner): Promise<RemoteAccessStatus> {
  const webServer = (ctx as unknown as { webServer?: WebServerLike }).webServer
  const webHost = typeof webServer?.host === 'string' ? webServer.host : null
  const picker = pickerBrowseMounted(ctx)

  const version = await checkInstalled(run)
  if (version === null) {
    return {
      installed: false,
      version: null,
      backendState: null,
      loggedIn: false,
      dnsName: null,
      httpsUrl: null,
      serveActive: false,
      serveTarget: null,
      webHost,
      pickerBrowse: picker,
      issues: [{
        code: 'tailscale-not-installed',
        message: '未找到 tailscale 命令。',
        hint: '从 https://tailscale.com/download 安装 Tailscale 并登录同一 tailnet。',
      }],
    }
  }

  const status = await fetchStatus(run)
  const serve = await fetchServeStatus(run)
  const httpsUrl = status.dnsName !== null ? composeHttpsUrl(status.dnsName) : null
  const issues = status.loggedIn
    ? []
    : [{
        code: 'tailscale-not-logged-in' as const,
        message: 'Tailscale 未登录或本机不在 tailnet 中。',
        hint: '运行 tailscale up，或打开 Tailscale 应用登录。',
      }]

  return {
    installed: true,
    version,
    backendState: status.backendState,
    loggedIn: status.loggedIn,
    dnsName: status.dnsName,
    httpsUrl,
    serveActive: serve.servingPort === DSH_WEB_PORT,
    serveTarget: serve.target,
    webHost,
    pickerBrowse: picker,
    issues,
  }
}
