import { describe, expect, it } from 'vitest'
const { JSDOM } = require('jsdom') as {
  JSDOM: new (
    html: string,
    options?: { url?: string },
  ) => { window: Window & typeof globalThis }
}
import { ComposerFocusGuard } from '../src/client/composer-focus.ts'

interface World {
  doc: Document
  view: Window & typeof globalThis
  dispose: () => void
  composer: HTMLTextAreaElement
  /** focus() + the focusin event a real browser fires alongside it. */
  focus: (element: HTMLElement) => void
}

function setup(coarse: boolean): World {
  const dom = new JSDOM(
    `<!doctype html><html><body><textarea data-dsh-layout-composer-text></textarea></body></html>`,
    { url: 'https://dsh-layout.test/' },
  )
  const view = dom.window
  const doc = view.document
  // JSDOM has no matchMedia: emulate the pointer type the guard reads.
  view.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: coarse && query.includes('pointer: coarse'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList

  const composer = doc.querySelector('textarea')!
  const dispose = new ComposerFocusGuard(doc).install()
  const focus = (element: HTMLElement): void => {
    element.focus()
    element.dispatchEvent(new view.Event('focusin', { bubbles: true }))
  }
  return { doc, view, dispose, composer, focus }
}

describe('composer focus guard', () => {
  it('blurs programmatic focus on coarse pointers (keyboard stays down)', () => {
    const world = setup(true)
    try {
      world.focus(world.composer)
      expect(world.doc.activeElement).not.toBe(world.composer)
    } finally {
      world.dispose()
    }
  })

  it('keeps focus that follows a user gesture', () => {
    const world = setup(true)
    try {
      world.composer.dispatchEvent(
        new world.view.Event('pointerdown', { bubbles: true }),
      )
      world.focus(world.composer)
      expect(world.doc.activeElement).toBe(world.composer)
    } finally {
      world.dispose()
    }
  })

  it('does nothing on fine-pointer (desktop) devices', () => {
    const world = setup(false)
    try {
      world.focus(world.composer)
      expect(world.doc.activeElement).toBe(world.composer)
    } finally {
      world.dispose()
    }
  })

  it('ignores editors outside the conversation composer', () => {
    const world = setup(true)
    try {
      const outside = world.doc.createElement('textarea')
      world.doc.body.append(outside)
      world.focus(outside)
      expect(world.doc.activeElement).toBe(outside)
      outside.remove()
    } finally {
      world.dispose()
    }
  })
})
