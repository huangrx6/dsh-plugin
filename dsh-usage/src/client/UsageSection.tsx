/**
 * Subscription usage monitor — rendered in the launcher personal space.
 *
 * Dashboard-style card grid: each subscription is a stat card whose hero is
 * the lowest remaining percentage across its quota bars (big tabular number
 * + slim bar), with the per-window breakdown beneath. All keys and outbound
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

/** Provider metadata — brand wordmark as the tile text, hue as accent. */
const PROVIDERS: { id: UsageProvider; color: string; initials: string }[] = [
  { id: 'glm', color: '#3b82f6', initials: 'GLM' },
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

      {status === 'loading' ? <div className="u-empty"><span>{t('loading')}</span></div> : null}
      {status === 'error' ? <div className="u-empty u-empty--error" role="alert"><span>{message}</span></div> : null}

      {/* ── stat card grid ── */}
      {entries.length > 0 ? (
        <div className="u-grid">
          {entries.map((entry) => (
            <StatCard
              key={entry.id}
              entry={entry}
              result={results.get(entry.id)}
              loadingLabel={t('loading')}
              onEdit={() => setEditing({
                id: entry.id, label: entry.label, provider: entry.provider,
                apiKey: entry.apiKey ?? '', endpoint: entry.endpoint ?? '',
                region: entry.region ?? 'bigmodel',
              })}
              onDelete={() => void remove(entry.id)}
              editLabel={t('editEntry')}
              deleteLabel={t('delete')}
            />
          ))}
        </div>
      ) : status === 'ready' ? (
        <div className="u-empty"><span>{t('addEntry')}</span></div>
      ) : null}

      {updatedAt !== undefined ? <p className="u-meta">{t('updatedAt')}: {new Date(updatedAt).toLocaleTimeString()}</p> : null}

      {/* ── edit modal ── */}
      {editing !== undefined ? (
        <div className="u-mask" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setEditing(undefined) }}>
          <div className="u-modal" role="dialog" aria-label={editing.id === undefined ? t('addEntry') : t('editEntry')}>
            <div className="u-modalTitle">{editing.id === undefined ? t('addEntry') : t('editEntry')}</div>

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
              <label className="u-f">{t('entryRegion')}
                <select value={editing.region} onChange={(e) => setEditing({ ...editing, region: e.target.value as 'bigmodel' | 'zai' })}>
                  <option value="bigmodel">{t('entryRegionBigmodel')}</option>
                  <option value="zai">{t('entryRegionZai')}</option>
                </select>
              </label>
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

/** One dashboard stat card: hero percent (the tightest window) + breakdown rows. */
function StatCard({ entry, result, loadingLabel, onEdit, onDelete, editLabel, deleteLabel }: {
  readonly entry: UsageEntry
  readonly result: UsageQueryResult | undefined
  readonly loadingLabel: string
  readonly onEdit: () => void
  readonly onDelete: () => void
  readonly editLabel: string
  readonly deleteLabel: string
}): JSX.Element {
  const pmeta = PROVIDERS.find((p) => p.id === entry.provider)
  const accent = pmeta?.color ?? '#6ea8fe'
  const bars = result?.ok === true ? result.bars ?? [] : []
  const hero = bars.length > 0
    ? bars.reduce((min, b) => Math.min(min, clamp(b.remainingPercent ?? 100)), 100)
    : undefined

  return (
    <div className="u-stat" style={{ '--u-accent': accent } as React.CSSProperties}>
      {/* card head: wordmark tile + name + quiet actions */}
      <div className="u-statHead">
        <span className="u-statTile">{pmeta?.initials ?? '—'}</span>
        <div className="u-statInfo">
          <span className="u-statName">{entry.label}</span>
          <span className="u-statProvider">{providerLabelSafe(entry.provider)}{result?.level !== undefined ? ` · ${result.level}` : ''}</span>
        </div>
        <span className="u-statActions">
          <button type="button" className="u-mini" onClick={onEdit}>{editLabel}</button>
          <button type="button" className="u-mini u-mini--danger" onClick={onDelete}>{deleteLabel}</button>
        </span>
      </div>

      {/* hero: the tightest remaining percent, big tabular digits */}
      {hero !== undefined ? (
        <div className="u-statHero" data-fill={fillState(hero)}>
          <span className="u-statValue">{hero}<span className="u-statUnit">%</span></span>
          <span className="u-statHeroTrack"><span className="u-statHeroFill" data-fill={fillState(hero)} style={{ width: `${hero}%` }} /></span>
        </div>
      ) : result === undefined ? (
        <div className="u-statPending">{loadingLabel}</div>
      ) : result.ok === false ? (
        <div className="u-statError">{result.message}</div>
      ) : (
        <div className="u-statPending">—</div>
      )}

      {/* per-window breakdown */}
      {bars.length > 0 ? (
        <div className="u-statBars">
          {bars.map((bar, i) => {
            const pct = clamp(bar.remainingPercent ?? 0)
            const tooltip = bar.remaining !== undefined && bar.total !== undefined
              ? `${bar.remaining} / ${bar.total}${bar.unit !== undefined ? ' ' + bar.unit : ''}`
              : `${pct}%`
            return (
              <div key={i} className="u-statBarRow" title={tooltip}>
                <span className="u-statBarLabel">
                  <span className="u-statBarName">{bar.label}</span>
                  {bar.detail !== undefined ? <span className="u-statBarDetail">{bar.detail}</span> : null}
                </span>
                <span className="u-statBarTrack"><span className="u-statBarFill" data-fill={fillState(pct)} style={{ width: `${pct}%` }} /></span>
                <span className="u-statBarVal">{pct}%</span>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function providerLabelSafe(p: UsageProvider): string {
  return p === 'glm' ? 'GLM' : p === 'minimax' ? 'MiniMax' : 'Opencode'
}

function providerLabel(t: (k: UsageLocaleKey) => string, p: UsageProvider): string {
  return p === 'glm' ? t('providerGlm') : p === 'minimax' ? t('providerMinimax') : t('providerOpencode')
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0))
}

function fillState(pct: number): 'safe' | 'warning' | 'critical' {
  return pct > 50 ? 'safe' : pct > 20 ? 'warning' : 'critical'
}
