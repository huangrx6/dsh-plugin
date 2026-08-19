/**
 * Archive manager workspace section — master-detail list form
 * (macOS Settings / Linear style, "quiet structure").
 *
 * Structure:
 *   .dam-shell  grid 300px | 1fr (single column under 768px)
 *     .dam-list    sticky group container: 34px search field on top,
 *                  compact 44px rows below — title 13px/600 over an
 *                  11px meta line (message count + relative time), with
 *                  an inline 24px restore icon button on the trailing
 *                  edge (revealed on hover / selection).
 *     .dam-detail  action bar (restore = primary, exports = secondary,
 *                  delete = danger), then a "session summary" group of
 *                  label-left / value-right rows (ID / updated / payload
 *                  size / messages), then a "timeline" group where each
 *                  event is one row: 24px role icon base, event name
 *                  12px/600 + 11px time, single-line 12px excerpt, rows
 *                  separated by hairlines and stitched by a 2px
 *                  label-primary 10% vertical thread.
 *
 * Data flow (props contract unchanged — host injects `api` and `t`):
 *  - List     : host `archive.list`   → summaries (id, title, updatedAt, messageCount)
 *  - Detail   : host `archive.info`   → raw events for the selected session
 *  - Restore  : host `archive.restore` → workspaceRegistry.setState
 *  - Export md: host `archive.export-md` → Blob download
 *  - Export zip: client `fetch('/api/session.export?sessionId=…')` (trusted-host)
 *  - Delete   : no host API — the danger button discloses an inline note
 *               with the session directory path + a copy action.
 */
import { useEffect, useMemo, useState } from 'react'
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

function relativeTime(value: number | string | undefined, now: number): string {
  if (value === undefined) return ''
  const t = typeof value === 'number' ? value : Date.parse(value)
  if (Number.isNaN(t)) return ''
  const diff = (now - t) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return formatShort(t)
}

/** Human-readable size of the raw event payload (JSON byte estimate). */
function estimateSize(events: readonly unknown[]): string {
  let bytes = 0
  try {
    bytes = JSON.stringify(events).length
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

const GLYPHS: Readonly<Record<Exclude<EventKind, 'other'>, string>> = {
  user: 'U',
  assistant: 'A',
  toolCall: 'T',
  toolResult: 'R',
}

const ICON_RESTORE = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 7.5a4.5 4.5 0 1 1 1.318 3.182M3.5 11V7.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ICON_MD = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2.5h10A.5.5 0 0 1 13.5 3v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 11.5V5l2.2 3 2.3-3v6.5M10.5 5.5v5h.5M11.5 8h-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ICON_ZIP = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 2.5h5l2.5 2.5V13a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M10 2.5V5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
const ICON_SEARCH = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.3"/><path d="m10.4 10.4 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const ICON_TRASH = <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.8 4.2h10.4M6.2 4V2.8h3.6V4M4.2 4.2l.6 9h6.4l.6-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>

export function ArchiveManagerSection({ api, t }: Props): JSX.Element {
  const [items, setItems] = useState<readonly ArchivedSummary[]>([])
  const [loadError, setLoadError] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [detail, setDetail] = useState<DetailState | undefined>()
  const [toast, setToast] = useState<ToastState | undefined>()
  const [query, setQuery] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

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

  function showToast(text: string, kind: 'ok' | 'error' = 'ok'): void {
    setToast({ text, kind })
    window.setTimeout(() => setToast(undefined), 3200)
  }

  function select(id: string): void {
    setDeleteOpen(false)
    setSelectedId(cur => (cur === id ? undefined : id))
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
      showToast(t('exportMd') + ' ✓')
    } catch (err) {
      showToast(t('exportFailed') + ' ' + (err instanceof Error ? err.message : String(err)), 'error')
    }
  }

  function onExportZip(): void {
    if (selectedId === undefined) return
    const url = `${window.location.origin}/api/session.export?sessionId=${encodeURIComponent(selectedId)}`
    window.open(url, '_blank', 'noopener,noreferrer')
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

  // Timeline entries: pre-process the raw events so render is a single map.
  const timeline = useMemo(() => {
    if (detail?.info === undefined) return []
    return detail.info.events
      .map((raw, idx) => ({ raw, idx, ev: describeEvent(raw) }))
      .filter(entry => entry.ev.kind !== 'other')
  }, [detail?.info])

  const payloadSize = useMemo(
    () => (detail?.info === undefined ? '—' : estimateSize(detail.info.events)),
    [detail?.info],
  )

  const emptyListText = query.trim() === '' ? t('empty') : t('noResults')

  return (
    <div className="dam-section">
      {loadError !== undefined ? (
        <p className="dam-note dam-note--error" role="alert">{t('loadFailed')} {loadError}</p>
      ) : null}

      <div className="dam-shell">
        {/* ── master: session list ── */}
        <aside className="dam-list">
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
          <div className="dam-list-scroll" role="listbox" aria-label={t('listHeader')}>
            {visibleItems.length === 0 && loadError === undefined ? (
              <div className="dam-empty">{emptyListText}</div>
            ) : null}
            {visibleItems.map((item) => {
              const active = item.id === selectedId
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={active}
                  tabIndex={0}
                  className={`dam-row${active ? ' dam-row--active' : ''}`}
                  onClick={() => select(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      select(item.id)
                    }
                  }}
                >
                  <span className="dam-row-main">
                    <span className="dam-row-title">{displayTitle(item.title || item.id)}</span>
                    <span className="dam-row-meta">
                      <span>{item.messageCount} {t('messageCount')}</span>
                      <span className="dam-row-meta-dot" aria-hidden="true">·</span>
                      <span>{relativeTime(item.updatedAt, now)}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    className="dam-icon-btn"
                    title={t('restore')}
                    aria-label={t('restore')}
                    onClick={(e) => {
                      e.stopPropagation()
                      void onRestore(item.id)
                    }}
                  >
                    {ICON_RESTORE}
                  </button>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ── detail ── */}
        <section className="dam-detail">
          {selectedInfo === undefined ? (
            <div className="dam-detail-empty">
              <div>{t('noSelection')}</div>
              <div className="dam-detail-empty-hint">{t('selectPrompt')}</div>
            </div>
          ) : (
            <>
              {/* action bar */}
              <div className="dam-toolbar">
                <span className="dam-toolbar-name">{displayTitle(selectedInfo.title || selectedInfo.id)}</span>
                <div className="dam-toolbar-actions">
                  <button type="button" className="dam-btn dam-btn--primary" onClick={() => void onRestore(selectedInfo.id)}>
                    {ICON_RESTORE}<span>{t('restore')}</span>
                  </button>
                  <button type="button" className="dam-btn" onClick={() => void onExportMd()}>
                    {ICON_MD}<span>{t('exportMd')}</span>
                  </button>
                  <button type="button" className="dam-btn" onClick={onExportZip}>
                    {ICON_ZIP}<span>{t('exportZip')}</span>
                  </button>
                  <button
                    type="button"
                    className="dam-btn dam-btn--danger"
                    aria-expanded={deleteOpen}
                    onClick={() => setDeleteOpen(cur => !cur)}
                  >
                    {ICON_TRASH}<span>{t('delete')}</span>
                  </button>
                </div>
              </div>

              {deleteOpen ? (
                <div className="dam-delete" role="note">
                  <span className="dam-delete-text">{t('deleteNote')}</span>
                  <code className="dam-delete-path">~/.dsh/sessions/{selectedInfo.id}/</code>
                  <button type="button" className="dam-btn dam-btn--sm" onClick={() => void onCopyPath(selectedInfo.id)}>
                    {t('copyPath')}
                  </button>
                </div>
              ) : null}

              {/* session summary group */}
              <div className="dam-group">
                <div className="dam-group-label">{t('sessionInfo')}</div>
                <div className="dam-kv">
                  <span className="dam-kv-key">{t('sessionId')}</span>
                  <code className="dam-kv-val dam-kv-val--code">{selectedInfo.id}</code>
                </div>
                <div className="dam-kv">
                  <span className="dam-kv-key">{t('updatedAtLabel')}</span>
                  <span className="dam-kv-val">{formatFull(selectedInfo.updatedAt)}</span>
                </div>
                <div className="dam-kv">
                  <span className="dam-kv-key">{t('sizeLabel')}</span>
                  <span className="dam-kv-val">{payloadSize}</span>
                </div>
                <div className="dam-kv">
                  <span className="dam-kv-key">{t('messagesLabel')}</span>
                  <span className="dam-kv-val">{selectedInfo.messageCount} {t('messageCount')}</span>
                </div>
              </div>

              {/* timeline group */}
              <div className="dam-group">
                <div className="dam-group-label">
                  <span>{t('timelineLabel')}</span>
                  <span className="dam-group-count">{timeline.length} {t('eventCount')}</span>
                </div>
                <div className="dam-tl">
                  {detail?.loading === true ? (
                    <div className="dam-tl-state">{t('loading')}</div>
                  ) : null}
                  {detail?.error !== undefined ? (
                    <div className="dam-tl-state dam-tl-state--error" role="alert">{detail.error}</div>
                  ) : null}
                  {detail?.loading !== true && detail?.error === undefined && timeline.length === 0 ? (
                    <div className="dam-tl-state">{t('eventsEmpty')}</div>
                  ) : null}
                  {timeline.map((entry) => {
                    const { ev, idx } = entry
                    const kind = ev.kind as Exclude<EventKind, 'other'>
                    const roleLabel = t(`role.${ev.kind}` as ArchiveManagerLocaleKey)
                    const name = ev.kind === 'toolCall' && ev.toolName !== '' ? ev.toolName : roleLabel
                    const excerpt = ev.kind === 'toolCall' ? ev.toolArgs : ev.text
                    const time = formatShort(ev.time)
                    return (
                      <div key={idx} className={`dam-tl-row dam-tl-row--${kind}`}>
                        <span className="dam-tl-icon" aria-hidden="true">{GLYPHS[kind]}</span>
                        <div className="dam-tl-main">
                          <div className="dam-tl-head">
                            <span className="dam-tl-dot" aria-hidden="true" />
                            <span className="dam-tl-name">{name}</span>
                            {time !== '' ? <span className="dam-tl-time">{time}</span> : null}
                          </div>
                          <div className="dam-tl-text">{excerpt !== '' ? excerpt : '—'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {toast !== undefined ? (
        <div className={`dam-toast${toast.kind === 'error' ? ' dam-toast--error' : ''}`}>{toast.text}</div>
      ) : null}
    </div>
  )
}
