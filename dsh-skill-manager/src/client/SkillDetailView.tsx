import { useEffect, useRef, useState } from 'react'
import { IconChevronLeftOutline14, IconSkillOutline16, IconTrashOutline16, IconWarningOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { JsonTree, MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SkillDetail } from '../contracts.ts'
import type { SkillManagerApi } from './api.ts'
import type { SkillManagerLocaleKey } from './locales.ts'
import { sourceLabel } from './SkillManagerTab.tsx'
import { SkillFilePreview } from './SkillFilePreview.tsx'
import { SkillFileTree } from './SkillFileTree.tsx'

export interface SkillDetailViewProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly api: SkillManagerApi
  readonly name: string
  readonly path?: string | undefined
  readonly onBack: () => void
  readonly onDeleted: () => void
}

interface DetailState {
  readonly status: 'loading' | 'error' | 'ready'
  readonly detail?: SkillDetail
}

/** Full-page skill detail: frontmatter, invocation policy, files, rendered body. */
export function SkillDetailView({ t, api, name, path, onBack, onDeleted }: SkillDetailViewProps) {
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined)
  const [selectedFile, setSelectedFile] = useState<string | undefined>(undefined)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const scrollRequested = useRef(false)

  useEffect(() => {
    let current = true
    setSelectedFile(undefined)
    Promise.resolve()
      .then(() => api.detail(name, path))
      .then(detail => {
        if (!current) return
        setState({ status: 'ready', detail })
        // the single preview box starts on the skill body (= SKILL.md)
        setSelectedFile(detail.files.find(file => file.name === 'SKILL.md')?.name ?? detail.files[0]?.name)
      })
      .catch(() => { if (current) setState({ status: 'error' }) })
    return () => { current = false }
  }, [api, name, path])

  // only user-driven clicks scroll the preview into view, not the initial body
  useEffect(() => {
    if (selectedFile !== undefined && scrollRequested.current) {
      scrollRequested.current = false
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedFile])

  const handleDelete = async () => {
    if (state.status !== 'ready' || state.detail === undefined) return
    if (state.detail.path === undefined) return
    if (!window.confirm(t('deleteConfirm'))) return
    setDeleting(true)
    setDeleteError(undefined)
    try {
      await api.deleteSkill(state.detail.path)
      onDeleted()
      onBack()
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : String(error))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="dshm-tab" aria-busy={state.status === 'loading'}>
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
          <>
            <div className="dshm-toolbar">
              <button type="button" className="dshm-button" onClick={onBack}>
                <IconChevronLeftOutline14 size={12} aria-hidden="true" />
                {t('back')}
              </button>
            </div>
            <div className="dshm-failure" role="alert"><p>{t('detailFailed')}</p></div>
          </>
        )
        : null}
      {state.status === 'ready' && state.detail !== undefined
        ? (
          <>
            <div className="dshm-detailHead">
              <button type="button" className="dshm-button" onClick={onBack}>
                <IconChevronLeftOutline14 size={12} aria-hidden="true" />
                {t('back')}
              </button>
              <span className="dshm-spacer" />
              {state.detail.managed === true && state.detail.path !== undefined
                ? (
                  <button type="button" className="dshm-button dshm-buttonDanger" disabled={deleting} onClick={() => { void handleDelete() }}>
                    <IconTrashOutline16 size={14} aria-hidden="true" />
                    {deleting ? t('deleting') : t('deleteButton')}
                  </button>
                )
                : null}
            </div>
            <div className="dshm-hero">
              <span className={`dshm-tile dshm-heroTile ${state.detail.invalid !== undefined ? 'dshm-tileError' : state.detail.shadowed ? 'dshm-tileWarn' : ''}`}>
                <IconSkillOutline16 size={20} aria-hidden="true" />
              </span>
              <span className="dshm-heroBody">
                <h3 className="dshm-heroName">{state.detail.name}</h3>
                <span className="dshm-heroTags">
                  <span className="dshm-tag">{sourceLabel(t, state.detail.source)}{state.detail.rank !== undefined ? ` · rank ${state.detail.rank}` : ''}</span>
                  <span className={`dshm-tag ${state.detail.invocation.modelInvocable ? 'dshm-tagOk' : 'dshm-tagWarn'}`}>
                    {state.detail.invocation.modelInvocable ? t('tagModelOn') : t('tagModelOff')}
                  </span>
                  <span className={`dshm-tag ${state.detail.invocation.userInvocable ? '' : 'dshm-tagWarn'}`}>
                    {state.detail.invocation.userInvocable ? t('tagUserOn') : t('tagUserOff')}
                  </span>
                </span>
              </span>
            </div>
            {state.detail.shadowed
              ? <p className="dshm-callout dshm-calloutWarn"><IconWarningOutline16 size={13} aria-hidden="true" /> {t('shadowedHint')}</p>
              : null}
            {state.detail.invalid !== undefined
              ? <p className="dshm-callout dshm-calloutError" role="alert">{t('invalidHint')}（{state.detail.invalid}）</p>
              : null}
            {deleteError !== undefined ? <div className="dshm-failure" role="alert"><p>{t('deleteFailed')}：{deleteError}</p></div> : null}
            <div className="dshm-detailCard">
              <h4>{t('fieldDescription')}</h4>
              <p className="dshm-desc">{state.detail.description || '—'}</p>
              {state.detail.whenToUse !== undefined && state.detail.whenToUse !== ''
                ? (
                  <>
                    <h4>{t('fieldWhenToUse')}</h4>
                    <p className="dshm-callout">{state.detail.whenToUse}</p>
                  </>
                )
                : null}
              <h4>{t('detailTitle')}</h4>
              <dl className="dshm-details">
                <div><dt>{t('fieldProvider')}</dt><dd>{state.detail.provider}</dd></div>
                {state.detail.path !== undefined ? <div><dt>{t('fieldPath')}</dt><dd className="dshm-path">{state.detail.path}</dd></div> : null}
                {state.detail.metadata !== undefined && Object.keys(state.detail.metadata).length > 0
                  ? (
                    <div>
                      <dt>{t('fieldMetadata')}</dt>
                      <dd><JsonTree data={state.detail.metadata as Record<string, unknown>} label={state.detail.name} copyable /></dd>
                    </div>
                  )
                  : null}
              </dl>
            </div>
            {state.detail.files.length > 0
              ? (
                <div className="dshm-detailCard">
                  <h4>{t('fieldFiles')} · {fileCountLabel(t, state.detail.files.length)}</h4>
                  <SkillFileTree
                    key={state.detail.path ?? state.detail.name}
                    files={state.detail.files}
                    label={state.detail.name}
                    selectedFile={selectedFile}
                    onSelectFile={next => { scrollRequested.current = true; setSelectedFile(next) }}
                  />
                  {selectedFile !== undefined
                    ? (
                      <div className="dshm-previewWrap" ref={previewRef}>
                        <SkillFilePreview t={t} api={api} skillName={state.detail.name} file={selectedFile} />
                      </div>
                    )
                    : null}
                </div>
              )
              : state.detail.content.trim() !== ''
                ? (
                  <div className="dshm-detailCard">
                    <h4>{t('bodyHeading')}</h4>
                    <div className="dshm-md">
                      <MarkdownText text={state.detail.content} />
                    </div>
                  </div>
                )
                : null}
          </>
        )
        : null}
    </div>
  )
}

function fileCountLabel(t: (key: SkillManagerLocaleKey) => string, count: number): string {
  return count === 1 ? t('filesOne') : t('filesMany').replace('{n}', String(count))
}
