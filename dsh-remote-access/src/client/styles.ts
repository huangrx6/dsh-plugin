/**
 * Remote Access panel styles (Quiet Structure v3 -- hero + card columns).
 *
 * Layout direction (Raycast / Linear settings page):
 *   - Status hero sits directly on the page background: a single 22px/600
 *     status word with an 8px tone dot is the page's signature element.
 *     URL in monospace, actions pinned to the right column; the hero wears
 *     no card chrome so the quiet cards below recede.
 *   - A hairline divider (20px optical gap) separates the hero from the
 *     two-column body: QR card (fixed width) + diagnostics card (fluid).
 *   - Single accent stays neutral: the solid CTA uses the theme's official
 *     button-primary-fill / label-primary-foreground pair; state colors are
 *     reserved for status semantics (success / warn / error).
 *
 * Design principles applied:
 *   - No emoji anywhere
 *   - Flat surfaces: cards use thin borders + micro-tint fill, no shadows
 *     except the QR white plate (scannability requires a light tray)
 *   - Buttons: ghost (default), danger ghost (destructive), solid (CTA);
 *     6px radius, active scale(0.97), no box-shadow
 *   - Card labels: uppercase, 0.06em letter-spacing, tertiary color
 *   - No pure black text; dark-mode primary: #e4e4e7
 *   - Motion limited to bg/color 120ms, hero rise-in, issue stagger
 *
 * Class prefix: `dsh-ra-` (component contract -- do not rename).
 *
 * Token alignment: spacing, typography, radius, color recipes (surface /
 * border / interaction / state), button specs and card specs are sourced
 * from design-tokens.md.
 */
export function installStyles(doc: Document): () => void {
  const CSS = `
/* ─── Shell: single column, 14px rhythm ─── */
.dsh-ra-panel { display: flex; flex-direction: column; gap: 14px; max-width: 760px; }

/* ─── Status hero: no card chrome, the page's signature element ─── */
.dsh-ra-hero {
  display: flex; flex-direction: column; gap: 10px;
  animation: dsh-ra-rise 260ms var(--ds-ease-in-out, ease) both;
}
.dsh-ra-hero-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dsh-ra-hero-title {
  display: flex; align-items: center; gap: 10px; margin: 0;
  font-size: 22px; font-weight: 600; line-height: 1.25; letter-spacing: -0.01em;
  color: var(--dsw-alias-label-primary, #e4e4e7);
}
/* 8px tone dot: green=enabled / gray=disabled / red=error; soft halo only on loud tones */
.dsh-ra-hero-dot {
  flex: 0 0 8px; width: 8px; height: 8px; border-radius: 50%;
  background: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dsh-ra-hero[data-tone='on'] .dsh-ra-hero-dot {
  background: var(--dsw-alias-state-success-primary, #4caf50);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 16%, transparent);
}
.dsh-ra-hero[data-tone='error'] .dsh-ra-hero-dot {
  background: var(--dsw-alias-state-error-primary, #ef5350);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 16%, transparent);
}

/* URL row: monospace 13px full-width + actions pinned right */
.dsh-ra-hero-url { display: flex; align-items: center; gap: 12px; min-height: 30px; }
.dsh-ra-url {
  flex: 1; min-width: 0;
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 13px; line-height: 1.5;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dsh-ra-hero-actions {
  display: flex; align-items: center; gap: 8px; flex: none; margin-left: auto;
}
.dsh-ra-hero-meta {
  margin: 0; font-size: 12px; line-height: 1.6;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  overflow-wrap: anywhere;
}
.dsh-ra-hero-warn { color: var(--dsw-alias-state-warn-primary, #d97706); }

/* ─── Divider: hero -> body, 20px optical gap (14 rhythm + 6 margins) ─── */
.dsh-ra-sep {
  flex: none; height: 1px; margin: 6px 0;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 8%, transparent);
}

/* ─── Body columns: QR card (fixed) + diagnostics card (fluid) ─── */
.dsh-ra-columns { display: flex; gap: 12px; align-items: stretch; }
.dsh-ra-card {
  flex: 1 1 auto; min-width: 0;
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px 16px 16px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 3%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.dsh-ra-card-qr { flex: 0 0 248px; }
.dsh-ra-card-label {
  margin: 0; padding: 0 2px;
  font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* ─── QR: centered white tray (QR needs a light background to scan) ─── */
.dsh-ra-qr-body {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 4px 0 2px;
}
.dsh-ra-qr-plate {
  box-sizing: border-box; width: 160px; height: 160px; padding: 12px;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
  border-radius: var(--dsh-layout-radius-user, 8px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}
.dsh-ra-qr-plate svg { display: block; width: 100%; height: 100%; }
.dsh-ra-qr-hint {
  margin: 0; font-size: 11px; line-height: 1.5; text-align: center;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dsh-ra-qr-empty {
  margin: 0; padding: 8px 0 16px;
  font-size: 12px; line-height: 1.55; text-align: center;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  overflow-wrap: anywhere;
}
.dsh-ra-qr-collapse {
  border: none; background: transparent; padding: 2px 8px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  font: inherit; font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dsh-ra-qr-collapse:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 4%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dsh-ra-qr-collapse:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }

/* ─── Diagnostics: one row per issue (6px dot + title + description) ─── */
.dsh-ra-issues { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; }
.dsh-ra-issue {
  display: flex; gap: 10px; padding: 10px 2px;
  animation: dsh-ra-rise 260ms var(--ds-ease-in-out, ease) both;
}
.dsh-ra-issue:nth-child(1) { animation-delay: 0ms; }
.dsh-ra-issue:nth-child(2) { animation-delay: 30ms; }
.dsh-ra-issue:nth-child(3) { animation-delay: 60ms; }
.dsh-ra-issue:nth-child(n+4) { animation-delay: 90ms; }
.dsh-ra-issue + .dsh-ra-issue {
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 6%, transparent);
}
.dsh-ra-issue-dot {
  flex: 0 0 6px; width: 6px; height: 6px; margin-top: 7px;
  border-radius: 50%;
  background: var(--dsw-alias-state-warn-primary, #d97706);
}
.dsh-ra-issue-body { min-width: 0; }
.dsh-ra-issue-message {
  margin: 0; font-size: 13px; font-weight: 500; line-height: 1.5;
  color: var(--dsw-alias-label-primary, #e4e4e7);
  overflow-wrap: anywhere;
}
.dsh-ra-issue-hint {
  margin: 2px 0 0; font-size: 12px; line-height: 1.55;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  overflow-wrap: anywhere;
}

/* All-clear resting state: green check + quiet text */
.dsh-ra-ok { display: flex; align-items: center; gap: 8px; padding: 18px 0 10px; }
.dsh-ra-ok-mark { display: inline-flex; flex: none; color: var(--dsw-alias-state-success-primary, #4caf50); }
.dsh-ra-ok-text { font-size: 13px; color: var(--dsw-alias-label-secondary, #b3b3b8); }

/* ─── Buttons: ghost (default) / danger ghost / solid CTA ─── */
.dsh-ra-btn {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  height: 30px; padding: 0 12px; gap: 6px;
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 10%, transparent);
  background: transparent; color: var(--dsw-alias-label-primary, #e4e4e7);
  font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease);
}
.dsh-ra-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 5%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 16%, transparent);
}
.dsh-ra-btn:active:not(:disabled) { transform: scale(0.97); }
.dsh-ra-btn:disabled { opacity: 0.45; cursor: default; }
.dsh-ra-btn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }

/* Danger ghost: destructive action while service is enabled */
.dsh-ra-btn-danger {
  color: var(--dsw-alias-state-error-primary, #ef5350);
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent);
}
.dsh-ra-btn-danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 32%, transparent);
}

/* Solid CTA: theme's official primary fill + contrast foreground */
.dsh-ra-btn-solid {
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary, #e4e4e7));
  color: var(--dsw-alias-label-primary-foreground, #101014);
  font-weight: 600;
}
.dsh-ra-btn-solid:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 86%, transparent));
}

/* Icon button: 28px square, ghost style */
.dsh-ra-icon-btn {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 28px; height: 28px; border: none;
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dsh-ra-icon-btn:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 5%, transparent);
  color: var(--dsw-alias-label-primary, #e4e4e7);
}
.dsh-ra-icon-btn:active { transform: scale(0.97); }
.dsh-ra-icon-btn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }

/* ─── Loading / error / action hint ─── */
.dsh-ra-hint {
  display: flex; align-items: center; gap: 8px; margin: 0;
  font-size: 12px; line-height: 1.55;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dsh-ra-spin { display: inline-flex; animation: dsh-ra-rotate 1s linear infinite; }
@keyframes dsh-ra-rotate { to { transform: rotate(360deg); } }
.dsh-ra-error {
  margin: 0; padding: 8px 12px;
  color: var(--dsw-alias-state-error-primary, #ef5350);
  font-size: 12px; line-height: 1.55;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  overflow-wrap: anywhere;
}
.dsh-ra-action-hint {
  margin: 0; font-size: 12px; line-height: 1.55;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  overflow-wrap: anywhere;
}

/* ─── Footnotes ─── */
.dsh-ra-notes {
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #e4e4e7) 6%, transparent);
  padding-top: 2px;
  display: flex; flex-direction: column; gap: 4px;
}
.dsh-ra-notes p {
  margin: 0; max-width: 560px;
  font-size: 11px; line-height: 1.6;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  overflow-wrap: anywhere;
}

/* ─── Entrance motion ─── */
@keyframes dsh-ra-rise {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ─── Responsive (<=767px): columns stack; touch targets >=36px; URL wraps ─── */
@media (max-width: 767px) {
  .dsh-ra-columns { flex-direction: column; }
  .dsh-ra-card-qr { flex-basis: auto; }
  .dsh-ra-btn { height: 36px; padding: 0 14px; }
  .dsh-ra-icon-btn { width: 36px; height: 36px; }
  .dsh-ra-hero-url { flex-wrap: wrap; }
  .dsh-ra-url { flex-basis: 100%; white-space: normal; word-break: break-all; overflow-wrap: anywhere; }
  .dsh-ra-hero-actions { margin-left: 0; }
  /* entrance motion only on initial desktop load, not on every H5 repaint */
  .dsh-ra-hero, .dsh-ra-issue { animation: none; }
}

/* ─── dsh-layout material bridge: frosted glass when material is on ─── */
html[data-dsh-layout-material='on'] .dsh-ra-card {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}

/* ─── Motion safety: transitions and entrance dropped under reduced motion ─── */
@media (prefers-reduced-motion: reduce) {
  .dsh-ra-btn, .dsh-ra-icon-btn, .dsh-ra-qr-collapse { transition: none; }
  .dsh-ra-btn:active:not(:disabled), .dsh-ra-icon-btn:active, .dsh-ra-qr-collapse:active { transform: none; }
  .dsh-ra-spin { animation: none; }
  .dsh-ra-hero, .dsh-ra-issue { animation: none; }
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
