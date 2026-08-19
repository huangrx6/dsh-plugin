import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconPlusOutline16, IconRefreshOutline16, IconSearchOutline16, IconSkillOutline16, IconTrashOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SkillListItem } from '../contracts.ts'
import type { SkillManagerApi } from './api.ts'
import type { SkillManagerLocaleKey } from './locales.ts'
import { SkillDetailModal } from './SkillDetailModal.tsx'
import { SkillImportView } from './SkillImportView.tsx'
import { IconGrid, IconList } from './market/icons.tsx'
import { hueStyle } from './market/hue.ts'
import { loadInstalledView, saveInstalledView, type InstalledViewMode } from './installed-view.ts'
import { LIST_PAGE, slicePage } from './paging.ts'

export interface SkillManagerSectionProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly api: SkillManagerApi
}

type View = { kind: 'browse' } | { kind: 'import' }

interface DetailTarget {
  readonly name: string
  readonly path?: string | undefined
}

interface ListState {
  readonly status: 'loading' | 'error' | 'ready'
  readonly skills?: readonly SkillListItem[]
}

/** Installed-skills catalog: one full-width toolbar (dense search, refresh,
 *  import, list⇄cards toggle persisted under its own storage key) over
 *  either a grouped row list or a card grid. "详情" opens the detail modal
 *  (file tree + live preview + metadata); delete stays on the rows / cards
 *  and only shows for managed copies, behind a confirm. */
export function SkillManagerSection({ t, api }: SkillManagerSectionProps) {
  const [view, setView] = useState<View>({ kind: 'browse' })
  const [request, setRequest] = useState(0)
  const [query, setQuery] = useState('')
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [viewMode, setViewMode] = useState<InstalledViewMode>(() =>
    typeof window === 'undefined' ? 'list' : loadInstalledView(window.localStorage),
  )
  const [detail, setDetail] = useState<DetailTarget | undefined>(undefined)
  const [deletingKey, setDeletingKey] = useState<string | undefined>(undefined)
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined)

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setRequest(value => value + 1)
  }, [])

  useEffect(() => {
    let current = true
    Promise.resolve()
      .then(() => api.list())
      .then(skills => { if (current) setState({ status: 'ready', skills }) })
      .catch(() => { if (current) setState({ status: 'error' }) })
    return () => { current = false }
  }, [api, request])

  const pickViewMode = useCallback((next: InstalledViewMode) => {
    setViewMode(next)
    if (typeof window !== 'undefined') saveInstalledView(window.localStorage, next)
  }, [])

  const openDetail = useCallback((skill: SkillListItem) => {
    setDetail({ name: skill.name, path: skill.path })
  }, [])

  const handleDelete = useCallback(async (skill: SkillListItem) => {
    if (skill.path === undefined) return
    if (!window.confirm(t('deleteConfirm'))) return
    const key = `${skill.source}:${skill.name}`
    setDeletingKey(key)
    setDeleteError(undefined)
    try {
      await api.deleteSkill(skill.path)
      if (detail?.name === skill.name) setDetail(undefined)
      reload()
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : String(error))
    } finally {
      setDeletingKey(undefined)
    }
  }, [api, t, detail, reload])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const skills = state.status === 'ready' && state.skills !== undefined ? state.skills : []
  const filtered = useMemo(() => {
    if (normalizedQuery === '') return [...skills]
    return skills.filter(skill =>
      skill.name.toLocaleLowerCase().includes(normalizedQuery)
      || skill.description.toLocaleLowerCase().includes(normalizedQuery))
  }, [normalizedQuery, skills])

  // Batched rendering state: huge catalogs never mount thousands of rows
  // / cards at once — the first LIST_PAGE render, then an intersection
  // sentinel loads the next batch as the user scrolls (button fallback).
  // Search / reload / view switch reset to the first page (the installed ⇄
  // market mode switch unmounts this section, resetting it naturally).
  const [visibleCount, setVisibleCount] = useState(LIST_PAGE)
  useEffect(() => { setVisibleCount(LIST_PAGE) }, [filtered, viewMode])
  const visible = slicePage(filtered, visibleCount)
  const hasMore = visibleCount < filtered.length
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (node === null || !hasMore || typeof IntersectionObserver !== 'function') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisibleCount(count => count + LIST_PAGE)
      }
    }, { root: null, rootMargin: '300px' })
    observer.observe(node)
    return () => { observer.disconnect() }
  }, [hasMore, visibleCount, filtered.length])

  return (
    <div className="dshm-tab dshm-inst" aria-busy={state.status === 'loading'}>
      {state.status === 'error'
        ? (
          <div className="dshm-failure" role="alert">
            <p>{t('error')}</p>
            <button type="button" onClick={reload}>{t('retry')}</button>
          </div>
        )
        : null}
      {deleteError !== undefined
        ? <div className="dshm-failure" role="alert"><p>{t('deleteFailed')}：{deleteError}</p></div>
        : null}
      <div className="dshm-instToolbar">
        <label className="dshm-search dshm-searchDense">
          <IconSearchOutline16 size={13} aria-hidden="true" />
          <span className="dshm-visuallyHidden">{t('search')}</span>
          <input type="search" value={query} placeholder={t('search')} onChange={event => { setQuery(event.currentTarget.value) }} />
        </label>
        <button type="button" className="dshm-iconBtn" onClick={reload} title={t('refresh')} aria-label={t('refresh')}>
          <IconRefreshOutline16 size={14} aria-hidden="true" />
        </button>
        <button type="button" className="dshm-iconBtn is-primary" onClick={() => { setView({ kind: 'import' }) }} title={t('importButton')} aria-label={t('importButton')}>
          <IconPlusOutline16 size={14} aria-hidden="true" />
        </button>
        {view.kind === 'browse'
          ? (
            <div
              className="dshm-mkt-viewseg"
              role="group"
              aria-label={t('installedViewList') + ' / ' + t('installedViewCards')}
            >
              <button
                type="button"
                aria-pressed={viewMode === 'list'}
                onClick={() => { pickViewMode('list') }}
                title={t('installedViewList')}
                aria-label={t('installedViewList')}
              >
                <IconList size={14} />
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'cards'}
                onClick={() => { pickViewMode('cards') }}
                title={t('installedViewCards')}
                aria-label={t('installedViewCards')}
              >
                <IconGrid size={14} />
              </button>
            </div>
          )
          : null}
      </div>
      {view.kind === 'import'
        ? (
          <div className="dshm-instImport">
            <SkillImportView
              t={t}
              api={api}
              onDone={importedName => {
                reload()
                setView({ kind: 'browse' })
                if (importedName !== undefined) {
                  const installed = skills.find(skill => skill.name === importedName)
                  setDetail({ name: importedName, path: installed?.path })
                }
              }}
              onCancel={() => { setView({ kind: 'browse' }) }}
            />
          </div>
        )
        : (
          <>
            <div className="dshm-instHead">
              <span className="dshm-sectionLabel">{t('catalog')}</span>
              <span className="dshm-instCount" data-skill-count={filtered.length}>{filtered.length}</span>
            </div>
            {state.status === 'loading'
              ? (
                <div className="dshm-skeleton" role="status" aria-label={t('loading')}>
                  <div className="dshm-skelRow" />
                  <div className="dshm-skelRow" />
                  <div className="dshm-skelRow" />
                  <div className="dshm-skelRow" />
                  <div className="dshm-skelRow" />
                </div>
              )
              : null}
            {state.status === 'ready'
              ? (
                <>
                  {skills.length === 0
                    ? (
                      <div className="dshm-empty dshm-emptyDense">
                        <span className="dshm-emptyTile"><IconSkillOutline16 size={20} aria-hidden="true" /></span>
                        <p className="dshm-emptyTitle">{t('emptyTitle')}</p>
                        <p>{t('empty')}</p>
                      </div>
                    )
                    : null}
                  {skills.length > 0 && filtered.length === 0 ? <p className="dshm-status">{t('emptySearch')}</p> : null}
                  {filtered.length > 0 && viewMode === 'list'
                    ? (
                      <ul className="dshm-instList">
                        {visible.map(skill => (
                          <InstalledRow
                            key={`${skill.source}:${skill.name}`}
                            t={t}
                            skill={skill}
                            busy={deletingKey === `${skill.source}:${skill.name}`}
                            onOpen={openDetail}
                            onDelete={handleDelete}
                          />
                        ))}
                      </ul>
                    )
                    : null}
                  {filtered.length > 0 && viewMode === 'cards'
                    ? (
                      <ul className="dshm-instCards">
                        {visible.map(skill => (
                          <InstalledCard
                            key={`${skill.source}:${skill.name}`}
                            t={t}
                            skill={skill}
                            busy={deletingKey === `${skill.source}:${skill.name}`}
                            onOpen={openDetail}
                            onDelete={handleDelete}
                          />
                        ))}
                      </ul>
                    )
                    : null}
                  {hasMore
                    ? (
                      <div ref={sentinelRef} className="dshm-more">
                        <button
                          type="button"
                          className="dshm-moreBtn"
                          onClick={() => { setVisibleCount(count => count + LIST_PAGE) }}
                        >
                          {t('showMore')} · {visibleCount}/{filtered.length}
                        </button>
                      </div>
                    )
                    : null}
                </>
              )
              : null}
          </>
        )}
      {detail !== undefined
        ? (
          <SkillDetailModal
            t={t}
            api={api}
            name={detail.name}
            path={detail.path}
            onClose={() => { setDetail(undefined) }}
          />
        )
        : null}
    </div>
  )
}

interface InstalledRowProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly skill: SkillListItem
  readonly busy: boolean
  readonly onOpen: (skill: SkillListItem) => void
  readonly onDelete: (skill: SkillListItem) => Promise<void>
}

/** One compact row: 32px tile, name + source / flag meta, single-line
 *  description, detail + delete (managed only) on the right. */
function InstalledRow({ t, skill, busy, onOpen, onDelete }: InstalledRowProps) {
  const tileClass = skill.invalid !== undefined ? ' is-error' : skill.shadowed ? ' is-warn' : ''
  const removable = skill.managed && skill.path !== undefined
  return (
    <li className="dshm-instRow" data-skill={skill.name}>
      <button type="button" className="dshm-instRowMain" onClick={() => { onOpen(skill) }}>
        <span className={`dshm-tile${tileClass}`} aria-hidden="true">
          <IconSkillOutline16 size={15} />
        </span>
        <span className="dshm-instRowId">
          <span className="dshm-instRowName">{skill.name}</span>
          <span className="dshm-instRowMeta">
            {skill.shadowed ? <span className="dshm-instFlag is-warn">{t('shadowedTag')}</span> : null}
            {skill.invalid !== undefined ? <span className="dshm-instFlag is-error">{t('invalidTag')}</span> : null}
            {sourceLabel(t, skill.source)}
          </span>
        </span>
        <span className="dshm-instRowDesc">{skill.description}</span>
      </button>
      <div className="dshm-instRowSide">
        <button type="button" className="dshm-mkt-btn" onClick={() => { onOpen(skill) }} disabled={busy}>
          {t('installedDetail')}
        </button>
        {removable
          ? (
            <button
              type="button"
              className="dshm-mkt-iconBtn is-danger"
              onClick={() => { void onDelete(skill) }}
              disabled={busy}
              title={t('deleteButton')}
              aria-label={`${t('deleteButton')}: ${skill.name}`}
            >
              <IconTrashOutline16 size={14} aria-hidden="true" />
            </button>
          )
          : null}
      </div>
    </li>
  )
}

interface InstalledCardProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly skill: SkillListItem
  readonly busy: boolean
  readonly onOpen: (skill: SkillListItem) => void
  readonly onDelete: (skill: SkillListItem) => Promise<void>
}

/** One installed card: 46px hue-keyed gradient tile (the skill's name
 *  hashed to one stable hue) + name + version capsule head, two-line
 *  description, status capsules (rank / shadowed / invalid) + provider /
 *  path meta, and a hairline bottom action bar (detail + delete for
 *  managed copies). Cards carry the catalog's only texture — a lit
 *  surface with a soft ambient shadow; hover brightens the border and
 *  deepens the shadow only (rows stay quiet). */
function InstalledCard({ t, skill, busy, onOpen, onDelete }: InstalledCardProps) {
  const tileClass = skill.invalid !== undefined ? ' is-error' : skill.shadowed ? ' is-warn' : ''
  const removable = skill.managed && skill.path !== undefined
  return (
    <li className="dshm-instCard" data-skill={skill.name} style={hueStyle(skill.name)}>
      <button type="button" className="dshm-instCardHead" onClick={() => { onOpen(skill) }}>
        <span className={`dshm-tile dshm-instCardTile${tileClass}`} aria-hidden="true">
          <IconSkillOutline16 size={20} />
        </span>
        <span className="dshm-instCardId">
          <span className="dshm-instCardNameRow">
            <span className="dshm-instCardName">{skill.name}</span>
            {skill.version !== undefined ? <span className="dshm-instCardVer">v{skill.version}</span> : null}
          </span>
          <span className="dshm-instCardMeta">{sourceLabel(t, skill.source)}</span>
        </span>
      </button>
      <p className="dshm-instCardDesc">{skill.description}</p>
      <div className="dshm-instCardInfo">
        {skill.shadowed ? <span className="dshm-instFlag is-warn">{t('shadowedTag')}</span> : null}
        {skill.invalid !== undefined ? <span className="dshm-instFlag is-error">{t('invalidTag')}</span> : null}
        {skill.rank !== undefined ? <span className="dshm-instFlag is-rank">{`rank ${skill.rank}`}</span> : null}
        <span>{skill.provider}</span>
        {skill.path !== undefined ? <span title={skill.path}>{shortPath(skill.path)}</span> : null}
      </div>
      <div className="dshm-instCardBar">
        <span className="dshm-instCardBarMeta">
          {skill.invocation.modelInvocable ? t('tagModelOn') : t('tagModelOff')}
        </span>
        <span className="dshm-instCardBarActions">
          <button type="button" className="dshm-mkt-btn" onClick={() => { onOpen(skill) }} disabled={busy}>
            {t('installedDetail')}
          </button>
          {removable
            ? (
              <button
                type="button"
                className="dshm-mkt-btn is-danger"
                onClick={() => { void onDelete(skill) }}
                disabled={busy}
                title={t('deleteButton')}
              >
                {busy ? t('deleting') : t('deleteButton')}
              </button>
            )
            : null}
        </span>
      </div>
    </li>
  )
}

/** Tail-only path abbreviation for card meta lines. */
function shortPath(path: string): string {
  const parts = path.split('/')
  if (parts.length <= 3) return path
  return `…/${parts.slice(-3).join('/')}`
}

export function sourceLabel(t: (key: SkillManagerLocaleKey) => string, source: string): string {
  switch (source) {
    case 'project-dsh': return t('sourceProjectDsh')
    case 'project-agents': return t('sourceProjectAgents')
    case 'user-dsh': return t('sourceUserDsh')
    case 'user-agents': return t('sourceUserAgents')
    case 'custom': return t('sourceCustom')
    case 'bundled': return t('sourceBundled')
    case 'runtime': return t('sourceRuntime')
    default: return source
  }
}
