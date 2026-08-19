import { IconCloseOutline16, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ReactNode } from 'react'

/**
 * Shared Quiet Structure modal shell for the 已安装 pane's edit and detail
 * dialogs. Behavior (portal, Escape, mask click, aria) comes from the
 * platform `Modal` primitive mounted headless; the visuals are ours:
 *
 *   - mask: black 45% over a 4px backdrop blur (dark and light themes
 *     alike — a normal modal scrim, never a milky wash)
 *   - dialog: opaque bg-layer-1 card, 10% hairline, the user's large
 *     radius, max-width 560px (edit) / 640px (detail), a 160ms slide-up
 *     entry
 *   - chrome: quiet head (title + 26px close) when `title` is given,
 *     scrollable body, optional hairline-separated foot
 *
 * The edit dialog passes no `title` / `footer` and mounts the McpEditor
 * form directly — the editor's own header and 保存/测试/取消 foot act as
 * the dialog chrome — so both dialogs share this one shell class set
 * (`dshmcp-modal*`, single-sourced in styles.ts).
 */
export interface ModalShellProps {
  readonly open: boolean
  readonly onClose: () => void
  /** Also used as the dialog's accessible name; omit for headless content. */
  readonly title?: string
  /**
   * Locale lookup for the close affordance — deliberately the narrow
   * literal the shell actually reads, so callers whose translator covers
   * only a key subset (the vendored market shelf) can mount it too.
   * Full-dictionary translators remain assignable.
   */
  readonly t: (key: 'drawerClose') => string
  /** Dialog max-width: 'md' = 560px (edit), 'lg' = 640px (detail). */
  readonly size?: 'md' | 'lg'
  /** Action row pinned under the body (hairline above). */
  readonly footer?: ReactNode
  readonly children: ReactNode
}

export function ModalShell({ open, onClose, title, t, size = 'md', footer, children }: ModalShellProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? 'MCP'}
      closeLabel={t('drawerClose')}
      headless
      className={`dshmcp-modal${size === 'lg' ? ' is-lg' : ''}`}
    >
      <div className="dshmcp-modalInner">
        {title === undefined ? null : (
          <div className="dshmcp-modalHead">
            <h3 className="dshmcp-modalTitle">{title}</h3>
            <button type="button" className="dshmcp-modalClose" aria-label={t('drawerClose')} title={t('drawerClose')} onClick={onClose}>
              <IconCloseOutline16 size={14} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="dshmcp-modalBody">{children}</div>
        {footer === undefined ? null : <div className="dshmcp-modalFoot">{footer}</div>}
      </div>
    </Modal>
  )
}
