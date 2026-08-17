import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import type { McpManagerLocaleKey } from './locales.ts'
import { enUS, MCP_MANAGER_NS, zhCN } from './locales.ts'
import { McpManagerApi } from './api.ts'
import { McpManagerTab } from './McpManagerTab.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.mcpManager': McpManagerLocaleKey
  }
}


declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'settings.thirdparty.tab': {
      kind: 'list'
      scope: 'root'
      owner: Record<string, never>
    }
  }
}

export const inject = ['slots', 'locale', 'connection']

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle }).connection
  const api = new McpManagerApi(connection.rpc)

  ctx.effect(() => ctx.locale.register(MCP_MANAGER_NS, { zh: zhCN, en: enUS }), 'dsh-mcp-manager: dictionaries')
  const t = ctx.locale.bind(MCP_MANAGER_NS)

  ctx.effect(() => installStyles(document), 'dsh-mcp-manager: styles')

  ctx.slots.inject('settings.thirdparty.tab', () => ctx.slots.register({
    name: 'settings.thirdparty.tab',
    id: 'mcp',
    order: 30,
    label: () => t('tab'),
    locale: MCP_MANAGER_NS,
    inject: () => ({ api }),
  }, McpManagerTab))
}

export { McpManagerTab }
