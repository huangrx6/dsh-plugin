/** RPC wrapper for the subscription usage monitor. */
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { DSH_USAGE_CHANNEL, type UsageConfig, type UsageQueryResult } from '../contracts.ts'

export class UsageApi {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  private async call<T>(payload: unknown): Promise<T> {
    const result = await this.rpc.call(DSH_USAGE_CHANNEL, 'dsh-usage', payload)
    if (!result.ok) throw new Error(result.error.message)
    return result.value as T
  }

  async readConfig(): Promise<UsageConfig> {
    return this.call<UsageConfig>({ op: 'config.read', payload: {} })
  }

  async writeConfig(config: UsageConfig): Promise<void> {
    await this.call<{ saved: boolean }>({ op: 'config.write', payload: { config } })
  }

  async query(): Promise<readonly UsageQueryResult[]> {
    const value = await this.call<{ results: readonly UsageQueryResult[] }>({ op: 'query', payload: {} })
    return value.results
  }
}
