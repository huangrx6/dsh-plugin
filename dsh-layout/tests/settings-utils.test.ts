import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../src/client/types.ts'
import { LayoutStore, normalizeSettings } from '../src/client/store.ts'
import { countOverrides, getPath, isOverridden, resetField, setPath } from '../src/client/settings-utils.ts'

describe('per-field status and restore', () => {
  it('walks dot paths immutably', () => {
    const settings = normalizeSettings({ content: { trace: { background: 'clear' } } })
    expect(getPath(settings, 'content.trace.background')).toBe('clear')
    const next = setPath(settings, 'content.trace.width', 'inset')
    expect(getPath(next, 'content.trace.width')).toBe('inset')
    expect(getPath(settings, 'content.trace.width')).toBe('full')
  })

  it('reports overrides only against native defaults', () => {
    const settings = normalizeSettings({ global: { radius: 12 } })
    expect(isOverridden(settings, 'global.radius')).toBe(true)
    expect(isOverridden(settings, 'content.bubble')).toBe(false)
  })

  it('counts leaf overrides and ignores profiles', () => {
    const base = normalizeSettings({ global: { radius: 12 }, content: { width: 'full' } })
    const withProfile = setPath(base, 'profiles', [{ id: 'p1', name: 'x', data: base }])
    expect(countOverrides(base)).toBeGreaterThan(0)
    expect(countOverrides(withProfile)).toBe(countOverrides(base))
    expect(countOverrides(DEFAULT_SETTINGS)).toBe(0)
  })

  it('restores a single field to its native default', () => {
    const values = new Map<string, string>()
    const store = new LayoutStore({
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value) },
    })
    store.update({ global: { ...store.getSnapshot().global, radius: 12 } })
    expect(isOverridden(store.getSnapshot(), 'global.radius')).toBe(true)
    resetField(store, 'global.radius')
    expect(isOverridden(store.getSnapshot(), 'global.radius')).toBe(false)
  })
})
