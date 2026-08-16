import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { IconCheckOutline14, IconChevronLeftOutline14, IconDownloadOutline16, IconPaperclipOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SkillDestination, SkillImportResult } from '../contracts.ts'
import type { SkillManagerApi } from './api.ts'
import type { SkillManagerLocaleKey } from './locales.ts'

export interface SkillImportViewProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly api: SkillManagerApi
  readonly onDone: (importedName?: string) => void
  readonly onCancel: () => void
}

type Mode = 'url' | 'file'

interface ImportState {
  readonly status: 'idle' | 'busy' | 'done' | 'error'
  readonly result?: SkillImportResult
  readonly error?: string
}

/** Import a skill from a URL or an uploaded file into a managed root. */
export function SkillImportView({ t, api, onDone, onCancel }: SkillImportViewProps) {
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | undefined>(undefined)
  const [destination, setDestination] = useState<SkillDestination>('user-dsh')
  const [state, setState] = useState<ImportState>({ status: 'idle' })

  const busy = state.status === 'busy'

  const submit = async () => {
    if (busy) return
    setState({ status: 'busy' })
    try {
      const source = mode === 'url'
        ? { kind: 'url' as const, url: url.trim() }
        : file === undefined
          ? undefined
          : { kind: 'bytes' as const, filename: file.name, base64: await fileToBase64(file) }
      if (source === undefined) throw new Error(t('filePick'))
      const result = await api.importSkill(source, destination)
      setState({ status: 'done', result })
    } catch (error) {
      setState({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.currentTarget.files !== null && event.currentTarget.files.length > 0 ? event.currentTarget.files[0] : undefined)
  }

  return (
    <div className="dshm-tab">
      <div className="dshm-toolbar">
        <button type="button" className="dshm-button" onClick={onCancel}>
          <IconChevronLeftOutline14 size={12} aria-hidden="true" />
          {t('backToList')}
        </button>
      </div>
      <div className="dshm-heading">
        <h3>{t('importTitle')}</h3>
      </div>
      {state.status === 'done' && state.result !== undefined
        ? (
          (() => {
            const result = state.result
            return (
              <div className="dshm-resultCard" role="status">
                <div className="dshm-resultHead">
                  <span className="dshm-resultIcon"><IconCheckOutline14 size={16} aria-hidden="true" /></span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <strong>{t('importSuccess')}：{result.name}</strong>
                    <span className="dshm-resultMeta">
                      <code>{result.path}</code>
                      {' · '}
                      {result.files === 1 ? t('importFilesOne') : t('importFilesMany').replace('{n}', String(result.files))}
                    </span>
                  </div>
                </div>
                {result.warnings.length > 0
                  ? (
                    <>
                      <strong style={{ fontSize: 12.5 }}>{t('warnings')}</strong>
                      <ul className="dshm-warnList">
                        {result.warnings.map(warning => <li key={warning}>{warning}</li>)}
                      </ul>
                    </>
                  )
                  : null}
                <div className="dshm-actions">
                  <button type="button" className="dshm-button dshm-buttonPrimary" onClick={() => { onDone(result.name) }}>{t('openDetail')}</button>
                  <button type="button" className="dshm-button" onClick={onCancel}>{t('backToList')}</button>
                </div>
              </div>
            )
          })()
        )
        : (
          <div className="dshm-detailCard">
            <div className="dshm-form">
              <div className="dshm-formRow">
                <label>{t('importSource')}</label>
                <div className="dshm-seg" role="group">
                  <button type="button" aria-pressed={mode === 'url'} onClick={() => { setMode('url') }}>{t('importFromUrl')}</button>
                  <button type="button" aria-pressed={mode === 'file'} onClick={() => { setMode('file') }}>{t('importFromFile')}</button>
                </div>
              </div>
              {mode === 'url'
                ? (
                  <div className="dshm-formRow">
                    <label htmlFor="dshm-import-url">{t('urlLabel')}</label>
                    <input id="dshm-import-url" className="dshm-input" type="url" value={url} placeholder={t('urlPlaceholder')} onChange={event => { setUrl(event.currentTarget.value) }} />
                    <span>{t('urlHint')}</span>
                  </div>
                )
                : (
                  <div className="dshm-formRow">
                    <label>{t('fileLabel')}</label>
                    <label className="dshm-drop">
                      <input className="dshm-dropInput" type="file" accept=".md,.markdown,.zip" onChange={onFileChange} />
                      <span className="dshm-dropIcon"><IconPaperclipOutline16 size={16} aria-hidden="true" /></span>
                      <span className="dshm-dropBody">
                        <span className="dshm-dropTitle">{file !== undefined ? file.name : t('filePick')}</span>
                        <span className="dshm-dropHint">{file !== undefined ? `${formatFileSize(file.size)}` : '.md / .markdown / .zip'}</span>
                      </span>
                    </label>
                  </div>
                )
              }
              <div className="dshm-formRow">
                <label>{t('destination')}</label>
                <div className="dshm-seg" role="group">
                  <button type="button" aria-pressed={destination === 'user-dsh'} onClick={() => { setDestination('user-dsh') }}>{t('destUserDsh')}</button>
                  <button type="button" aria-pressed={destination === 'user-agents'} onClick={() => { setDestination('user-agents') }}>{t('destUserAgents')}</button>
                </div>
              </div>
              {state.status === 'error' && state.error !== undefined
                ? <p className="dshm-callout dshm-calloutError" role="alert">{state.error}</p>
                : null}
              <div className="dshm-actions">
                <button type="button" className="dshm-button dshm-buttonPrimary" disabled={busy} onClick={() => { void submit() }}>
                  <IconDownloadOutline16 size={14} aria-hidden="true" />
                  {busy ? t('importing') : t('importAction')}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
