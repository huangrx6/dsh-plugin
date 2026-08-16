import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { DSH_LAYOUT_CHANNEL } from '../contracts.ts'
import { normalizeSettings } from './store.ts'
import type { LayoutSettings } from './types.ts'

export class DshLayoutClient {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  async load(): Promise<LayoutSettings | undefined> {
    const result = await this.rpc.call(DSH_LAYOUT_CHANNEL, 'load', {})
    if (!result.ok) throw new Error(result.error.message)
    return result.value === null ? undefined : normalizeSettings(result.value)
  }

  async save(settings: LayoutSettings): Promise<void> {
    const result = await this.rpc.call(DSH_LAYOUT_CHANNEL, 'save', { settings })
    if (!result.ok) throw new Error(result.error.message)
  }
}
