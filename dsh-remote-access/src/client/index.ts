/**
 * dsh-remote-access —— web client 侧入口。
 *
 * 职责单一：注册 zh/en 文案、注入样式、把「远程访问」作为独立分区挂进
 * 官方 settings.section 插槽（设置页左侧菜单独立入口，无 hub 依赖），
 * 并把容器组件依赖的 api 实例通过 slots 的 inject 闭包传入。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import type { RemoteAccessLocaleKey } from './locales.ts'
import { enUS, REMOTE_ACCESS_NS, zhCN } from './locales.ts'
import { RemoteAccessApi } from './api.ts'
import { installSettingsBridgeClient } from './settings-bridge.ts'
import { RemoteAccessSection } from './RemoteAccessSection.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.remoteAccess': RemoteAccessLocaleKey
  }
}

export const inject = ['slots', 'locale', 'connection', 'theme', 'remote']

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle }).connection
  const api = new RemoteAccessApi(connection.rpc)

  // 远端（非 loopback）浏览器才安装设置桥：本机 SettingsScope 本就直连宿主。
  const isLoopback = (ctx as unknown as { connection?: ConnectionHandle & { isLoopback?: boolean } }).connection?.isLoopback === true
  if (!isLoopback) {
    ctx.effect(() => installSettingsBridgeClient(ctx) ?? (() => {}), 'dsh-remote-access: settings bridge')
  }

  ctx.effect(() => ctx.locale.register(REMOTE_ACCESS_NS, { zh: zhCN, en: enUS }), 'dsh-remote-access: dictionaries')
  const t = ctx.locale.bind(REMOTE_ACCESS_NS)

  ctx.effect(() => installStyles(document), 'dsh-remote-access: styles')

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'remote-access',
    order: 52,
    label: () => t('tab'),
    locale: REMOTE_ACCESS_NS,
    inject: () => ({ api }),
  }, RemoteAccessSection))
}

export { RemoteAccessSection }
