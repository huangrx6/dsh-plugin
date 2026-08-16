import { useEffect, useMemo, useState } from 'react'
import {
  IconArchiveOutline20,
  IconBrowseOutline16,
  IconCheckOutline14,
  IconCodeOutline16,
  IconCopyOutline16,
  IconDataOutline16,
  IconListPenOutline16,
  IconPlayOutline16,
  IconRightUpOutline14,
  MarkdownText,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SkillFileContent } from '../contracts.ts'
import type { SkillManagerApi } from './api.ts'
import { parseCsv, type ParsedCsv } from './csv.ts'
import { formatSize } from './file-tree.ts'
import { highlightCode } from './highlight.ts'
import type { SkillManagerLocaleKey } from './locales.ts'
import { useIsDarkTheme } from './theme.ts'

export interface SkillFilePreviewProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly api: SkillManagerApi
  /** Owning skill name — the host re-resolves its directory on every read. */
  readonly skillName: string
  /** Relative path of the clicked tree row. */
  readonly file: string
}

type Mode = 'rendered' | 'source' | 'table'

interface LoadState {
  readonly status: 'loading' | 'error' | 'ready'
  readonly content?: SkillFileContent
  readonly error?: string
}

/** Live preview of one tree row: markdown / code / csv-table / image / pdf / media. */
export function SkillFilePreview({ t, api, skillName, file }: SkillFilePreviewProps) {
  const dark = useIsDarkTheme()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [mode, setMode] = useState<Mode | undefined>(undefined)
  const [html, setHtml] = useState<string | undefined>(undefined)
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined)
  const [copied, setCopied] = useState(false)

  const content = state.status === 'ready' ? state.content : undefined
  const isMarkdown = content?.kind === 'text' && content.language === 'markdown'
  const isCsv = content?.kind === 'text' && content.language === 'csv'
  const csv = useMemo(
    () => (isCsv && content?.text !== undefined ? parseCsv(content.text, content.file.endsWith('.tsv') ? '\t' : ',') : undefined),
    [isCsv, content],
  )

  useEffect(() => {
    let current = true
    setState({ status: 'loading' })
    setMode(undefined)
    setHtml(undefined)
    Promise.resolve()
      .then(() => api.readFile(skillName, file))
      .then(loaded => {
        if (!current) return
        setState({ status: 'ready', content: loaded })
        setMode(loaded.kind === 'text' && loaded.language === 'markdown'
          ? 'rendered'
          : loaded.kind === 'text' && loaded.language === 'csv' ? 'table' : undefined)
      })
      .catch(error => {
        if (current) setState({ status: 'error', error: error instanceof Error ? error.message : String(error) })
      })
    return () => { current = false }
  }, [api, skillName, file])

  // highlight whenever the source view is (or becomes) visible
  useEffect(() => {
    if (content?.kind !== 'text' || content.text === undefined) return
    if (mode === 'rendered') return
    let current = true
    highlightCode(content.text, content.language ?? 'text')
      .then(rendered => { if (current) setHtml(rendered) })
      .catch(() => { if (current) setHtml(undefined) })
    return () => { current = false }
  }, [content, mode])

  // blob URL lifecycle for image / pdf / audio / video
  useEffect(() => {
    if (content?.base64 === undefined) { setBlobUrl(undefined); return }
    const url = URL.createObjectURL(new Blob([base64ToBytes(content.base64)], content.mime !== undefined ? { type: content.mime } : undefined))
    setBlobUrl(url)
    return () => { URL.revokeObjectURL(url) }
  }, [content])

  const copy = async () => {
    if (content?.text === undefined) return
    await navigator.clipboard.writeText(content.text)
    setCopied(true)
    setTimeout(() => { setCopied(false) }, 1500)
  }

  const kindLabel = (kind: SkillFileContent['kind'], language: string | undefined): string => {
    switch (kind) {
      case 'text':
        if (language === 'markdown') return 'Markdown'
        if (language === 'csv') return 'CSV'
        if (language === undefined || language === 'text') return t('kindText')
        return language.charAt(0).toUpperCase() + language.slice(1)
      case 'image': return t('kindImage')
      case 'pdf': return t('kindPdf')
      case 'audio': return t('kindAudio')
      case 'video': return t('kindVideo')
      default: return t('kindBinary')
    }
  }

  if (state.status === 'error') {
    return (
      <div className="dshm-previewCard">
        <p className="dshm-callout dshm-calloutError" role="alert">{t('previewFailed')}：{state.error}</p>
      </div>
    )
  }

  if (content === undefined) {
    return (
      <div className="dshm-previewCard">
        <div className="dshm-previewLoading" role="status" aria-label={t('previewLoading')}>
          <div className="dshm-skelRow" />
          <div className="dshm-skelRow" />
          <div className="dshm-skelRow" />
        </div>
      </div>
    )
  }

  const showSeg = isMarkdown === true || isCsv === true
  return (
    <div className={`dshm-previewCard${dark ? ' dshm-previewDark' : ''}`}>
      <div className="dshm-previewHead">
        <span className={`dshm-tile dshm-previewTile dshm-previewTile-${content.kind}`} aria-hidden="true">
          {content.kind === 'image' ? <IconBrowseOutline16 size={15} />
            : content.kind === 'pdf' ? <IconDataOutline16 size={15} />
            : content.kind === 'audio' || content.kind === 'video' ? <IconPlayOutline16 size={15} />
            : content.kind === 'binary' ? <IconArchiveOutline20 size={15} />
            : isMarkdown === true ? <IconListPenOutline16 size={15} />
            : <IconCodeOutline16 size={15} />}
        </span>
        <span className="dshm-previewMeta">
          <span className="dshm-previewName">{content.name}</span>
          <span className="dshm-previewChips">
            <span className="dshm-tag">{kindLabel(content.kind, content.language)}</span>
            <span className="dshm-tag">{formatSize(content.size)}</span>
            {content.truncated ? <span className="dshm-tag dshm-tagWarn">{t('previewTruncated')}</span> : null}
            {content.file.includes('/') ? <span className="dshm-tag dshm-previewPath">{content.file}</span> : null}
          </span>
        </span>
        <span className="dshm-spacer" />
        {showSeg
          ? (
            <div className="dshm-seg dshm-segSm" role="group">
              {isMarkdown === true
                ? (
                  <>
                    <button type="button" aria-pressed={mode === 'rendered'} onClick={() => { setMode('rendered') }}>{t('previewRendered')}</button>
                    <button type="button" aria-pressed={mode === 'source'} onClick={() => { setMode('source') }}>{t('previewSource')}</button>
                  </>
                )
                : (
                  <>
                    <button type="button" aria-pressed={mode === 'table'} onClick={() => { setMode('table') }}>{t('previewTable')}</button>
                    <button type="button" aria-pressed={mode === 'source'} onClick={() => { setMode('source') }}>{t('previewCode')}</button>
                  </>
                )}
            </div>
          )
          : null}
        {content.kind === 'text' && content.text !== undefined
          ? (
            <button type="button" className="dshm-button dshm-buttonGhostSm" onClick={() => { void copy() }}>
              {copied ? <IconCheckOutline14 size={13} aria-hidden="true" /> : <IconCopyOutline16 size={13} aria-hidden="true" />}
              {copied ? t('previewCopied') : t('previewCopy')}
            </button>
          )
          : null}
        {blobUrl !== undefined && (content.kind === 'image' || content.kind === 'pdf')
          ? <a className="dshm-button dshm-buttonGhostSm" href={blobUrl} target="_blank" rel="noreferrer"><IconRightUpOutline14 size={13} aria-hidden="true" />{t('openNewTab')}</a>
          : null}
      </div>
      <div className="dshm-previewBody">
        {content.kind === 'text'
          ? mode === 'rendered' && content.text !== undefined
            ? <div className="dshm-md"><MarkdownText text={stripFrontmatter(content.text)} /></div>
            : isCsv === true && mode === 'table' && csv !== undefined
              ? <CsvTable csv={csv} t={t} />
              : html !== undefined
                ? <div className="dshm-codeBody" aria-label={content.name} dangerouslySetInnerHTML={{ __html: html }} />
                : (
                  <div className="dshm-previewLoading" role="status">
                    <div className="dshm-skelRow" />
                    <div className="dshm-skelRow" />
                    <div className="dshm-skelRow" />
                  </div>
                )
          : null}
        {content.kind === 'image' && blobUrl !== undefined
          ? <div className="dshm-imgWrap"><img className="dshm-img" src={blobUrl} alt={content.name} /></div>
          : null}
        {content.kind === 'pdf' && blobUrl !== undefined
          ? <iframe className="dshm-pdfFrame" src={blobUrl} title={content.name} />
          : null}
        {content.kind === 'audio' && blobUrl !== undefined ? <audio className="dshm-audio" src={blobUrl} controls preload="metadata" /> : null}
        {content.kind === 'video' && blobUrl !== undefined ? <video className="dshm-video" src={blobUrl} controls preload="metadata" /> : null}
        {content.kind === 'binary'
          ? (
            <div className="dshm-previewEmpty">
              <IconArchiveOutline20 size={22} aria-hidden="true" />
              <p>{t('binaryHint')}</p>
              <p className="dshm-previewEmptyMeta">{formatSize(content.size)}</p>
            </div>
          )
          : null}
      </div>
    </div>
  )
}

function CsvTable({ csv, t }: { readonly csv: ParsedCsv; readonly t: (key: SkillManagerLocaleKey) => string }) {
  return (
    <div className="dshm-tableWrap">
      <table className="dshm-table">
        <thead>
          <tr>{csv.headers.map((header, index) => <th key={index}>{header === '' ? `#${index + 1}` : header}</th>)}</tr>
        </thead>
        <tbody>
          {csv.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {csv.truncated ? <p className="dshm-tableNote">{t('rowsTruncated').replace('{n}', '500')}</p> : null}
    </div>
  )
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

/** Rendered markdown hides a leading YAML frontmatter block; source view keeps it. */
function stripFrontmatter(text: string): string {
  if (!text.startsWith('---')) return text
  const end = text.indexOf('\n---', 3)
  if (end === -1) return text
  const after = text.slice(end + 4)
  return after.startsWith('\n') ? after.slice(1) : after
}
