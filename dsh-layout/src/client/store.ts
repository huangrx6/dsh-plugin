import {
  DEFAULT_METRICS,
  DEFAULT_SETTINGS,
  DENSITY_LIMITS,
  DIALOG_HEIGHT_LIMITS,
  PAD_LIMITS,
  SIDEBAR_WIDTH_LIMITS,
  SIDEBAR_PADDING_LIMITS,
  SIDEBAR_ROW_HEIGHT_LIMITS,
  SIDEBAR_ROW_GAP_LIMITS,
  type PaddingMode,
  type PaddingSides,
  DIALOG_WIDTH_LIMITS,
  RADIUS_LIMITS,
  READ_WIDTH_LIMITS,
  ROWS_LIMITS,
  SCALE_LIMITS,
  GLASS_LIMITS,
  STATS_METRICS,
  coreSettings,
  type BackgroundMode,
  type BubbleMode,
  type ContentAlign,
  type Quality,
  type SettingsView,
  type TraceBackground,
  type TraceTail,
  type TraceWidth,
  type FooterPlate,
  type ScrollRange,
  type GlassMaterial,
  type LayoutProfile,
  type LayoutSettings,
  type ReadWidth,
  type ScrollbarMode,
  type SidebarDivider,
  type SidebarScrollbar,
  type StatsMetric,
  type StatsMode,
} from './types.ts'

const STORAGE_KEY = 'dsh-layout.settings.v2'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type LayoutListener = () => void

export class LayoutStore {
  private snapshot: LayoutSettings
  /** Transient "hold to compare against native" state — never persisted. */
  private peeking = false
  private readonly listeners = new Set<LayoutListener>()

  constructor(
    private readonly storage?: StorageLike,
    private readonly persist?: (settings: LayoutSettings) => void,
  ) {
    this.snapshot = loadSettings(storage)
  }

  readonly getSnapshot = (): LayoutSettings => this.snapshot

  readonly getPeek = (): boolean => this.peeking

  readonly subscribe = (listener: LayoutListener): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  update(patch: Partial<LayoutSettings>): void {
    const next = normalizeSettings({ ...this.snapshot, ...patch })
    if (sameSettings(next, this.snapshot)) return
    this.snapshot = next
    this.persist?.(next)
    saveSettings(this.storage, next)
    for (const listener of this.listeners) listener()
  }

  hydrate(value: unknown, persist = false): void {
    const next = normalizeSettings(value)
    if (sameSettings(next, this.snapshot)) return
    this.snapshot = next
    if (persist) {
      this.persist?.(next)
      saveSettings(this.storage, next)
    }
    for (const listener of this.listeners) listener()
  }

  setPeek(value: boolean): void {
    if (this.peeking === value) return
    this.peeking = value
    for (const listener of this.listeners) listener()
  }

  reset(): void {
    this.update(coreSettings(DEFAULT_SETTINGS))
  }

  saveProfile(name: string): void {
    const clean = name.trim().slice(0, 40)
    if (clean === '') return
    const profiles = this.snapshot.profiles.filter(profile => profile.name !== clean)
    this.update({
      profiles: [...profiles, { id: profileId(), name: clean, data: coreSettings(this.snapshot) }],
    })
  }

  applyProfile(id: string): void {
    const profile = this.snapshot.profiles.find(item => item.id === id)
    if (profile === undefined) return
    this.update({ ...profile.data, profiles: this.snapshot.profiles })
  }

  deleteProfile(id: string): void {
    this.update({ profiles: this.snapshot.profiles.filter(profile => profile.id !== id) })
  }
}

function profileId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function browserStorage(): StorageLike | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export function normalizeSettings(value: unknown): LayoutSettings {
  const input = isRecord(value) ? value : {}
  const globalInput = isRecord(input.global) ? input.global : {}
  const sidebarInput = isRecord(input.sidebar) ? input.sidebar : {}
  const contentInput = isRecord(input.content) ? input.content : {}
  const footerInput = isRecord(input.footer) ? input.footer : {}
  return Object.freeze({
    version: 2,
    global: Object.freeze({
      radius: optionalNumber(globalInput.radius, RADIUS_LIMITS),
      background: normalizeBackground(globalInput.background),
      fluidGlass: globalInput.fluidGlass === true,
      dialog: Object.freeze({
        width: optionalNumber(isRecord(globalInput.dialog) ? globalInput.dialog.width : undefined, DIALOG_WIDTH_LIMITS),
        height: optionalNumber(isRecord(globalInput.dialog) ? globalInput.dialog.height : undefined, DIALOG_HEIGHT_LIMITS),
      }),
      padding: normalizePadding(globalInput.padding),
      narrow: Object.freeze({
        headerWrap: !isRecord(globalInput.narrow) || globalInput.narrow.headerWrap !== false,
      }),
      settingsView: isSettingsView(globalInput.settingsView) ? globalInput.settingsView : 'embedded',
      // Legacy fluidGlass meant "remove blur"; migrate its behavior into
      // the single quality control while keeping the old field readable.
      quality: isQuality(globalInput.quality)
        ? globalInput.quality
        : globalInput.fluidGlass === true ? 'performance' : 'quality',
    }),
    // v2.0 persisted the sidebar glass flat; v2.1 wraps it with the divider.
    // v2.2 folds the header material into the content area and drops the
    // footer width (the composer now follows the content reading measure);
    // both old fields are simply ignored on load.
    sidebar: Object.freeze({
      width: optionalNumber(sidebarInput.width, SIDEBAR_WIDTH_LIMITS),
      paddingX: optionalNumber(sidebarInput.paddingX, SIDEBAR_PADDING_LIMITS),
      paddingY: optionalNumber(sidebarInput.paddingY, SIDEBAR_PADDING_LIMITS),
      rowHeight: optionalNumber(sidebarInput.rowHeight, SIDEBAR_ROW_HEIGHT_LIMITS),
      rowGap: optionalNumber(sidebarInput.rowGap, SIDEBAR_ROW_GAP_LIMITS),
      scrollbar: isSidebarScrollbar(sidebarInput.scrollbar) ? sidebarInput.scrollbar : 'native',
      glass: glass(sidebarInput.glass ?? sidebarInput, DEFAULT_SETTINGS.sidebar.glass),
      divider: isSidebarDivider(sidebarInput.divider) ? sidebarInput.divider : 'native',
    }),
    content: Object.freeze({
      glass: glass(contentInput.glass, DEFAULT_SETTINGS.content.glass),
      width: readWidth(contentInput.width),
      density: optionalNumber(contentInput.density, DENSITY_LIMITS),
      scale: number(contentInput.scale, 100, SCALE_LIMITS),
      scrollbar: isScrollbarMode(contentInput.scrollbar) ? contentInput.scrollbar : 'native',
      bubble: isBubbleMode(contentInput.bubble) ? contentInput.bubble : 'native',
      align: contentInput.align === 'start' ? 'start' satisfies ContentAlign as ContentAlign : 'center',
      trace: Object.freeze({
        background: isTraceBackground(isRecord(contentInput.trace) ? contentInput.trace.background : undefined) ? (contentInput.trace as { background: TraceBackground }).background : 'native',
        width: isTraceWidth(isRecord(contentInput.trace) ? contentInput.trace.width : undefined) ? (contentInput.trace as { width: TraceWidth }).width : 'full',
        tableTail: isTraceTail(isRecord(contentInput.trace) ? contentInput.trace.tableTail : undefined) ? (contentInput.trace as { tableTail: TraceTail }).tableTail : 'native',
      }),
    }),
    footer: Object.freeze({
      // The old plate enum mixed scroll extent with floor paint; split it.
      // Pre-plate full-width configs kept the log above the input.
      scrollRange: isScrollRange(footerInput.scrollRange)
        ? footerInput.scrollRange
        : footerInput.plate === 'above' || (footerInput.plate === undefined && readWidth(contentInput.width) === 'full')
          ? 'above' satisfies ScrollRange as ScrollRange
          : 'native',
      plate: isFooterPlate(footerInput.plate) ? footerInput.plate : 'transparent',
      rows: number(footerInput.rows, 3, ROWS_LIMITS),
      stats: isStatsMode(footerInput.stats) ? footerInput.stats : 'native',
      statsMetrics: metrics(footerInput.statsMetrics),
    }),
    profiles: profiles(input.profiles),
  })
}

/**
 * The v1 model (preset enums + per-section toggles) maps onto v2 without ever
 * inventing custom values: 'frosted' sections become glass areas, wallpaper
 * becomes an image background, and the old width/placement choices carry over.
 */
export function normalizeSettingsV1(value: unknown): LayoutSettings {
  const input = isRecord(value) ? value : {}
  const enabled = input.enabled === true
  const base = normalizeSettings({})
  const sectionGlass = (key: string, fallback: GlassMaterial): GlassMaterial => {
    const section = isRecord(input[key]) ? input[key] : {}
    const on = enabled && section.enabled === true && section.preset === 'frosted'
    return { ...fallback, enabled: on }
  }
  const background = isRecord(input.background) ? input.background : {}
  const mode: BackgroundMode = enabled && background.enabled === true
    ? background.mode === 'color' || background.mode === 'gradient' || background.mode === 'dynamic'
      ? 'color'
      : background.mode === 'wallpaper'
        ? 'image'
        : 'native'
    : 'native'
  let stats: StatsMode = 'native'
  if (enabled) {
    if (input.placement === 'dock') stats = 'below'
    else if (input.summary === 'icon') stats = 'icon'
    else stats = 'brief'
  }
  return {
    ...base,
    global: { ...base.global, background: {
      mode,
      color: hex(background.color, base.global.background.color),
      imageUrl: mode === 'image' ? url(background.wallpaperUrl) : '',
      videoUrl: '',
    } },
    sidebar: { ...base.sidebar, glass: sectionGlass('sidebar', base.sidebar.glass) },
    content: {
      ...base.content,
      glass: sectionGlass('content', base.content.glass),
      width: enabled && input.composerWidth === 'full' ? 'full' as const : 'native' as const,
    },
    footer: {
      ...base.footer,
      scrollRange: enabled && input.composerWidth === 'full' ? 'above' as const : base.footer.scrollRange,
      stats,
    },
  }
}

export function loadSettings(storage?: StorageLike): LayoutSettings {
  if (storage === undefined) return DEFAULT_SETTINGS
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return DEFAULT_SETTINGS
    const parsed: unknown = JSON.parse(raw)
    const legacy = !(isRecord(parsed) && parsed.version === 2)
    const settings = legacy ? normalizeSettingsV1(parsed) : normalizeSettings(parsed)
    if (legacy) storage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return settings
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(storage: StorageLike | undefined, settings: LayoutSettings): void {
  if (storage === undefined) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('layout settings could not be saved:', error)
  }
}

function glass(value: unknown, fallback: GlassMaterial): GlassMaterial {
  const input = isRecord(value) ? value : {}
  return Object.freeze({
    enabled: input.enabled === true,
    tint: input.tint === undefined || input.tint === '' ? '' : hex(input.tint, ''),
    opacity: number(input.opacity, fallback.opacity, GLASS_LIMITS.opacity),
    blur: number(input.blur, fallback.blur, GLASS_LIMITS.blur),
    saturation: number(input.saturation, fallback.saturation, GLASS_LIMITS.saturation),
  })
}

function normalizeBackground(value: unknown): LayoutSettings['global']['background'] {
  const input = isRecord(value) ? value : {}
  return Object.freeze({
    mode: isBackgroundMode(input.mode) ? input.mode : 'native',
    color: hex(input.color, DEFAULT_SETTINGS.global.background.color),
    imageUrl: url(input.imageUrl),
    videoUrl: url(input.videoUrl),
  })
}

function metrics(value: unknown): Readonly<Record<StatsMetric, boolean>> {
  const input = isRecord(value) ? value : {}
  const result = { ...DEFAULT_METRICS }
  for (const metric of STATS_METRICS) {
    if (typeof input[metric] === 'boolean') result[metric] = input[metric] as boolean
  }
  return Object.freeze(result)
}

function profiles(value: unknown): readonly LayoutProfile[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const result: LayoutProfile[] = []
  for (const item of value.slice(0, 24)) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string' || !isRecord(item.data)) continue
    const name = item.name.trim().slice(0, 40)
    if (name === '' || seen.has(item.id)) continue
    seen.add(item.id)
    result.push(Object.freeze({ id: item.id.slice(0, 32), name, data: coreSettings(normalizeSettings({ ...item.data, profiles: [] })) }))
  }
  return Object.freeze(result)
}

function readWidth(value: unknown): ReadWidth {
  if (value === 'native' || value === 'full') return value
  if (typeof value === 'number' && Number.isFinite(value)) return Math.min(READ_WIDTH_LIMITS[1], Math.max(READ_WIDTH_LIMITS[0], Math.round(value)))
  return 'native'
}

function isBackgroundMode(value: unknown): value is BackgroundMode {
  return value === 'native' || value === 'color' || value === 'image' || value === 'video'
}

function isSidebarDivider(value: unknown): value is SidebarDivider {
  return value === 'native' || value === 'hidden'
}

function isSidebarScrollbar(value: unknown): value is SidebarScrollbar {
  return value === 'native' || value === 'hidden'
}

function isFooterPlate(value: unknown): value is FooterPlate {
  return value === 'transparent' || value === 'solid'
}

function isScrollRange(value: unknown): value is ScrollRange {
  return value === 'native' || value === 'above'
}

function isScrollbarMode(value: unknown): value is ScrollbarMode {
  return value === 'native' || value === 'hidden'
}

function isBubbleMode(value: unknown): value is BubbleMode {
  return value === 'native' || value === 'glass' || value === 'solid' || value === 'transparent'
}

function normalizePadding(value: unknown): LayoutSettings['global']['padding'] {
  const input = isRecord(value) ? value : {}
  const sides = (area: 'header' | 'content' | 'composer'): PaddingSides => {
    const raw = isRecord(input[area]) ? input[area] as Record<string, unknown> : {}
    return Object.freeze({
      left: optionalNumber(raw.left, PAD_LIMITS),
      right: optionalNumber(raw.right, PAD_LIMITS),
    })
  }
  return Object.freeze({
    mode: input.mode === 'custom' ? 'custom' satisfies PaddingMode as PaddingMode : 'auto',
    header: sides('header'),
    content: sides('content'),
    composer: sides('composer'),
  })
}

function isQuality(value: unknown): value is Quality {
  return value === 'quality' || value === 'balanced' || value === 'performance'
}

function isSettingsView(value: unknown): value is SettingsView {
  return value === 'embedded' || value === 'page'
}

function isTraceBackground(value: unknown): value is TraceBackground {
  return value === 'native' || value === 'clear'
}

function isTraceWidth(value: unknown): value is TraceWidth {
  return value === 'full' || value === 'inset' || value === 'message'
}

function isTraceTail(value: unknown): value is TraceTail {
  return value === 'native' || value === 'none'
}

function isStatsMode(value: unknown): value is StatsMode {
  return value === 'native' || value === 'icon' || value === 'brief' || value === 'below'
}

function hex(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/iu.test(value) ? value.toLowerCase() : fallback
}

function url(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 4096) : ''
}

function number(value: unknown, fallback: number, [min, max]: readonly [number, number]): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback
}

function optionalNumber(value: unknown, [min, max]: readonly [number, number]): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sameSettings(a: LayoutSettings, b: LayoutSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
