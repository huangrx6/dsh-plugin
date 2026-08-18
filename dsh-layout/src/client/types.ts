export type StatsMode = 'native' | 'icon' | 'brief' | 'below'
/** Global scrollbar visibility: native keeps every DSH scroller; hidden
    removes the conversation and session-list bars. */
export type ScrollbarMode = 'native' | 'hidden'
export type BackgroundMode = 'native' | 'color' | 'image' | 'video'
/** Conversation log extent: native lets the log scroll under the whole
    window; above pulls the composer out of the scroll flow so the log ENDS
    above the input — a pure geometry change, the composer keeps its native
    look. */
export type ScrollEnd = 'native' | 'above'
/** Reading measure for the conversation AND the composer width: 'native'
    keeps both at the native measure, 'full' spans the window edges. Pure
    geometry — no other style rides on it. */
export type ReadWidth = 'native' | 'full'
/** Message bubbles: native keeps DSH's blue-tinted fill; glass frosts them;
    solid is an opaque panel; transparent keeps only the hairline. */
export type BubbleMode = 'native' | 'glass' | 'solid' | 'transparent'
/** Trace tab: native keeps DSH's white canvas; clear shows the page material. */
export type TraceBackground = 'native' | 'clear'
/** Trace tab: full keeps DSH's edge-to-edge canvas; inset aligns to the
    header row; message aligns to the reading measure. */
export type TraceWidth = 'full' | 'inset' | 'message'
/** Trace ledger tail space: DSH reserves a scroll tail under the floating
    input; the above-end already reserves its own, making it redundant. */
export type TraceTail = 'native' | 'none'

export interface TraceSettings {
  readonly background: TraceBackground
  readonly width: TraceWidth
  readonly tableTail: TraceTail
}

export type StatsMetric = 'turns' | 'steps' | 'llm' | 'tools' | 'ttft' | 'speed' | 'cache' | 'tokens'

export const STATS_METRICS: readonly StatsMetric[] = ['turns', 'steps', 'llm', 'tools', 'ttft', 'speed', 'cache', 'tokens']

/**
 * One frosted material owns the whole page (sidebar + content region).
 * The grade cards are named presets on top of the three numbers — state
 * always lives in the numbers, so the sliders remain the source of truth.
 */
export interface MaterialSettings {
  readonly enabled: boolean
  readonly opacity: number
  readonly blur: number
  readonly saturation: number
}

export interface ConversationSettings {
  readonly width: ReadWidth
  /** Input textarea line count; null keeps the native single row. */
  readonly inputRows: number | null
  readonly scrollEnd: ScrollEnd
  readonly bubble: BubbleMode
  readonly trace: TraceSettings
  readonly stats: StatsMode
  readonly statsMetrics: Readonly<Record<StatsMetric, boolean>>
}

export interface BackgroundSettings {
  readonly mode: BackgroundMode
  readonly color: string
  readonly imageUrl: string
  readonly videoUrl: string
}

/** Page paddings: desktop and mobile each control the header / content /
    composer left-right edges. null falls back to that side's preset while
    the mode is 'custom'; 'auto' keeps DSH's native paddings. */
export type PaddingMode = 'auto' | 'custom'

export interface PaddingSides {
  readonly left: number | null
  readonly right: number | null
}

export interface PaddingArea {
  readonly header: PaddingSides
  readonly content: PaddingSides
  readonly composer: PaddingSides
}

export interface PaddingSettings {
  readonly mode: PaddingMode
  readonly desktop: PaddingArea
  readonly mobile: PaddingArea
}

/** Preset edges used when a side is left empty in 'custom' mode. */
export const PAD_PRESETS = Object.freeze({
  desktop: Object.freeze({
    header: Object.freeze({ left: 20, right: 28 }),
    content: Object.freeze({ left: 28, right: 28 }),
    composer: Object.freeze({ left: 28, right: 28 }),
  }),
  mobile: Object.freeze({
    header: Object.freeze({ left: 0, right: 8 }),
    content: Object.freeze({ left: 8, right: 8 }),
    composer: Object.freeze({ left: 8, right: 8 }),
  }),
})

/** Narrow-viewport (< 768px) adaptation: header wrapping against crowding,
    and the sidebar presentation — native keeps DSH's squeezed rail,
    fullscreen turns it into an off-canvas overlay owning the whole viewport,
    float turns it into a fixed-width off-canvas overlay over the content.
    The wide-viewport twin is WideSettings — the two are configured
    independently and never affect each other. */
export type MobileSidebarMode = 'native' | 'fullscreen' | 'float'

export interface NarrowSettings {
  readonly headerWrap: boolean
  readonly sidebar: MobileSidebarMode
}

/** Wide-viewport (≥ 768px) adaptation. native keeps DSH's inline sidebar
    column (the content shrinks beside it); float turns the sidebar into a
    fixed-width off-canvas overlay — the content column owns the full grid
    and never reflows when the sidebar opens (narrow desktop windows
    included). 'fullscreen' stays phone-only on purpose. */
export type WideSidebarMode = 'native' | 'float'

export interface WideSettings {
  readonly sidebar: WideSidebarMode
}

export interface DialogSize {
  readonly width: number | null
  readonly height: number | null
}

export interface LayoutSettings {
  readonly version: 3
  readonly global: {
    readonly scrollbar: ScrollbarMode
    /** null keeps every native corner radius untouched. */
    readonly radius: number | null
    readonly background: BackgroundSettings
    /** Settings dialog panel size; null keeps DSH's native 800×min(800, vh−48). */
    readonly dialog: DialogSize
    readonly padding: PaddingSettings
    readonly narrow: NarrowSettings
    readonly wide: WideSettings
  }
  readonly material: MaterialSettings
  readonly conversation: ConversationSettings
}

export const MATERIAL_LIMITS = Object.freeze({
  opacity: Object.freeze([40, 100] as const),
  blur: Object.freeze([0, 48] as const),
  saturation: Object.freeze([100, 200] as const),
})

export const ROWS_LIMITS = Object.freeze([1, 6] as const)
export const RADIUS_LIMITS = Object.freeze([0, 20] as const)
export const DIALOG_WIDTH_LIMITS = Object.freeze([600, 1280] as const)
export const DIALOG_HEIGHT_LIMITS = Object.freeze([480, 1080] as const)
export const PAD_LIMITS = Object.freeze([0, 48] as const)

/** Named grades on top of the sliders — state stays in the numbers. */
export interface MaterialGrade {
  readonly id: string
  readonly name: string
  readonly hint: string
  readonly values: Omit<MaterialSettings, 'enabled'>
}

export const MATERIAL_GRADES: readonly MaterialGrade[] = Object.freeze([
  Object.freeze({ id: 'xuanzhi', name: '宣纸', hint: '素净纸面 · 隐约透光', values: Object.freeze({ opacity: 95, blur: 8, saturation: 102 }) }),
  Object.freeze({ id: 'chanyi', name: '蝉翼', hint: '薄如蝉翼 · 轻雾拂面', values: Object.freeze({ opacity: 86, blur: 16, saturation: 112 }) }),
  Object.freeze({ id: 'yanlan', name: '烟岚', hint: '山间雾霭 · 朦胧含黛', values: Object.freeze({ opacity: 72, blur: 26, saturation: 130 }) }),
  Object.freeze({ id: 'liuli', name: '琉璃', hint: '琉璃映彩 · 深处见光', values: Object.freeze({ opacity: 58, blur: 40, saturation: 160 }) }),
])

/** The grade whose numbers exactly match the material, if any (custom tuning
    deselects every card — the sliders remain honest). */
export function materialGrade(material: MaterialSettings): MaterialGrade | undefined {
  return MATERIAL_GRADES.find(grade =>
    grade.values.opacity === material.opacity &&
    grade.values.blur === material.blur &&
    grade.values.saturation === material.saturation,
  )
}

export const DEFAULT_METRICS: Readonly<Record<StatsMetric, boolean>> = Object.freeze({
  turns: true, steps: true, llm: true, tools: true, ttft: true, speed: true, cache: true, tokens: true,
})

export const DEFAULT_SETTINGS: LayoutSettings = Object.freeze({
  version: 3,
  global: Object.freeze({
    scrollbar: 'native' as const,
    radius: null,
    background: Object.freeze({ mode: 'native' as const, color: '#f4f6f9', imageUrl: '', videoUrl: '' }),
    dialog: Object.freeze({ width: null, height: null }),
    padding: Object.freeze({
      mode: 'auto' as const,
      desktop: Object.freeze({
        header: Object.freeze({ left: null, right: null }),
        content: Object.freeze({ left: null, right: null }),
        composer: Object.freeze({ left: null, right: null }),
      }),
      mobile: Object.freeze({
        header: Object.freeze({ left: null, right: null }),
        content: Object.freeze({ left: null, right: null }),
        composer: Object.freeze({ left: null, right: null }),
      }),
    }),
    narrow: Object.freeze({ headerWrap: true, sidebar: 'native' as const }),
    wide: Object.freeze({ sidebar: 'native' as const }),
  }),
  material: Object.freeze({ enabled: false, opacity: 86, blur: 16, saturation: 112 }),
  conversation: Object.freeze({
    width: 'native' as const,
    inputRows: null,
    scrollEnd: 'native' as const,
    bubble: 'native' as const,
    trace: Object.freeze({ background: 'native' as const, width: 'full' as const, tableTail: 'native' as const }),
    stats: 'native' as const,
    statsMetrics: DEFAULT_METRICS,
  }),
})
