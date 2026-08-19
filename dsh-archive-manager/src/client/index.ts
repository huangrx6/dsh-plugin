/**
 * Client-side runtime for the archive manager.
 *
 * Registers a section in the dsh-launcher workspace (功能 → 个人插件 →
 * 归档管理) — the plugin's only nav entry. The former settings.section
 * registration moved there when the workspace became the home for all
 * plugin sections.
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
  interface SlotMap {
    /** Workspace sections contributed to the dsh-launcher full-screen
        workspace; registering under id 'archive' replaces the launcher's
        default placeholder for the 归档管理 entry. */
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
  const api = new ArchiveManagerApi(connection.rpc)

  ctx.effect(() => ctx.locale.register(ARCHIVE_MANAGER_NS, { zh: zhCN, en: enUS }), 'dsh-archive-manager: dictionaries')
  const t = ctx.locale.bind(ARCHIVE_MANAGER_NS)

  ctx.effect(() => installStyles(document), 'dsh-archive-manager: styles')

  // Launcher workspace section: the dsh-launcher plugin renders our
  // ArchiveManagerSection inside its full-screen workspace when the user
  // picks the 归档管理 entry; the launcher's placeholder for
  // id 'archive' is replaced by this registration.
  ctx.slots.inject('dsh-launcher.workspace.section', () => ctx.slots.register({
    name: 'dsh-launcher.workspace.section',
    id: 'archive',
    order: 60,
    label: () => t('tab'),
    locale: ARCHIVE_MANAGER_NS,
    inject: () => ({ api, t }),
  }, ArchiveManagerSection))
}

export { ArchiveManagerSection }