import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_METRICS, DEFAULT_SETTINGS } from '../src/client/types.ts'
import { LayoutStore, loadSettings, normalizeSettings, type StorageLike } from '../src/client/store.ts'

describe('LayoutStore', () => {
  it('normalizes invalid settings', () => {
    expect(normalizeSettings({ global: { scrollbar: 'maybe' }, conversation: { stats: 'everywhere' } })).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps the global section from older shapes and collapses the rest', () => {
    const legacy = normalizeSettings({
      version: 2,
      global: { radius: 12, background: { mode: 'image', imageUrl: 'https://example.com/a.jpg' }, quality: 'balanced', fluidGlass: true },
      sidebar: { width: 340, glass: { enabled: true } },
      content: { width: 'full', density: 24 },
      footer: { scrollRange: 'above', plate: 'solid' },
      profiles: [{ id: 'p', name: '旧方案', data: {} }],
    })
    expect(legacy.global.radius).toBe(12)
    expect(legacy.global.background).toEqual({ mode: 'image', color: '#f4f6f9', imageUrl: 'https://example.com/a.jpg', videoUrl: '' })
    expect(legacy.conversation).toEqual(DEFAULT_SETTINGS.conversation)
    expect(legacy.material).toEqual(DEFAULT_SETTINGS.material)
  })

  it('normalizes global overrides without changing native defaults', () => {
    const settings = normalizeSettings({
      global: {
        scrollbar: 'hidden',
        background: { mode: 'color', color: 'nope' },
        dialog: { width: 9999 },
        padding: { mode: 'custom', header: { left: -5, right: 99 } },
        narrow: { headerWrap: false },
      },
    })
    expect(settings.global.scrollbar).toBe('hidden')
    expect(settings.global.background.mode).toBe('color')
    expect(settings.global.background.color).toBe('#f4f6f9')
    expect(settings.global.dialog.width).toBe(1280)
    expect(settings.global.padding.mode).toBe('custom')
    expect(settings.global.padding.desktop.header).toEqual({ left: 0, right: 48 })
    expect(settings.global.narrow.headerWrap).toBe(false)
    expect(normalizeSettings({}).global).toEqual(DEFAULT_SETTINGS.global)
  })

  it('clamps material parameters to their ranges', () => {
    const settings = normalizeSettings({ material: { enabled: true, opacity: -20, blur: 999, saturation: -5 } })
    expect(settings.material).toEqual({ enabled: true, opacity: 40, blur: 48, saturation: 100 })
  })

  it('keeps the grade numbers round-trippable', () => {
    const settings = normalizeSettings({ material: { enabled: true, opacity: 72.4, blur: 26.9, saturation: 130 } })
    expect(settings.material).toEqual({ enabled: true, opacity: 72, blur: 27, saturation: 130 })
  })

  it('normalizes conversation overrides without changing native defaults', () => {
    const settings = normalizeSettings({ conversation: { width: 'full', inputRows: 4, scrollEnd: 'above', bubble: 'glass' } })
    expect(settings.conversation).toMatchObject({ width: 'full', inputRows: 4, scrollEnd: 'above', bubble: 'glass' })
    expect(normalizeSettings({}).conversation).toMatchObject({ width: 'native', inputRows: null, scrollEnd: 'native', bubble: 'native' })
  })

  it('clamps input rows and rejects unknown widths', () => {
    expect(normalizeSettings({ conversation: { inputRows: 99 } }).conversation.inputRows).toBe(6)
    expect(normalizeSettings({ conversation: { inputRows: 'tall' } }).conversation.inputRows).toBeNull()
    expect(normalizeSettings({ conversation: { width: 900 } }).conversation.width).toBe('native')
  })

  it('normalizes the trace tab', () => {
    const settings = normalizeSettings({ conversation: { trace: { background: 'clear', width: 'inset', tableTail: 'none' } } })
    expect(settings.conversation.trace).toEqual({ background: 'clear', width: 'inset', tableTail: 'none' })
    expect(normalizeSettings({ conversation: { trace: { width: 'weird' } } }).conversation.trace.width).toBe('full')
  })

  it('persists updates and notifies subscribers', () => {
    const values = new Map<string, string>()
    const storage: StorageLike = {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value) },
    }
    const store = new LayoutStore(storage)
    const listener = vi.fn()
    store.subscribe(listener)

    store.update({ conversation: { ...store.getSnapshot().conversation, stats: 'below' } })

    expect(listener).toHaveBeenCalledOnce()
    expect(store.getSnapshot().conversation.stats).toBe('below')
    expect(loadSettings(storage).conversation.stats).toBe('below')
  })

  it('notifies peek listeners without persisting', () => {
    const values = new Map<string, string>()
    const storage: StorageLike = {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value) },
    }
    const persist = vi.fn()
    const store = new LayoutStore(storage, persist)
    const listener = vi.fn()
    store.subscribe(listener)

    store.setPeek(true)
    expect(store.getPeek()).toBe(true)
    expect(listener).toHaveBeenCalledOnce()
    expect(persist).not.toHaveBeenCalled()
    expect(values.size).toBe(0)
  })

  it('filters stat metrics to known keys', () => {
    const settings = normalizeSettings({ conversation: { statsMetrics: { turns: false, nonsense: true, cache: false } } })
    expect(settings.conversation.statsMetrics).toEqual({ ...DEFAULT_METRICS, turns: false, cache: false })
  })

  it('resets to the native defaults', () => {
    const store = new LayoutStore()
    store.update({ material: { enabled: true, opacity: 58, blur: 40, saturation: 160 }, conversation: { ...store.getSnapshot().conversation, scrollEnd: 'above' } })
    store.reset()
    expect(store.getSnapshot()).toEqual(DEFAULT_SETTINGS)
  })
})
