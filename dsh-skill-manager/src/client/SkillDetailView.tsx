import { useEffect, useRef, useState } from 'react'
import { JsonTree, MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import { IconSkillOutline16, IconWarningOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SkillDetail } from '../contracts.ts'
import type { SkillManagerApi } from './api.ts'
import type { SkillManagerLocaleKey } from './locales.ts'
import { sourceLabel } from './SkillManagerSection.tsx'
import { IconClose } from './market/icons.tsx'
import { SkillFilePreview } from './SkillFilePreview.tsx'
import { SkillFileTree } from './SkillFileTree.tsx'

export interface SkillDetailViewProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly api: SkillManagerApi
  readonly name: string
  readonly path?: string | undefined
  readonly onClose: () => void
}

interface DetailState {
  readonly status: 'loading' | 'error' | 'ready'
  readonly detail?: SkillDetail
}

/** Skill detail content for the detail modal: head (tile, name, invocation
 *  tags, close), a 220px file tree pane and a preview + metadata pane.
 *  Rendered inside SkillDetailModal's dialog shell — this component owns
 *  no overlay / layering of its own. */
export function SkillDetailView({ t, api, name, path, onClose }: SkillDetailViewProps) {
  const [state, setState] = useState<DetailState>({ status: 'loading' })
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
        // the preview pane starts on the skill body (= SKILL.md)
        setSelectedFile(detail.files.find(file => file.name === 'SKILL.md')?.name ?? detail.files[0]?.name)
      })
      .catch(() => { if (current) setState({ status: 'error' }) })
    return () => { current = false }
  }, [api, name, path])

  // only user-driven tree clicks scroll the preview into view (narrow
  // layouts stack the panes), not the initial body selection
  useEffect(() => {
    if (selectedFile !== undefined && scrollRequested.current) {
      scrollRequested.current = false
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedFile])

  const detail = state.status === 'ready' ? state.detail : undefined

  return (
    <div className="dshm-detail" aria-busy={state.status === 'loading'}>
      {state.status === 'loading'
        ? (
          <div className="dshm-skeleton dshm-detailSkeleton" role="status" aria-label={t('loading')}>
            <div className="dshm-skelRow" />
            <div className="dshm-skelRow" />
            <div className="dshm-skelRow" />
          </div>
        )
        : null}
      {state.status === 'error'
        ? (
          <div className="dshm-detailMain">
            <p className="dshm-callout dshm-calloutError" role="alert">{t('detailFailed')}</p>
          </div>
        )
        : null}
      {detail !== undefined
        ? (
          <>
            <header className="dshm-detailHead">
              <div className="dshm-hero">
                <span className={`dshm-tile dshm-heroTile ${detail.invalid !== undefined ? 'dshm-tileError' : detail.shadowed ? 'dshm-tileWarn' : ''}`}>
                  <IconSkillOutline16 size={20} aria-hidden="true" />
                </span>
                <span className="dshm-heroBody">
                  <h3 className="dshm-heroName">{detail.name}</h3>
                  <span className="dshm-heroTags">
                    <span className="dshm-tag">{sourceLabel(t, detail.source)}{detail.rank !== undefined ? ` · rank ${detail.rank}` : ''}</span>
                    <span className={`dshm-tag ${detail.invocation.modelInvocable ? 'dshm-tagOk' : 'dshm-tagWarn'}`}>
                      {detail.invocation.modelInvocable ? t('tagModelOn') : t('tagModelOff')}
                    </span>
                    <span className={`dshm-tag ${detail.invocation.userInvocable ? '' : 'dshm-tagWarn'}`}>
                      {detail.invocation.userInvocable ? t('tagUserOn') : t('tagUserOff')}
                    </span>
                  </span>
                </span>
              </div>
              <button type="button" className="dshm-iconBtn" onClick={onClose} title={t('modalClose')} aria-label={t('modalClose')}>
                <IconClose size={14} />
              </button>
            </header>
            {/* Skill facts live HERE, in the header strip — the main pane
                is pure file preview, so the info no longer repeats under
                every file. Long-form bits fold into a disclosure. */}
            <div className="dshm-heroInfo">
              <p className="dshm-heroDesc">{detail.description || '—'}</p>
              <span className="dshm-heroMeta">{detail.provider}{detail.path !== undefined ? ` · ${detail.path}` : ''}</span>
              {(detail.whenToUse !== undefined && detail.whenToUse !== '') || (detail.metadata !== undefined && Object.keys(detail.metadata).length > 0)
                ? (
                  <details className="dshm-heroDetails">
                    <summary>{t('detailTitle')}</summary>
                    <div className="dshm-heroDetailsBody">
                      {detail.whenToUse !== undefined && detail.whenToUse !== ''
                        ? (
                          <>
                            <h4>{t('fieldWhenToUse')}</h4>
                            <p className="dshm-callout">{detail.whenToUse}</p>
                          </>
                        )
                        : null}
                      {detail.metadata !== undefined && Object.keys(detail.metadata).length > 0
                        ? <JsonTree data={detail.metadata as Record<string, unknown>} label={detail.name} copyable />
                        : null}
                    </div>
                  </details>
                )
                : null}
            </div>
            <div className={`dshm-detailBody${detail.files.length > 0 ? '' : ' is-single'}`}>
              {detail.files.length > 0
                ? (
                  <aside className="dshm-detailTree">
                    <span className="dshm-sectionLabel">{t('fieldFiles')} · {fileCountLabel(t, detail.files.length)}</span>
                    <SkillFileTree
                      key={detail.path ?? detail.name}
                      files={detail.files}
                      label={detail.name}
                      selectedFile={selectedFile}
                      onSelectFile={next => { scrollRequested.current = true; setSelectedFile(next) }}
                    />
                  </aside>
                )
                : null}
              <div className="dshm-detailMain">
                {detail.shadowed
                  ? <p className="dshm-callout dshm-calloutWarn"><IconWarningOutline16 size={13} aria-hidden="true" /> {t('shadowedHint')}</p>
                  : null}
                {detail.invalid !== undefined
                  ? <p className="dshm-callout dshm-calloutError" role="alert">{t('invalidHint')}（{detail.invalid}）</p>
                  : null}
                {selectedFile !== undefined
                  ? (
                    <div className="dshm-previewWrap" ref={previewRef}>
                      <SkillFilePreview t={t} api={api} skillName={detail.name} file={selectedFile} />
                    </div>
                  )
                  : detail.content.trim() !== ''
                    ? (
                      <div className="dshm-detailCard">
                        <h4>{t('bodyHeading')}</h4>
                        <div className="dshm-md">
                          <MarkdownText text={detail.content} />
                        </div>
                      </div>
                    )
                    : null}
              </div>
            </div>
          </>
        )
        : null}
    </div>
  )
}

function fileCountLabel(t: (key: SkillManagerLocaleKey) => string, count: number): string {
  return count === 1 ? t('filesOne') : t('filesMany').replace('{n}', String(count))
}
