/**
 * Styles for the archive manager section.
 *
 * Mirrors dsh-skill-manager's two-pane layout (list + detail) so the
 * section feels native to dsh settings.
 */
export function installStyles(doc: Document): () => void {
  const style = doc.createElement('style')
  style.dataset.plugin = 'dsh-archive-manager'
  style.textContent = CSS
  doc.head.append(style)
  return () => {
    style.remove()
  }
}

const CSS = `
.dam-section { display: flex; flex-direction: column; gap: 12px; padding: 0 4px; }
.dam-banner { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
.dam-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 14px; align-items: stretch; min-height: 0; }
@media (max-width: 767px) {
  .dam-layout { grid-template-columns: minmax(0, 1fr); }
}
.dam-list { display: flex; flex-direction: column; gap: 4px; min-width: 0; max-height: 480px; overflow-y: auto; padding: 6px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--dsw-alias-border-strong, #888) 28%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #fff) 45%, transparent); }
.dam-list-empty { padding: 20px 8px; text-align: center; color: var(--dsw-alias-label-tertiary); font-size: 12px; }
.dam-item { display: flex; flex-direction: column; align-items: stretch; gap: 2px; text-align: left; padding: 8px 10px; border: 0; border-radius: 8px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.dam-item:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.10)); }
.dam-item--active { background: var(--dsw-alias-interactive-bg-selected, rgba(59,110,245,.16)); }
.dam-item-title { font-size: 13px; font-weight: 600; line-height: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dam-item-meta { font-size: 11px; color: var(--dsw-alias-label-tertiary); line-height: 16px; font-variant-numeric: tabular-nums; }
.dam-detail { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 12px 14px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--dsw-alias-border-strong, #888) 28%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #fff) 35%, transparent); }
.dam-detail-empty { color: var(--dsw-alias-label-tertiary); font-size: 13px; padding: 24px 8px; text-align: center; }
.dam-detail-header { display: flex; flex-direction: column; gap: 2px; }
.dam-detail-title { font-size: 16px; font-weight: 600; line-height: 22px; overflow: hidden; text-overflow: ellipsis; }
.dam-detail-meta { font-size: 12px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.dam-detail-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.dam-btn { padding: 6px 12px; min-height: 30px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; cursor: pointer; }
.dam-btn:hover { border-color: color-mix(in srgb, #3678ea 45%, var(--dsw-alias-border-l2)); }
.dam-btn--primary { background: #3678ea; color: #fff; border-color: #3678ea; }
.dam-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dam-messages { display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; padding: 6px 0; }
.dam-msg { padding: 8px 10px; border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 70%, transparent); }
.dam-msg-role { font-size: 11px; color: var(--dsw-alias-label-tertiary); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .04em; }
.dam-msg-text { font-size: 13px; line-height: 20px; white-space: pre-wrap; overflow-wrap: anywhere; }
.dam-tool { padding: 6px 10px; border-radius: 6px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 60%, transparent); border-left: 3px solid var(--dsw-alias-state-business-primary); font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }
.dam-tool-result { padding: 6px 10px; border-radius: 6px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 60%, transparent); border-left: 3px solid var(--dsw-alias-state-success-primary); font-size: 12px; white-space: pre-wrap; overflow-wrap: anywhere; }
.dam-tool-name { font-weight: 600; color: var(--dsw-alias-label-primary); margin-bottom: 2px; }
.dam-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary); line-height: 16px; margin-top: 4px; }
.dam-toast { position: fixed; right: 16px; bottom: 16px; padding: 8px 14px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-size: 12px; box-shadow: var(--dsw-shadow-shadow-lv1); z-index: 200; max-width: 320px; }
.dam-toast--error { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 25%, var(--dsw-alias-bg-layer-2)); }
`