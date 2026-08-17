export type GlassArea = 'sidebar' | 'header' | 'content' | 'footer'
export type StatsMode = 'native' | 'icon' | 'brief' | 'below'
export type BackgroundMode = 'native' | 'color' | 'image' | 'video'
export type SidebarDivider = 'native' | 'hidden'
/** Conversation scroll extent: native lets the log scroll under the whole
    window; above pulls the composer out of the scroll flow so the log ENDS
    above the input while the plate stays clear. */
export type ScrollRange = 'native' | 'above'
/** The input-area floor under the composer when the log scrolls beneath it:
    clear shows the page through, solid paints the conversation color. */
export type FooterPlate = 'transparent' | 'solid'
export type ScrollbarMode = 'native' | 'hidden'
/** Message bubbles: native keeps DSH's blue-tinted fill; glass frosts them;
    solid is an opaque panel; transparent keeps only the hairline. */
export type BubbleMode = 'native' | 'glass' | 'solid' | 'transparent'
/** Trace tab: native keeps DSH's white canvas; clear shows the content glass. */
export type TraceBackground = 'native' | 'clear'
/** Trace tab: full keeps DSH's edge-to-edge canvas; inset aligns to the
    header row; message aligns to the reading measure. */
export type TraceWidth = 'full' | 'inset' | 'message'

/** Trace ledger tail space: DSH reserves a scroll tail under the floating
    input; the above-plate already reserves its own, making it redundant. */
export type TraceTail = 'native' | 'none'

export interface TraceSettings {
  readonly background: TraceBackground
  readonly width: TraceWidth
  readonly tableTail: TraceTail
}

export type ContentAlign = 'center' | 'start'

/** Rendering quality: full effects, capped blurs, or flat fills only. */
export type Quality = 'quality' | 'balanced' | 'performance'
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
  readonly padding: PaddingSettings
  readonly narrow: NarrowSettings
  readonly settingsView: SettingsView
  readonly quality: Quality
}

export interface DialogSize {
  readonly width: number | null
  readonly height: number | null
}

/** Page paddings as layout tokens: full-width presets (desktop 20/28 header,
    28 content/composer) overridden by a mobile preset (0/8, 8/8, 8/8) and
    finally by explicit user values. Native width mode is untouched. */
export type PaddingMode = 'auto' | 'custom'

export interface PaddingSides {
  readonly left: number | null
  readonly right: number | null
}

export interface PaddingSettings {
  readonly mode: PaddingMode
  readonly header: PaddingSides
  readonly content: PaddingSides
  readonly composer: PaddingSides
}

/** Narrow-viewport (< 768px) adaptation: header wrapping against crowding. */
export interface NarrowSettings {
  readonly headerWrap: boolean
}

/** Where the layout editor lives: embedded in DSH's settings dialog, or as
    the plugin's own full-page overlay (portal, mobile-friendly). */
export type SettingsView = 'embedded' | 'page'

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
  readonly trace: TraceSettings
  /** Message column alignment inside the content region (full width). */
  readonly align: ContentAlign
}

export interface FooterSettings {
  /** Where the conversation log stops relative to the input area. */
  readonly scrollRange: ScrollRange
  /** Floor appearance; meaningless (and hidden) once the log ends above. */
  readonly plate: FooterPlate
  /** Input textarea line count while the composer is full width. */
  readonly rows: number
  readonly stats: StatsMode
  readonly statsMetrics: Readonly<Record<StatsMetric, boolean>>
}

export type SidebarScrollbar = 'native' | 'hidden'

export interface SidebarSettings {
  /** Sidebar column layout. Null values keep DSH native CSS. */
  readonly width: number | null
  readonly paddingX: number | null
  readonly paddingY: number | null
  /** Session list rhythm. Null values keep DSH native row geometry. */
  readonly rowHeight: number | null
  readonly rowGap: number | null
  readonly scrollbar: SidebarScrollbar
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
export const PAD_LIMITS = Object.freeze([0, 48] as const)
export const SIDEBAR_WIDTH_LIMITS = Object.freeze([220, 420] as const)
export const SIDEBAR_PADDING_LIMITS = Object.freeze([0, 32] as const)
export const SIDEBAR_ROW_HEIGHT_LIMITS = Object.freeze([28, 52] as const)
export const SIDEBAR_ROW_GAP_LIMITS = Object.freeze([0, 16] as const)

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
    padding: Object.freeze({
      mode: 'auto' as const,
      header: Object.freeze({ left: null, right: null }),
      content: Object.freeze({ left: null, right: null }),
      composer: Object.freeze({ left: null, right: null }),
    }),
    narrow: Object.freeze({ headerWrap: true }),
    settingsView: 'embedded' as const,
    quality: 'quality' as const,
  }),
  sidebar: Object.freeze({
    width: null,
    paddingX: null,
    paddingY: null,
    rowHeight: null,
    rowGap: null,
    scrollbar: 'native' as const,
    glass: defaultGlass(72),
    divider: 'native' as const,
  }),
  content: Object.freeze({
    glass: defaultGlass(72),
    width: 'native' as const,
    density: null,
    scale: 100,
    scrollbar: 'native' as const,
    bubble: 'native' as const,
    trace: Object.freeze({ background: 'native' as const, width: 'full' as const, tableTail: 'native' as const }),
    align: 'center' as const,
  }),
  footer: Object.freeze({
    scrollRange: 'native' as const,
    plate: 'transparent' as const,
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
