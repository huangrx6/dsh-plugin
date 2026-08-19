/** RPC wrapper for the global agent rules editor. */
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { DSH_AGENT_RULES_CHANNEL } from '../contracts.ts'

export class AgentRulesApi {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  private async call<T>(payload: unknown): Promise<T> {
    const result = await this.rpc.call(DSH_AGENT_RULES_CHANNEL, 'dsh-agent-rules', payload)
    if (!result.ok) throw new Error(result.error.message)
    return result.value as T
  }

  /** Current content of `~/.dsh/AGENTS.md` ('' when absent). */
  async read(): Promise<string> {
    const value = await this.call<{ text: string }>({ op: 'read', payload: {} })
    return value.text
  }

  /** Persist the global instructions file. Returns byte count written. */
  async write(text: string): Promise<number> {
    const value = await this.call<{ bytes: number }>({ op: 'write', payload: { text } })
    return value.bytes
  }
}
