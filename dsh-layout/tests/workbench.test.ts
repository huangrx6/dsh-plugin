import { describe, expect, it } from 'vitest'
import { composerCardMinimumWidth, workbenchActive } from '../src/client/workbench.ts'
import { DEFAULT_SETTINGS } from '../src/client/types.ts'

describe('responsive composer workbench', () => {
  it('keeps the desktop composer detection conservative', () => {
    expect(composerCardMinimumWidth(1440)).toBe(300)
  })

  it('activates the bounded scroll end independently of reading width', () => {
    expect(workbenchActive({
      ...DEFAULT_SETTINGS,
      conversation: { ...DEFAULT_SETTINGS.conversation, width: 'native', scrollEnd: 'above' },
    })).toBe(true)
  })

  it('keeps every activation concern independent', () => {
    expect(workbenchActive(DEFAULT_SETTINGS)).toBe(false)
    expect(workbenchActive({ ...DEFAULT_SETTINGS, conversation: { ...DEFAULT_SETTINGS.conversation, width: 'full' } })).toBe(true)
    expect(workbenchActive({ ...DEFAULT_SETTINGS, conversation: { ...DEFAULT_SETTINGS.conversation, inputRows: 3 } })).toBe(true)
    expect(workbenchActive({ ...DEFAULT_SETTINGS, conversation: { ...DEFAULT_SETTINGS.conversation, scrollEnd: 'above' } }, true)).toBe(false)
  })
})


describe('scroll container discovery', () => {
  it('marks the structural scroller regardless of overflow state', async () => {
    const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis } }
    const dom = new JSDOM('<!doctype html><div id="outer" style="overflow-y:auto"><div id="inner"><div id="stack"></div></div></div>')
    const doc = dom.window.document
    const { findScrollAncestor } = await import('../src/client/workbench.ts')
    const found = findScrollAncestor(doc.getElementById('stack') as HTMLElement, doc)
    expect(found?.id).toBe('outer')
  })
})
