/**
 * Global agent rules editor — rendered in the launcher personal space.
 *
 * Wraps the trusted-host RPC that reads/writes `~/.dsh/AGENTS.md`, the
 * user-global instructions file every session inherits. Textarea editor + a
 * couple of quiet actions; the section keeps the Quiet Structure language
 * shared by the other workspace sections.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AgentRulesApi } from './api.ts'
import type { AgentRulesLocaleKey } from './locales.ts'

export interface AgentRulesSectionProps {
  readonly t: (key: AgentRulesLocaleKey) => string
  readonly api: AgentRulesApi
}

const TEMPLATE = `# 全局 Agent 规则
- 当会话处于 Code Mode 时：只能直接调用 run_code；bash、文件读写、联网、ask_user_question 等一律通过 run_code 程序内的 tools SDK 调用（如 await tools.bash({ command, description })），不要直接发起这些工具调用。
- 列表/读取类工具的 limit 参数不超过 2000。
`

export function AgentRulesSection({ t, api }: AgentRulesSectionProps): JSX.Element {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading')
  const [notice, setNotice] = useState<string | undefined>(undefined)

  useEffect(() => {
    let current = true
    api.read().then(
      (value) => {
        if (!current) return
        setText(value)
        setStatus('ready')
      },
      (error) => {
        if (!current) return
        setStatus('error')
        setNotice(error instanceof Error ? error.message : String(error))
      },
    )
    return () => {
      current = false
    }
  }, [api])

  const bytes = useMemo(() => new TextEncoder().encode(text).byteLength, [text])

  const save = useCallback(async () => {
    setStatus('saving')
    try {
      await api.write(text)
      setStatus('ready')
      setNotice(t('saved'))
    } catch (error) {
      setStatus('error')
      setNotice(t('saveFailed') + ': ' + (error instanceof Error ? error.message : String(error)))
    }
  }, [api, text, t])

  const loadTemplate = useCallback(() => {
    setText((current) => (current.trim() === '' ? TEMPLATE : current))
  }, [])

  const reset = useCallback(async () => {
    setText('')
    try {
      const bytesWritten = await api.write('')
      setStatus('ready')
      setNotice(`${t('saved')} · 0 ${t('bytes')}`)
      void bytesWritten
    } catch (error) {
      setStatus('error')
      setNotice(t('saveFailed') + ': ' + (error instanceof Error ? error.message : String(error)))
    }
  }, [api, t])

  const dirty = status !== 'saving'

  return (
    <div className="agr-section">
      <div className="agr-group">
        <div className="agr-toolbar">
          <span className="agr-label">{t('editorLabel')}</span>
          <span className="agr-meta">{bytes} {t('bytes')}</span>
        </div>
        <textarea
          className="agr-editor"
          value={text}
          disabled={status !== 'ready'}
          spellCheck={false}
          placeholder={t('editorPlaceholder')}
          aria-label={t('editorLabel')}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="agr-actions">
          <span className="agr-hint">{t('budgetHint')}</span>
          <button type="button" className="agr-btn" onClick={loadTemplate} disabled={!dirty}>
            {t('restoreTemplate')}
          </button>
          <button type="button" className="agr-btn" onClick={reset} disabled={!dirty}>
            {t('reset')}
          </button>
          <button type="button" className="agr-btn agr-btn--primary" onClick={save} disabled={status !== 'ready'}>
            {status === 'saving' ? t('saving') : t('save')}
          </button>
        </div>
        {status === 'loading' ? <p className="agr-note">{t('loading')}</p> : null}
        {status === 'error' ? <p className="agr-note agr-note--error" role="alert">{notice}</p> : null}
        {status === 'ready' && notice === t('saved') ? <p className="agr-note">{notice}</p> : null}
      </div>
    </div>
  )
}
