/** dsh-usage client entry — a subscription usage monitor in the launcher personal space. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import type { UsageLocaleKey } from './locales.ts'
import { USAGE_NS, enUS, zhCN } from './locales.ts'
import { UsageApi } from './api.ts'
import { UsageSection } from './UsageSection.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-usage': UsageLocaleKey
  }
  interface SlotMap {
    /** Workspace sections contributed to the dsh-launcher workspace;
        registering under id 'usage' replaces the placeholder. */
    'dsh-launcher.workspace.section': {
      kind: 'list'
      scope: 'root'
      owner: object
    }
  }
}

export const inject = ['slots', 'locale', 'connection']

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle }).connection
  const api = new UsageApi(connection.rpc)

  ctx.effect(() => ctx.locale.register(USAGE_NS, { zh: zhCN, en: enUS }), 'dsh-usage: dictionaries')
  ctx.effect(() => installStyles(document), 'dsh-usage: styles')

  const t = ctx.locale.bind(USAGE_NS)
  ctx.slots.inject('dsh-launcher.workspace.section', () =>
    ctx.slots.register(
      {
        name: 'dsh-launcher.workspace.section',
        id: 'usage',
        order: 75,
        label: () => t('section'),
        locale: USAGE_NS,
        inject: () => ({ api }),
      },
      UsageSection,
    ),
  )
}
