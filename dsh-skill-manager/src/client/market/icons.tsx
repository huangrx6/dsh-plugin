/**
 * Minimal icon set for the vendored marketplace shelf. These are the
 * icons MarketShelf references via `<TileIcon>` (skill / mcp / archive /
 * layout / remote / general) and via the toolbar / chip row. Kept as a
 * separate file so consumers don't pull in the rest of dsh-launcher's
 * icon set — the source-of-truth for the market UI lives entirely
 * inside this plugin.
 *
 * Inline SVG, `currentColor`, no font / no fetch.
 */
import type { ReactElement } from "react"

interface IconProps {
  readonly size?: number
  readonly className?: string
  readonly title?: string
}

function svgInner(d: string): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconSparkle({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M8 2v4M8 10v4M2 8h4M10 8h4M4 4l2.5 2.5M9.5 9.5L12 12M4 12l2.5-2.5M9.5 6.5L12 4")}
    </svg>
  )
}

export function IconSkills({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M2.5 9.5l3 3 8-8M2.5 13.5l3 3 8-8")}
    </svg>
  )
}

export function IconMcp({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M5 2.5h6a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z")}
      {svgInner("M2.5 5.5h6M2.5 10.5h6M7.5 8h1")}
    </svg>
  )
}

export function IconRemote({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M2.5 6.5a5.5 5.5 0 0 1 11 0v3a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-3Z")}
      {svgInner("M6 11.5v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2")}
    </svg>
  )
}

export function IconArchive({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M2.5 4.5h11v8a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-8Z")}
      {svgInner("M2 4.5l.5-2h11l.5 2M6 7.5h4")}
    </svg>
  )
}

export function IconLayout({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M2.5 3.5h11v9h-11v-9Z")}
      {svgInner("M2.5 6.5h11M6 6.5v6")}
    </svg>
  )
}

export function IconSearch({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M7 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM10.6 10.6L14 14")}
    </svg>
  )
}

export function IconPlus({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M8 3v10M3 8h10")}
    </svg>
  )
}

export function IconRefresh({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3")}
    </svg>
  )
}

export function IconPencil({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M11.5 2.5l2 2-8 8H3.5v-2l8-8Z")}
    </svg>
  )
}

export function IconClose({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M4 4l8 8M12 4l-8 8")}
    </svg>
  )
}

export function IconRows({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M2.5 4h11M2.5 8h11M2.5 12h11")}
    </svg>
  )
}

export function IconGrid({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? "true" : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : "img"}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner("M2.5 2.5h4.5v4.5H2.5V2.5ZM9 2.5h4.5v4.5H9V2.5ZM2.5 9h4.5v4.5H2.5V9ZM9 9h4.5v4.5H9V9Z")}
    </svg>
  )
}