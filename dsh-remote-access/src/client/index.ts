/**
 * dsh-remote-access —— web client 侧入口。
 *
 * 职责单一：注册 zh/en 文案、注入样式、把「远程访问」tab 挂进
 * Settings → Plugins 的 tab 插槽，并把容器组件依赖的 api 实例
 * 通过 slots 的 inject 闭包传入。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import type { RemoteAccessLocaleKey } from './locales.ts'
import { enUS, REMOTE_ACCESS_NS, zhCN } from './locales.ts'
import { RemoteAccessApi } from './api.ts'
import { RemoteAccessTab } from './RemoteAccessTab.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.remoteAccess': RemoteAccessLocaleKey
  }
}

export const inject = ['slots', 'locale', 'connection']

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle }).connection
  const api = new RemoteAccessApi(connection.rpc)

  ctx.effect(() => ctx.locale.register(REMOTE_ACCESS_NS, { zh: zhCN, en: enUS }), 'dsh-remote-access: dictionaries')
  const t = ctx.locale.bind(REMOTE_ACCESS_NS)

  ctx.effect(() => installStyles(document), 'dsh-remote-access: styles')

  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'remote-access',
    // 30 = mcp-manager，40 排其后。
    order: 40,
    label: () => t('tab'),
    locale: REMOTE_ACCESS_NS,
    inject: () => ({ api }),
  }, RemoteAccessTab))
}

export { RemoteAccessTab }
