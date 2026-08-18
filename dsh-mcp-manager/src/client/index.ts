import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import type { McpManagerLocaleKey } from './locales.ts'
import { enUS, MCP_MANAGER_NS, zhCN } from './locales.ts'
import { McpManagerApi } from './api.ts'
import { McpManagerSection } from './McpManagerSection.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.mcpManager': McpManagerLocaleKey
  }
}

export const inject = ['slots', 'locale', 'connection']

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle }).connection
  const api = new McpManagerApi(connection.rpc)

  ctx.effect(() => ctx.locale.register(MCP_MANAGER_NS, { zh: zhCN, en: enUS }), 'dsh-mcp-manager: dictionaries')
  const t = ctx.locale.bind(MCP_MANAGER_NS)

  ctx.effect(() => installStyles(document), 'dsh-mcp-manager: styles')

  // Independent settings nav entry (设置页左侧菜单独立入口) — no hub
  // dependency: installing this plugin alone is enough.
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'mcp',
    order: 51,
    label: () => t('tab'),
    locale: MCP_MANAGER_NS,
    inject: () => ({ api }),
  }, McpManagerSection))
}

export { McpManagerSection }
