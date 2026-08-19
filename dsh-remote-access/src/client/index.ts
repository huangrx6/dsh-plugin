/**
 * dsh-remote-access —— web client 侧入口。
 *
 * 职责：注册 zh/en 文案、注入样式、把「远程访问」作为分区挂进
 * dsh-launcher 工作区（功能 → 个人插件 → 远程访问，本插件唯一的导航
 * 入口；原先的 settings.section 注册在工作区成为插件分区之家后移除），
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
  interface SlotMap {
    /** Workspace sections contributed to the dsh-launcher full-screen
        workspace; registering under id 'remote' replaces the launcher's
        default placeholder for the 远程访问 entry. */
    'dsh-launcher.workspace.section': {
      kind: 'list'
      scope: 'root'
      owner: object
    }
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

  // Launcher workspace section: the dsh-launcher plugin renders our
  // RemoteAccessSection inside its full-screen workspace when the user
  // picks the 远程访问 entry; the launcher's placeholder for
  // id 'remote' is replaced by this registration.
  ctx.slots.inject('dsh-launcher.workspace.section', () => ctx.slots.register({
    name: 'dsh-launcher.workspace.section',
    id: 'remote',
    order: 52,
    label: () => t('tab'),
    locale: REMOTE_ACCESS_NS,
    inject: () => ({ api, t }),
  }, RemoteAccessSection))
}

export { RemoteAccessSection }
