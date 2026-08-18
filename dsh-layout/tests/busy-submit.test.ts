import { describe, expect, it } from 'vitest'
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string, options?: { url?: string }) => { window: Window & typeof globalThis } }
import { DomSync } from '../src/client/dom-sync.ts'
import { BusySubmitRuntime, type BusyEnterScope } from '../src/client/busy-submit.ts'

interface World {
  doc: Document
  sync: DomSync
  runtime: BusySubmitRuntime
  primary: HTMLButtonElement
  events: { key: string; ctrlKey: boolean }[]
  scopeState: { value?: { busyEnter?: string } }
}

function setup(mobile: boolean): World {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div data-dsh-layout-composer-tools><button id="add">+</button></div>
    <textarea data-dsh-layout-composer-text></textarea>
    <div><button class="x_primary" aria-label="发送消息"></button></div>
  </body></html>`, { url: 'https://dsh-layout.test/' })
  const view = dom.window
  const doc = view.document
  view.matchMedia = (query: string): MediaQueryList => ({
    matches: mobile && query.includes('767'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as MediaQueryList)
  const sync = new DomSync(doc)
  // Stand-in for React's delegated keydown: record what DSH would receive.
  const events: { key: string; ctrlKey: boolean }[] = []
  doc.querySelector('textarea')!.addEventListener('keydown', (event) => {
    const keyboard = event as KeyboardEvent
    events.push({ key: keyboard.key, ctrlKey: keyboard.ctrlKey })
  })
  const scopeState: { value?: { busyEnter?: string } } = {}
  const listeners = new Set<() => void>()
  const scope: BusyEnterScope = {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    getSnapshot: () => scopeState as { value?: { busyEnter?: unknown } | undefined },
  }
  const runtime = new BusySubmitRuntime(scope, doc, sync, key => (key === 'busyQueue' ? '排队' : '插话'))
  return { doc, sync, runtime, primary: doc.querySelector<HTMLButtonElement>('button.x_primary')!, events, scopeState }
}

async function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 10))
}

describe('BusySubmitRuntime', () => {
  it('shows the pill only while an agent runs, phones only', async () => {
    const { doc, sync, runtime, primary } = setup(true)
    sync.install()
    runtime.install()
    await flush()
    expect(doc.querySelector('.dsh-layout-busy-pill')).toBeNull()
    primary.setAttribute('aria-label', '停止生成')
    await flush()
    expect(doc.querySelector('.dsh-layout-busy-pill')).not.toBeNull()
    primary.setAttribute('aria-label', '发送消息')
    await flush()
    expect(doc.querySelector('.dsh-layout-busy-pill')).toBeNull()
    runtime.dispose()
  })

  it('never appears on wide viewports', async () => {
    const { doc, sync, runtime, primary } = setup(false)
    sync.install()
    runtime.install()
    primary.setAttribute('aria-label', '停止生成')
    await flush()
    expect(doc.querySelector('.dsh-layout-busy-pill')).toBeNull()
    runtime.dispose()
  })

  it('picks the gesture that yields the labeled outcome under the setting', async () => {
    const { doc, sync, runtime, primary, events, scopeState } = setup(true)
    sync.install()
    runtime.install()
    primary.setAttribute('aria-label', '停止生成')
    await flush()
    const buttons = Array.from(doc.querySelectorAll<HTMLButtonElement>('.dsh-layout-busy-pill button'))
    expect(buttons.map(button => button.textContent)).toEqual(['排队', '插话'])
    const [queue, steer] = buttons
    // Default preference = queue: plain Enter queues, Ctrl+Enter steers.
    queue!.click()
    expect(events.at(-1)).toEqual({ key: 'Enter', ctrlKey: false })
    steer!.click()
    expect(events.at(-1)).toEqual({ key: 'Enter', ctrlKey: true })
    // Flip the preference — the same buttons swap gestures, no re-render.
    scopeState.value = { busyEnter: 'steer' }
    queue!.click()
    expect(events.at(-1)).toEqual({ key: 'Enter', ctrlKey: true })
    steer!.click()
    expect(events.at(-1)).toEqual({ key: 'Enter', ctrlKey: false })
    // Disposal removes the injected chrome.
    runtime.dispose()
    expect(doc.querySelector('.dsh-layout-busy-pill')).toBeNull()
  })
})
