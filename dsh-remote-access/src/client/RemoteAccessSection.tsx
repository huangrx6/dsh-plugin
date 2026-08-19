/**
 * 远程访问面板（container）：持有全部状态与副作用，渲染交给自身与
 * 展示子组件（{@link ./IssuesList.tsx} / {@link ./QrPanel.tsx}）。
 *
 * 布局（macOS 设置页式分组行）：
 *   「服务状态」分组：状态行（点 + 文案 + 启停）→ 地址行（等宽 + 复制）→ meta 行
 *   「二维码」分组：白色托盘 160px 居中 + 提示文字
 *   宽屏两分组并排（弹性 + 320px），<768px 纵向堆叠。
 *   区块内不再渲染大标题 —— 工作区壳已提供标题行。
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

export interface RemoteAccessSectionProps {
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

export function RemoteAccessSection({ t, api }: RemoteAccessSectionProps) {
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
  const dotTone = data !== undefined && (active || data.loggedIn)
    ? (active && data.pickerBrowse ? 'ra-dot-success' : 'ra-dot-business')
    : 'ra-dot-error'
  const url = data?.httpsUrl ?? null

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
    if (url === null) return
    // clipboard API 在非 Secure Context 下不可用 —— 面板主路径是 HTTPS，
    // 裸 HTTP 下的降级是无声失败（地址仍可手动选中复制）。
    void navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => { setCopied(false) }, 1600)
      })
      .catch(() => {})
  }, [url])

  const toggleQr = useCallback(() => {
    if (url === null || qrSvg !== undefined) return
    setQrBusy(true)
    api.getQr(url)
      .then(response => { setQrSvg(response.svg) })
      .catch(error => setActionError(error instanceof Error ? error.message : String(error)))
      .finally(() => setQrBusy(false))
  }, [api, qrSvg, url])

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

  const device = data?.dnsName ?? data?.backendState ?? '—'
  const network = data?.installed === true ? t('networkName') : '—'
  const gateway = active ? (data?.serveTarget ?? t('httpsSecure')) : t('httpsNone')

  return (
    <div className="ra-panel">
      <div className="ra-grid">
        <section className="ra-group" aria-label={t('groupService')}>
          <div className="ra-group-head">
            <span className="ra-section-label">{t('groupService')}</span>
            <button type="button" className="ra-icon-btn" title={t('refresh')} aria-label={t('refresh')} onClick={refresh}>
              <IconRefreshOutline16 />
            </button>
          </div>

          <div className="ra-row">
            <span className={`ra-dot ${dotTone}`} aria-hidden="true" />
            <span className="ra-row-title">{overall}</span>
            {active ? (
              <button
                type="button"
                className="ra-btn"
                disabled={busy !== undefined}
                onClick={() => { void runAction('disable') }}
              >
                {busy === 'disable' ? t('disabling') : t('disable')}
              </button>
            ) : (
              <button
                type="button"
                className="ra-btn ra-btn-primary"
                disabled={busy !== undefined || data?.installed !== true || data.loggedIn === false}
                onClick={() => { void runAction('enable') }}
              >
                {busy === 'enable' ? t('enabling') : t('enable')}
              </button>
            )}
          </div>

          <div className="ra-row">
            <span className="ra-row-text ra-mono" title={url ?? undefined}>{url ?? '—'}</span>
            {url !== null && (
              <button type="button" className="ra-btn" onClick={copyUrl} disabled={busy !== undefined}>
                {copied ? t('copied') : t('copyUrl')}
              </button>
            )}
          </div>

          <div className="ra-row">
            <span className="ra-meta">{device} · {network} · {gateway}</span>
            {data?.pickerBrowse !== true && <span className="ra-meta ra-meta-warn">{t('pickerMissing')}</span>}
          </div>
        </section>

        <section className="ra-group ra-group-qr" aria-label={t('groupQr')}>
          <div className="ra-group-head">
            <span className="ra-section-label">{t('groupQr')}</span>
          </div>
          {url === null
            ? <p className="ra-qr-empty">{t('qrUnavailable')}</p>
            : qrSvg === undefined
              ? (
                <div className="ra-qr-body">
                  <button type="button" className="ra-btn" onClick={toggleQr} disabled={qrBusy}>
                    {qrBusy ? t('loading') : t('showQr')}
                  </button>
                </div>
              )
              : <QrPanel t={t} svg={qrSvg} onCollapse={() => { setQrSvg(undefined) }} />}
        </section>
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
