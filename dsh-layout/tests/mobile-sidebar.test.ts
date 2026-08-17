import { describe, expect, it } from 'vitest'
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string, options?: { url?: string }) => { window: Window & typeof globalThis } }
import { DomSync } from '../src/client/dom-sync.ts'
import { MobileSidebarRuntime } from '../src/client/mobile-sidebar.ts'
import { LayoutStore } from '../src/client/store.ts'

function setup(mobile: boolean): {
  doc: Document
  sync: DomSync
  runtime: MobileSidebarRuntime
  store: LayoutStore
  toggleClicks: () => number
} {
  const dom = new JSDOM(`<!doctype html><html><body>
    <main data-dsh-layout-frame data-sidebar-collapsed="true">
      <aside data-dsh-layout-sidebar-col><div><div>
        <button id="toggle" aria-label="Open sidebar"></button>
        <button id="session">Session</button>
      </div></div></aside>
      <section data-dsh-layout-center-col>Chat</section>
      <aside data-dsh-layout-details-col></aside>
    </main>
  </body></html>`, { url: 'https://dsh-layout.test/' })
  const view = dom.window
  const doc = view.document
  // JSDOM has no matchMedia: emulate the narrow state the runtime reads.
  view.matchMedia = (query: string): MediaQueryList => ({
    matches: mobile && query.includes('767'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as MediaQueryList)
  const sync = new DomSync(doc)
  const store = new LayoutStore()
  const runtime = new MobileSidebarRuntime(store, doc, sync)
  const toggleClicks = (): number => {
    const trigger = doc.querySelector<HTMLButtonElement>('.dsh-layout-mobile-sidebar-trigger')
    trigger?.click()
    return trigger ? 1 : 0
  }
  return { doc, sync, runtime, store, toggleClicks }
}

function setFullscreen(store: LayoutStore): void {
  const global = store.getSnapshot().global
  store.update({ global: { ...global, narrow: { ...global.narrow, sidebar: 'fullscreen' } } })
}

async function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 10))
}

describe('MobileSidebarRuntime', () => {
  it('stays fully native on desktop, whatever the setting', async () => {
    const { doc, sync, runtime, store, toggleClicks } = setup(false)
    sync.install()
    runtime.install()
    setFullscreen(store)
    await flush()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar')).toBe(false)
    expect(toggleClicks()).toBe(0)
    expect(doc.querySelector('.dsh-layout-mobile-sidebar-mask')).toBeNull()
  })

  it('does nothing on phones while the setting is native', async () => {
    const { doc, sync, runtime } = setup(true)
    sync.install()
    runtime.install()
    await flush()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar')).toBe(false)
  })

  it('takes over on phones once the setting is fullscreen', async () => {
    const { doc, sync, runtime, store, toggleClicks } = setup(true)
    sync.install()
    runtime.install()
    await flush()
    setFullscreen(store)
    await flush()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar')).toBe(true)
    expect(toggleClicks()).toBe(1)
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(true)
    const mask = doc.querySelector<HTMLButtonElement>('.dsh-layout-mobile-sidebar-mask')
    expect(mask?.hidden).toBe(false)
    mask?.click()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(false)
  })

  it('closes on session selection, Esc, and tears down on native', async () => {
    const { doc, sync, runtime, store, toggleClicks } = setup(true)
    sync.install()
    runtime.install()
    setFullscreen(store)
    await flush()
    toggleClicks()
    doc.getElementById('session')?.click()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(false)

    toggleClicks()
    const view = doc.defaultView as Window & typeof globalThis
    doc.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(false)

    const global = store.getSnapshot().global
    store.update({ global: { ...global, narrow: { ...global.narrow, sidebar: 'native' } } })
    await flush()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar')).toBe(false)
    expect(doc.querySelector('.dsh-layout-mobile-sidebar-trigger')).toBeNull()
  })
})
