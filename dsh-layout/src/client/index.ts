import React from 'react'
import { createRoot } from 'react-dom/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import type { LayoutLocaleKey } from './locales.ts'
import { enUS, LAYOUT_NS, zhCN } from './locales.ts'
import { LayoutFullPageOverlay, LayoutSettingsSection } from './LayoutSettings.tsx'
import { DockStats, ToolbarStats } from './StatsPanel.tsx'
import { LayoutStore } from './store.ts'
import { DomSync } from './dom-sync.ts'
import { OriginalStatsSuppressor } from './suppressor.ts'
import { installStyles } from './styles.ts'
import { ComposerWorkbench } from './workbench.ts'
import { BackgroundRuntime } from './background.ts'
import { ShellRuntime } from './shell.ts'
import { DshLayoutClient } from './persistence.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    layout: LayoutLocaleKey
  }
}

export const inject = ['slots', 'locale', 'connection']

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle }).connection
  const persistence = new DshLayoutClient(connection.rpc)
  // The profile file is the source of truth. Do not resurrect old browser-only
  // layout/surface keys when the unified plugin is installed for the first time.
  const store = new LayoutStore(undefined, settings => { void persistence.save(settings).catch(error => console.error('dsh-layout could not be saved:', error)) })
  const sync = new DomSync(document)
  const suppressor = new OriginalStatsSuppressor(store, document, sync)
  const workbench = new ComposerWorkbench(store, document, sync)
  const background = new BackgroundRuntime(store, document)
  const shell = new ShellRuntime(store, document, sync)

  ctx.effect(() => ctx.locale.register(LAYOUT_NS, { zh: zhCN, en: enUS }), 'layout: dictionaries')
  const t = ctx.locale.bind(LAYOUT_NS)
  const overlayHost = document.createElement('div')
  overlayHost.id = 'dsh-layout-overlay-host'
  document.body.append(overlayHost)
  const overlayRoot = createRoot(overlayHost)
  overlayRoot.render(React.createElement(LayoutFullPageOverlay, { store, t }))
  ctx.effect(() => () => { overlayRoot.unmount(); overlayHost.remove() }, 'dsh-layout: settings overlay')

  ctx.effect(() => installStyles(document), 'dsh-layout: styles')
  ctx.effect(() => background.install(), 'dsh-layout: background')
  ctx.effect(() => shell.install(), 'dsh-layout: shell')
  void persistence.load().then(settings => { if (settings !== undefined) store.hydrate(settings) }).catch(error => console.error('dsh-layout could not load file settings:', error))
  // One shared MutationObserver drives every DOM pass; order matters:
  // the shell marks the frame first, then the workbench marks the composer.
  ctx.effect(() => sync.install(), 'dsh-layout: dom sync')
  ctx.effect(() => workbench.install(), 'dsh-layout: composer workbench')
  ctx.effect(() => suppressor.install(), 'dsh-layout: original stats suppression')

  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'dsh-layout-toolbar',
    order: 80,
    locale: LAYOUT_NS,
    inject: () => ({ store }),
  }, ToolbarStats))

  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
    name: 'conversation.composer.dock',
    id: 'dsh-layout-dock',
    order: 80,
    locale: LAYOUT_NS,
    inject: () => ({ store }),
  }, DockStats))

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'dsh-layout',
    order: 46,
    label: () => t('section'),
    locale: LAYOUT_NS,
    inject: () => ({ store }),
  }, LayoutSettingsSection))
}

export { LayoutSettingsSection }
