/**
 * dsh-agent-rules client entry.
 *
 * Registers a workspace section into dsh-launcher's full-screen personal
 * space under id 'rules': a small editor for the user-global agent
 * instructions file (~/.dsh/AGENTS.md). The section UI just talks to the
 * trusted-host RPC channel declared in ../index.ts.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import type { AgentRulesLocaleKey } from './locales.ts'
import { AGENT_RULES_NS, enUS, zhCN } from './locales.ts'
import { AgentRulesApi } from './api.ts'
import { AgentRulesSection } from './AgentRulesSection.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-agent-rules': AgentRulesLocaleKey
  }
  interface SlotMap {
    /** Workspace sections contributed to the dsh-launcher full-screen
        workspace; registering under id 'rules' replaces the launcher's
        default placeholder for the Agent 规则 entry. */
    'dsh-launcher.workspace.section': {
      kind: 'list'
      scope: 'root'
      owner: object
    }
  }
}

export const inject = ['slots', 'locale', 'connection']

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle })
    .connection
  const api = new AgentRulesApi(connection.rpc)

  ctx.effect(
    () => ctx.locale.register(AGENT_RULES_NS, { zh: zhCN, en: enUS }),
    'dsh-agent-rules: dictionaries',
  )
  ctx.effect(() => installStyles(document), 'dsh-agent-rules: styles')

  const t = ctx.locale.bind(AGENT_RULES_NS)
  ctx.slots.inject('dsh-launcher.workspace.section', () =>
    ctx.slots.register(
      {
        name: 'dsh-launcher.workspace.section',
        id: 'rules',
        order: 70,
        label: () => t('section'),
        locale: AGENT_RULES_NS,
        inject: () => ({ api }),
      },
      AgentRulesSection,
    ),
  )
}
