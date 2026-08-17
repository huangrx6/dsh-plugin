import {
  DEFAULT_METRICS,
  DEFAULT_SETTINGS,
  DIALOG_HEIGHT_LIMITS,
  DIALOG_WIDTH_LIMITS,
  MATERIAL_LIMITS,
  PAD_LIMITS,
  RADIUS_LIMITS,
  ROWS_LIMITS,
  STATS_METRICS,
  type BackgroundMode,
  type BubbleMode,
  type LayoutSettings,
  type MaterialSettings,
  type MobileSidebarMode,
  type PaddingArea,
  type PaddingMode,
  type PaddingSides,
  type ReadWidth,
  type ScrollbarMode,
  type ScrollEnd,
  type StatsMetric,
  type StatsMode,
  type TraceBackground,
  type TraceTail,
  type TraceWidth,
} from './types.ts'

const STORAGE_KEY = 'dsh-layout.settings.v3'

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
    this.update({ ...DEFAULT_SETTINGS })
  }
}

export function browserStorage(): StorageLike | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/** Unknown shapes (including older versions) collapse to defaults — the
    stored settings model is small enough to rebuild rather than migrate. */
export function normalizeSettings(value: unknown): LayoutSettings {
  const input = isRecord(value) ? value : {}
  const globalInput = isRecord(input.global) ? input.global : {}
  const materialInput = isRecord(input.material) ? input.material : {}
  const conversationInput = isRecord(input.conversation) ? input.conversation : {}
  const traceInput = isRecord(conversationInput.trace) ? conversationInput.trace : {}
  return Object.freeze({
    version: 3,
    global: Object.freeze({
      scrollbar: isScrollbarMode(globalInput.scrollbar) ? globalInput.scrollbar : 'native',
      radius: optionalNumber(globalInput.radius, RADIUS_LIMITS),
      background: normalizeBackground(globalInput.background),
      dialog: Object.freeze({
        width: optionalNumber(isRecord(globalInput.dialog) ? globalInput.dialog.width : undefined, DIALOG_WIDTH_LIMITS),
        height: optionalNumber(isRecord(globalInput.dialog) ? globalInput.dialog.height : undefined, DIALOG_HEIGHT_LIMITS),
      }),
      padding: normalizePadding(globalInput.padding),
      narrow: Object.freeze({
        headerWrap: !isRecord(globalInput.narrow) || globalInput.narrow.headerWrap !== false,
        sidebar: isMobileSidebarMode(isRecord(globalInput.narrow) ? globalInput.narrow.sidebar : undefined)
          ? (globalInput.narrow as { sidebar: 'native' | 'fullscreen' }).sidebar
          : 'native',
      }),
    }),
    material: material(materialInput),
    conversation: Object.freeze({
      width: isReadWidth(conversationInput.width) ? conversationInput.width : 'native',
      inputRows: optionalNumber(conversationInput.inputRows, ROWS_LIMITS),
      scrollEnd: isScrollEnd(conversationInput.scrollEnd) ? conversationInput.scrollEnd : 'native',
      bubble: isBubbleMode(conversationInput.bubble) ? conversationInput.bubble : 'native',
      trace: Object.freeze({
        background: isTraceBackground(traceInput.background) ? traceInput.background : 'native',
        width: isTraceWidth(traceInput.width) ? traceInput.width : 'full',
        tableTail: isTraceTail(traceInput.tableTail) ? traceInput.tableTail : 'native',
      }),
      stats: isStatsMode(conversationInput.stats) ? conversationInput.stats : 'native',
      statsMetrics: metrics(conversationInput.statsMetrics),
    }),
  })
}

export function loadSettings(storage?: StorageLike): LayoutSettings {
  if (storage === undefined) return DEFAULT_SETTINGS
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return DEFAULT_SETTINGS
    return normalizeSettings(JSON.parse(raw))
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

function material(value: Record<string, unknown>): MaterialSettings {
  return Object.freeze({
    enabled: value.enabled === true,
    opacity: number(value.opacity, DEFAULT_SETTINGS.material.opacity, MATERIAL_LIMITS.opacity),
    blur: number(value.blur, DEFAULT_SETTINGS.material.blur, MATERIAL_LIMITS.blur),
    saturation: number(value.saturation, DEFAULT_SETTINGS.material.saturation, MATERIAL_LIMITS.saturation),
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

function isScrollbarMode(value: unknown): value is ScrollbarMode {
  return value === 'native' || value === 'hidden'
}

function isReadWidth(value: unknown): value is ReadWidth {
  return value === 'native' || value === 'full'
}

function isScrollEnd(value: unknown): value is ScrollEnd {
  return value === 'native' || value === 'above'
}

function isBubbleMode(value: unknown): value is BubbleMode {
  return value === 'native' || value === 'glass' || value === 'solid' || value === 'transparent'
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

function normalizeBackground(value: unknown): LayoutSettings['global']['background'] {
  const input = isRecord(value) ? value : {}
  return Object.freeze({
    mode: isBackgroundMode(input.mode) ? input.mode : 'native',
    color: hex(input.color, DEFAULT_SETTINGS.global.background.color),
    imageUrl: url(input.imageUrl),
    videoUrl: url(input.videoUrl),
  })
}

function isBackgroundMode(value: unknown): value is BackgroundMode {
  return value === 'native' || value === 'color' || value === 'image' || value === 'video'
}

function isMobileSidebarMode(value: unknown): value is MobileSidebarMode {
  return value === 'native' || value === 'fullscreen'
}

function normalizePadding(value: unknown): LayoutSettings['global']['padding'] {
  const input = isRecord(value) ? value : {}
  const sides = (raw: unknown): PaddingSides => {
    const r = isRecord(raw) ? raw as Record<string, unknown> : {}
    return Object.freeze({ left: optionalNumber(r.left, PAD_LIMITS), right: optionalNumber(r.right, PAD_LIMITS) })
  }
  const area = (raw: unknown): PaddingArea => {
    const r = isRecord(raw) ? raw as Record<string, unknown> : {}
    return Object.freeze({ header: sides(r.header), content: sides(r.content), composer: sides(r.composer) })
  }
  const mode = input.mode === 'custom' ? 'custom' satisfies PaddingMode as PaddingMode : 'auto'
  // 旧版形状 { mode, header, content, composer } → 迁到 desktop，mobile 全空。
  const legacy = isRecord(input.header) || isRecord(input.content) || isRecord(input.composer)
  if (legacy && !isRecord(input.desktop)) {
    return Object.freeze({ mode, desktop: area(input), mobile: area({}) })
  }
  return Object.freeze({ mode, desktop: area(input.desktop), mobile: area(input.mobile) })
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
