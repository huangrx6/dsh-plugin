/**
 * Wire contract between the web client and the trusted host for the
 * global agent rules editor.
 *
 * The host reads/writes `$DSH_HOME/AGENTS.md` (default `~/.dsh/AGENTS.md`)
 * — the user-global instructions file that @deepseek-ai/dsh-agent-instructions
 * loads into EVERY session as a persistent baseline. Editing it here is the
 * supported way to customize global agent behavior, e.g. "when in Code Mode,
 * call bash/files only through run_code's tools SDK".
 */
export const DSH_AGENT_RULES_CHANNEL = '/dsh-agent-rules'

/** read → value { text }; write → value { bytes }. */
export type AgentRulesOp = 'read' | 'write'

export interface AgentRulesPayload {
  readonly op: AgentRulesOp
  readonly payload?: { readonly text?: string }
}
