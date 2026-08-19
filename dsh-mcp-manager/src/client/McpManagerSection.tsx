import { useCallback, useEffect, useRef, useState } from 'react'
import { IconApiOutline14, IconLoadingOutline16, IconPlusOutline16, IconRefreshOutline16, IconTrashOutline16, IconWarningOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { McpListResponse, McpServerView } from '../contracts.ts'
import type { McpManagerApi } from './api.ts'
import type { McpManagerLocaleKey } from './locales.ts'
import type { CachedTest } from './tool-cache.ts'
import { McpEditor } from './McpEditor.tsx'
import { ModalShell } from './ModalShell.tsx'
import { cachedToolsToRows } from './ToolList.tsx'
import { clearCachedTest, loadCachedTest, saveCachedTest } from './tool-cache.ts'
import { loadInstalledView, saveInstalledView, type InstalledView } from './preferences.ts'
import { IconGrid, IconList, IconMcp, IconRemote } from './market/icons.tsx'

export interface McpManagerSectionProps {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly api: McpManagerApi
}

interface ListState {
  readonly status: 'loading' | 'error' | 'ready'
  readonly data?: McpListResponse
  readonly error?: string
}

/**
 * 已安装 pane: the full-width server catalog with a list ⇄ card view
 * toggle (persisted independently from the market view). Every row and
 * card carries the same action cluster — enable switch, 详情 (read-only
 * modal), 编辑 (the McpEditor form inside a modal shell) and 删除
 * (confirm-first). Enabled servers get one background auto-probe so tool
 * counts / versions appear without anyone clicking 测试连接.
 */
export function McpManagerSection({ t, api }: McpManagerSectionProps) {
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [request, setRequest] = useState(0)
  const [view, setView] = useState<InstalledView>(() => loadInstalledView(window.localStorage))
  const [editing, setEditing] = useState<McpServerView | undefined | 'add'>(undefined)
  const [detailId, setDetailId] = useState<string | undefined>(undefined)
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

  const pickView = useCallback((next: InstalledView) => {
    setView(next)
    saveInstalledView(window.localStorage, next)
  }, [])

  /** Shared per-server actions, wired identically from rows and cards.
      Deliberately not memoized — withGuard must see the current busy
      flag to keep row actions serialized. */
  const handleToggle = (server: McpServerView) => {
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
  }

  const handleDelete = (server: McpServerView) => {
    if (!window.confirm(t('deleteConfirm'))) return
    void withGuard(server.entryId, async () => { await api.deleteServer(server.entryId) })
  }

  const detail = detailId === undefined ? undefined : servers.find(server => server.entryId === detailId)

  return (
    <div className="dshmcp-tab" aria-busy={state.status === 'loading'}>
      {state.status === 'loading'
        ? (
          <div className="dshmcp-skeleton" role="status" aria-label={t('loading')}>
            <div className="dshmcp-skelRow" />
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
            <div className="dshmcp-bar">
              <span className="dshmcp-barLabel">{t('catalog')}</span>
              <span className="dshmcp-count" data-server-count={servers.length}>{servers.length}</span>
              <span className="dshmcp-spacer" />
              <div className="dshmcp-mkt-viewseg" role="group" aria-label={t('installedViewList')}>
                <button
                  type="button"
                  aria-pressed={view === 'list'}
                  title={t('installedViewList')}
                  aria-label={t('installedViewList')}
                  onClick={() => { pickView('list') }}
                >
                  <IconList size={14} />
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'card'}
                  title={t('installedViewCard')}
                  aria-label={t('installedViewCard')}
                  onClick={() => { pickView('card') }}
                >
                  <IconGrid size={14} />
                </button>
              </div>
              <button type="button" className="dshmcp-button dshmcp-buttonIcon" onClick={() => { setRequest(value => value + 1) }} title={t('refresh')} aria-label={t('refresh')}>
                <IconRefreshOutline16 size={14} aria-hidden="true" />
              </button>
              <button type="button" className="dshmcp-button dshmcp-buttonPrimary" onClick={() => { setEditing('add') }}>
                <IconPlusOutline16 size={13} aria-hidden="true" />
                {t('addButton')}
              </button>
            </div>
            {actionError !== undefined ? <p className="dshmcp-callout dshmcp-calloutError" role="alert">{actionError}</p> : null}
            {servers.length === 0
              ? (
                <div className="dshmcp-empty">
                  <span className="dshmcp-emptyTile"><IconApiOutline14 size={20} aria-hidden="true" /></span>
                  <p className="dshmcp-emptyTitle">{t('emptyTitle')}</p>
                  <p>{t('empty')}</p>
                </div>
              )
              : view === 'card'
                ? (
                  <ul className="dshmcp-instCards">
                    {servers.map(server => (
                      <InstalledCard
                        key={server.entryId}
                        t={t}
                        server={server}
                        cache={cache[server.serverName]}
                        autoTesting={autoTesting[server.serverName] === true}
                        busy={busy !== undefined}
                        onToggle={() => { handleToggle(server) }}
                        onDetail={() => { setDetailId(server.entryId) }}
                        onEdit={() => { setEditing(server) }}
                        onDelete={() => { handleDelete(server) }}
                      />
                    ))}
                  </ul>
                )
                : (
                  <ul className="dshmcp-list">
                    {servers.map(server => (
                      <InstalledRow
                        key={server.entryId}
                        t={t}
                        server={server}
                        cache={cache[server.serverName]}
                        autoTesting={autoTesting[server.serverName] === true}
                        busy={busy !== undefined}
                        onToggle={() => { handleToggle(server) }}
                        onDetail={() => { setDetailId(server.entryId) }}
                        onEdit={() => { setEditing(server) }}
                        onDelete={() => { handleDelete(server) }}
                      />
                    ))}
                  </ul>
                )}
          </>
        )
        : null}
      {editing !== undefined
        ? (
          <ModalShell open t={t} onClose={() => { setEditing(undefined) }}>
            <McpEditor
              key={editing === 'add' ? 'new' : editing.entryId}
              t={t}
              api={api}
              original={editing === 'add' ? undefined : editing}
              onSaved={() => { setEditing(undefined); settleRefresh() }}
              onCancel={() => { setEditing(undefined) }}
            />
          </ModalShell>
        )
        : null}
      {detail !== undefined
        ? (
          <ServerDetailModal
            key={detail.entryId}
            t={t}
            server={detail}
            cache={cache[detail.serverName]}
            autoTesting={autoTesting[detail.serverName] === true}
            onClose={() => { setDetailId(undefined) }}
          />
        )
        : null}
    </div>
  )
}

/** Tile icon by transport, shared by the list row and the card. */
function TransportIcon({ transport }: { readonly transport: 'stdio' | 'streamable-http' }): JSX.Element {
  return transport === 'streamable-http' ? <IconRemote size={16} /> : <IconMcp size={16} />
}

/** The enable switch (success-tinted when on), shared by the row and card. */
function EnableSwitch({ t, server, busy, onToggle }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly server: McpServerView
  readonly busy: boolean
  readonly onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!server.disabled}
      aria-label={server.disabled ? t('enableButton') : t('disableButton')}
      title={server.disabled ? t('enableButton') : t('disableButton')}
      className={`dshmcp-switch${server.disabled ? '' : ' is-on'}`}
      disabled={busy}
      onClick={onToggle}
    >
      <span className="dshmcp-switchKnob" />
    </button>
  )
}

/** 详情 / 编辑 / 删除 cluster, shared by the row side and the card foot. */
function RowActions({ t, server, busy, onDetail, onEdit, onDelete }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly server: McpServerView
  readonly busy: boolean
  readonly onDetail: () => void
  readonly onEdit: () => void
  readonly onDelete: () => void
}) {
  return (
    <>
      <button type="button" className="dshmcp-button dshmcp-buttonGhostSm" disabled={busy} onClick={onDetail}>{t('detailButton')}</button>
      <button type="button" className="dshmcp-button dshmcp-buttonGhostSm" disabled={server.config === undefined || busy} onClick={onEdit}>{t('editButton')}</button>
      <button
        type="button"
        className="dshmcp-button dshmcp-buttonGhostSm dshmcp-buttonDanger"
        disabled={!server.removable || busy}
        onClick={onDelete}
        title={server.removable ? undefined : t('notRemovable')}
      >
        <IconTrashOutline16 size={12} aria-hidden="true" />
        {t('deleteButton')}
      </button>
    </>
  )
}

/** Meta fragments shared by the row meta line and the card meta line. */
function metaPartsOf(t: (key: McpManagerLocaleKey) => string, server: McpServerView, cache: CachedTest | undefined): readonly string[] {
  const liveCount = server.tools.length
  const cachedCount = cache?.toolCount ?? cache?.tools.length ?? 0
  const shownCount = liveCount > 0 ? liveCount : cachedCount
  return [
    server.config?.transport === 'streamable-http' ? t('transportHttp') : t('transportStdio'),
    shownCount > 0 ? (shownCount === 1 ? t('toolsCountOne') : t('toolsCountMany').replace('{n}', String(shownCount))) : '',
  ].filter(part => part !== '')
}

function autoTestIndicator(autoTesting: boolean): JSX.Element | null {
  return autoTesting
    ? <IconLoadingOutline16 size={11} className="dshmcp-spin" aria-hidden="true" />
    : null
}

/** Command (stdio) or URL (http) summary, single-line. */
function configSummary(server: McpServerView): string {
  if (server.config === undefined) return ''
  return server.config.transport === 'stdio'
    ? `${server.config.command ?? ''} ${(server.config.args ?? []).join(' ')}`.trim()
    : server.config.url ?? ''
}

/**
 * One compact list row: 32px tile / name + transport & tool-count meta /
 * command-or-url line (flex, ellipsized) / switch + detail, edit, delete.
 */
function InstalledRow({ t, server, cache, autoTesting, busy, onToggle, onDetail, onEdit, onDelete }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly server: McpServerView
  readonly cache: CachedTest | undefined
  readonly autoTesting: boolean
  readonly busy: boolean
  readonly onToggle: () => void
  readonly onDetail: () => void
  readonly onEdit: () => void
  readonly onDelete: () => void
}) {
  const meta = metaPartsOf(t, server, cache)
  const summary = configSummary(server)
  return (
    <li className="dshmcp-instRow">
      <span className="dshmcp-instTile" aria-hidden="true">
        <TransportIcon transport={server.config?.transport === 'streamable-http' ? 'streamable-http' : 'stdio'} />
      </span>
      <span className="dshmcp-instId">
        <span className={`dshmcp-instName${server.disabled ? ' is-muted' : ''}`}>{server.serverName}</span>
        <span className="dshmcp-instMeta">
          {server.disabled ? t('disabledTag') : meta.join(' · ')}
          {autoTestIndicator(autoTesting)}
        </span>
      </span>
      <span className="dshmcp-instDesc" title={summary}>{summary === '' ? '—' : summary}</span>
      <span className="dshmcp-instSide">
        <EnableSwitch t={t} server={server} busy={busy} onToggle={onToggle} />
        <RowActions t={t} server={server} busy={busy} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} />
      </span>
    </li>
  )
}

/**
 * One installed card: 40px plinth + name + status dot with the enable
 * switch in the top-right corner, two-line clamped command/URL, transport
 * · tools · version meta, and a hairline-separated action foot.
 */
function InstalledCard({ t, server, cache, autoTesting, busy, onToggle, onDetail, onEdit, onDelete }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly server: McpServerView
  readonly cache: CachedTest | undefined
  readonly autoTesting: boolean
  readonly busy: boolean
  readonly onToggle: () => void
  readonly onDetail: () => void
  readonly onEdit: () => void
  readonly onDelete: () => void
}) {
  const meta = metaPartsOf(t, server, cache)
  const summary = configSummary(server)
  const version = cache?.serverVersion
  const phase = server.fiberPhase
  return (
    <li className="dshmcp-instCard">
      <div className="dshmcp-instCardHead">
        <span className="dshmcp-instCardTile" aria-hidden="true">
          <TransportIcon transport={server.config?.transport === 'streamable-http' ? 'streamable-http' : 'stdio'} />
        </span>
        <span className="dshmcp-instCardId">
          <span className="dshmcp-instCardNameLine">
            <span className={`dshmcp-instName${server.disabled ? ' is-muted' : ''}`}>{server.serverName}</span>
            {server.disabled
              ? <span className="dshmcp-statusDot" data-phase="disabled" aria-hidden="true" />
              : <span className="dshmcp-statusDot" data-phase={phase ?? 'unobserved'} role="img" aria-label={phaseLabel(t, phase)} title={phaseLabel(t, phase)} />}
          </span>
          <span className="dshmcp-instMeta">
            {server.disabled ? t('disabledTag') : meta.join(' · ')}
            {version !== undefined ? ` · v${version}` : ''}
            {autoTestIndicator(autoTesting)}
          </span>
        </span>
        <EnableSwitch t={t} server={server} busy={busy} onToggle={onToggle} />
      </div>
      <p className="dshmcp-instCardDesc" title={summary}>{summary === '' ? '—' : summary}</p>
      <div className="dshmcp-instCardFoot">
        <RowActions t={t} server={server} busy={busy} onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </li>
  )
}

/**
 * Read-only 详情 dialog: grouped basic-info rows (name, transport,
 * command, env count, version, patch layer …) plus a grouped tool list
 * (name + one-line description). Shares the modal shell with the editor.
 */
function ServerDetailModal({ t, server, cache, autoTesting, onClose }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly server: McpServerView
  readonly cache: CachedTest | undefined
  readonly autoTesting: boolean
  readonly onClose: () => void
}) {
  const phase = server.fiberPhase
  const liveCount = server.tools.length
  const cachedCount = cache?.toolCount ?? cache?.tools.length ?? 0
  const shownCount = liveCount > 0 ? liveCount : cachedCount
  const toolRows = liveCount > 0
    ? server.tools.map(tool => ({ name: tool.publicName, description: tool.description }))
    : cache !== undefined && cache.ok ? cachedToolsToRows(cache.tools) : []
  const envCount = Object.keys(server.config?.env ?? {}).length
  const version = cache?.serverVersion
  return (
    <ModalShell
      open
      t={t}
      size="lg"
      title={server.serverName}
      onClose={onClose}
      footer={<button type="button" className="dshmcp-button dshmcp-buttonPrimary" onClick={onClose}>{t('drawerClose')}</button>}
    >
      {server.config === undefined ? <p className="dshmcp-status">{t('notRemovable')}</p> : null}
      <div className="dshmcp-block">
        <div className="dshmcp-blockHead">
          <span className="dshmcp-label">{t('basicInfo')}</span>
        </div>
        <dl className="dshmcp-fields">
          <div><dt>{t('fieldTransport')}</dt><dd>{server.config?.transport === 'streamable-http' ? t('transportHttp') : t('transportStdio')}</dd></div>
          <div><dt>{t('detailStatus')}</dt><dd>{server.disabled ? t('disabledTag') : phaseLabel(t, phase)}</dd></div>
          {server.config?.command !== undefined ? <div><dt>{t('detailCommand')}</dt><dd className="dshmcp-path">{server.config.command}</dd></div> : null}
          {server.config?.args !== undefined && server.config.args.length > 0 ? <div><dt>{t('detailArgs')}</dt><dd className="dshmcp-path">{server.config.args.join(' ')}</dd></div> : null}
          {server.config?.url !== undefined ? <div><dt>{t('detailUrl')}</dt><dd className="dshmcp-path">{server.config.url}</dd></div> : null}
          <div><dt>{t('detailEnv')}</dt><dd>{t('detailEnvCount').replace('{n}', String(envCount))}</dd></div>
          {version !== undefined ? <div><dt>{t('detailVersion')}</dt><dd className="dshmcp-path">v{version}</dd></div> : null}
          <div><dt>{t('detailEntryId')}</dt><dd className="dshmcp-path">{server.entryId}</dd></div>
          <div><dt>{t('detailOrigin')}</dt><dd>{originLabel(t, server.origin)}</dd></div>
          {server.config?.toolCallTimeoutMs !== undefined ? <div><dt>{t('detailTimeout')}</dt><dd>{server.config.toolCallTimeoutMs} ms</dd></div> : null}
          {server.config?.reconnect !== undefined ? <div><dt>{t('detailReconnect')}</dt><dd>{server.config.reconnect.enabled === false ? '✕' : '✓'}</dd></div> : null}
          {server.config?.failOnStartupError === true ? <div><dt>{t('detailStartup')}</dt><dd>✓</dd></div> : null}
          {server.hasExpressions ? <div><dt /><dd><IconWarningOutline16 size={12} aria-hidden="true" /> {t('exprLocked')}</dd></div> : null}
        </dl>
      </div>
      <div className="dshmcp-block">
        <div className="dshmcp-blockHead">
          <span className="dshmcp-label">{t('toolsHeading')}</span>
          {shownCount > 0 ? <span className="dshmcp-count">{shownCount}</span> : null}
          {autoTesting ? <span className="dshmcp-toolsMeta dshmcp-autoTest"><IconLoadingOutline16 size={11} className="dshmcp-spin" aria-hidden="true" />{t('autoTesting')}</span> : null}
        </div>
        {toolRows.length > 0
          ? (
            <ul className="dshmcp-detailTools">
              {toolRows.map(tool => (
                <li key={tool.name}>
                  <span className="dshmcp-detailToolName">{tool.name}</span>
                  {tool.description.trim() !== '' ? <span className="dshmcp-detailToolDesc" title={tool.description}>{tool.description}</span> : null}
                </li>
              ))}
            </ul>
          )
          : <p className="dshmcp-status">{t('toolNone')}</p>}
      </div>
    </ModalShell>
  )
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
