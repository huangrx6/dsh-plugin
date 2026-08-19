/** Agent rules editor styles — Quiet Structure, mirrors the other sections. */
export const AGENT_RULES_STYLES = `
.agr-section { max-width: 760px; }
.agr-group {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  padding: 8px;
}
.agr-toolbar { display: flex; align-items: center; gap: 10px; padding: 4px 8px 6px; }
.agr-label { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); }
.agr-meta { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-variant-numeric: tabular-nums; }
.agr-editor {
  width: 100%;
  min-height: 280px;
  resize: vertical;
  box-sizing: border-box;
  padding: 12px 14px;
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  outline: 0;
  overflow-wrap: anywhere;
}
.agr-editor:focus { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 26%, transparent); }
.agr-editor:disabled { opacity: 0.6; }
.agr-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px 8px 4px; }
.agr-hint { flex: 1 1 260px; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.agr-btn {
  display: inline-flex; align-items: center; min-height: 28px; padding: 4px 14px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit; font-size: 12px; cursor: pointer; transition: background-color 120ms ease;
}
.agr-btn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.agr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.agr-btn--primary {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
}
.agr-note { margin: 6px 8px 4px; font-size: 12px; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.agr-note--error { color: var(--dsw-alias-state-error-primary, #ef5350); }
@media (prefers-reduced-motion: reduce) {
  .agr-btn { transition: none; }
}
`

let installed = false

export function installStyles(target: Document): () => void {
  if (installed) return () => {}
  installed = true
  const style = target.createElement('style')
  style.className = 'dsh-agent-rules-styles'
  style.textContent = AGENT_RULES_STYLES
  target.head.append(style)
  return () => {
    installed = false
    style.remove()
  }
}
