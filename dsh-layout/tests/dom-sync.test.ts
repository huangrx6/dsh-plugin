import { describe, expect, it, vi } from 'vitest'
// Minimal typing: the suite only constructs JSDOM and reads window/document.
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string, options?: { url?: string }) => { window: Window & typeof globalThis } }
import { DomSync } from '../src/client/dom-sync.ts'

function setup(): { doc: Document; sync: DomSync } {
  const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { url: 'https://dsh-layout.test/' })
  const view = dom.window
  const doc = view.document
  return { doc, sync: new DomSync(doc) }
}

function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 10))
}

describe('DomSync', () => {
  it('delivers an initial full pass, then scoped structural updates', async () => {
    const { doc, sync } = setup()
    const full = vi.fn()
    const structural = vi.fn()
    sync.register({ onFull: full, onStructural: structural })
    sync.install()
    await flush()
    expect(full).toHaveBeenCalled()
    expect(structural).not.toHaveBeenCalled()

    doc.getElementById('host')?.append(doc.createElement('span'))
    await flush()
    expect(structural).toHaveBeenCalled()
    expect(full).toHaveBeenCalledTimes(1)
  })

  it('routes class/style mutations to the attribute pass only', async () => {
    const { doc, sync } = setup()
    const attribute = vi.fn()
    sync.register({ onAttribute: attribute })
    sync.install()
    await flush()
    attribute.mockClear()

    const node = doc.getElementById('host') as HTMLElement
    node.className = 'changed'
    await flush()
    expect(attribute).toHaveBeenCalledTimes(1)
    expect(attribute.mock.calls[0]?.[0]).toContain(node)
  })

  it('stops delivering after disposal', async () => {
    const { doc, sync } = setup()
    const structural = vi.fn()
    const dispose = sync.install()
    sync.register({ onStructural: structural })
    await flush()
    dispose()
    doc.getElementById('host')?.append(doc.createElement('i'))
    await flush()
    expect(structural).not.toHaveBeenCalled()
  })
})
