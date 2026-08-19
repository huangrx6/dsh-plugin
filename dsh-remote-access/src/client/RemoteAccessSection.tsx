/**
 * 远程访问面板（container）：持有全部状态与副作用，渲染交给自身与
 * 展示子组件（{@link ./IssuesList.tsx} / {@link ./QrPanel.tsx}）。
 *
 * 布局（Raycast / Linear 设置页式）：
 *   状态英雄区 —— 22px 状态字 + 8px 彩色圆点（绿=启用 / 灰=停用 / 红=错误），
 *   等宽 URL 全宽展示，复制与启停按钮固定在右侧同一列；英雄区直接落在
 *   页面底色上，不套卡片 —— 它是本页唯一的签名元素。
 *   分隔线（20px 视距）之下：左「二维码」卡片 + 右「诊断」卡片双栏，
 *   <768px 纵向堆叠；页脚两行使用注记。
 *   未启用时隐藏二维码与诊断卡，页面收敛为「未启用 + 启用」单一决策；
 *   仅当存在阻断性问题时保留诊断卡，给出下一步方向。
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
  const issues = data?.issues ?? []
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
      <div className="dsh-ra-panel">
        <p className="dsh-ra-hint"><span className="dsh-ra-spin"><IconLoadingOutline16 /></span>{t('loading')}</p>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="dsh-ra-panel">
        <section className="dsh-ra-hero" data-tone="error" aria-label={t('groupService')}>
          <div className="dsh-ra-hero-top">
            <p className="dsh-ra-hero-title">
              <span className="dsh-ra-hero-dot" aria-hidden="true" />
              {t('statusError')}
            </p>
          </div>
          <p className="dsh-ra-error">{state.error}</p>
          <div className="dsh-ra-hero-actions">
            <button type="button" className="dsh-ra-btn" onClick={() => { setState({ status: 'loading' }); load() }}>{t('retry')}</button>
          </div>
        </section>
      </div>
    )
  }

  const device = data?.dnsName ?? data?.backendState ?? '—'
  const network = data?.installed === true ? t('networkName') : '—'
  const gateway = active ? (data?.serveTarget ?? t('httpsSecure')) : t('httpsNone')
  // 未启用时页面收敛为单一决策；阻断性问题（未装/未登录）保留诊断方向。
  const showColumns = active || issues.length > 0
  const showNotes = active
  const hasBody = showColumns || showNotes || actionError !== undefined

  return (
    <div className="dsh-ra-panel">
      <section className="dsh-ra-hero" data-tone={active ? 'on' : 'off'} aria-label={t('groupService')}>
        <div className="dsh-ra-hero-top">
          <p className="dsh-ra-hero-title">
            <span className="dsh-ra-hero-dot" aria-hidden="true" />
            {active ? t('statusOn') : t('statusOff')}
          </p>
          <button type="button" className="dsh-ra-icon-btn" title={t('refresh')} aria-label={t('refresh')} onClick={refresh}>
            <IconRefreshOutline16 />
          </button>
        </div>

        <div className="dsh-ra-hero-url">
          {active && url !== null && <span className="dsh-ra-url" title={url}>{url}</span>}
          <div className="dsh-ra-hero-actions">
            {active && url !== null && (
              <button type="button" className="dsh-ra-btn" onClick={copyUrl} disabled={busy !== undefined}>
                {copied ? t('copied') : t('copyUrl')}
              </button>
            )}
            {active ? (
              <button
                type="button"
                className="dsh-ra-btn dsh-ra-btn-danger"
                disabled={busy !== undefined}
                onClick={() => { void runAction('disable') }}
              >
                {busy === 'disable' ? t('disabling') : t('disable')}
              </button>
            ) : (
              <button
                type="button"
                className="dsh-ra-btn dsh-ra-btn-solid"
                disabled={busy !== undefined || data?.installed !== true || data.loggedIn === false}
                onClick={() => { void runAction('enable') }}
              >
                {busy === 'enable' ? t('enabling') : t('enable')}
              </button>
            )}
          </div>
        </div>

        <p className="dsh-ra-hero-meta">
          {device} · {network} · {gateway}
          {active && data?.pickerBrowse !== true && <span className="dsh-ra-hero-warn"> · {t('pickerMissing')}</span>}
        </p>
      </section>

      {hasBody && <div className="dsh-ra-sep" aria-hidden="true" />}

      {actionError !== undefined && <p className="dsh-ra-error">{actionError}</p>}
      {hint !== undefined && <p className="dsh-ra-action-hint">{t('issueHintPrefix')}：{hint}</p>}

      {showColumns && (
        <div className="dsh-ra-columns">
          {active && (
            <section className="dsh-ra-card dsh-ra-card-qr" aria-label={t('groupQr')}>
              <p className="dsh-ra-card-label">{t('groupQr')}</p>
              {url === null
                ? <p className="dsh-ra-qr-empty">{t('qrUnavailable')}</p>
                : qrSvg === undefined
                  ? (
                    <div className="dsh-ra-qr-body">
                      <button type="button" className="dsh-ra-btn" onClick={toggleQr} disabled={qrBusy}>
                        {qrBusy ? t('loading') : t('showQr')}
                      </button>
                    </div>
                  )
                  : <QrPanel t={t} svg={qrSvg} onCollapse={() => { setQrSvg(undefined) }} />}
            </section>
          )}
          <IssuesList t={t} issues={issues} />
        </div>
      )}

      {showNotes && (
        <footer className="dsh-ra-notes">
          <p>{t('loopbackNote')}</p>
          <p>{t('trustedHostNote')}</p>
        </footer>
      )}
    </div>
  )
}
