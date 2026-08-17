import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../src/client/types.ts'
import { LayoutStore, normalizeSettings } from '../src/client/store.ts'
import { countOverrides, getPath, isOverridden, resetField, setPath } from '../src/client/settings-utils.ts'

describe('per-field status and restore', () => {
  it('walks dot paths immutably', () => {
    const settings = normalizeSettings({ conversation: { trace: { background: 'clear' } } })
    expect(getPath(settings, 'conversation.trace.background')).toBe('clear')
    const next = setPath(settings, 'conversation.trace.width', 'inset')
    expect(getPath(next, 'conversation.trace.width')).toBe('inset')
    expect(getPath(settings, 'conversation.trace.width')).toBe('full')
  })

  it('reports overrides only against native defaults', () => {
    const settings = normalizeSettings({ material: { enabled: true } })
    expect(isOverridden(settings, 'material.enabled')).toBe(true)
    expect(isOverridden(settings, 'material.opacity')).toBe(false)
    expect(isOverridden(settings, 'conversation.bubble')).toBe(false)
  })

  it('counts leaf overrides', () => {
    const base = normalizeSettings({ global: { scrollbar: 'hidden' }, conversation: { width: 'full' } })
    expect(countOverrides(base)).toBe(2)
    expect(countOverrides(DEFAULT_SETTINGS)).toBe(0)
  })

  it('restores a single field to its native default', () => {
    const values = new Map<string, string>()
    const store = new LayoutStore({
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value) },
    })
    store.update({ conversation: { ...store.getSnapshot().conversation, scrollEnd: 'above' } })
    expect(isOverridden(store.getSnapshot(), 'conversation.scrollEnd')).toBe(true)
    resetField(store, 'conversation.scrollEnd')
    expect(isOverridden(store.getSnapshot(), 'conversation.scrollEnd')).toBe(false)
  })
})
