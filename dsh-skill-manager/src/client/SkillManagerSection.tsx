import { useEffect, useMemo, useState } from 'react'
import { IconChevronRightOutline14, IconPlusOutline16, IconRefreshOutline16, IconSearchOutline16, IconSkillOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
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

/** Independent settings section: skill catalog with search, import and detail views. */
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

  if (view.kind === 'detail') {
    return <SkillDetailView t={t} api={api} name={view.name} path={view.path} onBack={() => setView({ kind: 'list' })} onDeleted={reload} />
  }
  if (view.kind === 'import') {
    return <SkillImportView t={t} api={api} onDone={importedName => { reload(); setView(importedName !== undefined ? { kind: 'detail', name: importedName } : { kind: 'list' }) }} onCancel={() => { setView({ kind: 'list' }) }} />
  }

  return (
    <div className="dshm-tab" aria-busy={state.status === 'loading'}>
      <header className="dshm-head">
        <h2>{t('tab')}</h2>
        <p>{t('intro')}</p>
      </header>
      {state.status === 'loading'
        ? (
          <div className="dshm-skeleton" role="status" aria-label={t('loading')}>
            <div className="dshm-skelRow" />
            <div className="dshm-skelRow" />
            <div className="dshm-skelRow" />
          </div>
        )
        : null}
      {state.status === 'error'
        ? (
          <div className="dshm-failure" role="alert">
            <p>{t('error')}</p>
            <button type="button" onClick={reload}>{t('retry')}</button>
          </div>
        )
        : null}
      {state.status === 'ready'
        ? (
          <>
            <div className="dshm-toolbar">
              <label className="dshm-search">
                <IconSearchOutline16 size={15} aria-hidden="true" />
                <span className="dshm-visuallyHidden">{t('search')}</span>
                <input type="search" value={query} placeholder={t('search')} onChange={event => { setQuery(event.currentTarget.value) }} />
              </label>
              <button type="button" className="dshm-button dshm-buttonIcon" onClick={reload} title={t('refresh')} aria-label={t('refresh')}>
                <IconRefreshOutline16 size={15} aria-hidden="true" />
              </button>
            </div>
            <div className="dshm-heading">
              <h3>{t('catalog')}</h3>
              <span className="dshm-count" data-skill-count={filtered.length}>{filtered.length}</span>
              <span className="dshm-spacer" />
              <button type="button" className="dshm-button dshm-buttonPrimary" onClick={() => { setView({ kind: 'import' }) }}>
                <IconPlusOutline16 size={14} aria-hidden="true" />
                {t('importButton')}
              </button>
            </div>
            {skills.length === 0
              ? (
                <div className="dshm-empty">
                  <span className="dshm-emptyTile"><IconSkillOutline16 size={22} aria-hidden="true" /></span>
                  <p className="dshm-emptyTitle">{t('emptyTitle')}</p>
                  <p>{t('empty')}</p>
                </div>
              )
              : null}
            {skills.length > 0 && filtered.length === 0 ? <p className="dshm-status">{t('emptySearch')}</p> : null}
            {filtered.length > 0
              ? (
                <ul className="dshm-cards">
                  {filtered.map(skill => (
                    <li key={`${skill.source}:${skill.name}`} className="dshm-card" data-skill={skill.name}>
                      <button type="button" className="dshm-cardContent" onClick={() => { setView({ kind: 'detail', name: skill.name, path: skill.path }) }}>
                        <span className={`dshm-tile ${skill.invalid !== undefined ? 'dshm-tileError' : skill.shadowed ? 'dshm-tileWarn' : ''}`}>
                          <IconSkillOutline16 size={17} aria-hidden="true" />
                        </span>
                        <span className="dshm-cardBody">
                          <span className="dshm-cardTitle">{skill.name}</span>
                          <span className="dshm-cardDesc">{skill.invalid !== undefined ? skill.invalid : skill.description}</span>
                        </span>
                        <span className="dshm-cardTrailing">
                          {skill.shadowed ? <span className="dshm-tag dshm-tagWarn">{t('shadowedTag')}</span> : null}
                          {skill.invalid !== undefined ? <span className="dshm-tag dshm-tagError">{t('invalidTag')}</span> : null}
                          <span className="dshm-tag">{sourceLabel(t, skill.source)}</span>
                          <IconChevronRightOutline14 size={12} aria-hidden="true" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
              : null}
          </>
        )
        : null}
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
