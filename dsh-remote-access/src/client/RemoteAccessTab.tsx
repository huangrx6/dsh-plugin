/**
 * 远程访问面板（container）：持有全部状态与副作用，渲染交给自身与
 * 展示子组件（{@link ./IssuesList.tsx} / {@link ./QrPanel.tsx}）。
 *
 * 状态机：
 *   list: loading → ready | error      （status 轮询，manual refresh）
 *   busy: undefined | 'enable' | 'disable'   （互斥，防双击）
 *   qr:   undefined | svg                     （按需拉取，可收起）
 *   hint: string | undefined                  （host 折叠进 message 的建议）
 */
import { useCallback, useEffect, useState } from 'react'
import { IconLoadingOutline16, IconRefreshOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { RemoteAccessStatus } from '../contracts.ts'
import type { RemoteAccessApi } from './api.ts'
import type { RemoteAccessLocaleKey } from './locales.ts'
import { IssuesList } from './IssuesList.tsx'
import { QrPanel } from './QrPanel.tsx'

export interface RemoteAccessTabProps {
  readonly t: (key: RemoteAccessLocaleKey, vars?: Record<string, string>) => string
  readonly api: RemoteAccessApi
}

interface ListState {
  readonly status: 'loading' | 'error' | 'ready'
  readonly data?: RemoteAccessStatus
  readonly error?: string
}

type Busy = 'enable' | 'disable' | undefined

/** host 侧 foldError 的还原约定：`message\n[hint] hint`。 */
const HINT_SEPARATOR = '\n[hint] '

export function RemoteAccessTab({ t, api }: RemoteAccessTabProps) {
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [request, setRequest] = useState(0)
  const [busy, setBusy] = useState<Busy>(undefined)
  const [actionError, setActionError] = useState<string | undefined>(undefined)
  const [hint, setHint] = useState<string | undefined>(undefined)
  const [copied, setCopied] = useState(false)
  const [qrSvg, setQrSvg] = useState<string | undefined>(undefined)
  const [qrBusy, setQrBusy] = useState(false)

  const load = useCallback(() => {
    Promise.resolve()
      .then(() => api.status())
      .then(data => { setState({ status: 'ready', data }) })
      .catch(error => {
        setState({ status: 'error', error: error instanceof Error ? error.message : String(error) })
      })
  }, [api])

  useEffect(() => { load() }, [load, request])

  const data = state.status === 'ready' ? state.data : undefined
  const active = data?.serveActive === true
  const overall = data === undefined
    ? t('statusOff')
    : active && data.pickerBrowse
      ? t('statusOn')
      : (active || data.loggedIn ? t('statusPartial') : t('statusOff'))

  const refresh = useCallback(() => {
    setState({ status: 'loading' })
    setRequest(n => n + 1)
  }, [])

  const runAction = useCallback(async (action: Exclude<Busy, undefined>): Promise<void> => {
    if (busy !== undefined) return
    if (action === 'disable' && !window.confirm(t('disableConfirm'))) return
    setBusy(action)
    setActionError(undefined)
    setHint(undefined)
    try {
      if (action === 'enable') await api.enable()
      else await api.disable()
      setRequest(n => n + 1)
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error)
      const [message, extracted] = raw.split(HINT_SEPARATOR)
      setActionError(t('actionFailed', { message: message ?? raw }))
      if (extracted !== undefined) setHint(extracted)
    } finally {
      setBusy(undefined)
    }
  }, [api, busy, t])

  const copyUrl = useCallback(() => {
    const url = data?.httpsUrl
    if (url === undefined || url === null) return
    // clipboard API 在非 Secure Context 下不可用 —— 面板主路径是 HTTPS，
    // 裸 HTTP 下的降级是无声失败（地址仍可手动选中复制）。
    void navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => { setCopied(false) }, 1600)
      })
      .catch(() => {})
  }, [data?.httpsUrl])

  const toggleQr = useCallback(() => {
    const url = data?.httpsUrl
    if (url === undefined || url === null) return
    if (qrSvg !== undefined) { setQrSvg(undefined); return }
    setQrBusy(true)
    api.getQr(url)
      .then(response => { setQrSvg(response.svg) })
      .catch(error => { setActionError(error instanceof Error ? error.message : String(error)) })
      .finally(() => { setQrBusy(false) })
  }, [api, data?.httpsUrl, qrSvg])

  if (state.status === 'loading') {
    return (
      <div className="ra-panel">
        <p className="ra-hint"><span className="ra-spin"><IconLoadingOutline16 /></span>{t('loading')}</p>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="ra-panel">
        <p className="ra-hint">{t('loadFailed')}</p>
        <p className="ra-error">{state.error}</p>
        <button type="button" className="ra-btn" onClick={() => { setState({ status: 'loading' }); load() }}>{t('retry')}</button>
      </div>
    )
  }

  return (
    <div className="ra-panel">
      <header className="ra-head">
        <h3 className="ra-title">{t('title')}</h3>
        <button type="button" className="ra-icon-btn" title={t('refresh')} onClick={refresh}>
          <IconRefreshOutline16 />
        </button>
      </header>
      <p className="ra-subtitle">{t('subtitle')}</p>

      <dl className="ra-fields">
        <div className="ra-field">
          <dt>{t('fieldStatus')}</dt>
          <dd><span className={active ? 'ra-chip ra-chip-on' : 'ra-chip'}>{overall}</span></dd>
        </div>
        <div className="ra-field">
          <dt>{t('fieldNetwork')}</dt>
          <dd>{data?.installed === true ? t('networkName') : '—'}</dd>
        </div>
        <div className="ra-field">
          <dt>{t('fieldHttps')}</dt>
          <dd>{active ? t('httpsSecure') : t('httpsNone')}</dd>
        </div>
        <div className="ra-field">
          <dt>{t('fieldDevice')}</dt>
          <dd>{data?.dnsName ?? data?.backendState ?? '—'}</dd>
        </div>
        <div className="ra-field ra-field-wide">
          <dt>{t('fieldUrl')}</dt>
          <dd className="ra-url">{data?.httpsUrl ?? '—'}</dd>
        </div>
        <div className="ra-field ra-field-wide">
          <dt>{t('fieldPicker')}</dt>
          <dd>{data?.pickerBrowse === true ? t('pickerEnabled') : <span className="ra-warn">{t('pickerMissing')}</span>}</dd>
        </div>
      </dl>

      {data?.httpsUrl != null && (
        <div className="ra-actions">
          <button type="button" className="ra-btn" onClick={copyUrl} disabled={busy !== undefined}>
            {copied ? t('copied') : t('copyUrl')}
          </button>
          <button type="button" className="ra-btn" onClick={() => { void toggleQr() }} disabled={qrBusy}>
            {qrSvg !== undefined ? t('hideQr') : (qrBusy ? t('loading') : t('showQr'))}
          </button>
        </div>
      )}

      {qrSvg !== undefined && <QrPanel t={t} svg={qrSvg} />}

      <div className="ra-actions">
        <button
          type="button"
          className="ra-btn ra-btn-primary"
          disabled={busy !== undefined || data?.installed !== true || data.loggedIn === false}
          onClick={() => { void runAction('enable') }}
        >
          {busy === 'enable' ? t('enabling') : t('enable')}
        </button>
        <button
          type="button"
          className="ra-btn"
          disabled={busy !== undefined || !active}
          onClick={() => { void runAction('disable') }}
        >
          {busy === 'disable' ? t('disabling') : t('disable')}
        </button>
      </div>

      {actionError !== undefined && <p className="ra-error">{actionError}</p>}
      {hint !== undefined && <p className="ra-issue-hint">{t('issueHintPrefix')}：{hint}</p>}

      <IssuesList t={t} issues={data?.issues ?? []} />

      <footer className="ra-notes">
        <p>{t('loopbackNote')}</p>
        <p>{t('trustedHostNote')}</p>
      </footer>
    </div>
  )
}
