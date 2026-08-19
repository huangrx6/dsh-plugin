/**
 * Remote Access panel styles (Quiet Structure v2).
 *
 * Design direction: macOS Settings-style grouped rows with a single accent
 * color. Surfaces are flat -- groups use thin borders + micro-tint fill,
 * rows use thin separators. Hover only lightens the background. Motion is
 * limited to background/color 120ms transitions, the mandated active
 * scale(0.97) on buttons, and staggered list entrance.
 *
 * Design principles applied:
 *   - No emoji anywhere
 *   - Single accent color (business-primary)
 *   - Ultra-diffuse shadows: opacity < 0.05
 *   - Buttons: solid fill (primary), 6px radius, no box-shadow
 *   - Labels: pill shape, uppercase, letter-spacing 0.06em
 *   - Cards: 1px solid border, max 12px radius
 *   - No pure black text; dark-mode primary: #e4e4e7
 *   - Staggered list animation for rows and issue items
 *
 * Class prefix: `ra-` (component contract -- do not rename).
 *
 * Token alignment: spacing (xs->9xl), typography (xs->4xl), radius
 * (sm/md/lg/xl/full/round), color recipes (surface/border/interaction/
 * state), button specs, card specs, group container specs -- all sourced
 * from design-tokens.md.
 */
export function installStyles(doc: Document): () => void {
  const CSS = `
/* ─── Shell: two-column grid (flex + 320px), single column on mobile ─── */
.ra-panel { display: flex; flex-direction: column; gap: 14px; max-width: 740px; }
.ra-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 12px; align-items: start; }
@media (max-width: 767px) { .ra-grid { grid-template-columns: minmax(0, 1fr); } }

/* ─── Group container: thin border + micro-tint fill, 6px padding ─── */
.ra-group {
  padding: 6px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.ra-group-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; min-height: 30px; padding: 4px 10px 2px 14px;
}

/* ─── Section label: pill shape, uppercase, 0.06em letter-spacing ─── */
.ra-section-label {
  display: inline-flex; align-items: center;
  padding: 2px 8px;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  border-radius: 999px;
}

/* ─── Status card: gradient background for the status group ─── */
.ra-status-card {
  padding: 14px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 2%, transparent),
    transparent
  );
}
.ra-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ra-status-dot {
  flex-shrink: 0;
  width: 6px; height: 6px;
  border-radius: 50%;
}
.ra-status-label {
  font-size: 12px; font-weight: 500;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
/* Tri-state: online / offline / error */
.ra-status--online .ra-status-dot { background: var(--dsw-alias-state-success-primary, #4caf50); }
.ra-status--online .ra-status-label { color: var(--dsw-alias-state-success-primary, #4caf50); }
.ra-status--offline .ra-status-dot { background: var(--dsw-alias-label-tertiary, #8a8a8e); }
.ra-status--offline .ra-status-label { color: var(--dsw-alias-label-secondary, #b3b3b8); }
.ra-status--error .ra-status-dot { background: var(--dsw-alias-state-error-primary, #ef5350); }
.ra-status--error .ra-status-label { color: var(--dsw-alias-state-error-primary, #ef5350); }

/* ─── Rows: 44px height, thin separators (first row none), hover lighten ─── */
.ra-row {
  display: flex; align-items: center; gap: 10px;
  min-height: 44px; padding: 8px 14px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
  animation: ra-stagger-in 260ms var(--ds-ease-in-out, ease) both;
}
.ra-row:nth-child(1) { animation-delay: 0ms; }
.ra-row:nth-child(2) { animation-delay: 30ms; }
.ra-row:nth-child(3) { animation-delay: 60ms; }
.ra-row:nth-child(4) { animation-delay: 90ms; }
.ra-row:nth-child(5) { animation-delay: 120ms; }
.ra-row:nth-child(6) { animation-delay: 150ms; }
.ra-row:nth-child(7) { animation-delay: 180ms; }
.ra-row:nth-child(8) { animation-delay: 210ms; }
.ra-row:nth-child(n+9) { animation-delay: 240ms; }
@keyframes ra-stagger-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.ra-row + .ra-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 6%, transparent); }
.ra-row:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 4%, transparent); }

/* Status row: 6px dot + name (13px/600) + right-side toggle */
.ra-dot {
  flex: 0 0 6px; width: 6px; height: 6px; border-radius: 50%;
  background: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.ra-dot-success { background: var(--dsw-alias-state-success-primary, #4caf50); }
.ra-dot-business { background: var(--dsw-alias-state-warning-primary, #d97706); }
.ra-dot-error { background: var(--dsw-alias-state-error-primary, #ef5350); }
.ra-row-title {
  flex: 1; min-width: 0;
  font-size: 13px; font-weight: 600;
  color: var(--dsw-alias-label-primary, #e4e4e7);
}

/* Address row: monospace body (12px secondary), long text ellipsis (title fallback full) */
.ra-row-text {
  flex: 1; min-width: 0;
  font-size: 12px; color: var(--dsw-alias-label-secondary, #b3b3b8);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ra-mono {
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 12px;
}

/* Meta row: 11px tertiary; picker missing uses warning color annotation */
.ra-meta {
  flex: 1; min-width: 0;
  font-size: 11px; line-height: 1.5;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ra-meta-warn { flex: none; color: var(--dsw-alias-state-warning-primary, #d97706); }

/* ─── Buttons: 28px height (standard), 26px (small); 6px radius ─── */
.ra-btn {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  height: 28px; padding: 0 10px; gap: 5px;
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 10%, transparent);
  background: transparent; color: var(--dsw-alias-label-primary, #e4e4e7);
  font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease);
}
.ra-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 5%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 16%, transparent);
}
.ra-btn:active:not(:disabled) { transform: scale(0.97); background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 8%, transparent); }
.ra-btn:disabled { opacity: 0.45; cursor: default; }
.ra-btn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }

/* Primary button: solid fill, 24% border, no box-shadow */
.ra-btn-primary {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 24%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 10%, transparent);
  font-weight: 600;
}
.ra-btn-primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 14%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 28%, transparent);
}

/* Icon button: 28px square, ghost style */
.ra-icon-btn {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 28px; height: 28px; border: none;
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.ra-icon-btn:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 5%, transparent);
  color: var(--dsw-alias-label-primary, #e4e4e7);
}
.ra-icon-btn:active { transform: scale(0.97); }
.ra-icon-btn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }

/* ─── QR panel: independent card, 12px radius, ultra-diffuse shadow ─── */
.ra-qr-body { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px; }
.ra-qr-empty {
  margin: 0; padding: 8px 14px 12px;
  font-size: 12px; line-height: 1.55;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  text-align: center;
}
.ra-qr-plate {
  box-sizing: border-box; width: 160px; height: 160px; padding: 12px;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}
.ra-qr-plate svg { display: block; width: 100%; height: 100%; }
.ra-qr-hint {
  margin: 0; font-size: 11px; line-height: 1.5;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.ra-qr-collapse {
  border: none; background: transparent; padding: 2px 8px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  font: inherit; font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.ra-qr-collapse:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 4%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.ra-qr-collapse:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }

/* ─── Loading / error ─── */
.ra-hint {
  display: flex; align-items: center; gap: 8px; margin: 0;
  font-size: 12px; line-height: 1.55;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.ra-spin { display: inline-flex; animation: ra-rotate 1s linear infinite; }
@keyframes ra-rotate { to { transform: rotate(360deg); } }
.ra-error {
  margin: 0; padding: 8px 12px;
  color: var(--dsw-alias-state-error-primary, #ef5350);
  font-size: 12px; line-height: 1.55;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  overflow-wrap: anywhere;
}
.ra-issue-hint {
  margin: 0; font-size: 11px; line-height: 1.55;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* ─── Issue list: card-style items, 3% tint bg, 40px min-height, hover 4% ─── */
.ra-issues {
  padding: 6px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 20%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 8%, transparent);
}
.ra-issues-title {
  display: flex; align-items: center; gap: 6px;
  margin: 0; padding: 8px 14px 0;
  font-size: 12px; font-weight: 600;
  color: var(--dsw-alias-state-warning-primary, #d97706);
}
.ra-issues ul {
  margin: 0; padding: 6px; list-style: none;
  display: flex; flex-direction: column; gap: 4px;
}
.ra-issues li {
  display: flex; flex-direction: column; gap: 2px;
  min-height: 40px; padding: 8px 12px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 3%, transparent);
  transition: background 120ms var(--ds-ease-in-out, ease);
  animation: ra-stagger-in 260ms var(--ds-ease-in-out, ease) both;
}
.ra-issues li:nth-child(1) { animation-delay: 0ms; }
.ra-issues li:nth-child(2) { animation-delay: 30ms; }
.ra-issues li:nth-child(3) { animation-delay: 60ms; }
.ra-issues li:nth-child(4) { animation-delay: 90ms; }
.ra-issues li:nth-child(n+5) { animation-delay: 120ms; }
.ra-issues li:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 4%, transparent); }
.ra-issue-message {
  margin: 0; font-size: 12px; line-height: 1.55;
  color: var(--dsw-alias-label-primary, #e4e4e7);
}

/* ─── Footnotes ─── */
.ra-notes {
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 6%, transparent);
  padding-top: 10px; display: flex; flex-direction: column; gap: 4px;
}
.ra-notes p {
  margin: 0; max-width: 560px;
  font-size: 11px; line-height: 1.6;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* ─── Responsive (<=767px): touch targets >=36px; wrap long text ─── */
@media (max-width: 767px) {
  /* button touch targets >=36px */
  .ra-btn { height: 36px; padding: 0 12px; }
  .ra-icon-btn { width: 36px; height: 36px; }
  /* address row: no hover-title on touch, wrap long URLs */
  .ra-row-text { white-space: normal; word-break: break-all; overflow-wrap: anywhere; }
  /* meta row: wrap long device names / gateway tokens */
  .ra-meta { white-space: normal; text-overflow: clip; overflow-wrap: anywhere; }
  /* diagnostics / footnotes: break long commands and URLs */
  .ra-issue-message, .ra-issue-hint, .ra-notes p, .ra-qr-empty { overflow-wrap: anywhere; }
  /* status card: tighten padding */
  .ra-status-card { padding: 10px; }
  /* stagger only on initial load, not on every H5 repaint */
  .ra-row, .ra-issues li { animation: none; }
}

/* ─── dsh-layout material bridge: frosted glass when material is on ─── */
html[data-dsh-layout-material='on'] .ra-group,
html[data-dsh-layout-material='on'] .ra-issues {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .ra-group-qr {
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .ra-issues li {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 24%, transparent);
}

/* ─── Motion safety: transitions and stagger dropped under reduced motion ─── */
@media (prefers-reduced-motion: reduce) {
  .ra-row, .ra-btn, .ra-icon-btn, .ra-qr-collapse { transition: none; }
  .ra-btn:active:not(:disabled), .ra-icon-btn:active, .ra-qr-collapse:active { transform: none; }
  .ra-spin { animation: none; }
  .ra-row, .ra-issues li { animation: none; }
}
`
  const style = doc.createElement('style')
  style.dataset.plugin = 'dsh-remote-access'
  style.textContent = CSS
  doc.head.append(style)
  return () => {
    style.remove()
  }
}
