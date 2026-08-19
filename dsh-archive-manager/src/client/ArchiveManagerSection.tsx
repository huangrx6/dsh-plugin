/**
 * Archive manager workspace section — Finder / Linear master-detail.
 *
 * Structure:
 *   .dam-section  column: topbar, then shell (or the full blank state)
 *     .dam-topbar  34px search field (flex) + "export all zip" secondary
 *                  button pinned right; no chrome of its own — the panes
 *                  below are the containers, the bar is whitespace.
 *     .dam-shell   height-bounded flex row, independent scrolling panes
 *       .dam-list  300px fixed column: rows grouped by 今天 / 昨天 / 更早
 *                  (10px uppercase group heads). Each row is title 13px/600
 *                  over an 11px meta line (relative time · message count).
 *                  Selection = accent 2px inset bar + 4% fill; hover 3%.
 *       .dam-detail flex 1 column: header (title 16px/600 + meta row),
 *                  scrollable message timeline (user left-aligned,
 *                  assistant/tool indented, monospace text, 2-line clamp
 *                  with click-to-expand), and a bottom action bar that
 *                  always sits at the panel's foot: restore (solid
 *                  primary) + export MD + export zip, delete as a quiet
 *                  icon-only danger toggle at the far end.
 *     .dam-blank   no archives at all: full-area dashed frame, title +
 *                  explanation + how archives get created.
 *
 * Data flow (props contract unchanged — host injects `api` and `t`):
 *  - List     : host `archive.list`   → summaries (id, title, updatedAt, messageCount)
 *  - Detail   : host `archive.info`   → raw events for the selected session
 *  - Restore  : host `archive.restore` → workspaceRegistry.setState
 *  - Export md: host `archive.export-md` → Blob download
 *  - Export zip (one): client `window.open('/api/session.export?…')`
 *  - Export zip (all): sequential client fetches of the same trusted-host
 *               endpoint, one Blob download per archive (api.ts untouched)
 *  - Delete   : no host API — the danger toggle discloses an inline note
 *               with the session directory path + a copy action.
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { ArchiveManagerApi } from './api.ts'
import type { ArchiveManagerLocaleKey } from './locales.ts'
import type { ArchivedSummary, ArchiveInfoResult } from '../contracts.ts'

type Translate = (key: ArchiveManagerLocaleKey) => string

interface Props {
  readonly api: ArchiveManagerApi
  readonly t: Translate
}

interface DetailState {
  readonly sessionId: string
  readonly info?: ArchiveInfoResult
  readonly loading: boolean
  readonly error?: string
}

interface ToastState {
  readonly text: string
  readonly kind: 'ok' | 'error'
}

interface ListGroup {
  readonly key: 'today' | 'yesterday' | 'earlier'
  readonly items: readonly ArchivedSummary[]
}

interface UserMessageLike { role?: string; content?: readonly { type?: string; text?: string }[] }
interface AssistantMessageLike { message?: UserMessageLike }
interface ToolCallLike { name?: string; arguments?: string }
interface ToolResultLike { message?: { content?: readonly { type?: string; text?: string }[] } }

type EventKind = 'user' | 'assistant' | 'toolCall' | 'toolResult' | 'other'

function safeText(parts: readonly { type?: string; text?: string }[] | undefined): string {
  if (!parts) return ''
  return parts.filter(p => p.type === 'text' && typeof p.text === 'string').map(p => p.text ?? '').join('\n').trim()
}

function describeEvent(raw: unknown): { kind: EventKind; text: string; toolName: string; toolArgs: string; time: string } {
  const r = raw as { type?: string; time?: string; data?: unknown }
  if (r === null || typeof r !== 'object') return { kind: 'other', text: '', toolName: '', toolArgs: '', time: '' }
  switch (r.type) {
    case 'user/message': {
      const m = r.data as UserMessageLike | undefined
      return { kind: 'user', text: safeText(m?.content), toolName: '', toolArgs: '', time: r.time ?? '' }
    }
    case 'assistant/message': {
      const m = r.data as AssistantMessageLike | undefined
      return { kind: 'assistant', text: safeText(m?.message?.content), toolName: '', toolArgs: '', time: r.time ?? '' }
    }
    case 'tool/call': {
      const d = r.data as ToolCallLike | undefined
      return { kind: 'toolCall', text: d?.arguments ?? '', toolName: d?.name ?? '', toolArgs: d?.arguments ?? '', time: r.time ?? '' }
    }
    case 'tool/result': {
      const d = r.data as ToolResultLike | undefined
      const first = d?.message?.content?.[0]
      const text = first && first.type === 'text' && typeof first.text === 'string' ? first.text : ''
      return { kind: 'toolResult', text, toolName: '', toolArgs: '', time: r.time ?? '' }
    }
    default:
      return { kind: 'other', text: '', toolName: '', toolArgs: '', time: '' }
  }
}

function formatFull(value: number | string | undefined): string {
  if (value === undefined) return ''
  const t = typeof value === 'number' ? value : Date.parse(value)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatShort(value: number | string | undefined): string {
  if (value === undefined) return ''
  const t = typeof value === 'number' ? value : Date.parse(value)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Localized relative time for the list meta line ("5 分钟前"). Beyond a
 *  week it degrades to the absolute `MM-DD HH:mm` form. */
function relativeTime(value: number | string | undefined, now: number, t: Translate): string {
  if (value === undefined) return ''
  const ts = typeof value === 'number' ? value : Date.parse(value)
  if (Number.isNaN(ts)) return ''
  const diff = (now - ts) / 1000
  if (diff < 60) return t('relNow')
  if (diff < 3600) return t('relMin').replace('{n}', String(Math.floor(diff / 60)))
  if (diff < 86400) return t('relHour').replace('{n}', String(Math.floor(diff / 3600)))
  if (diff < 86400 * 7) return t('relDay').replace('{n}', String(Math.floor(diff / 86400)))
  return formatShort(ts)
}

/** Human-readable size of the raw event payload (JSON byte estimate).
 *  Big sessions never stringify in full — past ~400 events a sample of
 *  the first 200 extrapolates, so the size value stays cheap at any scale. */
function estimateSize(events: readonly unknown[]): string {
  let bytes = 0
  try {
    if (events.length <= 400) {
      bytes = JSON.stringify(events).length
    } else {
      const sample = JSON.stringify(events.slice(0, 200)).length - 2
      bytes = Math.round((Math.max(sample, 0) / 200) * events.length)
    }
  } catch {
    return '—'
  }
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    link.remove()
  }, 0)
}

/** Raw session ids used as titles get folded to "session-…xxxx". */
function displayTitle(raw: string): string {
  if (/^session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(raw)) {
    return `session-…${raw.slice(-4)}`
  }
  return raw
}

const ICON_RESTORE = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 7.5a4.5 4.5 0 1 1 1.318 3.182M3.5 11V7.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ICON_MD = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2.5h10A.5.5 0 0 1 13.5 3v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 11.5V5l2.2 3 2.3-3v6.5M10.5 5.5v5h.5M11.5 8h-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ICON_ZIP = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 2.5h5l2.5 2.5V13a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M10 2.5V5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
const ICON_SEARCH = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.3"/><path d="m10.4 10.4 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const ICON_TRASH = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.8 4.2h10.4M6.2 4V2.8h3.6V4M4.2 4.2l.6 9h6.4l.6-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ICON_INBOX = <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8.5 6 4h12l2 4.5M4 8.5v10A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-10M4 8.5h4l1.5 3h5L16 8.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>

/** One timeline message, memoized: a 30s clock tick or a toast must not
 *  re-render thousands of rows — the entry objects come from a useMemo
 *  so their identities are stable across unrelated state changes.
 *  The text clamps to two lines; clicking it expands in place (click
 *  again to collapse) — truncated content stays reachable without
 *  widening every row. */
const TimelineRow = memo(function TimelineRow({
  ev, t,
}: {
  readonly ev: ReturnType<typeof describeEvent>
  readonly t: (key: ArchiveManagerLocaleKey) => string
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const kind = ev.kind as Exclude<EventKind, 'other'>
  const roleLabel = t(`role.${ev.kind}` as ArchiveManagerLocaleKey)
  const name = ev.kind === 'toolCall' && ev.toolName !== '' ? ev.toolName : roleLabel
  const excerpt = ev.kind === 'toolCall' ? ev.toolArgs : ev.text
  const time = formatShort(ev.time)
  const clickable = excerpt !== '' && excerpt.length > 160
  return (
    <div className={`dam-msg dam-msg--${kind}`}>
      <div className="dam-msg-head">
        <span className="dam-msg-role">{name}</span>
        {time !== '' ? <span className="dam-msg-time">{time}</span> : null}
      </div>
      <div
        className={`dam-msg-text${clickable ? ' is-clickable' : ''}${open ? ' is-open' : ''}`}
        title={clickable && !open ? excerpt : undefined}
        onClick={clickable ? () => { setOpen(v => !v) } : undefined}
      >
        {excerpt !== '' ? excerpt : '—'}
      </div>
    </div>
  )
})

/** Timeline renders in batches: huge sessions never mount thousands of
 *  rows at once — the first TIMELINE_PAGE render, then an intersection
 *  sentinel loads the next batch as the user scrolls (button fallback). */
const TIMELINE_PAGE = 100

export function ArchiveManagerSection({ api, t }: Props): JSX.Element {
  const [items, setItems] = useState<readonly ArchivedSummary[]>([])
  const [loadError, setLoadError] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [detail, setDetail] = useState<DetailState | undefined>()
  const [toast, setToast] = useState<ToastState | undefined>()
  const [query, setQuery] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exportingAll, setExportingAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    void api.list().then(
      (list) => { if (cancelled) return; setItems(list); setLoadError(undefined) },
      (err) => { if (cancelled) return; setLoadError(err instanceof Error ? err.message : String(err)) },
    )
    return () => { cancelled = true }
  }, [api])

  useEffect(() => {
    if (selectedId === undefined) { setDetail(undefined); return }
    let cancelled = false
    setDetail({ sessionId: selectedId, loading: true })
    void api.info(selectedId).then(
      (info) => { if (cancelled) return; setDetail({ sessionId: selectedId, info, loading: false }) },
      (err) => { if (cancelled) return; setDetail({ sessionId: selectedId, loading: false, error: err instanceof Error ? err.message : String(err) }) },
    )
    return () => { cancelled = true }
  }, [api, selectedId])

  // "now" refreshes every 30s for relative timestamps in the list.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  // Switching sessions rewinds the timeline to the top.
  const timelineRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { timelineRef.current?.scrollTo({ top: 0 }) }, [selectedId])

  function showToast(text: string, kind: 'ok' | 'error' = 'ok'): void {
    setToast({ text, kind })
    window.setTimeout(() => setToast(undefined), 3200)
  }

  function select(id: string): void {
    setDeleteOpen(false)
    setSelectedId(id)
  }

  async function onRestore(id: string): Promise<void> {
    if (!window.confirm(t('restoreConfirm'))) return
    try {
      await api.restore(id)
      showToast(t('restoreSuccess'))
      const fresh = await api.list()
      setItems(fresh)
      setSelectedId(cur => (cur === id ? undefined : cur))
      setDeleteOpen(false)
    } catch (err) {
      showToast(t('restoreFailed') + ' ' + (err instanceof Error ? err.message : String(err)), 'error')
    }
  }

  async function onExportMd(): Promise<void> {
    if (selectedId === undefined) return
    try {
      const result = await api.exportMd(selectedId)
      downloadBlob(new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' }), `${selectedId}.md`)
      showToast(t('exportMdDone'))
    } catch (err) {
      showToast(t('exportFailed') + ' ' + (err instanceof Error ? err.message : String(err)), 'error')
    }
  }

  function onExportZip(): void {
    if (selectedId === undefined) return
    const url = `${window.location.origin}/api/session.export?sessionId=${encodeURIComponent(selectedId)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  /** Export every archived session as its own zip via the trusted-host
   *  endpoint. Sequential fetch → Blob downloads (spaced so the browser
   *  registers each one); api.ts stays untouched. */
  async function onExportAll(): Promise<void> {
    if (exportingAll || items.length === 0) return
    setExportingAll(true)
    let done = 0
    let failed = 0
    for (const item of items) {
      try {
        const res = await fetch(`/api/session.export?sessionId=${encodeURIComponent(item.id)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        downloadBlob(await res.blob(), `${item.id}.zip`)
        done++
      } catch {
        failed++
      }
      await new Promise(resolve => setTimeout(resolve, 120))
    }
    setExportingAll(false)
    if (failed === 0) showToast(`${done} ${t('exportAllDone')}`)
    else if (done === 0) showToast(`${t('exportAllFailed')} 0/${items.length}`, 'error')
    else showToast(`${t('exportAllFailed')} ${done}/${items.length}`, 'error')
  }

  async function onCopyPath(id: string): Promise<void> {
    const path = `~/.dsh/sessions/${id}/`
    try {
      await navigator.clipboard.writeText(path)
      showToast(t('pathCopied'))
    } catch {
      // clipboard unavailable (permissions / non-secure context) — surface
      // the path in the toast so it is still copyable by hand.
      showToast(path)
    }
  }

  const selectedInfo = selectedId === undefined ? undefined : items.find(i => i.id === selectedId)

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return items
    return items.filter(i => {
      const hay = `${i.title} ${i.id}`.toLowerCase()
      return hay.includes(q)
    })
  }, [items, query])

  // Rows grouped by recency (今天 / 昨天 / 更早), newest first inside each.
  const groups = useMemo<ListGroup[]>(() => {
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    const todayStart = dayStart.getTime()
    const yesterdayStart = todayStart - 86_400_000
    const today: ArchivedSummary[] = []
    const yesterday: ArchivedSummary[] = []
    const earlier: ArchivedSummary[] = []
    for (const item of [...visibleItems].sort((a, b) => b.updatedAt - a.updatedAt)) {
      if (item.updatedAt >= todayStart) today.push(item)
      else if (item.updatedAt >= yesterdayStart) yesterday.push(item)
      else earlier.push(item)
    }
    const out: ListGroup[] = [
      { key: 'today', items: today },
      { key: 'yesterday', items: yesterday },
      { key: 'earlier', items: earlier },
    ]
    return out.filter(group => group.items.length > 0)
  }, [visibleItems, now])

  // Timeline entries: pre-process the raw events so render is a single map.
  const timeline = useMemo(() => {
    if (detail?.info === undefined) return []
    return detail.info.events
      .map((raw, idx) => ({ raw, idx, ev: describeEvent(raw) }))
      .filter(entry => entry.ev.kind !== 'other')
  }, [detail?.info])

  // Batched rendering state: resets per selection, grows one page at a time.
  const [visibleCount, setVisibleCount] = useState(TIMELINE_PAGE)
  useEffect(() => { setVisibleCount(TIMELINE_PAGE) }, [selectedId])
  const hasMore = visibleCount < timeline.length
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (node === null || !hasMore || typeof IntersectionObserver !== 'function') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisibleCount(count => count + TIMELINE_PAGE)
      }
    }, { rootMargin: '300px' })
    observer.observe(node)
    return () => { observer.disconnect() }
  }, [hasMore, visibleCount, timeline.length])

  const payloadSize = useMemo(
    () => (detail?.info === undefined ? '—' : estimateSize(detail.info.events)),
    [detail?.info],
  )

  const noArchives = items.length === 0 && loadError === undefined
  const emptyListText = query.trim() === '' ? t('empty') : t('noResults')
  const groupLabel = (key: ListGroup['key']): string =>
    key === 'today' ? t('groupToday') : key === 'yesterday' ? t('groupYesterday') : t('groupEarlier')

  return (
    <div className="dam-section">
      {loadError !== undefined ? (
        <p className="dam-note dam-note--error" role="alert">{t('loadFailed')} {loadError}</p>
      ) : null}

      {noArchives ? (
        /* ── blank state: no archives at all ── */
        <div className="dam-blank">
          <span className="dam-blank-icon" aria-hidden="true">{ICON_INBOX}</span>
          <div className="dam-blank-title">{t('emptyTitle')}</div>
          <p className="dam-blank-text">{t('empty')}</p>
          <p className="dam-blank-hint">{t('selectPrompt')}</p>
        </div>
      ) : (
        <>
          {/* ── topbar: search + export all ── */}
          <div className="dam-topbar">
            <div className="dam-search">
              {ICON_SEARCH}
              <input
                className="dam-search-input"
                type="search"
                value={query}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="dam-search-count" aria-hidden="true">{visibleItems.length}</span>
            </div>
            <div className="dam-topbar-actions">
              <button
                type="button"
                className="dam-btn"
                disabled={exportingAll || items.length === 0}
                onClick={() => { void onExportAll() }}
              >
                {ICON_ZIP}<span>{exportingAll ? t('exportAllRunning') : t('exportAllZip')}</span>
              </button>
            </div>
          </div>

          {/* ── master-detail shell ── */}
          <div className="dam-shell">
            {/* master: session list */}
            <aside className="dam-list">
              <div className="dam-list-scroll" role="listbox" aria-label={t('listHeader')}>
                {visibleItems.length === 0 ? (
                  <div className="dam-empty">{emptyListText}</div>
                ) : null}
                {groups.map((group) => (
                  <div key={group.key} role="group" aria-label={groupLabel(group.key)}>
                    <div className="dam-lgroup-head" aria-hidden="true">{groupLabel(group.key)}</div>
                    {group.items.map((item) => {
                      const active = item.id === selectedId
                      const title = displayTitle(item.title || item.id)
                      return (
                        <div
                          key={item.id}
                          role="option"
                          aria-selected={active}
                          tabIndex={0}
                          className={`dam-row${active ? ' dam-row--active' : ''}`}
                          title={title}
                          onClick={() => select(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              select(item.id)
                            }
                          }}
                        >
                          <span className="dam-row-title">{title}</span>
                          <span className="dam-row-meta">
                            <span>{relativeTime(item.updatedAt, now, t)}</span>
                            <span className="dam-dot" aria-hidden="true">·</span>
                            <span>{item.messageCount} {t('messageCount')}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </aside>

            {/* detail: header / timeline / action bar */}
            <section className="dam-detail">
              {selectedInfo === undefined ? (
                <div className="dam-detail-empty">
                  <span className="dam-detail-empty-icon" aria-hidden="true">{ICON_INBOX}</span>
                  <div className="dam-detail-empty-title">{t('noSelection')}</div>
                  <div className="dam-detail-empty-hint">{t('selectPrompt')}</div>
                </div>
              ) : (
                <>
                  <header className="dam-detail-head">
                    <h2 className="dam-detail-title" title={displayTitle(selectedInfo.title || selectedInfo.id)}>
                      {displayTitle(selectedInfo.title || selectedInfo.id)}
                    </h2>
                    <div className="dam-detail-meta">
                      <span>{formatFull(selectedInfo.updatedAt)}</span>
                      <span className="dam-dot" aria-hidden="true">·</span>
                      <span>{selectedInfo.messageCount} {t('messageCount')}</span>
                      <span className="dam-dot" aria-hidden="true">·</span>
                      <span>{payloadSize}</span>
                      <span className="dam-dot" aria-hidden="true">·</span>
                      <span className="dam-detail-meta-id">
                        {t('sessionId')} <code title={selectedInfo.id}>{selectedInfo.id}</code>
                      </span>
                    </div>
                  </header>

                  <div className="dam-timeline" ref={timelineRef}>
                    {detail?.loading === true ? (
                      <div className="dam-timeline-state">{t('loading')}</div>
                    ) : null}
                    {detail?.error !== undefined ? (
                      <div className="dam-timeline-state dam-timeline-state--error" role="alert">{detail.error}</div>
                    ) : null}
                    {detail?.loading !== true && detail?.error === undefined && timeline.length === 0 ? (
                      <div className="dam-timeline-state">{t('eventsEmpty')}</div>
                    ) : null}
                    {timeline.slice(0, visibleCount).map((entry) => (
                      <TimelineRow key={entry.idx} ev={entry.ev} t={t} />
                    ))}
                    {hasMore ? (
                      <div ref={sentinelRef} className="dam-loadmore">
                        <button
                          type="button"
                          className="dam-loadmore-btn"
                          onClick={() => { setVisibleCount(count => count + TIMELINE_PAGE) }}
                        >
                          {t('showMore')} · {visibleCount}/{timeline.length}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {deleteOpen ? (
                    <div className="dam-delete" role="note">
                      <span className="dam-delete-text">{t('deleteNote')}</span>
                      <code className="dam-delete-path">~/.dsh/sessions/{selectedInfo.id}/</code>
                      <button type="button" className="dam-btn dam-btn--sm" onClick={() => { void onCopyPath(selectedInfo.id) }}>
                        {t('copyPath')}
                      </button>
                    </div>
                  ) : null}

                  <footer className="dam-detail-actions">
                    <button type="button" className="dam-btn dam-btn--primary" onClick={() => { void onRestore(selectedInfo.id) }}>
                      {ICON_RESTORE}<span>{t('restore')}</span>
                    </button>
                    <button type="button" className="dam-btn" onClick={() => { void onExportMd() }}>
                      {ICON_MD}<span>{t('exportMd')}</span>
                    </button>
                    <button type="button" className="dam-btn" onClick={onExportZip}>
                      {ICON_ZIP}<span>{t('exportZip')}</span>
                    </button>
                    <span className="dam-detail-actions-gap" aria-hidden="true" />
                    <button
                      type="button"
                      className="dam-btn dam-btn--danger dam-btn--icon"
                      title={t('delete')}
                      aria-label={t('delete')}
                      aria-expanded={deleteOpen}
                      onClick={() => setDeleteOpen(cur => !cur)}
                    >
                      {ICON_TRASH}
                    </button>
                  </footer>
                </>
              )}
            </section>
          </div>
        </>
      )}

      {toast !== undefined ? (
        <div className={`dam-toast${toast.kind === 'error' ? ' dam-toast--error' : ''}`}>{toast.text}</div>
      ) : null}
    </div>
  )
}
