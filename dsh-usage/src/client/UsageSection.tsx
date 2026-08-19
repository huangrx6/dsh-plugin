/**
 * Subscription usage monitor — rendered in the launcher personal space.
 *
 * Lists every configured subscription as a card with quota bars (GLM 5h +
 * weekly from the real API / MiniMax / manual), refreshes automatically and
 * on demand, and edits entries through a small modal. All keys and outbound
 * HTTP live host-side; this component only talks to the trusted RPC.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UsageApi } from './api.ts'
import type { UsageEntry, UsageBar, UsageProvider, UsageQueryResult } from '../contracts.ts'
import type { UsageLocaleKey } from './locales.ts'

export interface UsageSectionProps {
  readonly t: (key: UsageLocaleKey) => string
  readonly api: UsageApi
}

interface EditState {
  readonly id?: string
  readonly label: string
  readonly provider: UsageProvider
  readonly apiKey: string
  readonly endpoint: string
  readonly region: 'bigmodel' | 'zai'
}

const EMPTY: EditState = { label: '', provider: 'glm', apiKey: '', endpoint: '', region: 'bigmodel' }

/** Provider metadata — initials used as icon text, color as accent. */
const PROVIDERS: { id: UsageProvider; color: string; initials: string }[] = [
  { id: 'glm', color: '#4285f4', initials: 'GLM' },
  { id: 'minimax', color: '#8b5cf6', initials: 'MM' },
  { id: 'opencode', color: '#10b981', initials: 'OC' },
]

export function UsageSection({ t, api }: UsageSectionProps): JSX.Element {
  const [entries, setEntries] = useState<readonly UsageEntry[]>([])
  const [results, setResults] = useState<ReadonlyMap<string, UsageQueryResult>>(new Map())
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busy, setBusy] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<number | undefined>(undefined)
  const [editing, setEditing] = useState<EditState | undefined>(undefined)
  const [message, setMessage] = useState<string | undefined>(undefined)

  const loadConfig = useCallback(async () => {
    try {
      const config = await api.readConfig()
      setEntries(config.entries)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }, [api])

  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      const list = await api.query()
      setResults(new Map(list.map((r) => [r.id, r])))
      setUpdatedAt(Date.now())
    } catch (error) {
      setMessage(t('queryFailed') + ': ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setBusy(false)
    }
  }, [api, t])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => { void refresh() }, 60_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const save = useCallback(async () => {
    if (editing === undefined) return
    const next = [...entries]
    const entry: UsageEntry = {
      id: editing.id ?? `u-${Date.now().toString(36)}`,
      label: editing.label.trim() || editing.provider,
      provider: editing.provider,
      apiKey: editing.apiKey,
      endpoint: editing.endpoint.trim() || undefined,
      region: editing.region,
    }
    const idx = next.findIndex((e) => e.id === entry.id)
    if (idx >= 0) next[idx] = entry
    else next.push(entry)
    await api.writeConfig({ entries: next })
    setEntries(next)
    setEditing(undefined)
    void refresh()
  }, [api, editing, entries, refresh])

  const remove = useCallback(async (id: string) => {
    if (!window.confirm(t('removeConfirm'))) return
    const next = entries.filter((e) => e.id !== id)
    await api.writeConfig({ entries: next })
    setEntries(next)
    const m = new Map(results)
    m.delete(id)
    setResults(m)
  }, [api, entries, results, t])

  return (
    <div className="u-card">
      {/* ── toolbar ── */}
      <div className="u-top">
        <span className="u-hint">{t('sectionHint')}</span>
        <button type="button" className="u-btn u-btn--accent" onClick={() => setEditing(EMPTY)}>
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          {t('addEntry')}
        </button>
        <button type="button" className="u-btn" onClick={() => void refresh()} disabled={busy}>
          <svg className={busy ? 'u-spin' : ''} viewBox="0 0 16 16" fill="none" width="13" height="13" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {busy ? t('refreshing') : t('refresh')}
        </button>
      </div>

      {status === 'loading' ? <div className="u-empty"><span className="u-empty-text">{t('loading')}</span></div> : null}
      {status === 'error' ? <div className="u-empty u-empty--error" role="alert"><span className="u-empty-text">{message}</span></div> : null}
      {entries.length === 0 && status === 'ready' ? (
        <div className="u-empty">
          <span className="u-empty-text">{t('addEntry')}</span>
        </div>
      ) : null}

      {/* ── subscription cards ── */}
      <div className="u-list">
        {entries.map((entry) => {
          const r = results.get(entry.id)
          const pmeta = PROVIDERS.find((p) => p.id === entry.provider)
          return (
            <div key={entry.id} className="u-row" style={{ '--u-accent': pmeta?.color ?? '#6ea8fe' } as React.CSSProperties}>
              <div className="u-rowHead">
                <span className="u-provider-icon">{pmeta?.initials ?? '—'}</span>
                <div className="u-rowInfo">
                  <span className="u-label">{entry.label}</span>
                  <span className="u-provider">{providerLabel(t, entry.provider)}{r?.level !== undefined ? ` · ${r.level}` : ''}</span>
                </div>
                <span className="u-actions">
                  <button type="button" className="u-mini" onClick={() => setEditing({
                    id: entry.id, label: entry.label, provider: entry.provider,
                    apiKey: entry.apiKey ?? '', endpoint: entry.endpoint ?? '',
                    region: entry.region ?? 'bigmodel',
                  })}>{t('editEntry')}</button>
                  <button type="button" className="u-mini u-mini--danger" onClick={() => void remove(entry.id)}>{t('delete')}</button>
                </span>
              </div>
              {r === undefined ? <div className="u-bar-loading">{t('loading')}</div> :
                r.ok === false ? <div className="u-bar-loading u-bar-loading--error">{r.message}</div> :
                  <div className="u-bars">
                    {(r.bars ?? []).map((bar, i) => <Bar key={i} bar={bar} />)}
                    {r.manualPercent !== undefined && (r.bars ?? []).length === 0
                      ? <Bar bar={{ label: t('manual'), remainingPercent: clamp(r.manualPercent) }} /> : null}
                  </div>}
            </div>
          )
        })}
      </div>

      {updatedAt !== undefined ? <p className="u-meta">{t('updatedAt')}: {new Date(updatedAt).toLocaleTimeString()}</p> : null}

      {/* ── edit modal ── */}
      {editing !== undefined ? (
        <div className="u-mask" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setEditing(undefined) }}>
          <div className="u-modal" role="dialog" aria-label={editing.id === undefined ? t('addEntry') : t('editEntry')}>
            <div className="u-modalTitle">{editing.id === undefined ? t('addEntry') : t('editEntry')}</div>

            {/* provider cards */}
            <div className="u-providerGrid">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`u-providerCard${editing.provider === p.id ? ' is-selected' : ''}`}
                  style={{ '--u-accent': p.color } as React.CSSProperties}
                  onClick={() => setEditing({ ...editing, provider: p.id, apiKey: '', endpoint: '', region: 'bigmodel' })}
                >
                  <span className="u-providerCard-initials" style={{ background: p.color }}>{p.initials}</span>
                  <span className="u-providerCard-name">{providerLabel(t, p.id)}</span>
                </button>
              ))}
            </div>

            <label className="u-f">{t('entryLabel')}
              <input value={editing.label} placeholder={providerLabel(t, editing.provider)} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
            </label>

            {editing.provider === 'glm' ? (
              <div className="u-regionRow">
                <label className="u-f u-f--row">
                  <span>{t('entryRegion')}</span>
                  <select value={editing.region} onChange={(e) => setEditing({ ...editing, region: e.target.value as 'bigmodel' | 'zai' })}>
                    <option value="bigmodel">{t('entryRegionBigmodel')}</option>
                    <option value="zai">{t('entryRegionZai')}</option>
                  </select>
                </label>
              </div>
            ) : null}

            <label className="u-f">{t('entryKey')}
              <input type="password" value={editing.apiKey} placeholder={editing.provider === 'opencode' ? 'env:OPENCODE_API_KEY' : 'sk-…'} onChange={(e) => setEditing({ ...editing, apiKey: e.target.value })} />
            </label>

            {editing.provider === 'minimax' || editing.provider === 'opencode' ? (
              <label className="u-f">{t('entryEndpoint')}
                <input type="url" value={editing.endpoint} placeholder={editing.provider === 'opencode' ? 'https://opencode.ai/zen/go/v1/usage' : 'https://www.minimaxi.com/v1/token_plan/remains'} onChange={(e) => setEditing({ ...editing, endpoint: e.target.value })} />
              </label>
            ) : null}

            <div className="u-modalFoot">
              <button type="button" className="u-btn" onClick={() => setEditing(undefined)}>{t('cancel')}</button>
              <button type="button" className="u-btn u-btn--primary" onClick={() => void save()}>{t('save')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function providerLabel(t: (k: UsageLocaleKey) => string, p: UsageProvider): string {
  return p === 'glm' ? t('providerGlm') : p === 'minimax' ? t('providerMinimax') : t('providerOpencode')
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0))
}

function Bar({ bar }: { readonly bar: UsageBar }): JSX.Element {
  const pct = clamp(bar.remainingPercent ?? 0)
  const fillState = pct > 50 ? 'safe' : pct > 20 ? 'warning' : 'critical'
  const tooltip = bar.remaining !== undefined && bar.total !== undefined
    ? `${bar.remaining} / ${bar.total}${bar.unit !== undefined ? ' ' + bar.unit : ''}`
    : `${pct}%`
  return (
    <div className="u-bar" title={tooltip}>
      <div className="u-barTop">
        <span className="u-barLabel">{bar.label}</span>
        <span className="u-barVal" data-fill={fillState}>{pct}%</span>
      </div>
      <div className="u-track"><div className="u-fill" data-fill={fillState} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
