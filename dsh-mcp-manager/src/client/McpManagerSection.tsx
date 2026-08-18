import { useCallback, useEffect, useRef, useState } from 'react'
import { IconApiOutline14, IconChevronDownOutline14, IconLoadingOutline16, IconPlusOutline16, IconRefreshOutline16, IconSearchOutline16, IconTrashOutline16, IconWarningOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { McpListResponse, McpServerView, McpTestResponse } from '../contracts.ts'
import type { McpManagerApi } from './api.ts'
import type { McpManagerLocaleKey } from './locales.ts'
import { McpEditor } from './McpEditor.tsx'
import { cachedToolsToRows, ToolList } from './ToolList.tsx'
import { clearCachedTest, loadCachedTest, saveCachedTest, type CachedTest } from './tool-cache.ts'

export interface McpManagerSectionProps {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly api: McpManagerApi
}

interface ListState {
  readonly status: 'loading' | 'error' | 'ready'
  readonly data?: McpListResponse
  readonly error?: string
}

/** Plugins-settings tab: MCP server cards with cached probes, auto-testing and actions. */
export function McpManagerSection({ t, api }: McpManagerSectionProps) {
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [request, setRequest] = useState(0)
  const [expanded, setExpanded] = useState<string | undefined>(undefined)
  const [editing, setEditing] = useState<McpServerView | undefined | 'add'>(undefined)
  const [busy, setBusy] = useState<string | undefined>(undefined)
  const [actionError, setActionError] = useState<string | undefined>(undefined)
  const [cache, setCache] = useState<Record<string, CachedTest>>({})
  const [autoTesting, setAutoTesting] = useState<Record<string, true>>({})
  const probingRef = useRef<string | undefined>(undefined)

  const load = useCallback(() => {
    Promise.resolve()
      .then(() => api.list())
      .then(data => { setState({ status: 'ready', data }) })
      .catch(error => { setState({ status: 'error', error: error instanceof Error ? error.message : String(error) }) })
  }, [api])

  useEffect(() => { load() }, [load, request])

  /** Adopt whatever is already cached for the freshly listed servers. */
  useEffect(() => {
    if (state.status !== 'ready' || state.data === undefined) return
    const listed = state.data.servers
    setCache(current => {
      const next = { ...current }
      for (const server of listed) {
        if (next[server.serverName] === undefined) {
          const cached = loadCachedTest(window.localStorage, server.serverName)
          if (cached !== undefined) next[server.serverName] = cached
        }
      }
      return next
    })
  }, [state])

  const runProbe = useCallback(async (serverName: string, config: NonNullable<McpServerView['config']>): Promise<CachedTest | undefined> => {
    try {
      const result = await api.test(config)
      const saved = saveCachedTest(window.localStorage, serverName, result)
      if (saved !== undefined) setCache(current => ({ ...current, [serverName]: saved }))
      return saved
    } catch (error) {
      // a transport-level failure still caches, so we don't re-probe forever
      const fallback: CachedTest = { ok: false, durationMs: 0, error: error instanceof Error ? error.message : String(error), tools: [], testedAt: Date.now() }
      saveCachedTest(window.localStorage, serverName, { ok: false, durationMs: 0, error: fallback.error })
      setCache(current => ({ ...current, [serverName]: fallback }))
      return fallback
    }
  }, [api])

  /**
   * Auto-probe queue: enabled servers the user has never tested get one
   * background probe (sequentially — npx spawns are not free), so tool lists
   * appear without anyone clicking 测试连接. localStorage is checked directly
   * so a cached result from a previous session suppresses the probe even
   * before the adoption effect has merged it into state (avoids a re-probe
   * race on every page load).
   */
  const servers = state.status === 'ready' && state.data !== undefined ? state.data.servers : []
  useEffect(() => {
    const candidate = servers.find(server =>
      !server.disabled && server.config !== undefined
      && cache[server.serverName] === undefined
      && autoTesting[server.serverName] === undefined)
    if (candidate === undefined || candidate.config === undefined) return
    const persisted = loadCachedTest(window.localStorage, candidate.serverName)
    if (persisted !== undefined) {
      setCache(current => current[candidate.serverName] === undefined ? { ...current, [candidate.serverName]: persisted } : current)
      return
    }
    if (probingRef.current === candidate.serverName) return
    probingRef.current = candidate.serverName
    setAutoTesting(current => ({ ...current, [candidate.serverName]: true }))
    void runProbe(candidate.serverName, candidate.config)
      .finally(() => {
        probingRef.current = undefined
        setAutoTesting(current => {
          const next = { ...current }
          delete next[candidate.serverName]
          return next
        })
      })
  }, [servers, cache, autoTesting, runProbe])

  /** Writes go through HMR; poll a few times so status settles visibly. */
  const settleRefresh = useCallback(() => {
    let round = 0
    const tick = (): void => {
      round += 1
      load()
      if (round < 4) window.setTimeout(tick, 1200)
    }
    tick()
  }, [load])

  const withGuard = async (key: string, action: () => Promise<void>): Promise<void> => {
    if (busy !== undefined) return
    setBusy(key)
    setActionError(undefined)
    try {
      await action()
      settleRefresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(undefined)
    }
  }

  if (editing !== undefined) {
    return (
      <McpEditor
        t={t}
        api={api}
        original={editing === 'add' ? undefined : editing}
        onSaved={() => { setEditing(undefined); settleRefresh() }}
        onCancel={() => { setEditing(undefined) }}
      />
    )
  }

  return (
    <div className="dshmcp-tab" aria-busy={state.status === 'loading'}>
      <header className="dshmcp-head">
        <h2>{t('tab')}</h2>
        <p>{t('intro')}</p>
      </header>
      {state.status === 'loading'
        ? (
          <div className="dshmcp-skeleton" role="status" aria-label={t('loading')}>
            <div className="dshmcp-skelRow" />
            <div className="dshmcp-skelRow" />
            <div className="dshmcp-skelRow" />
          </div>
        )
        : null}
      {state.status === 'error'
        ? (
          <div className="dshmcp-failure" role="alert">
            <p>{t('error')}{state.error !== undefined ? `：${state.error}` : ''}</p>
            <button type="button" onClick={() => { setState({ status: 'loading' }); setRequest(value => value + 1) }}>{t('retry')}</button>
          </div>
        )
        : null}
      {state.status === 'ready'
        ? (
          <>
            <div className="dshmcp-heading">
              <h3>{t('catalog')}</h3>
              <span className="dshmcp-count" data-server-count={servers.length}>{servers.length}</span>
              <span className="dshmcp-spacer" />
              <button type="button" className="dshmcp-button dshmcp-buttonIcon" onClick={() => { setRequest(value => value + 1) }} title={t('refresh')} aria-label={t('refresh')}>
                <IconRefreshOutline16 size={15} aria-hidden="true" />
              </button>
              <button type="button" className="dshmcp-button dshmcp-buttonPrimary" onClick={() => { setEditing('add') }}>
                <IconPlusOutline16 size={14} aria-hidden="true" />
                {t('addButton')}
              </button>
            </div>
            {servers.length === 0
              ? (
                <div className="dshmcp-empty">
                  <span className="dshmcp-emptyTile"><IconApiOutline14 size={22} aria-hidden="true" /></span>
                  <p className="dshmcp-emptyTitle">{t('emptyTitle')}</p>
                  <p>{t('empty')}</p>
                </div>
              )
              : null}
            {actionError !== undefined ? <p className="dshmcp-callout dshmcp-calloutError" role="alert">{actionError}</p> : null}
            <ul className="dshmcp-cards">
              {servers.map(server => (
                <ServerCard
                  key={server.entryId}
                  t={t}
                  server={server}
                  open={expanded === server.entryId}
                  busy={busy}
                  cache={cache[server.serverName]}
                  autoTesting={autoTesting[server.serverName] === true}
                  onToggleOpen={() => { setExpanded(current => current === server.entryId ? undefined : server.entryId) }}
                  onEdit={() => { setEditing(server) }}
                  onToggle={() => {
                    void withGuard(server.entryId, async () => {
                      const enabling = server.disabled
                      await api.toggle(server.entryId, !server.disabled)
                      // re-verify freshly enabled servers instead of showing stale data
                      if (enabling) {
                        clearCachedTest(window.localStorage, server.serverName)
                        setCache(current => {
                          const next = { ...current }
                          delete next[server.serverName]
                          return next
                        })
                      }
                    })
                  }}
                  onDelete={() => {
                    if (!window.confirm(t('deleteConfirm'))) return
                    void withGuard(server.entryId, async () => { await api.deleteServer(server.entryId) })
                  }}
                  onTest={async () => {
                    if (server.config === undefined) return
                    setBusy(`${server.entryId}:test`)
                    try {
                      const result = await api.test(server.config)
                      const saved = saveCachedTest(window.localStorage, server.serverName, result)
                      if (saved !== undefined) setCache(current => ({ ...current, [server.serverName]: saved }))
                    } catch (error) {
                      setCache(current => ({ ...current, [server.serverName]: { ok: false, durationMs: 0, error: error instanceof Error ? error.message : String(error), tools: [], testedAt: Date.now() } }))
                    } finally {
                      setBusy(undefined)
                    }
                  }}
                />
              ))}
            </ul>
          </>
        )
        : null}
    </div>
  )
}

function ServerCard({ t, server, open, busy, cache, autoTesting, onToggleOpen, onEdit, onToggle, onDelete, onTest }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly server: McpServerView
  readonly open: boolean
  readonly busy: string | undefined
  readonly cache: CachedTest | undefined
  readonly autoTesting: boolean
  readonly onToggleOpen: () => void
  readonly onEdit: () => void
  readonly onToggle: () => void
  readonly onDelete: () => void
  readonly onTest: () => Promise<void>
}) {
  const [toolQuery, setToolQuery] = useState('')
  const phase = server.fiberPhase
  const summary = server.config === undefined
    ? '—'
    : server.config.transport === 'stdio'
      ? `${server.config.command ?? ''} ${(server.config.args ?? []).join(' ')}`.trim()
      : server.config.url ?? ''
  const liveCount = server.tools.length
  const cachedCount = cache?.toolCount ?? cache?.tools.length ?? 0
  const shownCount = liveCount > 0 ? liveCount : cachedCount
  const toolsLabel = shownCount === 1 ? t('toolsCountOne') : t('toolsCountMany').replace('{n}', String(shownCount))
  const testedAtLabel = cache !== undefined ? formatTime(cache.testedAt) : undefined
  const unhealthy = phase === 'failed'
  const toolRows = liveCount > 0
    ? server.tools.map(tool => ({ name: tool.publicName, description: tool.description, schema: tool.parameters as Record<string, unknown> | undefined }))
    : cache !== undefined && cache.ok ? cachedToolsToRows(cache.tools) : []
  return (
    <li className="dshmcp-card" data-server={server.serverName} data-open={open ? 'true' : undefined}>
      <div
        className="dshmcp-cardContent"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggleOpen}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggleOpen() } }}
      >
        <span className={`dshmcp-tile ${server.disabled ? 'dshmcp-tileMuted' : unhealthy ? 'dshmcp-tileError' : ''}`}>
          <IconApiOutline14 size={17} aria-hidden="true" />
        </span>
        <span className="dshmcp-cardBody">
          <span className="dshmcp-cardTitle">{server.serverName}</span>
          <span className="dshmcp-summary">
            {!server.disabled
              ? <span className="dshmcp-statusDot" data-phase={phase ?? 'unobserved'} role="img" aria-label={phaseLabel(t, phase)} title={phaseLabel(t, phase)} />
              : null}
            {server.config?.transport === 'streamable-http' ? t('transportHttp') : t('transportStdio')}
            {' · '}
            {summary}
            {autoTesting
              ? <IconLoadingOutline16 size={12} className="dshmcp-spin" aria-hidden="true" />
              : shownCount > 0
                ? ` · ${toolsLabel}`
                : ''}
          </span>
        </span>
        <span className="dshmcp-cardTrailing">
          <button
            type="button"
            role="switch"
            aria-checked={!server.disabled}
            aria-label={server.disabled ? t('enableButton') : t('disableButton')}
            title={server.disabled ? t('enableButton') : t('disableButton')}
            className={`dshmcp-switch${server.disabled ? '' : ' is-on'}`}
            disabled={busy !== undefined}
            onClick={event => { event.stopPropagation(); onToggle() }}
          >
            <span className="dshmcp-switchKnob" />
          </button>
          <span className={`dshmcp-cardChevron${open ? ' is-open' : ''}`} aria-hidden="true">
            <IconChevronDownOutline14 size={12} />
          </span>
        </span>
      </div>
      {open
        ? (
          <div className="dshmcp-cardDetails">
            {server.config === undefined ? <p className="dshmcp-status">{t('notRemovable')}</p> : null}
            <div className="dshmcp-toolsHead"><h4>{t('basicInfo')}</h4></div>
            <dl className="dshmcp-details">
              <div><dt>{t('detailEntryId')}</dt><dd className="dshmcp-path">{server.entryId}</dd></div>
              <div><dt>{t('detailOrigin')}</dt><dd>{originLabel(t, server.origin)}</dd></div>
              {server.config?.command !== undefined ? <div><dt>{t('detailCommand')}</dt><dd className="dshmcp-path">{server.config.command}</dd></div> : null}
              {server.config?.args !== undefined && server.config.args.length > 0 ? <div><dt>{t('detailArgs')}</dt><dd className="dshmcp-path">{server.config.args.join(' ')}</dd></div> : null}
              {server.config?.url !== undefined ? <div><dt>{t('detailUrl')}</dt><dd className="dshmcp-path">{server.config.url}</dd></div> : null}
              {server.config?.toolCallTimeoutMs !== undefined ? <div><dt>{t('detailTimeout')}</dt><dd>{server.config.toolCallTimeoutMs} ms</dd></div> : null}
              {server.config?.reconnect !== undefined ? <div><dt>{t('detailReconnect')}</dt><dd>{server.config.reconnect.enabled === false ? '✕' : '✓'}</dd></div> : null}
              {server.config?.failOnStartupError === true ? <div><dt>{t('detailStartup')}</dt><dd>✓</dd></div> : null}
              {server.hasExpressions ? <div><dt /><dd><IconWarningOutline16 size={13} aria-hidden="true" /> {t('exprLocked')}</dd></div> : null}
            </dl>
            <div className="dshmcp-actions">
              <button type="button" className="dshmcp-button" disabled={server.config === undefined || busy !== undefined} onClick={onEdit}>{t('editButton')}</button>
              <span className="dshmcp-spacer" />
              <button type="button" className="dshmcp-button dshmcp-buttonDanger" disabled={!server.removable || busy !== undefined} onClick={onDelete} title={server.removable ? undefined : t('notRemovable')}>
                <IconTrashOutline16 size={14} aria-hidden="true" />
                {t('deleteButton')}
              </button>
            </div>
            <div className="dshmcp-toolsBlock">
              <div className="dshmcp-toolsHead">
                <h4>{t('toolsHeading')}</h4>
                {shownCount > 0 ? <span className="dshmcp-count">{shownCount}</span> : null}
                <span className="dshmcp-spacer" />
                <button type="button" className="dshmcp-button dshmcp-buttonGhostSm" disabled={server.config === undefined || busy !== undefined} onClick={() => { void onTest() }}>
                  {busy === `${server.entryId}:test` ? t('testRunning') : t('retestButton')}
                </button>
              </div>
              <div className="dshmcp-toolsBar">
                {autoTesting
                  ? <span className="dshmcp-toolsMeta dshmcp-autoTest"><IconLoadingOutline16 size={12} className="dshmcp-spin" aria-hidden="true" />{t('autoTesting')}</span>
                  : cache !== undefined
                    ? (
                      <>
                        <span className={`dshmcp-chipStatus${cache.ok ? ' is-ok' : ' is-fail'}`}>
                          <span className="dshmcp-chipDot" aria-hidden="true" />
                          {cache.ok ? t('chipConnected') : t('chipFailed')}
                        </span>
                        {testedAtLabel !== undefined ? <span className="dshmcp-toolsMeta">{t('lastTestAt').replace('{time}', testedAtLabel)}</span> : null}
                      </>
                    )
                    : null}
                {toolRows.length > 1
                  ? (
                    <>
                      <span className="dshmcp-spacer" />
                      <span className="dshmcp-toolSearch">
                      <IconSearchOutline16 size={13} aria-hidden="true" />
                      <input
                        type="search"
                        value={toolQuery}
                        placeholder={t('toolSearch')}
                        aria-label={t('toolSearch')}
                        onChange={event => { setToolQuery(event.currentTarget.value) }}
                      />
                        {toolQuery.trim() !== '' ? <span className="dshmcp-toolSearchCount">{toolRows.filter(tool => tool.name.toLowerCase().includes(toolQuery.trim().toLowerCase()) || tool.description.toLowerCase().includes(toolQuery.trim().toLowerCase())).length}/{toolRows.length}</span> : null}
                      </span>
                    </>
                  )
                  : null}
              </div>
              {cache !== undefined && !cache.ok && !autoTesting
                ? <p className="dshmcp-callout dshmcp-calloutError" role="alert">{cache.error !== undefined ? cache.error : t('testFailed')}</p>
                : null}
              {autoTesting
                ? null
                : toolRows.length > 0
                  ? <ToolList t={t} tools={toolRows} query={toolQuery} />
                  : <p className="dshmcp-status">{t('toolNone')}</p>}
            </div>
          </div>
        )
        : null}
    </li>
  )
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function phaseLabel(t: (key: McpManagerLocaleKey) => string, phase: string | null): string {
  switch (phase) {
    case 'active': return t('phaseActive')
    case 'failed': return t('phaseFailed')
    case 'loading': return t('phaseLoading')
    case 'pending': return t('phasePending')
    case 'unloading': return t('phaseUnloading')
    default: return t('phaseUnobserved')
  }
}

function originLabel(t: (key: McpManagerLocaleKey) => string, origin: McpServerView['origin']): string {
  switch (origin) {
    case 'profile': return t('detailOriginProfile')
    case 'home': return t('detailOriginHome')
    default: return t('detailOriginLive')
  }
}
