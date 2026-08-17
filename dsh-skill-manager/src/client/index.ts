import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import type { SkillManagerLocaleKey } from './locales.ts'
import { enUS, SKILL_MANAGER_NS, zhCN } from './locales.ts'
import { SkillManagerApi } from './api.ts'
import { SkillManagerTab } from './SkillManagerTab.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.skillManager': SkillManagerLocaleKey
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
  const api = new SkillManagerApi(connection.rpc)

  ctx.effect(() => ctx.locale.register(SKILL_MANAGER_NS, { zh: zhCN, en: enUS }), 'dsh-skill-manager: dictionaries')
  const t = ctx.locale.bind(SKILL_MANAGER_NS)

  ctx.effect(() => installStyles(document), 'dsh-skill-manager: styles')

  ctx.slots.inject('settings.thirdparty.tab', () => ctx.slots.register({
    name: 'settings.thirdparty.tab',
    id: 'skills',
    order: 20,
    label: () => t('tab'),
    locale: SKILL_MANAGER_NS,
    inject: () => ({ api }),
  }, SkillManagerTab))
}

export { SkillManagerTab }
