/**
 * Client-side runtime for the archive manager.
 *
 * Registers an independent settings section (left-nav entry) so the
 * archive manager can be installed without any third-party container.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import type { ArchiveManagerLocaleKey } from './locales.ts'
import { enUS, ARCHIVE_MANAGER_NS, zhCN } from './locales.ts'
import { ArchiveManagerApi } from './api.ts'
import { ArchiveManagerSection } from './ArchiveManagerSection.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-archive-manager': ArchiveManagerLocaleKey
  }
}

export const inject = ['slots', 'locale', 'connection']

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle }).connection
  const api = new ArchiveManagerApi(connection.rpc)

  ctx.effect(() => ctx.locale.register(ARCHIVE_MANAGER_NS, { zh: zhCN, en: enUS }), 'dsh-archive-manager: dictionaries')
  const t = ctx.locale.bind(ARCHIVE_MANAGER_NS)

  ctx.effect(() => installStyles(document), 'dsh-archive-manager: styles')

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'archive',
    order: 60, // after Plugins (10) and Third-party (50) per the settings nav order
    label: () => t('tab'),
    locale: ARCHIVE_MANAGER_NS,
    inject: () => ({ api }),
  }, ArchiveManagerSection))
}

export { ArchiveManagerSection }