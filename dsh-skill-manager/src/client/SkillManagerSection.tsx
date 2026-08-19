import { useEffect, useMemo, useState } from 'react'
import { IconPlusOutline16, IconRefreshOutline16, IconSearchOutline16, IconSkillOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SkillListItem } from '../contracts.ts'
import type { SkillManagerApi } from './api.ts'
import type { SkillManagerLocaleKey } from './locales.ts'
import { SkillDetailView } from './SkillDetailView.tsx'
import { SkillImportView } from './SkillImportView.tsx'

export interface SkillManagerSectionProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly api: SkillManagerApi
}

type View = { kind: 'list' } | { kind: 'detail'; name: string; path?: string | undefined } | { kind: 'import' }

interface ListState {
  readonly status: 'loading' | 'error' | 'ready'
  readonly skills?: readonly SkillListItem[]
}

/** Master-detail settings section: compact skill list on the left (280px),
 *  detail / import panel on the right; collapses to one column under 768px.
 *  The workspace shell already renders the section title, so the block
 *  itself only carries 11px section labels. */
export function SkillManagerSection({ t, api }: SkillManagerSectionProps) {
  const [view, setView] = useState<View>({ kind: 'list' })
  const [request, setRequest] = useState(0)
  const [query, setQuery] = useState('')
  const [state, setState] = useState<ListState>({ status: 'loading' })

  const reload = () => {
    setState({ status: 'loading' })
    setRequest(value => value + 1)
  }

  useEffect(() => {
    let current = true
    Promise.resolve()
      .then(() => api.list())
      .then(skills => { if (current) setState({ status: 'ready', skills }) })
      .catch(() => { if (current) setState({ status: 'error' }) })
    return () => { current = false }
  }, [api, request])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const skills = state.status === 'ready' && state.skills !== undefined ? state.skills : []
  const filtered = useMemo(() => {
    if (normalizedQuery === '') return [...skills]
    return skills.filter(skill =>
      skill.name.toLocaleLowerCase().includes(normalizedQuery)
      || skill.description.toLocaleLowerCase().includes(normalizedQuery))
  }, [normalizedQuery, skills])

  return (
    <div className="dshm-tab dshm-manager" aria-busy={state.status === 'loading'}>
      {state.status === 'error'
        ? (
          <div className="dshm-failure" role="alert">
            <p>{t('error')}</p>
            <button type="button" onClick={reload}>{t('retry')}</button>
          </div>
        )
        : null}
      <div className="dshm-managerGrid">
        <aside className="dshm-managerMaster">
          <div className="dshm-managerBar">
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
          </div>
          <div className="dshm-managerLabelRow">
            <span className="dshm-sectionLabel">{t('catalog')}</span>
            <span className="dshm-managerCount" data-skill-count={filtered.length}>{filtered.length}</span>
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
                {filtered.length > 0
                  ? (
                    <ul className="dshm-managerList">
                      {filtered.map(skill => {
                        const selected = view.kind === 'detail' && view.name === skill.name
                        return (
                          <li
                            key={`${skill.source}:${skill.name}`}
                            className={`dshm-managerRow${selected ? ' is-selected' : ''}`}
                            data-skill={skill.name}
                          >
                            <button type="button" className="dshm-managerRowBtn" aria-current={selected ? 'true' : undefined} onClick={() => { setView({ kind: 'detail', name: skill.name, path: skill.path }) }}>
                              <span className={`dshm-tile dshm-managerTile${skill.invalid !== undefined ? ' is-error' : skill.shadowed ? ' is-warn' : ''}`}>
                                <IconSkillOutline16 size={15} aria-hidden="true" />
                              </span>
                              <span className="dshm-managerRowBody">
                                <span className="dshm-managerRowName">{skill.name}</span>
                                <span className="dshm-managerRowMeta">
                                  {skill.shadowed ? <span className="dshm-managerFlag is-warn">{t('shadowedTag')}</span> : null}
                                  {skill.invalid !== undefined ? <span className="dshm-managerFlag is-error">{t('invalidTag')}</span> : null}
                                  {sourceLabel(t, skill.source)}
                                </span>
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )
                  : null}
              </>
            )
            : null}
        </aside>
        <section className="dshm-managerDetail">
          {view.kind === 'detail'
            ? <SkillDetailView t={t} api={api} name={view.name} path={view.path} onBack={() => { setView({ kind: 'list' }) }} onDeleted={reload} />
            : view.kind === 'import'
              ? <SkillImportView t={t} api={api} onDone={importedName => { reload(); setView(importedName !== undefined ? { kind: 'detail', name: importedName } : { kind: 'list' }) }} onCancel={() => { setView({ kind: 'list' }) }} />
              : (
                <div className="dshm-managerHint">
                  <span className="dshm-tile dshm-managerHintTile"><IconSkillOutline16 size={18} aria-hidden="true" /></span>
                  <p>{t('selectHint')}</p>
                </div>
              )}
        </section>
      </div>
    </div>
  )
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
