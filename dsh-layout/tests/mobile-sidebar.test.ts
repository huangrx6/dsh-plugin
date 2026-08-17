import { describe, expect, it } from 'vitest'
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string, options?: { url?: string }) => { window: Window & typeof globalThis } }
import { DomSync } from '../src/client/dom-sync.ts'
import { MobileSidebarRuntime } from '../src/client/mobile-sidebar.ts'
import { LayoutStore } from '../src/client/store.ts'

interface World {
  doc: Document
  sync: DomSync
  runtime: MobileSidebarRuntime
  store: LayoutStore
  toggle: HTMLButtonElement
  toggleClicks: () => number
  open: () => void
}

function setup(mobile: boolean): World {
  const dom = new JSDOM(`<!doctype html><html><body>
    <main data-dsh-layout-frame data-sidebar-collapsed>
      <aside data-dsh-layout-sidebar-col><div><div>
        <button class="x_toggle" aria-label="Open sidebar"></button>
        <button id="session">Session</button>
        <div role="treeitem" id="treeitem">Session A</div>
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
  const toggle = doc.querySelector<HTMLButtonElement>('button[class*="toggle"]')!
  let clicks = 0
  toggle.addEventListener('click', () => { clicks += 1 })
  const toggleClicks = (): number => clicks
  const open = (): void => {
    doc.querySelector<HTMLButtonElement>('.dsh-layout-mobile-sidebar-trigger')?.click()
  }
  return { doc, sync, runtime, store, toggle, toggleClicks, open }
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
    const { doc, sync, runtime, store, toggleClicks, open } = setup(false)
    sync.install()
    runtime.install()
    setFullscreen(store)
    await flush()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar')).toBe(false)
    expect(doc.querySelector('.dsh-layout-mobile-sidebar-trigger')).toBeNull()
    open()
    expect(toggleClicks()).toBe(0)
  })

  it('does nothing on phones while the setting is native', async () => {
    const { doc, sync, runtime } = setup(true)
    sync.install()
    runtime.install()
    await flush()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar')).toBe(false)
  })

  it('opens the drawer and expands DSH via its own toggle; closes and collapses back', async () => {
    const { doc, sync, runtime, store, toggle, toggleClicks, open } = setup(true)
    sync.install()
    runtime.install()
    setFullscreen(store)
    await flush()
    open()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(true)
    // Opening expanded the native sidebar (frame no longer collapsed).
    expect(toggleClicks()).toBe(1)
    doc.querySelector('[data-dsh-layout-frame]')?.removeAttribute('data-sidebar-collapsed') // simulate React
    doc.querySelector<HTMLButtonElement>('.dsh-layout-mobile-sidebar-mask')?.click()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(false)
    doc.querySelector('[data-dsh-layout-frame]')?.setAttribute('data-sidebar-collapsed', '') // React collapses back
    expect(toggleClicks()).toBe(2)
  })

  it('closes on navigation and Escape; collapses back to native on each close', async () => {
    const { doc, sync, runtime, store, toggle, toggleClicks, open } = setup(true)
    sync.install()
    runtime.install()
    setFullscreen(store)
    await flush()
    open()
    doc.querySelector('[data-dsh-layout-frame]')?.removeAttribute('data-sidebar-collapsed') // simulate React expand
    doc.getElementById('treeitem')?.click()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(false)
    expect(toggleClicks()).toBe(2) // open-expand + close-collapse
    doc.querySelector('[data-dsh-layout-frame]')?.setAttribute('data-sidebar-collapsed', '') // React collapsed back

    open()
    doc.querySelector('[data-dsh-layout-frame]')?.removeAttribute('data-sidebar-collapsed')
    const view = doc.defaultView as Window & typeof globalThis
    doc.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(false)
    expect(toggleClicks()).toBe(4)
  })

  it('self-heals when DSH collapses the sidebar from inside the open drawer', async () => {
    const { doc, sync, runtime, store, open } = setup(true)
    sync.install()
    runtime.install()
    setFullscreen(store)
    await flush()
    open()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(true)
    doc.querySelector('[data-dsh-layout-frame]')?.setAttribute('data-sidebar-collapsed', '') // native collapse mid-open
    await flush()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(false)
  })

  it('opens from a left-edge swipe and tears down on native', async () => {
    const { doc, sync, runtime, store, toggleClicks, open } = setup(true)
    sync.install()
    runtime.install()
    setFullscreen(store)
    await flush()
    const view = doc.defaultView as Window & typeof globalThis
    const touch = (type: string, x: number): void => {
      doc.dispatchEvent(new view.TouchEvent(type, {
        bubbles: true,
        touches: type === 'touchend' ? [] : [{ clientX: x } as unknown as Touch],
        changedTouches: type === 'touchend' ? [{ clientX: x } as unknown as Touch] : [],
      }))
    }
    touch('touchstart', 10)
    touch('touchend', 90)
    await flush()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar-open')).toBe(true)

    const global = store.getSnapshot().global
    store.update({ global: { ...global, narrow: { ...global.narrow, sidebar: 'native' } } })
    await flush()
    expect(doc.documentElement.hasAttribute('data-dsh-layout-mobile-sidebar')).toBe(false)
    expect(doc.querySelector('.dsh-layout-mobile-sidebar-trigger')).toBeNull()
    expect(toggleClicks()).toBe(1) // only the open-expand click happened
  })
})
