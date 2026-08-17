/**
 * dsh-remote-access —— host 侧组合根（Composition Root）。
 *
 * 只做三件事，业务逻辑全部下沉到各自的模块：
 *  1. 注册 RPC 通道（status / enable / disable / getQr），分发到
 *     {@link ./status.ts}（状态组装）与 {@link ./tailscale.ts}（流程）；
 *  2. 经 `ctx.webServer.tapIndex` 注入 {@link ./polyfill.ts} 兜底；
 *  3. 生产 runner（{@link ./runner.ts}）在此完成唯一一次绑定。
 */
import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import QRCode from 'qrcode'
import {
  DSH_REMOTE_ACCESS_CHANNEL,
  DSH_WEB_PORT,
  type EnableResponse,
  type QrResponse,
} from './contracts.ts'
import { runTailscale } from './runner.ts'
import { buildStatus } from './status.ts'
import {
  composeHttpsUrl,
  fetchServeStatus,
  fetchStatus,
  startServe,
  stopServe,
  TailscaleError,
} from './tailscale.ts'
import { injectPolyfill } from './polyfill.ts'

export const name = 'dsh-remote-access'

// Cordis 硬校验：apply() 里访问过的每个 ctx 属性都必须在此声明，
// 否则运行时抛 "cannot get property ... without inject"。
// webServer/pluginInventory 由 web profile（dsh-web-app + plugin-inventory）
// 提供；本插件仅面向 --profile web 发布（见 README）。
export const inject = ['connection', 'webServer', 'pluginInventory']

// ---------------------------------------------------------------------------
// RPC endpoint 实现（每个 endpoint 一个纯 async 函数）
// ---------------------------------------------------------------------------

async function statusEndpoint(ctx: Context): Promise<RemoteStatus> {
  return buildStatus(ctx, runTailscale)
}

type RemoteStatus = Awaited<ReturnType<typeof import('./status.ts').buildStatus>>

async function enableEndpoint(): Promise<EnableResponse> {
  const status = await fetchStatus(runTailscale)
  if (!status.loggedIn) {
    throw new TailscaleError(
      'tailscale-not-logged-in',
      'Tailscale 未登录，无法建立远程通道。',
      '运行 tailscale up，或打开 Tailscale 应用登录。',
    )
  }
  const serve = await fetchServeStatus(runTailscale)
  if (serve.servingPort !== DSH_WEB_PORT) {
    await startServe(runTailscale, DSH_WEB_PORT)
  }
  if (status.dnsName === null) {
    throw new TailscaleError(
      'tailscale-not-running',
      '无法获取本机 MagicDNS 名称。',
      '重试，或运行 tailscale status 检查。',
    )
  }
  return {
    httpsUrl: composeHttpsUrl(status.dnsName),
    alreadyServing: serve.servingPort === DSH_WEB_PORT,
  }
}

async function disableEndpoint(): Promise<{ ok: true }> {
  await stopServe(runTailscale, DSH_WEB_PORT)
  return { ok: true }
}

async function getQrEndpoint(payload: unknown): Promise<QrResponse> {
  const text = typeof (payload as { text?: unknown } | null)?.text === 'string'
    ? (payload as { text: string }).text
    : ''
  if (text === '') throw new Error('缺少二维码内容')
  // 二维码在 host（Node）侧生成：client 保持零依赖，且不受浏览器
  // QR 库的 Secure-Context / 体积差异影响。
  const svg = await QRCode.toString(text, { type: 'svg', margin: 1, width: 220 })
  return { svg }
}

// ---------------------------------------------------------------------------
// 分发与错误折叠
// ---------------------------------------------------------------------------

type Endpoint = 'status' | 'enable' | 'disable' | 'getQr'

/**
 * 错误折叠点：domain 错误的 code/hint 通过 `\n[hint] ` 分隔符编入
 * message —— RpcError 的 code/details 是封闭枚举（dsh 的 wire 契约），
 * 不接受自定义 code；client 切分还原展示。
 */
function foldError(error: unknown): RpcResult<unknown> {
  if (error instanceof TailscaleError) {
    return badRequest(`${error.message}\n[hint] ${error.hint}`)
  }
  const message = error instanceof Error ? error.message : String(error)
  return badRequest(message)
}

function ok(value: unknown): RpcResult<unknown> {
  return { ok: true, value }
}

function badRequest(message: string): RpcResult<unknown> {
  return { ok: false, error: { code: 'bad-request', message, details: { issues: [] } } }
}

async function handle(ctx: Context, endpoint: string, payload: unknown): Promise<RpcResult<unknown>> {
  try {
    switch (endpoint as Endpoint) {
      case 'status': return ok(await statusEndpoint(ctx))
      case 'enable': return ok(await enableEndpoint())
      case 'disable': return ok(await disableEndpoint())
      case 'getQr': return ok(await getQrEndpoint(payload))
      default: return badRequest(`未知操作：${endpoint}`)
    }
  } catch (error) {
    return foldError(error)
  }
}

// ---------------------------------------------------------------------------
// 组合根
// ---------------------------------------------------------------------------

interface WebServerLike {
  tapIndex?: ((transform: (html: string) => string) => void) | undefined
}

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.connection.rpc.handle(
    DSH_REMOTE_ACCESS_CHANNEL,
    (endpoint, payload) => handle(ctx, endpoint, payload),
    { authority: 'loopback' },
  ), 'dsh-remote-access: rpc')

  // tapIndex 属可选能力：无 webServer 的组合（headless 等）下静默跳过。
  const webServer = (ctx as unknown as { webServer?: WebServerLike }).webServer
  if (typeof webServer?.tapIndex === 'function') {
    webServer.tapIndex(injectPolyfill)
  }
}
