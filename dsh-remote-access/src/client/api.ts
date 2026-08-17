/**
 * RPC 薄封装（client 侧）：每个 endpoint 一个方法，业务错误统一 throw，
 * 由容器组件 catch 后按 `\n[hint] ` 约定还原诊断建议。
 */
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import {
  DSH_REMOTE_ACCESS_CHANNEL,
  type EnableResponse,
  type QrResponse,
  type RemoteAccessStatus,
} from '../contracts.ts'

export class RemoteAccessApi {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  async status(): Promise<RemoteAccessStatus> {
    const result = await this.rpc.call(DSH_REMOTE_ACCESS_CHANNEL, 'status', {})
    if (!result.ok) throw new Error(result.error.message)
    return result.value as RemoteAccessStatus
  }

  async enable(): Promise<EnableResponse> {
    const result = await this.rpc.call(DSH_REMOTE_ACCESS_CHANNEL, 'enable', {})
    if (!result.ok) throw new Error(result.error.message)
    return result.value as EnableResponse
  }

  async disable(): Promise<void> {
    const result = await this.rpc.call(DSH_REMOTE_ACCESS_CHANNEL, 'disable', {})
    if (!result.ok) throw new Error(result.error.message)
  }

  /** `text` 通常是 httpsUrl；SVG 由 host 生成返回。 */
  async getQr(text: string): Promise<QrResponse> {
    const result = await this.rpc.call(DSH_REMOTE_ACCESS_CHANNEL, 'getQr', { text })
    if (!result.ok) throw new Error(result.error.message)
    return result.value as QrResponse
  }
}
