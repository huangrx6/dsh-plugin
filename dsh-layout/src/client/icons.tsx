import type React from 'react'

/**
 * Sixteen-pixel stroke icons for the settings fields — one visual anchor per
 * row, drawn in currentColor so they follow the theme automatically.
 */
type IconProps = { readonly children: React.ReactNode }

function Svg({ children }: IconProps): React.ReactElement {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}

export const RadiusIcon = (): React.ReactElement => <Svg><rect x="2.5" y="2.5" width="11" height="11" rx="3.5" /></Svg>
export const ImageIcon = (): React.ReactElement => <Svg><rect x="2" y="2.5" width="12" height="11" rx="2" /><circle cx="5.8" cy="6.3" r="1.1" /><path d="M2.5 11.5 6.2 8.4a1.4 1.4 0 0 1 1.8 0l3.5 3.1" /></Svg>
export const FluidIcon = (): React.ReactElement => <Svg><path d="M3 9.5c1.6 0 1.6-3 3.2-3s1.7 3 3.3 3 1.6-3 3.2-3" /><path d="M3 4.5c1.6 0 1.6-1.5 3.2-1.5" opacity=".55" /><path d="M3 13.5c1.6 0 1.6-1.5 3.2-1.5" opacity=".55" /></Svg>
export const DialogIcon = (): React.ReactElement => <Svg><path d="M2.5 5.5v-1a2 2 0 0 1 2-2h1M13.5 5.5v-1a2 2 0 0 0-2-2h-1M2.5 10.5v1a2 2 0 0 0 2 2h1M13.5 10.5v1a2 2 0 0 1-2 2h-1" /><path d="M5.5 8h5" /></Svg>
export const GlassIcon = (): React.ReactElement => <Svg><path d="M8 1.8 12.8 5c.4.3.6.8.5 1.3l-1.6 6a1.5 1.5 0 0 1-1.5 1.1H6.8a1.5 1.5 0 0 1-1.5-1.1l-1.6-6A1.3 1.3 0 0 1 4.2 5Z" /><path d="M6.2 9.2c.6.9 1.3 1.3 1.8 1.3s1.2-.4 1.8-1.3" /></Svg>
export const DividerIcon = (): React.ReactElement => <Svg><path d="M2.5 4h11M2.5 12h11" /><path d="M8 6.2v3.6" /></Svg>
export const WidthIcon = (): React.ReactElement => <Svg><path d="M2.5 8h11M4.5 5.8 2.3 8l2.2 2.2M11.5 5.8 13.7 8l-2.2 2.2" /></Svg>
export const DensityIcon = (): React.ReactElement => <Svg><path d="M3 3.5h10M3 8h10M3 12.5h6" /></Svg>
export const ScaleIcon = (): React.ReactElement => <Svg><circle cx="6.7" cy="6.7" r="4.2" /><path d="M9.9 9.9 14 14M5.2 6.7h3M6.7 5.2v3" /></Svg>
export const ScrollbarIcon = (): React.ReactElement => <Svg><rect x="2.5" y="2.5" width="8" height="11" rx="1.5" /><path d="M13.5 4.5v3M13.5 10v1.6" /></Svg>
export const BubbleIcon = (): React.ReactElement => <Svg><path d="M13.5 7.2c0 2.9-2.5 5.2-5.5 5.2-.7 0-1.3-.1-1.9-.3L3 13.5l.8-2.4A4.9 4.9 0 0 1 2.5 7.2c0-2.9 2.5-5.2 5.5-5.2s5.5 2.3 5.5 5.2Z" /></Svg>
export const RangeIcon = (): React.ReactElement => <Svg><path d="M3 3.5h10M3 12.5h10" opacity=".55" /><path d="M8 5.5v5.2M8 5.5 6 7.5M8 5.5l2 2" /></Svg>
export const RowsIcon = (): React.ReactElement => <Svg><rect x="2.5" y="2.5" width="11" height="3.6" rx="1.2" /><rect x="2.5" y="9.9" width="11" height="3.6" rx="1.2" /></Svg>
export const StatsIcon = (): React.ReactElement => <Svg><path d="M3 13.5V9M6.8 13.5V4.5M10.5 13.5V6.8M14 13.5H2" /></Svg>
export const TraceIcon = (): React.ReactElement => <Svg><circle cx="4" cy="11.5" r="1.7" /><circle cx="8" cy="4.5" r="1.7" /><circle cx="12.4" cy="9" r="1.7" /><path d="M5.4 10.3 6.9 6M9.5 5.4l1.7 2.2M6.6 12.5l4.3-2.5" /></Svg>
export const BookmarkIcon = (): React.ReactElement => <Svg><path d="M4 2.8h8a.8.8 0 0 1 .8.8V14L8 11 3.2 14V3.6a.8.8 0 0 1 .8-.8Z" /></Svg>
export const FileIcon = (): React.ReactElement => <Svg><path d="M9.5 2H4.8A1.3 1.3 0 0 0 3.5 3.3v9.4A1.3 1.3 0 0 0 4.8 14h6.4a1.3 1.3 0 0 0 1.3-1.3V5Z" /><path d="M9.5 2v3h3" /></Svg>
