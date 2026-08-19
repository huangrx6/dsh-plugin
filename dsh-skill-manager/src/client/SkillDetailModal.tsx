import { useEffect, useRef } from 'react'
import type { SkillManagerApi } from './api.ts'
import type { SkillManagerLocaleKey } from './locales.ts'
import { SkillDetailView } from './SkillDetailView.tsx'

export interface SkillDetailModalProps {
  readonly t: (key: SkillManagerLocaleKey) => string
  readonly api: SkillManagerApi
  readonly name: string
  readonly path?: string | undefined
  readonly onClose: () => void
}

/** Quiet-Structure modal shell around the skill detail content: a dimmed
 *  (label-primary 32%) blurred (4px) overlay and a bordered layer-1 dialog
 *  at 760px × min(640px, 84vh) that slides up over 160ms. Closes via Esc,
 *  an overlay click, or the in-content close button. */
export function SkillDetailModal({ t, api, name, path, onClose }: SkillDetailModalProps): JSX.Element {
  const dialogRef = useRef<HTMLDivElement | null>(null)

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

  return (
    <div
      className="dshm-modalOverlay"
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
    >
      <div
        className="dshm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('detailTitle') + ': ' + name}
        ref={dialogRef}
        tabIndex={-1}
      >
        <SkillDetailView t={t} api={api} name={name} path={path} onClose={onClose} />
      </div>
    </div>
  )
}
