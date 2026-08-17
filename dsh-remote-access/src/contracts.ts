/**
 * Wire contract（Shared Kernel）：host RPC 与 web client 共享的类型与通道名。
 * 本文件不 import 任何模块，保持为纯类型/常量层。
 */

/** Settings 面板与 host 之间的 RPC 通道。 */
export const DSH_REMOTE_ACCESS_CHANNEL = '/dsh-remote-access'

/** 本插件代理的 dsh web 端口（dsh 默认监听 127.0.0.1:3080）。 */
export const DSH_WEB_PORT = 3080

/** 面板诊断问题的稳定 code，UI 据此渲染；与 host 错误映射一一对应。 */
export type RemoteAccessIssueCode =
  | 'tailscale-not-installed'
  | 'tailscale-not-running'
  | 'tailscale-not-logged-in'
  | 'https-certificates-disabled'
  | 'serve-failed'
  | 'serve-query-failed'
  | 'trusted-host-mismatch'

export interface DiagnoseIssue {
  readonly code: RemoteAccessIssueCode
  readonly message: string
  /** 面板直接渲染的可执行下一步。 */
  readonly hint: string
}

/** host 侧 Tailscale + serve 的完整投影；面板据此渲染全部字段。 */
export interface RemoteAccessStatus {
  /** `tailscale` 二进制能应答 `version`。 */
  readonly installed: boolean
  readonly version: string | null
  /** `tailscale status --json` 的 BackendState（"Running"/"Stopped"/...）。 */
  readonly backendState: string | null
  /** 存在已登录的 Self 节点。 */
  readonly loggedIn: boolean
  /** 本机 MagicDNS 名（已剥尾点），如 "mac.tail1234.ts.net"。 */
  readonly dnsName: string | null
  /** 登录后为 `https://<dnsName>`；否则 null。 */
  readonly httpsUrl: string | null
  /** serve 当前有规则转发到 dsh 端口。 */
  readonly serveActive: boolean
  /** serve 状态里观察到的代理目标（"http://127.0.0.1:3080"）。 */
  readonly serveTarget: string | null
  /** dsh web 实际绑定的 host（来自 ctx.webServer.host）。 */
  readonly webHost: string | null
  /** browse picker 行已挂载在当前运行树（bundle patch 静态生效的运行时印证）。 */
  readonly pickerBrowse: boolean
  readonly issues: readonly DiagnoseIssue[]
}

export interface EnableResponse {
  readonly httpsUrl: string
  /** serve 规则此前已存在，本次为幂等启用。 */
  readonly alreadyServing: boolean
}

export interface QrResponse {
  /** Node 端生成的二维码 SVG（client 零依赖直渲染）。 */
  readonly svg: string
}
