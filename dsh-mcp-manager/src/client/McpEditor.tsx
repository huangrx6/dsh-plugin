import { useState } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { IconCheckOutline14, IconCloseOutline16, IconCodeOutline16, IconPlayOutline16, IconWarningOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { McpJsExprValue, McpServerConfig, McpServerView, McpTestResponse, McpTransport } from '../contracts.ts'
import type { McpManagerApi } from './api.ts'
import type { McpManagerLocaleKey } from './locales.ts'
import { ToolList } from './ToolList.tsx'
import { saveCachedTest } from './tool-cache.ts'

export interface McpEditorProps {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly api: McpManagerApi
  /** Undefined when adding a new server. */
  readonly original: McpServerView | undefined
  readonly onSaved: () => void
  readonly onCancel: () => void
}

interface KeyValueRow {
  readonly key: string
  readonly value: string
  readonly locked: boolean
}

const EMPTY_CONFIG: McpServerConfig = { serverName: '', transport: 'stdio' }

/** Add / edit form with a dual-transport mode and a YAML source mode. */
export function McpEditor({ t, api, original, onSaved, onCancel }: McpEditorProps) {
  const initial = original?.config ?? EMPTY_CONFIG
  const [serverName, setServerName] = useState(initial.serverName)
  const [transport, setTransport] = useState<McpTransport>(initial.transport)
  const [command, setCommand] = useState(initial.command ?? '')
  const [argsText, setArgsText] = useState(initial.args !== undefined ? initial.args.join('\n') : '')
  const [envRows, setEnvRows] = useState<KeyValueRow[]>(rowsOf(initial.env))
  const [cwd, setCwd] = useState(initial.cwd ?? '')
  const [url, setUrl] = useState(initial.url ?? '')
  const [headerRows, setHeaderRows] = useState<KeyValueRow[]>(rowsOf(initial.headers))
  const [advancedOpen, setAdvancedOpen] = useState(initial.toolCallTimeoutMs !== undefined || initial.failOnStartupError === true || initial.reconnect !== undefined)
  const [timeoutText, setTimeoutText] = useState(initial.toolCallTimeoutMs !== undefined ? String(initial.toolCallTimeoutMs) : '')
  const [failOnStartup, setFailOnStartup] = useState(initial.failOnStartupError === true)
  const [reconnect, setReconnect] = useState(initial.reconnect?.enabled !== false)
  const [yamlMode, setYamlMode] = useState(false)
  const [yamlText, setYamlText] = useState('')
  const [yamlError, setYamlError] = useState<string | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>(undefined)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<McpTestResponse | undefined>(undefined)

  const formConfig = (): McpServerConfig => {
    const env = mapOf(envRows, original?.config?.env)
    const headers = mapOf(headerRows, original?.config?.headers)
    const timeout = Number(timeoutText)
    return {
      serverName: serverName.trim(),
      transport,
      ...(transport === 'stdio'
        ? { command: command.trim(), ...(argsText.trim() !== '' ? { args: argsText.split('\n').map(line => line.trim()).filter(line => line !== '') } : {}), ...(cwd.trim() !== '' ? { cwd: cwd.trim() } : {}) }
        : { ...(url.trim() !== '' ? { url: url.trim() } : {}) }),
      ...(Object.keys(env).length > 0 ? { env } : {}),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
      ...(timeoutText.trim() !== '' && Number.isFinite(timeout) && timeout > 0 ? { toolCallTimeoutMs: timeout } : {}),
      ...(failOnStartup ? { failOnStartupError: true } : {}),
      ...(reconnect ? { reconnect: { enabled: true } } : {}),
    }
  }

  const ensureYaml = async (): Promise<McpServerConfig | undefined> => {
    if (!yamlMode) return formConfig()
    try {
      const parsed = await api.parseYaml(yamlText)
      setYamlError(undefined)
      return parsed.config
    } catch (error) {
      setYamlError(error instanceof Error ? error.message : String(error))
      return undefined
    }
  }

  const handleTest = async () => {
    if (testing) return
    const config = await ensureYaml()
    if (config === undefined) return
    setTesting(true)
    setTestResult(undefined)
    try {
      const result = await api.test(config)
      // persist so the tab's card can show tools without re-testing
      const serverName = typeof config.serverName === 'string' ? config.serverName : undefined
      if (serverName !== undefined && serverName !== '') saveCachedTest(window.localStorage, serverName, result)
      setTestResult(result)
    } catch (error) {
      setTestResult({ ok: false, durationMs: 0, error: error instanceof Error ? error.message : String(error) })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (saving) return
    const config = await ensureYaml()
    if (config === undefined) return
    setSaving(true)
    setSaveError(undefined)
    try {
      await api.save({ entryId: original?.entryId, config })
      setSaved(true)
      window.setTimeout(onSaved, 700)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error))
    } finally {
      setSaving(false)
    }
  }

  const enterYamlMode = async () => {
    if (yamlMode) {
      setYamlMode(false)
      return
    }
    try {
      setYamlText(await api.dumpYaml(formConfig()))
      setYamlError(undefined)
      setYamlMode(true)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error))
    }
  }

  const onRowChange = (setter: Dispatch<SetStateAction<KeyValueRow[]>>) => (index: number, patch: Partial<KeyValueRow>) => {
    setter((rows: KeyValueRow[]) => rows.map((row, position) => position === index ? { ...row, ...patch } : row))
  }

  return (
    <div className="dshmcp-editor" data-editor={original !== undefined ? original.entryId : 'new'}>
      <div className="dshmcp-editorHead">
        <h3>{original !== undefined ? t('editorEditTitle') : t('editorAddTitle')}</h3>
        <span className="dshmcp-seg" role="group" aria-label={t('yamlMode')}>
          <button type="button" aria-pressed={!yamlMode} onClick={() => { if (yamlMode) void enterYamlMode() }}>{t('formMode')}</button>
          <button type="button" aria-pressed={yamlMode} onClick={() => { if (!yamlMode) void enterYamlMode() }}>
            <IconCodeOutline16 size={13} aria-hidden="true" />
            {t('yamlMode')}
          </button>
        </span>
        <button type="button" className="dshmcp-button dshmcp-buttonIcon" onClick={onCancel} title={t('cancelButton')} aria-label={t('cancelButton')}>
          <IconCloseOutline16 size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="dshmcp-editorBody">
        {yamlMode
          ? (
            <div className="dshmcp-form">
              <div className="dshmcp-formRow">
                <label htmlFor="dshmcp-yaml">YAML</label>
                <textarea id="dshmcp-yaml" className="dshmcp-textarea" value={yamlText} placeholder={t('yamlPlaceholder')} spellCheck={false} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => { setYamlText(event.currentTarget.value) }} />
                {yamlError !== undefined ? <span className="dshmcp-callout dshmcp-calloutError" role="alert">{yamlError}</span> : null}
              </div>
            </div>
          )
          : (
            <div className="dshmcp-form">
              <div className="dshmcp-formRow">
                <label htmlFor="dshmcp-name">{t('fieldServerName')}</label>
                <input id="dshmcp-name" className="dshmcp-input" value={serverName} onChange={event => { setServerName(event.currentTarget.value) }} />
                <span>{t('fieldServerNameHint')}</span>
              </div>
              <div className="dshmcp-formRow">
                <label>{t('fieldTransport')}</label>
                <div className="dshmcp-seg" role="group">
                  <button type="button" aria-pressed={transport === 'stdio'} onClick={() => { setTransport('stdio') }}>{t('transportStdio')}</button>
                  <button type="button" aria-pressed={transport === 'streamable-http'} onClick={() => { setTransport('streamable-http') }}>{t('transportHttp')}</button>
                </div>
              </div>
              {transport === 'stdio'
                ? (
                  <>
                    <div className="dshmcp-formRow">
                      <label htmlFor="dshmcp-command">{t('fieldCommand')}</label>
                      <input id="dshmcp-command" className="dshmcp-input" value={command} placeholder="npx" onChange={event => { setCommand(event.currentTarget.value) }} />
                    </div>
                    <div className="dshmcp-formRow">
                      <label htmlFor="dshmcp-args">{t('fieldArgs')}</label>
                      <textarea id="dshmcp-args" className="dshmcp-textarea" style={{ minHeight: 72 }} value={argsText} placeholder={'-y\n@modelcontextprotocol/server-everything'} spellCheck={false} onChange={event => { setArgsText(event.currentTarget.value) }} />
                    </div>
                    <KeyValueEditor t={t} label={t('fieldEnv')} rows={envRows} onChange={onRowChange(setEnvRows)} onAdd={() => { setEnvRows(rows => [...rows, { key: '', value: '', locked: false }]) }} onRemove={index => { setEnvRows(rows => rows.filter((_, position) => position !== index)) }} />
                    <div className="dshmcp-formRow">
                      <label htmlFor="dshmcp-cwd">{t('fieldCwd')}</label>
                      <input id="dshmcp-cwd" className="dshmcp-input" value={cwd} onChange={event => { setCwd(event.currentTarget.value) }} />
                    </div>
                  </>
                )
                : (
                  <>
                    <div className="dshmcp-formRow">
                      <label htmlFor="dshmcp-url">{t('fieldUrl')}</label>
                      <input id="dshmcp-url" className="dshmcp-input" value={url} placeholder="http://localhost:3000/mcp" onChange={event => { setUrl(event.currentTarget.value) }} />
                    </div>
                    <KeyValueEditor t={t} label={t('fieldHeaders')} rows={headerRows} onChange={onRowChange(setHeaderRows)} onAdd={() => { setHeaderRows(rows => [...rows, { key: '', value: '', locked: false }]) }} onRemove={index => { setHeaderRows(rows => rows.filter((_, position) => position !== index)) }} />
                  </>
                )}
              <div>
                <button type="button" className="dshmcp-button" onClick={() => { setAdvancedOpen(open => !open) }}>
                  {t('advanced')} {advancedOpen ? '−' : '+'}
                </button>
              </div>
              {advancedOpen
                ? (
                  <div className="dshmcp-form" style={{ gap: 10, padding: '10px 12px', background: 'var(--dsw-alias-bg-module-platform)', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 10 }}>
                    <div className="dshmcp-formRow">
                      <label htmlFor="dshmcp-timeout">{t('fieldTimeout')}</label>
                      <input id="dshmcp-timeout" className="dshmcp-input" inputMode="numeric" value={timeoutText} placeholder="60000" onChange={event => { setTimeoutText(event.currentTarget.value) }} />
                    </div>
                    <label className="dshmcp-checkRow">
                      <input type="checkbox" checked={failOnStartup} onChange={event => { setFailOnStartup(event.currentTarget.checked) }} />
                      {t('fieldFailOnStartup')}
                    </label>
                    <label className="dshmcp-checkRow">
                      <input type="checkbox" checked={reconnect} onChange={event => { setReconnect(event.currentTarget.checked) }} />
                      {t('fieldReconnect')}
                    </label>
                  </div>
                )
                : null}
            </div>
          )}
        <p className="dshmcp-status">{t('testHint')}</p>
        {testResult !== undefined ? <TestResult t={t} result={testResult} /> : null}
        {saveError !== undefined ? <p className="dshmcp-callout dshmcp-calloutError" role="alert">{t('savingError')}：{saveError}</p> : null}
        {saved
          ? (
            <p className="dshmcp-callout" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCheckOutline14 size={13} aria-hidden="true" />
              {t('savedHint')}
            </p>
          )
          : null}
      </div>
      <div className="dshmcp-editorFoot">
        <button type="button" className="dshmcp-button dshmcp-buttonPrimary" disabled={saving || saved} onClick={() => { void handleSave() }}>
          {saving ? t('saving') : t('saveButton')}
        </button>
        <button type="button" className="dshmcp-button" disabled={testing} onClick={() => { void handleTest() }}>
          <IconPlayOutline16 size={14} aria-hidden="true" />
          {testing ? t('testRunning') : t('testButton')}
        </button>
        <span className="dshmcp-spacer" />
        <button type="button" className="dshmcp-button" disabled={saving} onClick={onCancel}>{t('cancelButton')}</button>
      </div>
    </div>
  )
}

function KeyValueEditor({ t, label, rows, onChange, onAdd, onRemove }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly label: string
  readonly rows: readonly KeyValueRow[]
  readonly onChange: (index: number, patch: Partial<KeyValueRow>) => void
  readonly onAdd: () => void
  readonly onRemove: (index: number) => void
}) {
  return (
    <div className="dshmcp-formRow">
      <label>{label}</label>
      <div className="dshmcp-kvList">
        {rows.map((row, index) => (
          <div key={index} className="dshmcp-kvRow">
            <input value={row.key} placeholder={t('kvKey')} aria-label={`${label} ${t('kvKey')} ${index + 1}`} onChange={event => { onChange(index, { key: event.currentTarget.value }) }} />
            <input
              value={row.value}
              placeholder={t('kvValue')}
              aria-label={`${label} ${t('kvValue')} ${index + 1}`}
              disabled={row.locked}
              title={row.locked ? t('exprLocked') : undefined}
              onChange={event => { onChange(index, { value: event.currentTarget.value }) }}
            />
            <button type="button" className="dshmcp-kvRemove" aria-label={t('kvRemove')} onClick={() => { onRemove(index) }}>✕</button>
          </div>
        ))}
        <div className="dshmcp-kvFoot">
          <button type="button" className="dshmcp-button" onClick={onAdd}>+ {t('kvAdd')}</button>
        </div>
      </div>
    </div>
  )
}

export function TestResult({ t, result }: { readonly t: (key: McpManagerLocaleKey) => string; readonly result: McpTestResponse }) {
  return (
    <div className={`dshmcp-testPanel ${result.ok ? 'dshmcp-testOk' : 'dshmcp-testFail'}`} role="status">
      <div className="dshmcp-testHead">
        <span className="dshmcp-testIcon">
          {result.ok ? <IconCheckOutline14 size={16} aria-hidden="true" /> : <IconWarningOutline16 size={16} aria-hidden="true" />}
        </span>
        <span className="dshmcp-testHeadBody">
          <strong>{result.ok ? t('testOk') : t('testFailed')}</strong>
          <span className="dshmcp-testMeta">
            {t('testDuration').replace('{n}', String(result.durationMs))}
            {result.ok && result.serverName !== undefined ? ` · ${t('testServerInfo')}：${result.serverName}${result.serverVersion !== undefined ? ` v${result.serverVersion}` : ''}` : ''}
          </span>
        </span>
        {result.ok && result.tools !== undefined
          ? <span className="dshmcp-tag dshmcp-tagOk">{t('testToolsFound').replace('{n}', String(result.tools.length))}</span>
          : null}
      </div>
      {result.ok && result.tools !== undefined && result.tools.length > 0
        ? <ToolList t={t} tools={result.tools.map(tool => ({ name: tool.name, description: tool.description, schema: tool.inputSchema as Record<string, unknown> | undefined }))} />
        : null}
      {!result.ok && result.error !== undefined ? <pre>{result.error}</pre> : null}
    </div>
  )
}

function rowsOf(map: Readonly<Record<string, string | McpJsExprValue>> | undefined): KeyValueRow[] {
  if (map === undefined) return []
  return Object.entries(map).map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? value : `!!js ${value.__jsExpr}`,
    locked: typeof value !== 'string',
  }))
}

function mapOf(rows: readonly KeyValueRow[], original: Readonly<Record<string, string | McpJsExprValue>> | undefined): Record<string, string | McpJsExprValue> {
  const out: Record<string, string | McpJsExprValue> = {}
  for (const row of rows) {
    if (row.key.trim() === '') continue
    if (row.locked && original !== undefined) {
      const preserved = original[row.key]
      if (preserved !== undefined && typeof preserved !== 'string') {
        out[row.key] = preserved
        continue
      }
    }
    if (row.value.trim() === '') continue
    // typing `!!js <expr>` in the form creates a real expression entry,
    // so users don't end up with a quoted literal string in the patch file
    if (row.value.startsWith('!!js ') && row.value.slice(5).trim() !== '') {
      out[row.key] = { __jsExpr: row.value.slice(5).trim() }
      continue
    }
    out[row.key] = row.value
  }
  return out
}
