/**
 * Tailscale 领域层：状态解析、命令构造与操作流程。
 *
 * 分层契约（Ports & Adapters）：
 *  - 本文件只含**纯逻辑与流程编排**，不 spawn、不读环境；
 *  - 所有外部交互走注入的 {@link TailRunner} 端口 —— 测试注入
 *    fake runner 即可覆盖全部分支（见 tests/flows.test.ts）；
 *  - 生产 runner 由 {@link ./runner.ts} 提供。
 *
 * 消费的命令面（近期 tailscale 版本保持稳定）：
 *   tailscale version
 *   tailscale status --json
 *   tailscale serve status --json        （1.50 前回退到纯文本）
 *   tailscale serve --bg <port>
 *   tailscale serve --<port> off         （失败回退 serve reset）
 */
import type { DiagnoseIssue, RemoteAccessIssueCode } from './contracts.ts'

/**
 * 端口：执行 `tailscale <args>`，resolve 捕获到的输出与退出码；
 * 命令无法运行（未安装 / 超时）时 reject。
 */
export interface TailRunner {
  (args: readonly string[], opts?: { timeoutMs?: number }): Promise<{ stdout: string; stderr: string; code: number }>
}

// ---------------------------------------------------------------------------
// 解析（纯函数）
// ---------------------------------------------------------------------------

interface StatusSelf {
  readonly DNSName?: unknown
  readonly HostName?: unknown
}

interface StatusJson {
  readonly BackendState?: unknown
  readonly Self?: StatusSelf | null
}

export interface ParsedStatus {
  readonly backendState: string | null
  readonly loggedIn: boolean
  readonly dnsName: string | null
  readonly hostName: string | null
}

/** 解析 `tailscale status --json`；无法解析时返回全空的保守投影。 */
export function parseStatusJson(text: string): ParsedStatus {
  let json: StatusJson
  try {
    json = JSON.parse(text) as StatusJson
  } catch {
    return { backendState: null, loggedIn: false, dnsName: null, hostName: null }
  }
  const backendState = typeof json.BackendState === 'string' ? json.BackendState : null
  const self = json.Self ?? null
  const dnsNameRaw = self !== null && typeof self.DNSName === 'string' ? self.DNSName : null
  // MagicDNS 名称自带尾点（"mac.tailxxxx.ts.net."），统一剥掉。
  const dnsName = dnsNameRaw !== null ? dnsNameRaw.replace(/\.+$/u, '') : null
  return {
    backendState,
    loggedIn: self !== null && dnsName !== null && dnsName !== '',
    dnsName,
    hostName: self !== null && typeof self.HostName === 'string' ? self.HostName : null,
  }
}

/** 取 `tailscale version` 的首行（"1.82.5\n  tailscale commit: ..."）。 */
export function parseVersion(text: string): string | null {
  const line = text.split('\n', 1)[0]?.trim() ?? ''
  return line === '' ? null : line
}

export interface ParsedServeStatus {
  /** 某条代理规则在任意路径上转发到了该端口。 */
  readonly servingPort: number | null
  /** 观察到的代理目标，如 "http://127.0.0.1:3080"。 */
  readonly target: string | null
}

/**
 * 解析 `tailscale serve status`。两种形态：
 *  1. 新版嵌套 JSON：{ HTTPS: { "host.ts.net": { Handlers: { "/":
 *     { Type: "proxy", Proxy: "http://127.0.0.1:3080" } } } } }
 *  2. 旧版人类可读文本 —— 扫描其中的 127.0.0.1:<port> 即可。
 * 插件只需要「是否有规则转发到 3080」，因此深扫 JSON 树 + 文本正则
 * 双保险，任何一种形态命中即认定。
 */
export function parseServeStatus(text: string): ParsedServeStatus {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) {
    try {
      const found = scanProxy(JSON.parse(trimmed))
      if (found !== undefined) return found
    } catch {
      // 非 JSON，落入文本扫描。
    }
  }
  const match = /127\.0\.0\.1:(\d{2,5})/u.exec(trimmed)
  if (match === null) return { servingPort: null, target: null }
  const port = Number.parseInt(match[1] ?? '', 10)
  if (Number.isNaN(port)) return { servingPort: null, target: null }
  return { servingPort: port, target: `http://127.0.0.1:${String(port)}` }
}

/** 深扫 serve-status JSON，寻找 Type==="proxy" 且指向 127.0.0.1 的节点。 */
function scanProxy(node: unknown, depth = 0): ParsedServeStatus | undefined {
  if (depth > 6 || node === null || typeof node !== 'object') return undefined
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = scanProxy(item, depth + 1)
      if (hit !== undefined) return hit
    }
    return undefined
  }
  const record = node as Record<string, unknown>
  if (record.Type === 'proxy' && typeof record.Proxy === 'string') {
    const match = /127\.0\.0\.1:(\d{2,5})/u.exec(record.Proxy)
    if (match !== null) {
      const port = Number.parseInt(match[1] ?? '', 10)
      if (!Number.isNaN(port)) return { servingPort: port, target: record.Proxy }
    }
  }
  for (const value of Object.values(record)) {
    const hit = scanProxy(value, depth + 1)
    if (hit !== undefined) return hit
  }
  return undefined
}

// ---------------------------------------------------------------------------
// 命令构造（纯函数）
// ---------------------------------------------------------------------------

/** `tailscale serve --bg 3080`：后台常驻反代 https://<dns> → 127.0.0.1:3080。 */
export function buildServeStartArgs(port: number): readonly string[] {
  return ['serve', '--bg', String(port)]
}

/** 1.102+ 已无 `--3080 off` / `off 3080` 语法；旧式规则唯一可靠的摘除方式是 reset。 */
export function buildServeResetArgs(): readonly string[] {
  return ['serve', 'reset']
}

/** 组装 `https://<dnsName>`；容忍尾点输入。 */
export function composeHttpsUrl(dnsName: string): string {
  const host = dnsName.replace(/\.+$/u, '')
  return `https://${host}`
}

/** tailnet 未启用 Serve：CLI 挂起并打印 login.tailscale.com 授权链接。 */
export function parseServeAuthUrl(text: string): string | null {
  const match = /https:\/\/login\.tailscale\.com\/f\/serve\?node=[A-Za-z0-9]+/u.exec(text)
  return match === null ? null : match[0] ?? null
}

/** tailnet 未启用 HTTPS 证书（ACME 不可用）时的 CLI 报错特征。 */
export function looksLikeHttpsCertificatesDisabled(text: string): boolean {
  return /HTTPS.*disable|MagicDNS|certificate|ACME/iu.test(text)
}

// ---------------------------------------------------------------------------
// 操作流程（runner 注入，仍可单测）
// ---------------------------------------------------------------------------

/**
 * 领域错误：携带稳定的 issue code 与可执行的修复建议。
 * host 入口把它折叠进 RPC message（封闭枚举不允许自定义 code），
 * 面板切分后照常展示 hint。
 */
export class TailscaleError extends Error {
  constructor(
    readonly code: RemoteAccessIssueCode,
    message: string,
    readonly hint: string,
  ) {
    super(message)
    this.name = 'TailscaleError'
  }

  toIssue(): DiagnoseIssue {
    return { code: this.code, message: this.message, hint: this.hint }
  }
}

/** tailscale 是否可用；任何失败（含 ENOENT / 超时）都折叠为 `null`。 */
export async function checkInstalled(run: TailRunner): Promise<string | null> {
  try {
    const result = await run(['version'], { timeoutMs: 8000 })
    if (result.code !== 0) return null
    return parseVersion(result.stdout)
  } catch {
    return null
  }
}

/** 读取登录态与 MagicDNS 名称；非零退出按「守护进程未运行」归类。 */
export async function fetchStatus(run: TailRunner): Promise<ParsedStatus> {
  const result = await run(['status', '--json'], { timeoutMs: 10000 })
  if (result.code !== 0) {
    throw new TailscaleError(
      'tailscale-not-running',
      `tailscale status 退出码 ${String(result.code)}：${result.stderr.trim().slice(0, 200)}`,
      '打开 Tailscale 应用并连接，或运行 tailscale up。',
    )
  }
  return parseStatusJson(result.stdout)
}

/**
 * 读取 serve 状态。探测失败（老版本 CLI 不认 --json、serve 子命令
 * 异常等）一律折叠为「未在服务」—— 状态展示场景下，宁可显示未开启
 * 也不该让整个面板报错。
 */
export async function fetchServeStatus(run: TailRunner): Promise<ParsedServeStatus> {
  try {
    const result = await run(['serve', 'status', '--json'], { timeoutMs: 8000 })
    if (result.code === 0) return parseServeStatus(result.stdout)
    const legacy = await run(['serve', 'status'], { timeoutMs: 8000 })
    return parseServeStatus(legacy.code === 0 ? legacy.stdout : '')
  } catch {
    return { servingPort: null, target: null }
  }
}

/** 启动 serve，把三类可识别失败映射为带指引的领域错误。 */
export async function startServe(run: TailRunner, port: number): Promise<void> {
  let result: { stdout: string; stderr: string; code: number }
  try {
    result = await run(buildServeStartArgs(port), { timeoutMs: 90000 })
  } catch (error) {
    // 超时被拉断时拿不到输出；Serve 未启用时 CLI 正是这种挂起形态。
    // 短超时重试一次只为捕获授权链接，拿不到才当作普通超时报错。
    const message = error instanceof Error ? error.message : String(error)
    try {
      const probe = await run(buildServeStartArgs(port), { timeoutMs: 8000 })
      const url = parseServeAuthUrl(probe.stdout + probe.stderr)
      if (url !== null) {
        throw new TailscaleError(
          'serve-not-enabled',
          'tailnet 尚未启用 Serve 功能，需要管理员在浏览器授权一次（授权后永久生效）。',
          url,
        )
      }
    } catch (retry) {
      if (retry instanceof TailscaleError) throw retry
    }
    throw new TailscaleError(
      'serve-failed',
      `tailscale serve 无响应（${message}）。`,
      '检查 tailscaled 是否运行：tailscale status；或手动执行 tailscale serve --bg 3080 观察输出。',
    )
  }
  if (result.code !== 0) {
    const err = result.stderr.trim() + ' ' + result.stdout.trim()
    if (looksLikeHttpsCertificatesDisabled(err)) {
      throw new TailscaleError(
        'https-certificates-disabled',
        'tailnet 未启用 HTTPS 证书，Tailscale Serve 无法签发 ts.net 证书。',
        '到 Tailscale 管理后台 → DNS 页 → HTTPS Certificates 小节 → Enable（具体入口：https://login.tailscale.com/admin/dns）。',
      )
    }
    throw new TailscaleError(
      'serve-failed',
      `tailscale serve 启动失败：${err.slice(0, 300)}`,
      '确认本机已在 tailnet 内，且 3080 端口上的 dsh web 正在运行。',
    )
  }
  // 挂起被超时拉断时（exit 非零或输出里带授权链接）：Serve 功能未启用。
  const combined = result.stdout + result.stderr
  const authUrl = parseServeAuthUrl(combined)
  if (authUrl !== null) {
    throw new TailscaleError(
      'serve-not-enabled',
      'tailnet 尚未启用 Serve 功能，需要管理员在浏览器授权一次（授权后永久生效）。',
      authUrl,
    )
  }
}

/**
 * 停止 serve。实测 1.102+ 的 CLI 已无任何 per-port off 语法
 * （`--3080 off` / `off 3080` 均拒），旧式规则唯一可靠摘除方式是
 * `serve reset`（清除本节点全部 serve 规则 —— 本插件假设 serve 只服务 dsh）。
 */
export async function stopServe(run: TailRunner, _port: number): Promise<void> {
  const result = await run(buildServeResetArgs(), { timeoutMs: 10000 })
  if (result.code !== 0) {
    throw new TailscaleError(
      'serve-failed',
      `停止 serve 失败：${result.stderr.trim().slice(0, 300)}`,
      '可手动执行 tailscale serve reset 清除全部规则。',
    )
  }
}
