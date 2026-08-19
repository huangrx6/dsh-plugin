import { useEffect, useRef, useState } from 'react'
import type { MarketItem, MarketSource } from './market/types.ts'
import { IconClose, IconSkills } from './market/icons.tsx'
import type { SkillManagerLocaleKey } from './locales.ts'

export interface MarketItemDetailModalProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly item: MarketItem
  readonly source: MarketSource
  /** Installed copy exists locally (drives the footer action). */
  readonly installed: boolean
  /** Installed and the market version differs → footer shows 更新. */
  readonly updatable: boolean
  readonly onInstall: (item: MarketItem, source: MarketSource) => Promise<void>
  readonly onClose: () => void
}

/** Read-only 详情 dialog for one market item, reusing the skill detail
 *  modal's shell (dark blurred overlay + opaque bordered dialog) in a
 *  compact height: the full description plus source / version / author /
 *  tags / install target / install URL in one grouped card, with the
 *  row action (安装 / 更新) repeated as the footer's primary button. */
export function MarketItemDetailModal({
  t,
  item,
  source,
  installed,
  updatable,
  onInstall,
  onClose,
}: MarketItemDetailModalProps): JSX.Element {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown) }
  }, [onClose])

  // move focus into the dialog so keyboard users start inside it
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  const handleInstallClick = async (): Promise<void> => {
    if (busy || (installed && !updatable)) return
    setBusy(true)
    setError(undefined)
    try {
      await onInstall(item, source)
      onClose()
    } catch (installError) {
      setError(installError instanceof Error ? installError.message : String(installError))
    } finally {
      setBusy(false)
    }
  }

  const payload = item.payload ?? {}
  const installUrl = typeof payload['url'] === 'string' ? payload['url'] : undefined

  return (
    <div
      className="dshm-modalOverlay"
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
    >
      <div
        className="dshm-modal is-compact"
        role="dialog"
        aria-modal="true"
        aria-label={t('marketDetail') + ': ' + item.name}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="dshm-mktDetail">
          <header className="dshm-detailHead">
            <div className="dshm-hero">
              <span className="dshm-tile dshm-heroTile">
                <IconSkills size={20} />
              </span>
              <span className="dshm-heroBody">
                <h3 className="dshm-heroName">{item.name}</h3>
                <span className="dshm-heroTags">
                  <span className="dshm-tag">{source.name}</span>
                  {item.version !== undefined ? <span className="dshm-tag dshm-tagCode">v{item.version}</span> : null}
                </span>
              </span>
            </div>
            <button type="button" className="dshm-iconBtn" onClick={onClose} title={t('modalClose')} aria-label={t('modalClose')}>
              <IconClose size={14} />
            </button>
          </header>
          <div className="dshm-mktDetailBody">
            {error === undefined ? null : (
              <p className="dshm-callout dshm-calloutError" role="alert">{error}</p>
            )}
            <div className="dshm-detailCard">
              <h4>{t('fieldDescription')}</h4>
              <p className="dshm-desc">{item.description}</p>
              <dl className="dshm-details">
                <div><dt>{t('marketDetailSource')}</dt><dd>{source.name}</dd></div>
                {item.version !== undefined
                  ? <div><dt>{t('marketDetailVersion')}</dt><dd className="dshm-path">v{item.version}</dd></div>
                  : null}
                {item.author !== undefined
                  ? <div><dt>{t('marketDetailAuthor')}</dt><dd>{item.author}</dd></div>
                  : null}
                {item.tags !== undefined && item.tags.length > 0
                  ? (
                    <div>
                      <dt>{t('marketDetailTags')}</dt>
                      <dd>
                        <span className="dshm-heroTags">
                          {item.tags.map(tag => <span key={tag} className="dshm-tag">{tag}</span>)}
                        </span>
                      </dd>
                    </div>
                  )
                  : null}
                <div><dt>{t('marketDetailTarget')}</dt><dd>{t('destUserDsh')}</dd></div>
                {installUrl !== undefined
                  ? <div><dt>{t('urlLabel')}</dt><dd className="dshm-path">{installUrl}</dd></div>
                  : null}
              </dl>
            </div>
          </div>
          <footer className="dshm-mktDetailFoot">
            <button type="button" className="dshm-button" onClick={onClose}>{t('modalClose')}</button>
            <button
              type="button"
              className="dshm-button dshm-buttonPrimary"
              disabled={busy || (installed && !updatable)}
              onClick={() => { void handleInstallClick() }}
            >
              {!installed
                ? (busy ? t('marketInstalling') : t('marketInstall'))
                : updatable
                  ? (busy ? t('marketUpdating') : t('marketUpdate'))
                  : t('marketInstalled')}
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}
