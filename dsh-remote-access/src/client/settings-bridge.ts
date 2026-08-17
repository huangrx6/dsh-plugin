/**
 * 设置桥 client 端（远程浏览器侧）：把官方 api.settings.* 的调用代理到
 * 本插件的 trusted-host 桥通道，让手机端的官方设置页成为完整配置客户端。
 *
 * 原理（零 fork、零自造 UI）：
 *  - 官方 SettingsScopeController 在远程源下以 memory 模式构造，其
 *    read()/write() 仍调用 connection.api.settings.*——只是这些调用经
 *    /api 会被 PRIVILEGED_METHODS 403。controller 拿 writable/status 完全
 *    由服务端响应决定（memory 初始 unavailable 只是读失败的静止态）。
 *  - 因此只需在 api.settings 对象上替换 describe/update/replace/mutate
 *    四个方法（调用时属性访问，已构造的 controller 同样生效），把请求
 *    转发到桥；桥在 host 进程内调官方 ctx.settings 服务（与 /api 同源）。
 *  - writable 来自桥的 describe 响应（host settings.writable），手机端
 *    设置页因此从「不可用」恢复为「可读可写」。
 *  - 写后闭环走官方转发：host 广播 settings/document-updated（已在
 *    FORWARDED_EVENTS）→ 远端 refresh → 经代理读回新值。
 *
 * 安装后补一枪：ctx.remote.$dispatch('settings/document-updated', [])——
 * 与官方 transport 循环收到 host/remote-event 帧时的本地派发同路径，
 * 让「安装前已 bind、首次读已 403」的 scope 立即重读（此时读走代理）。
 *
 * 本机（loopback）不安装：官方直连本就可用，零干预。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle, ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { DSH_REMOTE_ACCESS_CHANNEL } from '../contracts.ts'

/** 官方 api.settings 面（callUnary envelope：{rpcId, result}）。 */
interface SettingsApiFace {
  describe(payload: unknown, signal?: AbortSignal): Promise<{ rpcId: string; result: ApiResult }>
  update(payload: unknown, signal?: AbortSignal): Promise<{ rpcId: string; result: ApiResult }>
  replace(payload: unknown, signal?: AbortSignal): Promise<{ rpcId: string; result: ApiResult }>
  mutate(payload: unknown, signal?: AbortSignal): Promise<{ rpcId: string; result: ApiResult }>
}

type ApiResult = { ok: true; value: unknown } | { ok: false; error: { code: string; message: string; details: Record<string, unknown> } }

interface RemoteBus {
  $dispatch(event: string, args: readonly unknown[]): void
}

const PROXIED_METHODS = ['describe', 'update', 'replace', 'mutate'] as const
type ProxiedMethod = (typeof PROXIED_METHODS)[number]

/** 桥 RPC：op + 原始 payload 透传，RpcResult 折叠回官方 envelope 形态。 */
async function bridgeCall(rpc: ClientConnectionRpc, op: ProxiedMethod, payload: unknown): Promise<{ rpcId: string; result: ApiResult }> {
  const result = await rpc.call(DSH_REMOTE_ACCESS_CHANNEL, 'bridge', { op, payload })
  if (result.ok) return { rpcId: `dsh-ra-bridge:${op}`, result: { ok: true, value: result.value } }
  return {
    rpcId: `dsh-ra-bridge:${op}`,
    result: { ok: false, error: { code: result.error.code, message: result.error.message, details: result.error.details as Record<string, unknown> } },
  }
}

export function installSettingsBridgeClient(ctx: ClientContext): (() => void) | undefined {
  const connection = (ctx as unknown as { connection?: ConnectionHandle }).connection
  if (connection === undefined) return undefined
  if (connection.isLoopback) return undefined

  const settings = (connection.api as unknown as { settings?: SettingsApiFace }).settings
  if (settings === undefined) return undefined

  const originals = new Map<ProxiedMethod, SettingsApiFace[ProxiedMethod]>()
  for (const method of PROXIED_METHODS) {
    const original = settings[method].bind(settings)
    originals.set(method, settings[method])
    // 保持与官方 callUnary 相同签名（payload, signal）；signal 由桥传输层自理。
    settings[method] = (payload: unknown) => bridgeCall(connection.rpc, method, payload)
  }

  // 让「安装前已 bind、首次读已 403」的 scope 立即经代理重读。
  const remote = (ctx as unknown as { remote?: RemoteBus }).remote
  try { remote?.$dispatch('settings/document-updated', []) } catch { /* 派发失败：下次官方转发事件仍会触发 */ }

  return () => {
    for (const [method, original] of originals) settings[method] = original
    originals.clear()
  }
}
