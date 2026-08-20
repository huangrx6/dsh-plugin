/**
 * Subscription usage monitor — dashboard stat-card edition.
 *
 * Layout: toolbar + responsive card grid (2 cols PC, 1 col H5).
 * Card anatomy: wordmark tile → hero (big tabular percent + wide bar,
 * tinted by semantic state) → per-window breakdown rows.
 * All fills share one semantic ramp (green / amber / red), the accent
 * hue only tints the tile and card top hairline.
 */
export const USAGE_STYLES = `
/* ── top-level card ── */
/* Fill the workspace content track like the skill/mcp card grids — no
   860px cap leaving dead space on the right. */
.u-card { max-width: none; }

/* ── spin ── */
@keyframes u-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.u-spin { animation: u-spin 800ms linear infinite; }

/* ── toolbar ── */
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
.u-btn:active { transform: scale(0.97); }
.u-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe);
  outline-offset: -2px;
}
.u-btn:disabled { opacity: 0.45; cursor: default; }
.u-btn:disabled:active { transform: none; }
.u-btn--primary {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
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

/* ── quiet mini buttons ── */
.u-mini {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 7px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease),
              color 120ms var(--ds-ease-in-out, ease);
}
.u-mini:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.u-mini:active { transform: scale(0.97); }
.u-mini:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.u-mini--danger { color: var(--dsw-alias-state-error-primary, #ef5350); }
.u-mini--danger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); }

/* ── empty / error ── */
.u-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  margin: 0 2px;
  font-size: 12.5px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent);
  border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.u-empty--error { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent); }

/* ── stat card grid ── */
.u-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;
}

/* ── one stat card ── */
.u-stat {
  --u-accent: #6ea8fe;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 18px 16px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  overflow: hidden;
  transition: border-color 200ms var(--ds-ease-in-out, ease),
              transform 200ms var(--ds-ease-in-out, ease);
}
.u-stat::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--u-accent) 55%, transparent), transparent 70%);
}
.u-stat:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  transform: translateY(-1px);
}

/* card head */
.u-statHead {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.u-statTile {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--u-accent);
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--u-accent) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--u-accent) 22%, transparent);
  border-radius: 8px;
}
.u-statInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.u-statName {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.u-statProvider {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.u-statActions {
  flex: none;
  display: inline-flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 140ms var(--ds-ease-in-out, ease);
}
.u-stat:hover .u-statActions,
.u-stat:focus-within .u-statActions { opacity: 1; }

/* hero: big remaining percent + wide bar */
.u-statHero {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.u-statValue {
  font-size: 34px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.u-statHero[data-fill="warning"] .u-statValue { color: var(--dsw-alias-state-warning-primary, #d97706); }
.u-statHero[data-fill="critical"] .u-statValue { color: var(--dsw-alias-state-error-primary, #ef5350); }
.u-statUnit {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0;
  margin-left: 2px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.u-statHeroTrack {
  display: block;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  overflow: hidden;
}
.u-statHeroFill {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 500ms cubic-bezier(0.22, 0.61, 0.36, 1);
}
.u-statHeroFill[data-fill="safe"] { background: var(--dsw-alias-state-success-primary, #22c55e); }
.u-statHeroFill[data-fill="warning"] { background: var(--dsw-alias-state-warning-primary, #d97706); }
.u-statHeroFill[data-fill="critical"] { background: var(--dsw-alias-state-error-primary, #ef5350); }

/* pending / error rows in place of the hero */
.u-statPending {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  padding: 10px 0 2px;
}
.u-statError {
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-state-error-primary, #ef5350);
  padding: 8px 10px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent);
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  overflow-wrap: anywhere;
}

/* per-window breakdown */
.u-statBars {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.u-statBarRow {
  display: grid;
  grid-template-columns: minmax(72px, auto) minmax(0, 1fr) 40px;
  align-items: center;
  gap: 10px;
}
.u-statBarLabel {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.u-statBarName {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  white-space: nowrap;
}
.u-statBarDetail {
  font-size: 10px;
  line-height: 1.35;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* roomier label column on H5 so long reset timestamps are readable */
@media (max-width: 767px) {
  .u-statBarRow { grid-template-columns: minmax(96px, auto) minmax(0, 1fr) 40px; }
  .u-statBarDetail { font-size: 9.5px; }
}
.u-statBarTrack {
  display: block;
  height: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  overflow: hidden;
}
.u-statBarFill {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 500ms cubic-bezier(0.22, 0.61, 0.36, 1);
}
.u-statBarFill[data-fill="safe"] { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #22c55e) 75%, transparent); }
.u-statBarFill[data-fill="warning"] { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 80%, transparent); }
.u-statBarFill[data-fill="critical"] { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 80%, transparent); }
.u-statBarVal {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  text-align: right;
}

/* ── meta ── */
.u-meta {
  margin: 12px 2px 0;
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
}
@keyframes u-modalUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.u-modalTitle {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--dsw-alias-label-primary, #f4f4f5);
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
  gap: 8px;
  padding: 14px 8px;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  cursor: pointer;
  font: inherit;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}
.u-providerCard:hover {
  background: color-mix(in srgb, var(--u-accent) 6%, transparent);
  border-color: color-mix(in srgb, var(--u-accent) 30%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.u-providerCard.is-selected {
  background: color-mix(in srgb, var(--u-accent) 8%, transparent);
  border-color: color-mix(in srgb, var(--u-accent) 36%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.u-providerCard-initials {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #fff;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}
.u-providerCard-name { font-size: 12px; font-weight: 500; }

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
  transition: border-color 120ms var(--ds-ease-in-out, ease);
}
.u-f input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.u-f input:hover,
.u-f select:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.u-f input:focus,
.u-f select:focus { border-color: var(--dsw-alias-state-business-primary, #6ea8fe); }

/* ── modal footer ── */
.u-modalFoot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}

/* ── H5 ── */
@media (max-width: 767px) {
  .u-card { max-width: 100%; }
  .u-grid { grid-template-columns: 1fr; gap: 10px; }
  .u-stat { padding: 14px 14px 12px; gap: 12px; }
  .u-statActions { opacity: 1; }
  .u-statValue { font-size: 30px; }
  .u-btn { height: 36px; padding: 0 12px; }
  .u-mini { height: 32px; }
  .u-mask { padding: 16px; }
  .u-modal { width: 100%; padding: 16px; max-height: calc(100dvh - 24px); gap: 12px; }
  .u-f input,
  .u-f select { height: 40px; }
}

/* ── dsh-layout material glass bridge — same frosted surface as the
   skill/mcp cards so backgrounds stay consistent when the page material
   is enabled ── */
html[data-dsh-layout-material='on'] .u-stat,
html[data-dsh-layout-material='on'] .u-empty {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}
@media (prefers-reduced-transparency: reduce) {
  html[data-dsh-layout-material='on'] .u-stat,
  html[data-dsh-layout-material='on'] .u-empty {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    background: var(--dsh-layout-mat-solid, var(--dsh-layout-glass-base, #16161a)) !important;
  }
}

/* ── reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .u-btn, .u-mini, .u-stat, .u-statHeroFill, .u-statBarFill, .u-f input, .u-f select { transition: none; }
  .u-btn:active, .u-mini:active { transform: none; }
  .u-stat:hover { transform: none; }
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
