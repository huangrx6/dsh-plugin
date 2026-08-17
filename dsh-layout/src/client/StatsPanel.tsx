import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { UseProjection } from '@deepseek-ai/dsh-client-runtime/client'
import type { LayoutLocaleKey } from './locales.ts'
import { buildInlineStats, buildStatsView } from './stats.ts'
import type { LayoutStore } from './store.ts'
import type { StatsMode } from './types.ts'

export interface StatsPanelInjected {
  readonly store: LayoutStore
  readonly t: (key: LayoutLocaleKey) => string
  readonly useProjection: UseProjection
}

/** In-composer entries (icon button / short readout) — both open the detail popover. */
export function ToolbarStats(props: StatsPanelInjected): React.ReactElement | null {
  const settings = useSyncExternalStore(props.store.subscribe, props.store.getSnapshot, props.store.getSnapshot)
  const mode = settings.conversation.stats
  return mode === 'icon' || mode === 'brief' ? <StatsPanel {...props} mode={mode} /> : null
}

/** The full read-only row below the composer. */
export function DockStats(props: StatsPanelInjected): React.ReactElement | null {
  const settings = useSyncExternalStore(props.store.subscribe, props.store.getSnapshot, props.store.getSnapshot)
  return settings.conversation.stats === 'below' ? <StatsPanel {...props} mode="below" /> : null
}

interface StatsPanelProps extends StatsPanelInjected {
  readonly mode: Exclude<StatsMode, 'native'>
}

function StatsPanel({ store, t, useProjection, mode }: StatsPanelProps): React.ReactElement | null {
  const settings = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const peeking = useSyncExternalStore(store.subscribe, store.getPeek, store.getPeek)
  const stats = useProjection('sessionStats')
  const usage = useProjection('tokenUsage')
  const view = buildStatsView(stats, usage, t, settings.conversation.statsMetrics)
  const [pinned, setPinned] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<{ x: string; top: string } | undefined>(undefined)

  // The panel is position:fixed (escapes the composer card's backdrop-filter
  // stacking context), so its x/y must come from the trigger's live rect.
  useEffect(() => {
    if (!pinned) { setAnchor(undefined); return }
    const place = (): void => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect === undefined) return
      const centerX = rect.left + rect.width / 2
      const clampedX = Math.min(Math.max(centerX, 164), window.innerWidth - 164)
      setAnchor({
        x: `${clampedX}px`,
        top: `${Math.max(rect.top - 12, 8)}px`,
      })
    }
    place()
    const view = window
    view.addEventListener('resize', place)
    view.visualViewport?.addEventListener('resize', place)
    return () => {
      view.removeEventListener('resize', place)
      view.visualViewport?.removeEventListener('resize', place)
    }
  }, [pinned])

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pinned) return
    const close = (event: PointerEvent): void => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setPinned(false)
    }
    document.addEventListener('pointerdown', close, true)
    return () => { document.removeEventListener('pointerdown', close, true) }
  }, [pinned])

  if (peeking) return null
  const smartLabel = view.summary === '' ? t('stats') : view.summary
  const row = (label: LayoutLocaleKey): string | undefined => view.rows.find(item => item.label === label)?.value
  const inlineGroups = buildInlineStats(view, t)

  // Full-detail row is a static readout: no trigger, no popup, no hover affordance.
  if (mode === 'below') {
    return (
      <div
        ref={rootRef}
        className="dsh-layout-root dsh-layout-root--dock dsh-layout-root--inline"
        aria-label={t('stats')}
      >
        <span className="dsh-layout-inline-summary">
          {inlineGroups.length === 0 ? t('noStats') : inlineGroups.map((group, index) => (
            <React.Fragment key={group.key}>
              {index > 0 && <span className="dsh-layout-inline-summary__divider" aria-hidden="true">|</span>}
              <span className="dsh-layout-inline-summary__group">{group.text}</span>
            </React.Fragment>
          ))}
        </span>
      </div>
    )
  }

  const open = pinned
  const buttonLabel = mode === 'brief' ? smartLabel : undefined
  const heroRows = [
    { label: 'steps' as const, value: row('steps') },
    { label: 'speed' as const, value: row('speed') },
  ].filter((item): item is { label: 'steps' | 'speed'; value: string } => item.value !== undefined)
  const detailRows = view.rows.filter(item => !['steps', 'speed', 'tokens'].includes(item.label))
  const tokens = row('tokens')

  return (
    <div
      ref={rootRef}
      className="dsh-layout-root dsh-layout-root--toolbar"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          setPinned(false)
          ;(event.currentTarget.querySelector('button') as HTMLButtonElement | null)?.focus()
        }
      }}
    >
      <button
        type="button"
        className={`dsh-layout-trigger${mode === 'icon' ? ' dsh-layout-trigger--icon' : ''}`}
        aria-label={t('stats')}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => { setPinned(value => !value) }}
      >
        <StatsIcon />
        {buttonLabel !== undefined && <span className="dsh-layout-trigger__label">{buttonLabel}</span>}
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className="dsh-layout-panel"
          role="tooltip"
          style={anchor === undefined
            ? { visibility: 'hidden' } as React.CSSProperties
            : {
                '--dsh-layout-popover-x': anchor.x,
                top: anchor.top,
                transform: 'translate(-50%, -100%)',
              } as React.CSSProperties}
        >
          <div className="dsh-layout-panel__header">
            <span className="dsh-layout-panel__icon"><StatsIcon /></span>
            <div>
              <strong>{t('stats')}</strong>
              {view.summary !== '' && <span>{view.summary}</span>}
            </div>
          </div>
          {view.rows.length === 0 ? (
            <p className="dsh-layout-panel__empty">{t('noStats')}</p>
          ) : (
            <>
              {heroRows.length > 0 && (
                <dl className="dsh-layout-panel__heroes">
                  {heroRows.map(item => (
                    <div className="dsh-layout-panel__hero" key={item.label}>
                      <dt>{t(item.label)}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {detailRows.length > 0 && (
                <dl className="dsh-layout-panel__details">
                  {detailRows.map(item => (
                    <div className="dsh-layout-panel__detail" key={item.label}>
                      <dt>{t(item.label)}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {tokens !== undefined && (
                <div className="dsh-layout-panel__tokens">
                  <span>{t('tokens')}</span>
                  <strong>{tokens}</strong>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatsIcon(): React.ReactElement {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
      <path d="M3 12.25V8.5M8 12.25V4M13 12.25V6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 13.25h12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}
