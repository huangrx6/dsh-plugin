/**
 * Styles for the archive manager section.
 *
 * Visual direction: a single rounded surface that hosts the list on the
 * left and the message timeline on the right. Selected list items are
 * indicated by a thin accent rail on the left, never by a heavy block
 * highlight. The detail pane reads top-to-bottom like a notarial transcript:
 * title, metadata row, action toolbar, then a vertical timeline of events.
 * Custom-property tokens (`--dam-*`) tune spacing, radius, and tone so the
 * whole surface feels designed, not assembled.
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
/* ── design tokens (tunable in one place) ─────────────────────────────────── */
.dam-section {
  /* surface */
  --dam-radius: 16px;
  --dam-radius-sm: 10px;
  --dam-line: color-mix(in srgb, var(--dsw-alias-border-strong, #888) 24%, transparent);
  --dam-line-soft: color-mix(in srgb, var(--dsw-alias-border-strong, #888) 12%, transparent);
  --dam-surface: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 65%, transparent);
  --dam-surface-flat: var(--dsw-alias-bg-layer-2, #fff);
  --dam-elev: 0 1px 0 0 color-mix(in srgb, var(--dsw-alias-border-strong, #888) 8%, transparent) inset,
              0 8px 24px -12px color-mix(in srgb, #000 18%, transparent);
  --dam-accent: #3678ea;
  --dam-accent-soft: color-mix(in srgb, #3678ea 18%, transparent);
  --dam-muted: var(--dsw-alias-label-tertiary, #888);
  --dam-text: var(--dsw-alias-label-primary, inherit);
  --dam-user: #3678ea;
  --dam-assistant: #16a34a;
  --dam-tool: #d97706;
  --dam-tool-ok: #16a34a;
  --dam-tool-err: #dc2626;
}

/* outer wrapper */
.dam-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  font-family: var(--dsw-alias-font-sans, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", sans-serif);
  color: var(--dam-text);
}

/* lede — a single quiet sentence at the top, not a callout */
.dam-banner {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--dam-muted);
  margin: 0 4px;
}

/* surface — a single rounded container hosting list + detail. We aim
   for a 2-pane layout at every width: at the typical settings-dialog
   right-column width (~440-540px on desktop) the list takes ~180px
   and the detail takes the rest; on small phones the list collapses
   to a single scrollable chip row above the detail. */
.dam-surface {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  min-height: 520px;
  border: 1px solid var(--dam-line);
  border-radius: var(--dam-radius);
  background: transparent;
  box-shadow: var(--dam-elev);
  overflow: hidden;
}
@media (max-width: 520px) {
  .dam-surface { grid-template-columns: 1fr; }
}

/* ── list pane ─────────────────────────────────────────────────────────── */
.dam-list {
  display: flex;
  flex-direction: column;
  /* a whisper of bg behind the list, anchored by the surface's own
     border; no harsh vertical divider so the surface reads as one piece. */
  background: color-mix(in srgb, var(--dam-surface-flat) 30%, transparent);
  min-width: 0;
  position: relative;
}
.dam-list::after {
  /* hairline divider at the right edge of the list pane */
  content: '';
  position: absolute;
  inset: 12px 0 12px auto;
  width: 1px;
  background: var(--dam-line-soft);
  pointer-events: none;
}
.dam-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 6px;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--dam-muted);
  font-weight: 600;
}
.dam-list-header-count {
  font-variant-numeric: tabular-nums;
  color: var(--dam-text);
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  font-size: 12px;
}
.dam-list-scroll {
  overflow-y: auto;
  padding: 4px 10px 12px;
  min-height: 0;
}
.dam-list-empty {
  padding: 32px 18px;
  text-align: center;
  color: var(--dam-muted);
  font-size: 13px;
  line-height: 1.5;
}
.dam-list-empty-icon {
  font-size: 28px;
  opacity: 0.5;
  margin-bottom: 6px;
  line-height: 1;
}

/* list item — single-line title + meta on a quiet 1px accent rail that
   lights up on select. Designed to be scannable in 180px. */
.dam-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
  padding: 8px 8px 8px 11px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: background 100ms ease, transform 80ms ease;
}
.dam-item + .dam-item { margin-top: 1px; }
.dam-item::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block: 6px;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: transparent;
  transition: background 100ms ease;
}
.dam-item:hover { background: color-mix(in srgb, var(--dsw-alias-interactive-bg-hover, #88888818) 100%, transparent); }
.dam-item--active { background: color-mix(in srgb, var(--dam-accent) 14%, transparent); }
.dam-item--active::before { background: var(--dam-accent); }
.dam-item-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.dam-item-title {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.35;
  color: var(--dam-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.005em;
}
.dam-item--active .dam-item-title { font-weight: 600; }
.dam-item-meta {
  font-size: 10.5px;
  color: var(--dam-muted);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dam-item-meta-dot { opacity: 0.4; }
.dam-item-chevron {
  flex-shrink: 0;
  opacity: 0.3;
  transition: opacity 100ms ease, transform 100ms ease;
}
.dam-item:hover .dam-item-chevron { opacity: 0.6; }
.dam-item--active .dam-item-chevron { opacity: 0.9; transform: translateX(2px); }

/* ── detail pane ───────────────────────────────────────────────────────── */
.dam-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: transparent;
}
.dam-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 320px;
  padding: 48px 24px;
  text-align: center;
  color: var(--dam-muted);
  font-size: 13px;
  line-height: 1.6;
  gap: 8px;
}
.dam-detail-empty-icon {
  font-size: 36px;
  line-height: 1;
  opacity: 0.35;
  margin-bottom: 4px;
}
.dam-detail-empty-hint {
  font-size: 12px;
  color: var(--dam-muted);
  opacity: 0.7;
}

/* detail header — vertical at narrow widths to give the title room
   to breathe and the action toolbar room to wrap without crowding. */
.dam-detail-head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--dam-line-soft);
  background: color-mix(in srgb, var(--dam-surface-flat) 30%, transparent);
}
.dam-detail-head-text { min-width: 0; }
.dam-detail-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.015em;
  color: var(--dam-text);
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-feature-settings: "ss01" 1, "cv11" 1;
}
.dam-detail-id-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: var(--dam-muted);
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  flex-wrap: wrap;
}
.dam-detail-id-row code {
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--dsw-alias-label-tertiary, #888) 14%, transparent);
  color: var(--dam-text);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex-shrink: 1;
}
.dam-detail-id-sep {
  width: 3px; height: 3px; border-radius: 50%;
  background: currentColor; opacity: 0.4;
  display: inline-block;
  flex-shrink: 0;
}

/* action toolbar — wraps gracefully when the column is narrow */
.dam-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* action toolbar */
.dam-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dam-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  border: 1px solid var(--dam-line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 75%, transparent);
  color: var(--dam-text);
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, transform 80ms ease;
  white-space: nowrap;
}
.dam-btn:hover {
  border-color: color-mix(in srgb, var(--dam-accent) 50%, var(--dam-line));
  background: color-mix(in srgb, var(--dam-accent) 6%, var(--dsw-alias-bg-layer-2, #fff));
}
.dam-btn:active { transform: translateY(0.5px); }
.dam-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dam-btn--primary {
  background: var(--dam-accent);
  border-color: var(--dam-accent);
  color: #fff;
}
.dam-btn--primary:hover {
  background: color-mix(in srgb, var(--dam-accent) 88%, #000);
  border-color: color-mix(in srgb, var(--dam-accent) 88%, #000);
}
.dam-btn-icon { width: 14px; height: 14px; flex-shrink: 0; opacity: 0.85; }
.dam-btn--primary .dam-btn-icon { opacity: 1; }

/* scroll container for messages */
.dam-timeline {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px 28px;
  min-height: 0;
}

/* each message — a row with role chip + content card */
.dam-msg {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 12px;
  align-items: start;
  margin-bottom: 18px;
}
.dam-msg:last-child { margin-bottom: 0; }
.dam-msg-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
}
.dam-msg-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  color: #fff;
}
.dam-msg--user .dam-msg-avatar { background: var(--dam-user); }
.dam-msg--assistant .dam-msg-avatar { background: var(--dam-assistant); }
.dam-msg--tool .dam-msg-avatar { background: var(--dam-tool); }
.dam-msg--tool-result .dam-msg-avatar { background: var(--dam-tool-ok); }
.dam-msg-rail-line {
  width: 1px;
  flex: 1;
  background: var(--dam-line-soft);
  margin-top: 6px;
  min-height: 12px;
}
.dam-msg-body { min-width: 0; }
.dam-msg-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--dam-muted);
}
.dam-msg-role {
  font-weight: 600;
  color: var(--dam-text);
}
.dam-msg-time {
  font-variant-numeric: tabular-nums;
}
.dam-msg-text {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--dam-text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  padding: 10px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 55%, transparent);
  border: 1px solid var(--dam-line-soft);
}
.dam-msg--user .dam-msg-text {
  background: color-mix(in srgb, var(--dam-user) 9%, var(--dsw-alias-bg-layer-2, #fff));
  border-color: color-mix(in srgb, var(--dam-user) 18%, transparent);
}
.dam-msg--tool .dam-msg-text,
.dam-msg--tool-result .dam-msg-text {
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.55;
}
.dam-msg--tool .dam-msg-text {
  background: color-mix(in srgb, var(--dam-tool) 6%, var(--dsw-alias-bg-layer-2, #fff));
  border-color: color-mix(in srgb, var(--dam-tool) 18%, transparent);
  border-left: 3px solid var(--dam-tool);
  border-radius: 4px 10px 10px 4px;
}
.dam-msg--tool-result .dam-msg-text {
  background: color-mix(in srgb, var(--dam-tool-ok) 5%, var(--dsw-alias-bg-layer-2, #fff));
  border-color: color-mix(in srgb, var(--dam-tool-ok) 18%, transparent);
  border-left: 3px solid var(--dam-tool-ok);
  border-radius: 4px 10px 10px 4px;
}
.dam-msg-tool-name {
  font-weight: 600;
  color: var(--dam-text);
  font-family: inherit;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: none;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dam-msg-tool-name::before {
  content: '→';
  font-family: ui-monospace, monospace;
  color: var(--dam-tool);
  font-weight: 500;
}
.dam-msg--tool-result .dam-msg-tool-name::before { color: var(--dam-tool-ok); }

/* footer hint */
.dam-hint {
  font-size: 11.5px;
  color: var(--dam-muted);
  line-height: 1.5;
  padding: 12px 22px 16px;
  border-top: 1px solid var(--dam-line-soft);
  display: flex;
  align-items: center;
  gap: 6px;
}
.dam-hint::before { content: 'ⓘ'; opacity: 0.5; }

/* toast */
.dam-toast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-3, #1a1d24);
  color: var(--dsw-alias-label-primary, #fff);
  font-size: 13px;
  box-shadow: 0 8px 32px -8px rgba(0,0,0,.32);
  z-index: 200;
  max-width: 360px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: dam-toast-in 220ms cubic-bezier(.2,.9,.3,1);
}
.dam-toast--error { background: color-mix(in srgb, var(--dam-tool-err) 30%, var(--dsw-alias-bg-layer-3, #1a1d24)); }
@keyframes dam-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* small responsive: stack */
@media (max-width: 767px) {
  .dam-surface { grid-template-columns: 1fr; min-height: 0; }
  .dam-list { border-right: 0; border-bottom: 1px solid var(--dam-line-soft); max-height: 280px; }
  .dam-detail-head { padding: 14px 16px 10px; }
  .dam-timeline { padding: 14px 16px 20px; }
  .dam-actions .dam-btn span:not(.dam-btn-icon) { display: none; }
  .dam-actions .dam-btn { width: 32px; padding: 0; justify-content: center; }
}

/* very small phones: tighten the rail */
@media (max-width: 480px) {
  .dam-msg { grid-template-columns: 24px 1fr; gap: 10px; }
  .dam-msg-avatar { width: 24px; height: 24px; font-size: 11px; }
}
`
