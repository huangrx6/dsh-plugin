import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_METRICS, DEFAULT_SETTINGS } from '../src/client/types.ts'
import { LayoutStore, loadSettings, normalizeSettings, normalizeSettingsV1, type StorageLike } from '../src/client/store.ts'

describe('LayoutStore', () => {
  it('normalizes invalid settings', () => {
    expect(normalizeSettings({ global: { radius: 'big' }, sidebar: { opacity: 'thin', tint: 'nope' }, footer: { stats: 'everywhere' } })).toEqual(DEFAULT_SETTINGS)
  })

  it('clamps glass parameters to their ranges', () => {
    const settings = normalizeSettings({ sidebar: { glass: { enabled: true, opacity: -20, blur: 999, saturation: -5, tint: '#FF0000' }, divider: 'hidden' } })
    expect(settings.sidebar.glass).toMatchObject({ enabled: true, opacity: 0, blur: 48, saturation: 100, tint: '#ff0000' })
    expect(settings.sidebar.divider).toBe('hidden')
  })

  it('accepts a pure frost at opacity 0', () => {
    const settings = normalizeSettings({ sidebar: { glass: { enabled: true, opacity: 0, blur: 20, saturation: 120 }, divider: 'native' } })
    expect(settings.sidebar.glass.opacity).toBe(0)
  })

  it('normalizes sidebar layout overrides without changing native defaults', () => {
    const settings = normalizeSettings({ sidebar: { width: 340, paddingX: 12, paddingY: 6, rowHeight: 36, rowGap: 4, scrollbar: 'hidden' } })
    expect(settings.sidebar).toMatchObject({ width: 340, paddingX: 12, paddingY: 6, rowHeight: 36, rowGap: 4, scrollbar: 'hidden' })
    expect(normalizeSettings({}).sidebar).toMatchObject({ width: null, paddingX: null, paddingY: null, rowHeight: null, rowGap: null, scrollbar: 'native' })
  })

  it('clamps sidebar layout values', () => {
    expect(normalizeSettings({ sidebar: { width: 999, paddingX: -5, paddingY: 99, rowHeight: 1, rowGap: 99 } }).sidebar).toMatchObject({ width: 420, paddingX: 0, paddingY: 32, rowHeight: 28, rowGap: 16 })
  })

  it('accepts the flat v2.0 sidebar glass shape', () => {
    const settings = normalizeSettings({ sidebar: { enabled: true, tint: '', opacity: 80, blur: 20, saturation: 140 } })
    expect(settings.sidebar).toMatchObject({ glass: { enabled: true, opacity: 80 }, divider: 'native' })
  })

  it('drops the pre-merge header material and footer width from persisted data', () => {
    const settings = normalizeSettings({
      header: { enabled: true, tint: '', opacity: 60, blur: 30, saturation: 180 },
      footer: { glass: { enabled: true, tint: '', opacity: 82, blur: 16, saturation: 120 }, width: 'full', stats: 'brief' },
    })
    expect('header' in settings).toBe(false)
    expect('width' in settings.footer).toBe(false)
    expect(settings.footer.stats).toBe('brief')
  })

  it('clamps radius, density, scale and reading width', () => {
    const settings = normalizeSettings({
      global: { radius: 99 },
      content: { density: 0, scale: 400, width: 100 },
    })
    expect(settings.global.radius).toBe(20)
    expect(settings.content.density).toBe(4)
    expect(settings.content.scale).toBe(125)
    expect(settings.content.width).toBe(640)
  })

  it('keeps null as the native default for radius and density', () => {
    expect(normalizeSettings({}).global.radius).toBeNull()
    expect(normalizeSettings({}).content.density).toBeNull()
    expect(normalizeSettings({ content: { density: 'off' } }).content.density).toBeNull()
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

    store.update({ footer: { ...store.getSnapshot().footer, stats: 'below' } })

    expect(listener).toHaveBeenCalledOnce()
    expect(store.getSnapshot().footer.stats).toBe('below')
    expect(loadSettings(storage).footer.stats).toBe('below')
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
    const settings = normalizeSettings({ footer: { statsMetrics: { turns: false, nonsense: true, cache: false } } })
    expect(settings.footer.statsMetrics).toEqual({ ...DEFAULT_METRICS, turns: false, cache: false })
  })

  it('caps and cleans the profile list', () => {
    const settings = normalizeSettings({ profiles: [{ id: 'a', name: '  晨间  ', data: {} }, { id: 'a', name: 'dup' }, { id: 'b' }, 'junk'] })
    expect(settings.profiles).toHaveLength(1)
    expect(settings.profiles[0]).toMatchObject({ id: 'a', name: '晨间' })
    expect(settings.profiles[0]!.data.version).toBe(2)
  })
})

describe('v1 migration', () => {
  it('maps the old frosted preset, wallpaper background and widths onto v2', () => {
    const migrated = normalizeSettingsV1({
      enabled: true,
      placement: 'toolbar',
      summary: 'icon',
      contentWidth: 'full',
      composerWidth: 'full',
      composerSurface: 'frosted',
      presetId: 'frosted',
      sidebar: { enabled: true, preset: 'frosted' },
      header: { enabled: true, preset: 'compact' },
      content: { enabled: true, preset: 'native' },
      footer: { enabled: true, preset: 'frosted' },
      background: { enabled: true, mode: 'wallpaper', color: '#f4f6f9', wallpaperUrl: 'https://example.com/a.jpg' },
    })
    expect(migrated.version).toBe(2)
    expect(migrated.sidebar.glass.enabled).toBe(true)
    expect(migrated.content.glass.enabled).toBe(false)
    expect(migrated.footer.scrollRange).toBe('above')
    expect(migrated.footer.plate).toBe('transparent')
    expect(migrated.footer.rows).toBe(3)
    expect(migrated.content.width).toBe('full')
    expect(migrated.footer.stats).toBe('icon')
    expect(migrated.global.background.mode).toBe('image')
    expect(migrated.global.background.imageUrl).toBe('https://example.com/a.jpg')
  })

  it('carries the opaque floor forward for pre-plate full-width configs', () => {
    expect(normalizeSettings({ content: { width: 'full' } }).footer.scrollRange).toBe('above')
    expect(normalizeSettings({ footer: { plate: 'transparent' }, content: { width: 'full' } }).footer.scrollRange).toBe('native')
    expect(normalizeSettings({ footer: { plate: 'solid' } }).footer).toMatchObject({ scrollRange: 'native', plate: 'solid' })
    expect(normalizeSettings({}).footer).toMatchObject({ scrollRange: 'native', plate: 'transparent' })
    expect(normalizeSettings({ footer: { rows: 99 } }).footer.rows).toBe(6)
  })

  it('maps the dock inline placement to the below-row stats mode', () => {
    const migrated = normalizeSettingsV1({ enabled: true, placement: 'dock', summary: 'inline' })
    expect(migrated.footer.stats).toBe('below')
  })

  it('returns fully native settings when v1 was disabled', () => {
    const migrated = normalizeSettingsV1({ enabled: false, sidebar: { enabled: true, preset: 'frosted' } })
    expect(migrated).toEqual(DEFAULT_SETTINGS)
  })

  it('re-stores migrated settings under the v2 key on load', () => {
    const values = new Map<string, string>([
      ['dsh-layout.settings.v2', JSON.stringify({ enabled: true, placement: 'dock', summary: 'inline' })],
    ])
    const storage: StorageLike = {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value) },
    }
    const settings = loadSettings(storage)
    expect(settings.footer.stats).toBe('below')
    expect(JSON.parse(values.get('dsh-layout.settings.v2')!).version).toBe(2)
  })
})
