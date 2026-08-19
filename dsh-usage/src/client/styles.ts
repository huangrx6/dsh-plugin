/**
 * Subscription usage monitor styles — polished edition.
 *
 * Cards: accent-colored left border, gradient bg, generous padding
 * Bars: 8px tall, semantic fill colors with glow
 * Modal: card-based provider selector, clean form layout
 * Buttons: 28px height, subtle accent on primary actions
 */
export const USAGE_STYLES = `
/* ── top-level card ── */
.u-card { max-width: 760px; }

/* ── spin animation for refresh ── */
@keyframes u-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.u-spin { animation: u-spin 800ms linear infinite; }

/* ── top toolbar ── */
.u-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 0 2px;
}
.u-hint {
  flex: 1 1 240px;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* ── buttons ── */
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
.u-btn:disabled { opacity: 0.45; cursor: default; }
.u-btn:disabled:active { transform: none; }
.u-btn--primary {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
}
.u-btn--primary:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent);
}
.u-btn--accent {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 12%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 28%, transparent);
  color: var(--dsw-alias-state-business-primary, #6ea8fe);
}
.u-btn--accent:hover {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 18%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 40%, transparent);
}

/* ── mini / quiet button ── */
.u-mini {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease),
              border-color 120ms var(--ds-ease-in-out, ease),
              color 120ms var(--ds-ease-in-out, ease);
}
.u-mini:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.u-mini:active { transform: scale(0.97); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.u-mini:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.u-mini--danger { color: var(--dsw-alias-state-error-primary, #ef5350); }
.u-mini--danger:hover {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent);
}

/* ── empty state ── */
.u-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 16px;
  margin: 0 2px;
  font-size: 12.5px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent);
  border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.u-empty--error { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent); }
.u-empty-text { font-size: 12.5px; }

/* ── subscription cards ── */
@keyframes u-rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.u-list {
  display: grid;
  gap: 10px;
}
.u-row {
  --u-accent: #6ea8fe;
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent), transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-left: 3px solid var(--u-accent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  padding: 16px;
  animation: u-rowIn 320ms var(--ds-ease-in-out, ease) both;
}
.u-row:nth-child(2) { animation-delay: 40ms; }
.u-row:nth-child(3) { animation-delay: 80ms; }
.u-row:nth-child(4) { animation-delay: 120ms; }
.u-row:nth-child(5) { animation-delay: 160ms; }
.u-row:nth-child(n+6) { animation-delay: 200ms; }
.u-row:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  border-left-color: var(--u-accent);
  transition: border-color 200ms var(--ds-ease-in-out, ease),
              transform 200ms var(--ds-ease-in-out, ease);
}

/* ── row header ── */
.u-rowHead {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.u-provider-icon {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--u-accent);
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--u-accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--u-accent) 20%, transparent);
  border-radius: 8px;
}
.u-rowInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.u-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  line-height: 1.3;
}
.u-provider {
  font-size: 11.5px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.u-level { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.u-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 4px;
}

/* ── bars container ── */
.u-bars {
  display: grid;
  gap: 10px;
  padding: 0 2px;
}
.u-bar-loading {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  padding: 6px 2px;
}
.u-bar-loading--error { color: var(--dsw-alias-state-error-primary, #ef5350); }

/* ── single bar ── */
.u-bar { display: grid; gap: 5px; }
.u-barTop {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.u-barLabel {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font-weight: 500;
}
.u-barVal {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.u-barVal[data-fill="safe"] { color: var(--dsw-alias-state-success-primary, #4caf50); }
.u-barVal[data-fill="warning"] { color: var(--dsw-alias-state-warning-primary, #d97706); }
.u-barVal[data-fill="critical"] { color: var(--dsw-alias-state-error-primary, #ef5350); }

/* ── progress track ── */
.u-track {
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  overflow: hidden;
}
.u-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 400ms cubic-bezier(0.4, 0, 0.2, 1), background-color 300ms ease;
}
.u-fill[data-fill="safe"] {
  background: linear-gradient(90deg, var(--dsw-alias-state-success-primary, #4caf50), color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 70%, white));
}
.u-fill[data-fill="warning"] {
  background: linear-gradient(90deg, var(--dsw-alias-state-warning-primary, #d97706), color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 70%, white));
}
.u-fill[data-fill="critical"] {
  background: linear-gradient(90deg, var(--dsw-alias-state-error-primary, #ef5350), color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 70%, white));
}
.u-fill:not([data-fill]) {
  background: var(--dsw-alias-state-success-primary, #4caf50);
}

/* ── meta ── */
.u-meta {
  margin-top: 10px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  text-align: right;
}

/* ── modal overlay ── */
.u-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: u-maskIn 160ms var(--ds-ease-in-out, ease) both;
}
@keyframes u-maskIn { from { opacity: 0; } to { opacity: 1; } }

/* ── modal shell ── */
.u-modal {
  width: min(480px, 100%);
  background: var(--dsw-alias-bg-layer-1, #1c1c1f);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  padding: 20px;
  display: grid;
  gap: 14px;
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  animation: u-modalUp 180ms var(--ds-ease-in-out, ease) both;
  box-shadow: 0 24px 48px rgba(0,0,0,0.3);
}
@keyframes u-modalUp {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── modal title ── */
.u-modalTitle {
  font-size: 15px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  letter-spacing: -0.01em;
}

/* ── provider card selector ── */
.u-providerGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.u-providerCard {
  --u-accent: #6ea8fe;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  cursor: pointer;
  font: inherit;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
}
.u-providerCard:hover {
  background: color-mix(in srgb, var(--u-accent) 6%, transparent);
  border-color: color-mix(in srgb, var(--u-accent) 30%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.u-providerCard.is-selected {
  background: color-mix(in srgb, var(--u-accent) 10%, transparent);
  border-color: color-mix(in srgb, var(--u-accent) 50%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--u-accent) 20%, transparent);
}
.u-providerCard-initials {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}
.u-providerCard-name { font-size: 12px; font-weight: 500; }

/* ── region row ── */
.u-regionRow {
  display: grid;
  grid-template-columns: 1fr;
}
.u-f--row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.u-f--row > span { flex: 0 0 auto; }
.u-f--row > select { flex: 1; }

/* ── form fields ── */
.u-f {
  display: grid;
  gap: 5px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font-weight: 500;
}
.u-f input,
.u-f select {
  height: 34px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12.5px;
  outline: 0;
  transition: border-color 120ms var(--ds-ease-in-out, ease),
              background-color 120ms var(--ds-ease-in-out, ease);
}
.u-f input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.u-f input:hover,
.u-f select:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
}
.u-f input:focus,
.u-f select:focus {
  border-color: var(--dsw-alias-state-business-primary, #6ea8fe);
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 3%, transparent);
}

/* ── modal footer ── */
.u-modalFoot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}

/* ── H5 overrides ── */
@media (max-width: 767px) {
  .u-card { max-width: 100%; }
  .u-top { gap: 6px; }
  .u-list { gap: 8px; }
  .u-row { padding: 12px; }
  .u-bars { gap: 8px; }
  .u-btn { height: 36px; padding: 0 12px; }
  .u-mini { height: 34px; padding: 0 8px; }
  .u-mask { padding: 16px; }
  .u-modal {
    width: 100%;
    padding: 16px;
    max-height: calc(100dvh - 24px);
    gap: 12px;
  }
  .u-providerGrid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .u-providerCard { padding: 12px 6px; }
  .u-f input,
  .u-f select { height: 40px; }
}

/* ── reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .u-btn, .u-mini, .u-fill, .u-f input, .u-f select, .u-row, .u-providerCard { transition: none; }
  .u-btn:active, .u-mini:active { transform: none; }
  .u-mask, .u-modal { animation: none; }
  .u-spin { animation: none; }
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
