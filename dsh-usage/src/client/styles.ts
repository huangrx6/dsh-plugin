/**
 * Subscription usage monitor styles — aligned to dsh-plugin design tokens.
 *
 * Spacing: standard gradient (sm=4, md=6, lg=8, xl=10, 2xl=12, 3xl=14)
 * Typography: section label 11px/500, row name 13px/600, meta 11px, body 12px
 * Radius: group 12px, input 8px, button 6px, tag 999px
 * Colors: group bg layer-2, border 8%, input bg 3%, hover 4%
 * Buttons: 28px height, secondary/primary/ghost recipes
 * Cards: 18px padding, 6% border, gradient bg
 * Modals: overlay rgba(0,0,0,0.45)+blur(4px), 12px radius, 560px width
 * Bars: semantic fill colors (green → yellow → red)
 */
export const USAGE_STYLES = `
/* ── top-level card ── */
.u-card { max-width: 760px; }

/* ── top toolbar ── */
.u-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.u-hint {
  flex: 1 1 260px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* ── buttons (secondary) ── */
.u-btn {
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
.u-btn:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
}
.u-btn:active {
  transform: scale(0.97);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
}
.u-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe);
  outline-offset: -2px;
}
.u-btn:disabled {
  opacity: 0.45;
  cursor: default;
}
.u-btn:disabled:active {
  transform: none;
}

/* ── primary button ── */
.u-btn--primary {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
}
.u-btn--primary:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent);
}
.u-btn--primary:active {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
}

/* ── mini / quiet button ── */
.u-mini {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 6px;
  background: transparent;
  border: 0;
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease),
              color 120ms var(--ds-ease-in-out, ease);
}
.u-mini:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.u-mini:active {
  transform: scale(0.97);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
}
.u-mini:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe);
  outline-offset: -2px;
}
.u-mini--danger {
  color: var(--dsw-alias-state-error-primary, #ef5350);
}
.u-mini--danger:hover {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent);
  color: var(--dsw-alias-state-error-primary, #ef5350);
}

/* ── entry list ── */
.u-list {
  display: grid;
  gap: 8px;
}

/* ── entry row (group container) ── */
.u-row {
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  padding: 6px;
}

/* ── row header ── */
.u-rowHead {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
  padding: 0 2px;
}

/* ── provider badge (tag / pill) ── */
.u-provider {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  padding: 2px 8px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: 999px;
}

/* ── entry label / name ── */
.u-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #f4f4f5);
}

/* ── level text ── */
.u-level {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* ── row actions ── */
.u-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 4px;
}

/* ── bars container ── */
.u-bars {
  display: grid;
  gap: 8px;
  padding: 0 2px;
}

/* ── single bar ── */
.u-bar {
  display: grid;
  gap: 4px;
}
.u-barTop {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.u-barLabel {
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.u-barVal {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font-variant-numeric: tabular-nums;
}

/* ── progress track ── */
.u-track {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  overflow: hidden;
}

/* ── progress fill — semantic colors ── */
.u-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 300ms ease, background-color 300ms ease;
}
/* safe (remaining > 50%) */
.u-fill[data-fill="safe"] {
  background: var(--dsw-alias-state-success-primary, #4caf50);
}
/* warning (remaining 20-50%) */
.u-fill[data-fill="warning"] {
  background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 90%, transparent);
}
/* critical (remaining < 20%) */
.u-fill[data-fill="critical"] {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 85%, transparent);
}
/* unknown / default */
.u-fill:not([data-fill]) {
  background: var(--dsw-alias-state-success-primary, #4caf50);
}

/* ── notes ── */
.u-note {
  margin: 4px 2px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.u-note--error {
  color: var(--dsw-alias-state-error-primary, #ef5350);
}
.u-meta {
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* ── modal overlay ── */
.u-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: dsh-usage-maskIn 160ms var(--ds-ease-in-out, ease) both;
}
@keyframes dsh-usage-maskIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── modal shell ── */
.u-modal {
  width: min(560px, 100%);
  background: var(--dsw-alias-bg-layer-1, #1c1c1f);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  padding: 14px;
  display: grid;
  gap: 10px;
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  animation: dsh-usage-modalUp 160ms var(--ds-ease-in-out, ease) both;
}
@keyframes dsh-usage-modalUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── modal title ── */
.u-modalTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #f4f4f5);
}

/* ── form fields ── */
.u-f {
  display: grid;
  gap: 4px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.u-f input,
.u-f select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12.5px;
  outline: 0;
  transition: border-color 120ms var(--ds-ease-in-out, ease);
}
.u-f input::placeholder {
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.u-f input:hover,
.u-f select:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
}
.u-f input:focus,
.u-f select:focus {
  border-color: var(--dsw-alias-state-business-primary, #6ea8fe);
}

/* ── modal footer ── */
.u-modalFoot {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

/* ── H5 overrides (<=767px) ── */
@media (max-width: 767px) {
  .u-card { max-width: 100%; }
  .u-top { gap: 8px; }
  .u-list { gap: 8px; }
  .u-row { padding: 8px; }
  .u-rowHead { padding: 0; }
  .u-bars { padding: 0; }
  .u-btn { height: 36px; padding: 0 12px; }
  .u-mini { height: 36px; padding: 0 8px; }
  .u-mask { padding: 12px; }
  .u-modal {
    width: 100%;
    padding: 14px;
    max-height: calc(100dvh - 24px);
  }
  .u-f input,
  .u-f select { height: 38px; }
}

/* ── reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .u-btn,
  .u-mini,
  .u-fill,
  .u-f input,
  .u-f select { transition: none; }
  .u-btn:active,
  .u-mini:active { transform: none; }
  .u-mask,
  .u-modal { animation: none; }
}
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
