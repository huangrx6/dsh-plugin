import { describe, expect, it } from 'vitest'
import { DSH_AGENT_RULES_CHANNEL } from '../src/contracts.ts'

describe('agent rules contract', () => {
  it('exposes the RPC channel name the client and host share', () => {
    expect(DSH_AGENT_RULES_CHANNEL).toBe('/dsh-agent-rules')
  })

  it('keeps the global rules file at the dsh instructions location', () => {
    // The host resolves `$DSH_HOME/AGENTS.md`; the user-global file that
    // @deepseek-ai/dsh-agent-instructions loads into every session.
    expect(process.env['DSH_HOME'] ?? '~/.dsh').toBeTruthy()
  })
})
