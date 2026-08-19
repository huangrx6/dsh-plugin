/**
 * Inline SVG icons used by the launcher panel and the workspace chrome.
 * Keeping them as inline SVG (no font / no extra fetch) means they render
 * before the style sheet ever loads and follow the parent's currentColor.
 */
import type { ReactElement } from 'react'

interface IconProps {
  readonly size?: number
  readonly className?: string
  readonly title?: string
}

function svgInner(d: string): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconLauncher({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      <path d="M8 1.5l5 2.5v5L8 11.5 3 9V4l5-2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 11.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 13.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

/** Four rounded squares — the "Features" affordance used by the FAB and
    the rail trigger. Reads as an app/features grid at 14–22px. */
export function IconGrid({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M3 3h4v4H3ZM9 3h4v4H9ZM3 9h4v4H3ZM9 9h4v4H9Z')}
    </svg>
  )
}

export function IconSparkle({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M8 2v4M8 10v4M2 8h4M10 8h4M4 4l2.5 2.5M9.5 9.5L12 12M4 12l2.5-2.5M9.5 6.5L12 4')}
    </svg>
  )
}

export function IconSettings({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z')}
      {svgInner('M13.2 8a5.2 5.2 0 0 0 0-.0c0-.3 0-.6-.1-.9l1.2-.9-1.2-2.1-1.4.5a5.2 5.2 0 0 0-1.5-.9l-.2-1.5h-2.4l-.2 1.5a5.2 5.2 0 0 0-1.5.9l-1.4-.5L3.3 6.2l1.2.9c-.1.3-.1.6-.1.9s0 .6.1.9l-1.2.9 1.2 2.1 1.4-.5a5.2 5.2 0 0 0 1.5.9l.2 1.5h2.4l.2-1.5a5.2 5.2 0 0 0 1.5-.9l1.4.5 1.2-2.1-1.2-.9c.1-.3.1-.6.1-.9Z')}
    </svg>
  )
}

export function IconClose({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M4 4l8 8M12 4l-8 8')}
    </svg>
  )
}

export function IconChevronRight({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M6 4l4 4-4 4')}
    </svg>
  )
}

export function IconRefresh({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3')}
    </svg>
  )
}

export function IconSearch({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M7 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM10.6 10.6L14 14')}
    </svg>
  )
}

export function IconPlus({ size = 14, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M8 3v10M3 8h10')}
    </svg>
  )
}

export function IconSkills({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M2.5 9.5l3 3 8-8M2.5 13.5l3 3 8-8')}
    </svg>
  )
}

export function IconMcp({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M5 2.5h6a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z')}
      {svgInner('M2.5 5.5h6M2.5 10.5h6M7.5 8h1')}
    </svg>
  )
}

export function IconRemote({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M2.5 6.5a5.5 5.5 0 0 1 11 0v3a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-3Z')}
      {svgInner('M6 11.5v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2')}
    </svg>
  )
}

export function IconArchive({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M2.5 4.5h11v8a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-8Z')}
      {svgInner('M2 4.5l.5-2h11l.5 2M6 7.5h4')}
    </svg>
  )
}

export function IconLayout({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M2.5 3.5h11v9h-11v-9Z')}
      {svgInner('M2.5 6.5h11M6 6.5v6')}
    </svg>
  )
}

/** A prompt/rule document — the Agent rules (global instructions) section. */
export function IconRules({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M5 2.5h6a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z')}
      {svgInner('M6 5.5h4M6 7.5h4M6 9.5h2.5')}
    </svg>
  )
}

/** A gauge — the subscription usage monitor section. */
export function IconGauge({ size = 16, className, title }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden={title === undefined ? 'true' : undefined} className={className} width={size} height={size} role={title === undefined ? undefined : 'img'}>
      {title === undefined ? null : <title>{title}</title>}
      {svgInner('M3.5 10.5a4.5 4.5 0 1 1 9 0M8 10.5V6M8 10.5a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z')}
      {svgInner('M8 1v1.5')}
    </svg>
  )
}
