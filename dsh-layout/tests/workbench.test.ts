import { describe, expect, it } from 'vitest'
import { composerCardMinimumWidth } from '../src/client/workbench.ts'

describe('responsive composer workbench', () => {
  it('keeps the desktop composer detection conservative', () => {
    expect(composerCardMinimumWidth(1440)).toBe(300)
  })

  it('allows the composer card to be detected on narrow screens', () => {
    expect(composerCardMinimumWidth(390)).toBe(195)
    expect(composerCardMinimumWidth(280)).toBe(160)
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
