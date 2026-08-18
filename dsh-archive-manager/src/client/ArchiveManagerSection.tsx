/**
 * Archive manager settings section: list + detail + restore / export.
 *
 * Data flow:
 *  - List: host `archive.list` returns summaries (id, title, updatedAt, messageCount).
 *  - Detail: host `archive.info` returns events for the selected session.
 *    Events are rendered inline (user/assistant bubbles + tool call/result
 *    blocks) — markdown export formats the same events via `archive.export-md`.
 *  - Restore: host `archive.restore` → workspaceRegistry.setState.
 *  - Export zip: client `fetch('/api/session.export?sessionId=…')` (trusted-host).
 *  - Export md: host `archive.export-md` → client builds a Blob and downloads.
 */
import { useEffect, useState } from 'react'
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

interface ToolCallLike { type?: string; name?: string; arguments?: string }
interface ToolResultLike { type?: string; text?: string; content?: readonly { type?: string; text?: string }[] }
interface UserMessageLike { role?: string; content?: readonly { type?: string; text?: string }[] }
interface AssistantMessageLike { message?: UserMessageLike }

function safeText(parts: readonly { type?: string; text?: string }[] | undefined): string {
  if (!parts) return ''
  return parts.filter(p => p.type === 'text' && typeof p.text === 'string').map(p => p.text ?? '').join('\n').trim()
}

function describeEvent(raw: unknown): { kind: 'user' | 'assistant' | 'toolCall' | 'toolResult' | 'other'; text: string; toolName: string; toolArgs: string } {
  const r = raw as { type?: string; data?: unknown }
  if (r === null || typeof r !== 'object') return { kind: 'other', text: '', toolName: '', toolArgs: '' }
  switch (r.type) {
    case 'user/message': {
      const m = r.data as UserMessageLike | undefined
      return { kind: 'user', text: safeText(m?.content), toolName: '', toolArgs: '' }
    }
    case 'assistant/message': {
      const m = r.data as AssistantMessageLike | undefined
      return { kind: 'assistant', text: safeText(m?.message?.content), toolName: '', toolArgs: '' }
    }
    case 'tool/call': {
      const d = r.data as ToolCallLike | undefined
      return { kind: 'toolCall', text: d?.arguments ?? '', toolName: d?.name ?? '', toolArgs: d?.arguments ?? '' }
    }
    case 'tool/result': {
      const d = r.data as { message?: { content?: readonly ToolResultLike[] } } | undefined
      const first = d?.message?.content?.[0]
      const text = first && first.type === 'text' && typeof first.text === 'string' ? first.text : ''
      return { kind: 'toolResult', text, toolName: '', toolArgs: '' }
    }
    default:
      return { kind: 'other', text: '', toolName: '', toolArgs: '' }
  }
}

function formatTimestamp(value: number): string {
  if (!Number.isFinite(value)) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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

function isLoopbackOrigin(): boolean {
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === ''
}

export function ArchiveManagerSection({ api, t }: Props): JSX.Element {
  const [items, setItems] = useState<readonly ArchivedSummary[]>([])
  const [loadError, setLoadError] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [detail, setDetail] = useState<DetailState | undefined>()
  const [toast, setToast] = useState<ToastState | undefined>()

  useEffect(() => {
    let cancelled = false
    void api.list().then(
      (list) => {
        if (cancelled) return
        setItems(list)
        setLoadError(undefined)
      },
      (err) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : String(err))
      },
    )
    return () => { cancelled = true }
  }, [api])

  // Load detail when a session is selected.
  useEffect(() => {
    if (selectedId === undefined) { setDetail(undefined); return }
    let cancelled = false
    const next: DetailState = { sessionId: selectedId, loading: true }
    setDetail(next)
    void api.info(selectedId).then(
      (info) => {
        if (cancelled) return
        setDetail({ sessionId: selectedId, info, loading: false })
      },
      (err) => {
        if (cancelled) return
        setDetail({ sessionId: selectedId, loading: false, error: err instanceof Error ? err.message : String(err) })
      },
    )
    return () => { cancelled = true }
  }, [api, selectedId])

  function showToast(text: string, kind: 'ok' | 'error' = 'ok'): void {
    setToast({ text, kind })
    setTimeout(() => setToast(undefined), 3200)
  }

  async function onRestore(): Promise<void> {
    if (selectedId === undefined) return
    if (!window.confirm(t('restoreConfirm'))) return
    try {
      await api.restore(selectedId)
      showToast(t('restoreSuccess'))
      // Refresh the list (restored session is no longer archived).
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
    } catch (err) {
      showToast(t('exportFailed') + ' ' + (err instanceof Error ? err.message : String(err)), 'error')
    }
  }

  function onExportZip(): void {
    if (selectedId === undefined) return
    // Zip export is the host's /api/session.export endpoint. Loopback-origin
    // calls reach 127.0.0.1 directly; remote origins (Tailscale) use the
    // current page origin so trusted-host authority applies.
    const origin = isLoopbackOrigin() ? window.location.origin : window.location.origin
    const url = `${origin}/api/session.export?sessionId=${encodeURIComponent(selectedId)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const selectedInfo = selectedId === undefined ? undefined : items.find(i => i.id === selectedId)

  return (
    <div className="dam-section">
      <p className="dam-banner">{t('tabDesc')}</p>
      {loadError !== undefined ? (
        <p className="dam-banner" role="alert">{t('loadFailed')} {loadError}</p>
      ) : null}
      <div className="dam-layout">
        <div className="dam-list" role="listbox" aria-label={t('tab')}>
          {items.length === 0 && loadError === undefined ? (
            <div className="dam-list-empty">{t('empty')}</div>
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
                <span className="dam-item-title">{item.title || item.id}</span>
                <span className="dam-item-meta">
                  {item.messageCount} {t('messageCount')} · {formatTimestamp(item.updatedAt)}
                </span>
              </button>
            )
          })}
        </div>
        <div className="dam-detail">
          {selectedInfo === undefined ? (
            <div className="dam-detail-empty">{t('noSelection')}</div>
          ) : (
            <>
              <div className="dam-detail-header">
                <div className="dam-detail-title">{selectedInfo.title || selectedInfo.id}</div>
                <div className="dam-detail-meta">
                  {t('sessionId')}: <code>{selectedInfo.id}</code> · {selectedInfo.messageCount} {t('messageCount')} · {formatTimestamp(selectedInfo.updatedAt)}
                </div>
              </div>
              <div className="dam-detail-actions">
                <button type="button" className="dam-btn dam-btn--primary" onClick={() => void onRestore()}>
                  {t('restore')}
                </button>
                <button type="button" className="dam-btn" onClick={() => void onExportMd()}>
                  {t('exportMd')}
                </button>
                <button type="button" className="dam-btn" onClick={onExportZip}>
                  {t('exportZip')}
                </button>
              </div>
              <div className="dam-messages">
                {detail?.loading === true ? <div className="dam-banner">{t('selectPrompt')}</div> : null}
                {detail?.error !== undefined ? (
                  <div className="dam-banner" role="alert">{detail.error}</div>
                ) : null}
                {detail?.info !== undefined ? detail.info.events.map((raw, idx) => {
                  const ev = describeEvent(raw)
                  if (ev.kind === 'other') return null
                  if (ev.kind === 'user') return (
                    <div key={idx} className="dam-msg">
                      <div className="dam-msg-role">user</div>
                      <div className="dam-msg-text">{ev.text}</div>
                    </div>
                  )
                  if (ev.kind === 'assistant') return (
                    <div key={idx} className="dam-msg">
                      <div className="dam-msg-role">assistant</div>
                      <div className="dam-msg-text">{ev.text}</div>
                    </div>
                  )
                  if (ev.kind === 'toolCall') return (
                    <div key={idx} className="dam-tool">
                      <div className="dam-tool-name">🔧 {ev.toolName ?? 'tool'}</div>
                      <div>{ev.toolArgs ?? ''}</div>
                    </div>
                  )
                  // toolResult
                  return (
                    <div key={idx} className="dam-tool-result">
                      <div className="dam-tool-name">→ result</div>
                      <div>{ev.text}</div>
                    </div>
                  )
                }) : null}
              </div>
              <p className="dam-hint">{t('deleteHint')}</p>
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