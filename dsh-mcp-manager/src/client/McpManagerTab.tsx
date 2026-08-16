import { useCallback, useEffect, useState } from 'react'
import { IconApiOutline14, IconChevronDownOutline14, IconPlayOutline16, IconPlusOutline16, IconRefreshOutline16, IconTrashOutline16, IconWarningOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { JsonTree } from '@deepseek-ai/dsh-client-ui-primitives'
import type { McpListResponse, McpServerView, McpTestResponse } from '../contracts.ts'
import type { McpManagerApi } from './api.ts'
import type { McpManagerLocaleKey } from './locales.ts'
import { McpEditor, TestResult } from './McpEditor.tsx'

export interface McpManagerTabProps {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly api: McpManagerApi
}

interface ListState {
  readonly status: 'loading' | 'error' | 'ready'
  readonly data?: McpListResponse
  readonly error?: string
}

/** Plugins-settings tab: MCP server cards with live status, tools and actions. */
export function McpManagerTab({ t, api }: McpManagerTabProps) {
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [request, setRequest] = useState(0)
  const [expanded, setExpanded] = useState<string | undefined>(undefined)
  const [editing, setEditing] = useState<McpServerView | undefined | 'add'>(undefined)
  const [busy, setBusy] = useState<string | undefined>(undefined)
  const [actionError, setActionError] = useState<string | undefined>(undefined)
  const [cardTest, setCardTest] = useState<{ entryId: string; result: McpTestResponse } | undefined>(undefined)

  const load = useCallback(() => {
    Promise.resolve()
      .then(() => api.list())
      .then(data => { setState({ status: 'ready', data }) })
      .catch(error => { setState({ status: 'error', error: error instanceof Error ? error.message : String(error) }) })
  }, [api])

  useEffect(() => { load() }, [load, request])

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

  const servers = state.status === 'ready' && state.data !== undefined ? state.data.servers : []

  return (
    <div className="dshmcp-tab" aria-busy={state.status === 'loading'}>
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
                  cardTest={cardTest !== undefined && cardTest.entryId === server.entryId ? cardTest.result : undefined}
                  onToggleOpen={() => { setExpanded(current => current === server.entryId ? undefined : server.entryId) }}
                  onEdit={() => { setEditing(server) }}
                  onToggle={() => { void withGuard(server.entryId, async () => { await api.toggle(server.entryId, !server.disabled) }) }}
                  onDelete={() => {
                    if (!window.confirm(t('deleteConfirm'))) return
                    void withGuard(server.entryId, async () => { await api.deleteServer(server.entryId) })
                  }}
                  onTest={async () => {
                    if (server.config === undefined) return
                    setBusy(`${server.entryId}:test`)
                    try {
                      const result = await api.test(server.config)
                      setCardTest({ entryId: server.entryId, result })
                    } catch (error) {
                      setCardTest({ entryId: server.entryId, result: { ok: false, durationMs: 0, error: error instanceof Error ? error.message : String(error) } })
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

function ServerCard({ t, server, open, busy, cardTest, onToggleOpen, onEdit, onToggle, onDelete, onTest }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly server: McpServerView
  readonly open: boolean
  readonly busy: string | undefined
  readonly cardTest: McpTestResponse | undefined
  readonly onToggleOpen: () => void
  readonly onEdit: () => void
  readonly onToggle: () => void
  readonly onDelete: () => void
  readonly onTest: () => Promise<void>
}) {
  const [openTool, setOpenTool] = useState<string | undefined>(undefined)
  const phase = server.fiberPhase
  const summary = server.config === undefined
    ? '—'
    : server.config.transport === 'stdio'
      ? `${server.config.command ?? ''} ${(server.config.args ?? []).join(' ')}`.trim()
      : server.config.url ?? ''
  const toolsLabel = server.tools.length === 1 ? t('toolsCountOne') : t('toolsCountMany').replace('{n}', String(server.tools.length))
  const unhealthy = phase === 'failed'
  return (
    <li className="dshmcp-card" data-server={server.serverName} data-open={open ? 'true' : undefined}>
      <button type="button" className="dshmcp-cardContent" aria-expanded={open} onClick={onToggleOpen}>
        <span className={`dshmcp-tile ${server.disabled ? 'dshmcp-tileMuted' : unhealthy ? 'dshmcp-tileError' : ''}`}>
          <IconApiOutline14 size={17} aria-hidden="true" />
        </span>
        <span className="dshmcp-cardBody">
          <span className="dshmcp-cardTitle">{server.serverName}</span>
          <span className="dshmcp-summary">{server.config?.transport === 'streamable-http' ? `${t('transportHttp')} · ${summary}` : `${t('transportStdio')} · ${summary}`}</span>
        </span>
        <span className="dshmcp-cardTrailing">
          {!server.disabled && server.tools.length > 0 ? <span className="dshmcp-tag dshmcp-tagCode">{toolsLabel}</span> : null}
          {!server.disabled ? <span className="dshmcp-statusDot" data-phase={phase ?? 'unobserved'} role="img" aria-label={phaseLabel(t, phase)} title={phaseLabel(t, phase)} /> : null}
          <span className={`dshmcp-tag ${server.disabled ? 'dshmcp-tagWarn' : 'dshmcp-tagOk'}`}>{server.disabled ? t('disabledTag') : t('enabledTag')}</span>
          <IconChevronDownOutline14 size={12} aria-hidden="true" />
        </span>
      </button>
      {open
        ? (
          <div className="dshmcp-cardDetails">
            {server.config === undefined ? <p className="dshmcp-status">{t('notRemovable')}</p> : null}
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
              <button type="button" className="dshmcp-button" disabled={busy !== undefined} onClick={onToggle}>{server.disabled ? t('enableButton') : t('disableButton')}</button>
              <button type="button" className="dshmcp-button" disabled={server.config === undefined || busy !== undefined} onClick={() => { void onTest() }}>
                <IconPlayOutline16 size={14} aria-hidden="true" />
                {busy === `${server.entryId}:test` ? t('testRunning') : t('testButton')}
              </button>
              <span className="dshmcp-spacer" />
              <button type="button" className="dshmcp-button dshmcp-buttonDanger" disabled={!server.removable || busy !== undefined} onClick={onDelete} title={server.removable ? undefined : t('notRemovable')}>
                <IconTrashOutline16 size={14} aria-hidden="true" />
                {t('deleteButton')}
              </button>
            </div>
            {cardTest !== undefined ? <TestResult t={t} result={cardTest} /> : null}
            <div>
              <h4 className="dshmcp-toolBodyLabel">{t('toolsHeading')} · {toolsLabel}</h4>
              {server.tools.length === 0
                ? <p className="dshmcp-status">{t('toolNone')}</p>
                : (
                  <ul className="dshmcp-toolList">
                    {server.tools.map(tool => (
                      <li key={tool.publicName} className="dshmcp-tool">
                        <button type="button" className="dshmcp-toolHead" aria-expanded={openTool === tool.publicName} onClick={() => { setOpenTool(current => current === tool.publicName ? undefined : tool.publicName) }}>
                          <span className="dshmcp-toolName">{tool.publicName}</span>
                          <span className="dshmcp-toolDesc">{tool.description}</span>
                        </button>
                        {openTool === tool.publicName
                          ? (
                            <div className="dshmcp-toolBody">
                              <span className="dshmcp-toolBodyLabel">{t('toolParameters')}</span>
                              <JsonTree data={tool.parameters} label={tool.publicName} copyable expandTopLevel />
                            </div>
                          )
                          : null}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>
        )
        : null}
    </li>
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
