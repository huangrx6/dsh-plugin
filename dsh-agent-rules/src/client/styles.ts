/**
 * Agent rules editor styles — aligned to dsh-plugin design tokens.
 *
 * Spacing: standard gradient (sm=4, md=6, lg=8, xl=10, 2xl=12, 3xl=14)
 * Typography: section header 16px/600, body 12px/400, input 12.5px/400
 * Radius: group 12px, input 8px, button 6px
 * Colors: group bg layer-2, border 8%, input bg 3%, hover 4%
 * Buttons: 28px height, ghost/primary recipes
 * Forms: textarea 3% bg, 10% border, business-primary focus
 */
export const AGENT_RULES_STYLES = `
/* ── section ── */
.agr-section {
  max-width: 760px;
  display: flex;
  flex-direction: column;
  /* Fill the workspace content pane so the editor occupies the viewport
     instead of collapsing to content height with dead space below. */
  min-height: calc(100dvh - 220px);
}

/* ── group container ── */
.agr-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  padding: 6px;
}

/* ── toolbar (label + meta) ── */
.agr-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px 6px;
}
.agr-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.agr-meta {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font-variant-numeric: tabular-nums;
}

/* ── textarea editor ── */
.agr-editor {
  flex: 1;
  width: 100%;
  min-height: 260px;
  resize: none;
  box-sizing: border-box;
  padding: 12px;
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 12px;
  line-height: 1.6;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  outline: 0;
  overflow-wrap: anywhere;
  transition: border-color 120ms var(--ds-ease-in-out, ease);
}
.agr-editor::placeholder {
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.agr-editor:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
}
.agr-editor:focus {
  border-color: var(--dsw-alias-state-business-primary, #6ea8fe);
}
.agr-editor:disabled {
  opacity: 0.5;
  cursor: default;
}

/* ── actions bar ── */
.agr-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 8px 6px 4px;
}
.agr-hint {
  flex: 1 1 260px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* ── buttons (secondary / ghost) ── */
.agr-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease),
              border-color 120ms var(--ds-ease-in-out, ease);
}
.agr-btn:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
}
.agr-btn:active {
  transform: scale(0.97);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
}
.agr-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe);
  outline-offset: -2px;
}
.agr-btn:disabled {
  opacity: 0.45;
  cursor: default;
}
.agr-btn:disabled:active {
  transform: none;
}

/* ── primary button ── */
.agr-btn--primary {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
}
.agr-btn--primary:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent);
}
.agr-btn--primary:active {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
}

/* ── notes ── */
.agr-note {
  margin: 4px 6px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.agr-note--error {
  color: var(--dsw-alias-state-error-primary, #ef5350);
}

/* ── H5 overrides (<=767px) ── */
@media (max-width: 767px) {
  .agr-section { max-width: 100%; min-height: calc(100dvh - 260px); }
  .agr-group { padding: 8px; }
  .agr-toolbar { padding: 4px 8px 6px; }
  .agr-editor { min-height: 180px; }
  .agr-actions { padding: 8px; }
  .agr-btn { height: 36px; padding: 0 12px; }
  .agr-note { margin: 4px 8px; }
}

/* ── dsh-layout material glass bridge — same frosted surface as the
   skill/mcp cards so the group frame stays consistent under material ── */
html[data-dsh-layout-material='on'] .agr-group {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}

/* ── reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .agr-editor,
  .agr-btn { transition: none; }
  .agr-btn:active { transform: none; }
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
