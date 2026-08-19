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

  // Auto-refresh once a minute while the section is visible.
  useEffect(() => {
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
      apiKey: editing.provider === 'opencode' ? editing.apiKey : editing.apiKey,
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
      <div className="u-top">
        <span className="u-hint">{t('sectionHint')}</span>
        <button type="button" className="u-btn" onClick={() => setEditing(EMPTY)}>{t('addEntry')}</button>
        <button type="button" className="u-btn u-btn--primary" onClick={() => void refresh()} disabled={busy}>
          {busy ? t('refreshing') : t('refresh')}
        </button>
      </div>
      {status === 'loading' ? <p className="u-note">{t('loading')}</p> : null}
      {status === 'error' ? <p className="u-note u-note--error" role="alert">{message}</p> : null}
      {entries.length === 0 && status === 'ready' ? <p className="u-note">{t('addEntry')}…</p> : null}
      <div className="u-list">
        {entries.map((entry) => {
          const r = results.get(entry.id)
          return (
            <div key={entry.id} className="u-row">
              <div className="u-rowHead">
                <span className="u-provider">{providerLabel(t, entry.provider)}</span>
                <span className="u-label">{entry.label}</span>
                {r?.level !== undefined ? <span className="u-level">{t('level')}: {r.level}</span> : null}
                <span className="u-actions">
                  <button type="button" className="u-mini"
                    onClick={() => setEditing({ id: entry.id, label: entry.label, provider: entry.provider, apiKey: entry.apiKey ?? '', endpoint: entry.endpoint ?? '', region: entry.region ?? 'bigmodel' })}>{t('editEntry')}</button>
                  <button type="button" className="u-mini u-mini--danger" onClick={() => void remove(entry.id)}>{t('delete')}</button>
                </span>
              </div>
              {r === undefined ? <p className="u-note">{t('loading')}…</p> :
                r.ok === false ? <p className="u-note u-note--error">{r.message}</p> :
                  <div className="u-bars">
                    {(r.bars ?? []).map((bar, i) => <Bar key={i} bar={bar} />)}
                    {r.manualPercent !== undefined && (r.bars ?? []).length === 0
                      ? <Bar bar={{ label: t('manual'), remainingPercent: clamp(r.manualPercent) }} /> : null}
                  </div>}
            </div>
          )
        })}
      </div>
      {updatedAt !== undefined ? <p className="u-note u-meta">{t('updatedAt')}: {new Date(updatedAt).toLocaleTimeString()}</p> : null}

      {editing !== undefined ? (
        <div className="u-mask" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setEditing(undefined) }}>
          <div className="u-modal" role="dialog" aria-label={t('editEntry')}>
            <div className="u-modalTitle">{editing.id === undefined ? t('addEntry') : t('editEntry')}</div>
            <label className="u-f">{t('entryLabel')}<input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} /></label>
            <label className="u-f">{t('entryProvider')}
              <select value={editing.provider} onChange={(e) => setEditing({ ...editing, provider: e.target.value as UsageProvider })}>
                <option value="glm">{t('entryProviderGlm')}</option>
                <option value="minimax">{t('entryProviderMinimax')}</option>
                <option value="opencode">{t('entryProviderOpencode')}</option>
              </select>
            </label>
            {editing.provider === 'glm' ? (
              <label className="u-f">{t('entryRegion')}
                <select value={editing.region} onChange={(e) => setEditing({ ...editing, region: e.target.value as 'bigmodel' | 'zai' })}>
                  <option value="bigmodel">{t('entryRegionBigmodel')}</option>
                  <option value="zai">{t('entryRegionZai')}</option>
                </select>
              </label>
            ) : null}
            {editing.provider !== 'opencode' ? (
              <label className="u-f">{t('entryKey')}<input type="password" value={editing.apiKey} onChange={(e) => setEditing({ ...editing, apiKey: e.target.value })} /></label>
            ) : null}
            {editing.provider === 'minimax' ? (
              <label className="u-f">{t('entryEndpoint')}<input type="url" value={editing.endpoint} onChange={(e) => setEditing({ ...editing, endpoint: e.target.value })} placeholder="https://…" /></label>
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
  const tooltip = bar.remaining !== undefined && bar.total !== undefined
    ? `${bar.remaining} / ${bar.total}${bar.unit !== undefined ? ' ' + bar.unit : ''}`
    : `${pct}%`
  return (
    <div className="u-bar" title={tooltip}>
      <div className="u-barTop">
        <span className="u-barLabel">{bar.label}</span>
        <span className="u-barVal">{pct}%</span>
      </div>
      <div className="u-track"><div className="u-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
