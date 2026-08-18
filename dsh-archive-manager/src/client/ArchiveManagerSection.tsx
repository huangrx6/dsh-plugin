/**
 * Archive manager settings section: list + timeline + restore / export.
 *
 * Layout: a single rounded surface hosts the session list on the left and
 * the message timeline on the right. The selected list item carries a 3px
 * accent rail; the detail pane reads top-to-bottom as title + meta + action
 * toolbar + vertical timeline of events.
 *
 * Data flow:
 *  - List     : host `archive.list`   → summaries (id, title, updatedAt, messageCount)
 *  - Detail   : host `archive.info`   → raw events for the selected session
 *  - Restore  : host `archive.restore` → workspaceRegistry.setState
 *  - Export md: host `archive.export-md` → Blob download
 *  - Export zip: client `fetch('/api/session.export?sessionId=…')` (trusted-host)
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
      return { kind: 'other', text: '', toolName: '', toolArgs: '', time: r.time ?? '' }
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

const ICON_RESTORE = <svg className="dam-btn-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 7.5a4.5 4.5 0 1 1 1.318 3.182M3.5 11V7.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ICON_MD = <svg className="dam-btn-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2.5h10A.5.5 0 0 1 13.5 3v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 11.5V5l2.2 3 2.3-3v6.5M10.5 5.5v5h.5M11.5 8h-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ICON_ZIP = <svg className="dam-btn-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 2.5h5l2.5 2.5V13a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M10 2.5V5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>

export function ArchiveManagerSection({ api, t }: Props): JSX.Element {
  const [items, setItems] = useState<readonly ArchivedSummary[]>([])
  const [loadError, setLoadError] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [detail, setDetail] = useState<DetailState | undefined>()
  const [toast, setToast] = useState<ToastState | undefined>()

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

  async function onRestore(): Promise<void> {
    if (selectedId === undefined) return
    if (!window.confirm(t('restoreConfirm'))) return
    try {
      await api.restore(selectedId)
      showToast(t('restoreSuccess'))
      const fresh = await api.list()
      setItems(fresh)
      setSelectedId(undefined)
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

  const selectedInfo = selectedId === undefined ? undefined : items.find(i => i.id === selectedId)

  // When the host returns a raw session id as the title (no friendly
  // title was ever written), truncate the id to "session-…xxxx" so the
  // detail header doesn't run three lines with hex.
  const displayTitle = (raw: string): string => {
    if (/^session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(raw)) {
      return `session-…${raw.slice(-4)}`
    }
    return raw
  }

  // Timeline entries: pre-process the raw events so render is a single map.
  const timeline = useMemo(() => {
    if (detail?.info === undefined) return []
    return detail.info.events
      .map((raw, idx) => ({ raw, idx, ev: describeEvent(raw) }))
      .filter(entry => entry.ev.kind !== 'other')
  }, [detail?.info])

  return (
    <div className="dam-section">
      <p className="dam-banner">{t('tabDesc')}</p>
      {loadError !== undefined ? (
        <p className="dam-banner" role="alert" style={{ color: 'var(--dam-tool-err)' }}>
          {t('loadFailed')} {loadError}
        </p>
      ) : null}

      <div className="dam-surface">
        {/* ── list pane ── */}
        <div className="dam-list" role="listbox" aria-label={t('tab')}>
          <div className="dam-list-header">
            <span>{t('listHeader')}</span>
            <span className="dam-list-header-count">{items.length}</span>
          </div>
          <div className="dam-list-scroll">
            {items.length === 0 && loadError === undefined ? (
              <div className="dam-list-empty">
                <div className="dam-list-empty-icon" aria-hidden="true">🗃</div>
                <div>{t('empty')}</div>
              </div>
            ) : null}
            {items.map((item) => {
              const active = item.id === selectedId
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`dam-item${active ? ' dam-item--active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="dam-item-body">
                    <span className="dam-item-title">{displayTitle(item.title || item.id)}</span>
                    <span className="dam-item-meta">
                      <span>{item.messageCount} {t('messageCount')}</span>
                      <span className="dam-item-meta-dot" aria-hidden="true">·</span>
                      <span>{relativeTime(item.updatedAt, now)}</span>
                    </span>
                  </span>
                  <svg className="dam-item-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M3.5 2 7 5 3.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── detail pane ── */}
        <div className="dam-detail">
          {selectedInfo === undefined ? (
            <div className="dam-detail-empty">
              <div className="dam-detail-empty-icon" aria-hidden="true">📁</div>
              <div>{t('noSelection')}</div>
              <div className="dam-detail-empty-hint">{t('selectPrompt')}</div>
            </div>
          ) : (
            <>
              <div className="dam-detail-head">
                <div className="dam-detail-head-text">
                  <h2 className="dam-detail-title">{displayTitle(selectedInfo.title || selectedInfo.id)}</h2>
                  <div className="dam-detail-id-row">
                    <code>{selectedInfo.id}</code>
                    <span className="dam-detail-id-sep" aria-hidden="true" />
                    <span>{selectedInfo.messageCount} {t('messageCount')}</span>
                    <span className="dam-detail-id-sep" aria-hidden="true" />
                    <span>{formatFull(selectedInfo.updatedAt)}</span>
                  </div>
                </div>
                <div className="dam-actions">
                  <button type="button" className="dam-btn dam-btn--primary" onClick={() => void onRestore()}>
                    {ICON_RESTORE}<span>{t('restore')}</span>
                  </button>
                  <button type="button" className="dam-btn" onClick={() => void onExportMd()} title={t('exportMd')}>
                    {ICON_MD}<span>{t('exportMd')}</span>
                  </button>
                  <button type="button" className="dam-btn" onClick={onExportZip} title={t('exportZip')}>
                    {ICON_ZIP}<span>{t('exportZip')}</span>
                  </button>
                </div>
              </div>

              <div className="dam-timeline">
                {detail?.loading === true ? (
                  <div className="dam-detail-empty">
                    <div className="dam-detail-empty-icon" aria-hidden="true">⏳</div>
                    <div>{t('loading')}</div>
                  </div>
                ) : null}
                {detail?.error !== undefined ? (
                  <div className="dam-detail-empty">
                    <div className="dam-detail-empty-icon" aria-hidden="true">⚠️</div>
                    <div>{detail.error}</div>
                  </div>
                ) : null}
                {timeline.map((entry) => {
                  const { ev, idx } = entry
                  const roleLabel = ev.kind === 'other' ? '' : t(`role.${ev.kind}` as ArchiveManagerLocaleKey)
                  const time = formatShort(ev.time)
                  if (ev.kind === 'user') return (
                    <div key={idx} className="dam-msg dam-msg--user">
                      <div className="dam-msg-rail">
                        <div className="dam-msg-avatar" aria-hidden="true">U</div>
                        <div className="dam-msg-rail-line" />
                      </div>
                      <div className="dam-msg-body">
                        <div className="dam-msg-head">
                          <span className="dam-msg-role">{roleLabel}</span>
                          {time !== '' ? <span className="dam-msg-time">{time}</span> : null}
                        </div>
                        <div className="dam-msg-text">{ev.text}</div>
                      </div>
                    </div>
                  )
                  if (ev.kind === 'assistant') return (
                    <div key={idx} className="dam-msg dam-msg--assistant">
                      <div className="dam-msg-rail">
                        <div className="dam-msg-avatar" aria-hidden="true">A</div>
                        <div className="dam-msg-rail-line" />
                      </div>
                      <div className="dam-msg-body">
                        <div className="dam-msg-head">
                          <span className="dam-msg-role">{roleLabel}</span>
                          {time !== '' ? <span className="dam-msg-time">{time}</span> : null}
                        </div>
                        <div className="dam-msg-text">{ev.text}</div>
                      </div>
                    </div>
                  )
                  if (ev.kind === 'toolCall') return (
                    <div key={idx} className="dam-msg dam-msg--tool">
                      <div className="dam-msg-rail">
                        <div className="dam-msg-avatar" aria-hidden="true">⚙</div>
                        <div className="dam-msg-rail-line" />
                      </div>
                      <div className="dam-msg-body">
                        <div className="dam-msg-head">
                          <span className="dam-msg-role">{roleLabel}</span>
                          {time !== '' ? <span className="dam-msg-time">{time}</span> : null}
                        </div>
                        <div className="dam-msg-text">
                          {ev.toolName ? <div className="dam-msg-tool-name">{ev.toolName}</div> : null}
                          {ev.text}
                        </div>
                      </div>
                    </div>
                  )
                  // toolResult
                  return (
                    <div key={idx} className="dam-msg dam-msg--tool-result">
                      <div className="dam-msg-rail">
                        <div className="dam-msg-avatar" aria-hidden="true">✓</div>
                        <div className="dam-msg-rail-line" />
                      </div>
                      <div className="dam-msg-body">
                        <div className="dam-msg-head">
                          <span className="dam-msg-role">{roleLabel}</span>
                          {time !== '' ? <span className="dam-msg-time">{time}</span> : null}
                        </div>
                        <div className="dam-msg-text">{ev.text}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="dam-hint">{t('deleteHint')}</div>
            </>
          )}
        </div>
      </div>

      {toast !== undefined ? (
        <div className={`dam-toast${toast.kind === 'error' ? ' dam-toast--error' : ''}`}>{toast.text}</div>
      ) : null}
    </div>
  )
}