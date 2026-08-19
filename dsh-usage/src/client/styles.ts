/** Subscription usage monitor styles — Quiet Structure, matches the other sections. */
export const USAGE_STYLES = `
.u-card { max-width: 760px; }
.u-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.u-hint { flex: 1 1 280px; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.u-btn {
  display: inline-flex; align-items: center; min-height: 28px; padding: 4px 14px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px); background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; cursor: pointer;
  transition: background-color 120ms ease;
}
.u-btn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.u-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.u-btn--primary { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }
.u-mini { background: transparent; border: 0; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; font-size: 12px; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
.u-mini:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.u-mini--danger { color: var(--dsw-alias-state-error-primary, #ef5350); }
.u-list { display: grid; gap: 10px; }
.u-row {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 12px 14px;
}
.u-rowHead { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.u-provider { font-size: 11px; font-weight: 500; color: var(--dsw-alias-label-tertiary, #8a8a8e); padding: 2px 8px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: 999px; }
.u-label { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); }
.u-level { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.u-actions { margin-left: auto; display: inline-flex; gap: 4px; }
.u-bars { display: grid; gap: 10px; }
.u-bar { display: grid; gap: 5px; }
.u-barTop { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.u-barLabel { font-size: 12px; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.u-barVal { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-variant-numeric: tabular-nums; }
.u-track { height: 6px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); overflow: hidden; }
.u-fill { height: 100%; border-radius: 999px; background: var(--dsw-alias-state-success-primary, #4caf50); transition: width 300ms ease; }
.u-note { margin: 4px 0; font-size: 12px; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.u-note--error { color: var(--dsw-alias-state-error-primary, #ef5350); }
.u-meta { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.u-mask { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; padding: 20px; }
.u-modal { width: min(420px, 92vw); background: var(--dsw-alias-bg-layer-1, #1c1c1f); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 16px; display: grid; gap: 10px; max-height: 86vh; overflow-y: auto; }
.u-modalTitle { font-size: 14px; font-weight: 600; }
.u-f { display: grid; gap: 4px; font-size: 12px; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.u-f input, .u-f select { min-height: 30px; padding: 4px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; }
.u-modalFoot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
@media (prefers-reduced-motion: reduce) { .u-btn, .u-fill { transition: none; } }
`

let installed = false

export function installStyles(target: Document): () => void {
  if (installed) return () => {}
  installed = true
  const style = target.createElement('style')
  style.className = 'dsh-usage-styles'
  style.textContent = USAGE_STYLES
  target.head.append(style)
  return () => {
    installed = false
    style.remove()
  }
}
