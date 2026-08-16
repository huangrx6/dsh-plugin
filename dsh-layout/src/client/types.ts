export type GlassArea = 'sidebar' | 'header' | 'content' | 'footer'
export type StatsMode = 'native' | 'icon' | 'brief' | 'below'
export type BackgroundMode = 'native' | 'color' | 'image' | 'video'
export type SidebarDivider = 'native' | 'hidden'
/** The input-area floor: native leaves it to DSH (translucent, the log
    scrolls under the whole window); above pulls the composer out of the
    scroll flow so the log ENDS above it while the plate stays transparent;
    solid paints an opaque strip instead. */
export type FooterPlate = 'native' | 'above' | 'solid'
export type ScrollbarMode = 'native' | 'hidden'
/** Message bubbles: native keeps DSH's blue-tinted fill; glass frosts them. */
export type BubbleMode = 'native' | 'glass'
/** null keeps the native reading measure; 'full' lets the column fill the window. */
export type ReadWidth = 'native' | 'full' | number
export type StatsMetric = 'turns' | 'steps' | 'llm' | 'tools' | 'ttft' | 'speed' | 'cache' | 'tokens'

export const STATS_METRICS: readonly StatsMetric[] = ['turns', 'steps', 'llm', 'tools', 'ttft', 'speed', 'cache', 'tokens']

/**
 * macOS / iOS style frosted material. `tint` is empty while the surface
 * follows the theme base color; a hex value pins it explicitly. Opacity 0
 * leaves a pure frost (blur only, no tint).
 */
export interface GlassMaterial {
  readonly enabled: boolean
  readonly tint: string
  readonly opacity: number
  readonly blur: number
  readonly saturation: number
}

export interface BackgroundSettings {
  readonly mode: BackgroundMode
  readonly color: string
  readonly imageUrl: string
  readonly videoUrl: string
}

export interface GlobalSettings {
  /** null keeps every native corner radius untouched. */
  readonly radius: number | null
  readonly background: BackgroundSettings
  /** Drops every backdrop blur and keeps translucent fills only. */
  readonly fluidGlass: boolean
  /** Settings dialog panel size; null keeps DSH's native 800×min(800, vh−48). */
  readonly dialog: DialogSize
}

export interface DialogSize {
  readonly width: number | null
  readonly height: number | null
}

export interface ContentSettings {
  readonly glass: GlassMaterial
  /** Reading measure for the conversation AND the composer width: 'native'
      keeps both centered at the native measure, a number sets both, 'full'
      lets the column and the input row span the window edges. */
  readonly width: ReadWidth
  /** null keeps the native message rhythm (16px column gap). */
  readonly density: number | null
  /** 100 keeps native sizing; 85–125 scales the conversation viewport. */
  readonly scale: number
  readonly scrollbar: ScrollbarMode
  /** Message bubbles: frosted glass instead of DSH's blue-tinted fill. */
  readonly bubble: BubbleMode
}

export interface FooterSettings {
  /** Opaque floor under the whole input region — the conversation log stops
      at its top edge instead of scrolling beneath the composer. */
  readonly plate: FooterPlate
  /** Input textarea line count while the composer is full width. */
  readonly rows: number
  readonly stats: StatsMode
  readonly statsMetrics: Readonly<Record<StatsMetric, boolean>>
}

export interface SidebarSettings {
  readonly glass: GlassMaterial
  readonly divider: SidebarDivider
}

/** Everything except the profile list itself, so snapshots never nest. */
export type CoreSettings = Omit<LayoutSettings, 'profiles'>

export interface LayoutProfile {
  readonly id: string
  readonly name: string
  readonly data: CoreSettings
}

export interface LayoutSettings {
  readonly version: 2
  readonly global: GlobalSettings
  readonly sidebar: SidebarSettings
  /** One material owns the whole center region: header + conversation; the
      header paints with the content material (no separate header settings). */
  readonly content: ContentSettings
  readonly footer: FooterSettings
  readonly profiles: readonly LayoutProfile[]
}

export const GLASS_LIMITS = Object.freeze({
  opacity: Object.freeze([0, 100] as const),
  blur: Object.freeze([0, 48] as const),
  saturation: Object.freeze([100, 200] as const),
})

export const RADIUS_LIMITS = Object.freeze([0, 20] as const)
export const DENSITY_LIMITS = Object.freeze([4, 40] as const)
export const SCALE_LIMITS = Object.freeze([85, 125] as const)
export const READ_WIDTH_LIMITS = Object.freeze([640, 1440] as const)
export const ROWS_LIMITS = Object.freeze([1, 6] as const)
export const DIALOG_WIDTH_LIMITS = Object.freeze([600, 1280] as const)
export const DIALOG_HEIGHT_LIMITS = Object.freeze([480, 1080] as const)

/** Named parameter sets on top of the sliders — state stays in the numbers. */
export const GLASS_TIERS: Readonly<Record<string, Omit<GlassMaterial, 'enabled' | 'tint'>>> = Object.freeze({
  airy: Object.freeze({ opacity: 55, blur: 32, saturation: 180 }),
  standard: Object.freeze({ opacity: 72, blur: 16, saturation: 120 }),
  solid: Object.freeze({ opacity: 88, blur: 8, saturation: 105 }),
})

export function glassTier(material: GlassMaterial): string | undefined {
  return Object.entries(GLASS_TIERS).find(([, tier]) =>
    tier.opacity === material.opacity && tier.blur === material.blur && tier.saturation === material.saturation,
  )?.[0]
}

export function defaultGlass(opacity: number): GlassMaterial {
  return Object.freeze({ enabled: false, tint: '', opacity, blur: 16, saturation: 120 })
}

export const DEFAULT_METRICS: Readonly<Record<StatsMetric, boolean>> = Object.freeze({
  turns: true, steps: true, llm: true, tools: true, ttft: true, speed: true, cache: true, tokens: true,
})

export const DEFAULT_SETTINGS: LayoutSettings = Object.freeze({
  version: 2,
  global: Object.freeze({
    radius: null,
    background: Object.freeze({ mode: 'native' as const, color: '#f4f6f9', imageUrl: '', videoUrl: '' }),
    fluidGlass: false,
    dialog: Object.freeze({ width: null, height: null }),
  }),
  sidebar: Object.freeze({ glass: defaultGlass(72), divider: 'native' as const }),
  content: Object.freeze({
    glass: defaultGlass(72),
    width: 'native' as const,
    density: null,
    scale: 100,
    scrollbar: 'native' as const,
    bubble: 'native' as const,
  }),
  footer: Object.freeze({
    plate: 'native' as const,
    rows: 3,
    stats: 'native' as const,
    statsMetrics: DEFAULT_METRICS,
  }),
  profiles: Object.freeze([]),
})

export function coreSettings(settings: LayoutSettings): CoreSettings {
  const { profiles: _profiles, ...core } = settings
  return core
}
