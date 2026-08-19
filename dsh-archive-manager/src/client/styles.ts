/**
 * Styles for the archive manager section.
 *
 * Visual direction — "Frosted Modern": the section renders on the
 * launcher's full-screen workspace canvas, so every surface is a piece
 * of frosted glass rather than a flat fill. Cards and panels are built
 * from a two-stop light wash (7% -> 3% label-primary) plus a 1px lit
 * top edge; hover states lift the card a hair (-1px) under a soft
 * 24px shadow. The timeline is the hero: role-tinted avatar dots with
 * a gentle 8px glow, connected by vertical gradient threads that fade
 * out as they descend. The restore action is the only bright
 * (label-primary 18% -> 28% gradient) button; exports stay quiet
 * hairline buttons so primary/secondary reads at a glance.
 *
 * Token discipline (shared with the other dsh-* plugins):
 *   - colors read `--dsw-alias-*` with dark-hex fallbacks
 *   - radii bridge to `--dsh-layout-radius-user[-lg]` (dsh-layout)
 *   - hairline borders are label-primary color-mix percentages
 *   - an `html[data-dsh-layout-material='on']` block at the end swaps
 *     the main surfaces onto the dsh-layout glass base
 *   - `prefers-reduced-motion` drops every added displacement
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
  /* surface — radii bridge to the user's dsh-layout corner setting */
  --dam-radius-lg: var(--dsh-layout-radius-user-lg, 16px);
  --dam-radius: var(--dsh-layout-radius-user, 10px);
  --dam-radius-sm: var(--dsh-layout-radius-user, 8px);
  --dam-line: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent);
  --dam-line-soft: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent);
  /* frosted card: two-stop light wash + a 1px lit top edge */
  --dam-card: linear-gradient(180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent),
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent));
  --dam-card-inset: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  --dam-lift: 0 8px 24px rgba(0, 0, 0, 0.28);
  --dam-ease: var(--ds-ease-in-out, ease);
  --dam-accent: #3678ea;
  --dam-text: var(--dsw-alias-label-primary, #f4f4f5);
  --dam-text-2: var(--dsw-alias-label-secondary, #b3b3b8);
  --dam-muted: var(--dsw-alias-label-tertiary, #8a8a8e);
  --dam-user: #3678ea;
  --dam-assistant: var(--dsw-alias-state-success-primary, #16a34a);
  --dam-tool: #d97706;
  --dam-tool-ok: var(--dsw-alias-state-success-primary, #16a34a);
  --dam-tool-err: var(--dsw-alias-state-error-primary, #dc2626);
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
  color: var(--dam-text-2);
  margin: 0 4px;
}

/* surface — one large frosted panel hosting list + detail. A soft
   radial sheen at the top edge gives the panel presence on the
   workspace canvas without competing with the content. 2-pane layout
   at every width: at the typical settings-dialog right-column width
   (~440-540px on desktop) the list takes ~180px and the detail takes
   the rest; on small phones the list stacks above the detail. */
.dam-surface {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  min-height: 520px;
  border: 1px solid var(--dam-line);
  border-radius: var(--dam-radius-lg);
  background:
    radial-gradient(120% 56% at 50% 0%,
      color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent),
      transparent 70%),
    var(--dam-card);
  box-shadow:
    var(--dam-card-inset),
    0 24px 48px -24px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
@media (max-width: 520px) {
  .dam-surface { grid-template-columns: 1fr; }
}

/* ── list pane ─────────────────────────────────────────────────────────── */
.dam-list {
  display: flex;
  flex-direction: column;
  /* a whisper of extra fill so the sidebar reads as its own layer on
     the shared surface; no harsh vertical divider — the hairline at
     the right edge fades in from the corners. */
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent),
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent));
  min-width: 0;
  position: relative;
}
.dam-list::after {
  /* hairline divider at the right edge of the list pane, dissolved
     at both ends so the surface still reads as one piece */
  content: '';
  position: absolute;
  inset: 12px 0 12px auto;
  width: 1px;
  background: linear-gradient(180deg,
    transparent,
    var(--dam-line-soft) 18%,
    var(--dam-line-soft) 82%,
    transparent);
  pointer-events: none;
}
.dam-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--dam-muted);
  font-weight: 600;
}
.dam-list-header-count {
  font-variant-numeric: tabular-nums;
  color: var(--dam-text);
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  font-size: 11px;
  line-height: 1;
  padding: 3px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
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
  font-size: 12.5px;
  line-height: 1.55;
}
.dam-list-empty-icon {
  font-size: 28px;
  opacity: 0.5;
  margin-bottom: 6px;
  line-height: 1;
}

/* list item — a quiet frosted chip: single-line title + meta over a
   hairline that lights up (border + 1px lift + soft shadow) on hover.
   Selected items get an accent-tinted gradient and a glowing accent
   rail on the leading edge. Designed to be scannable in 180px. */
.dam-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
  padding: 8px 8px 8px 11px;
  border: 1px solid transparent;
  border-radius: var(--dsh-layout-radius-user, 6px);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition:
    border-color 140ms var(--dam-ease),
    background 140ms var(--dam-ease),
    transform 140ms var(--dam-ease),
    box-shadow 140ms var(--dam-ease);
}
.dam-item + .dam-item { margin-top: 2px; }
.dam-item::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block: 6px;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: transparent;
  transition: background 140ms var(--dam-ease), box-shadow 140ms var(--dam-ease);
}
.dam-item:hover {
  border-color: var(--dam-line-soft);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  transform: translateY(-1px);
  box-shadow: var(--dam-lift);
}
.dam-item--active {
  border-color: color-mix(in srgb, var(--dam-accent) 42%, transparent);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-accent) 15%, transparent),
    color-mix(in srgb, var(--dam-accent) 8%, transparent));
  box-shadow:
    var(--dam-card-inset),
    0 0 12px -4px color-mix(in srgb, var(--dam-accent) 45%, transparent);
}
.dam-item--active::before {
  background: linear-gradient(180deg,
    var(--dam-accent),
    color-mix(in srgb, var(--dam-accent) 35%, transparent));
  box-shadow: 0 0 8px color-mix(in srgb, var(--dam-accent) 70%, transparent);
}
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
  font-size: 11px;
  color: var(--dam-muted);
  line-height: 1.3;
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
  transition: opacity 140ms var(--dam-ease), transform 140ms var(--dam-ease);
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
  font-size: 12.5px;
  line-height: 1.55;
  gap: 8px;
}
.dam-detail-empty-icon {
  font-size: 36px;
  line-height: 1;
  opacity: 0.4;
  margin-bottom: 4px;
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent));
}
.dam-detail-empty-hint {
  font-size: 11px;
  color: var(--dam-muted);
  opacity: 0.75;
}

/* detail header — a frosted band over a dissolved hairline, vertical
   at narrow widths to give the title room to breathe and the action
   toolbar room to wrap without crowding. */
.dam-detail-head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--dam-line-soft);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent),
    transparent);
  box-shadow: var(--dam-card-inset);
}
.dam-detail-head-text { min-width: 0; }
.dam-detail-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: var(--dam-text);
  margin: 0 0 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-feature-settings: "ss01" 1, "cv11" 1;
}
.dam-detail-id-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--dam-muted);
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  flex-wrap: wrap;
}
.dam-detail-id-row code {
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--dsh-layout-radius-user, 4px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent);
  color: var(--dam-text-2);
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

/* buttons — secondary (exports): hairline + hover fill; the restore
   action alone is bright (label-primary 18% -> 28% gradient) so the
   primary reads instantly. Presses settle with scale(0.98). */
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
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 11%, transparent);
  border-radius: var(--dam-radius-sm);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  color: var(--dam-text);
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color 140ms var(--dam-ease),
    background 140ms var(--dam-ease),
    transform 140ms var(--dam-ease),
    box-shadow 140ms var(--dam-ease);
}
.dam-btn:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  transform: translateY(-1px);
  box-shadow: var(--dam-lift);
}
.dam-btn:active { transform: scale(0.98); }
.dam-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dam-btn:disabled:hover { transform: none; box-shadow: none; }
.dam-btn--primary {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 32%, transparent);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent),
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent));
  color: var(--dsw-alias-label-primary, #fff);
  font-weight: 600;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent),
    var(--dam-lift);
}
.dam-btn--primary:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 42%, transparent);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 34%, transparent),
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 22%, transparent));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 45%, transparent),
    0 10px 28px rgba(0, 0, 0, 0.32);
}
.dam-btn--primary:active { transform: scale(0.98); }
.dam-btn-icon { width: 14px; height: 14px; flex-shrink: 0; opacity: 0.85; }
.dam-btn--primary .dam-btn-icon { opacity: 1; }

/* keyboard focus — a lit ring, never the hover shadow */
.dam-item:focus-visible,
.dam-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 45%, transparent);
  outline-offset: 2px;
}

/* scroll container for messages */
.dam-timeline {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px 28px;
  min-height: 0;
}

/* each message — avatar dot + content card. The dot is a lit sphere
   (top-lit gradient + 8px role-colored glow); the thread below it is
   a 2px vertical gradient that dissolves as it descends toward the
   next node. */
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
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
}
.dam-msg--user .dam-msg-avatar {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dam-user) 76%, #fff), var(--dam-user));
  box-shadow: 0 0 8px color-mix(in srgb, var(--dam-user) 55%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}
.dam-msg--assistant .dam-msg-avatar {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dam-assistant) 76%, #fff), var(--dam-assistant));
  box-shadow: 0 0 8px color-mix(in srgb, var(--dam-assistant) 55%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}
.dam-msg--tool .dam-msg-avatar {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dam-tool) 76%, #fff), var(--dam-tool));
  box-shadow: 0 0 8px color-mix(in srgb, var(--dam-tool) 55%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}
.dam-msg--tool-result .dam-msg-avatar {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dam-tool-ok) 76%, #fff), var(--dam-tool-ok));
  box-shadow: 0 0 8px color-mix(in srgb, var(--dam-tool-ok) 55%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}
.dam-msg-rail-line {
  width: 2px;
  flex: 1;
  border-radius: 1px;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent),
    transparent 92%);
  margin-top: 6px;
  min-height: 12px;
}
.dam-msg--user .dam-msg-rail-line {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-user) 28%, transparent),
    transparent 92%);
}
.dam-msg--assistant .dam-msg-rail-line {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-assistant) 28%, transparent),
    transparent 92%);
}
.dam-msg--tool .dam-msg-rail-line {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-tool) 28%, transparent),
    transparent 92%);
}
.dam-msg--tool-result .dam-msg-rail-line {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-tool-ok) 28%, transparent),
    transparent 92%);
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
  font-size: 12px;
  line-height: 1.55;
  color: var(--dam-text-2);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  padding: 10px 12px;
  border-radius: var(--dam-radius);
  background: var(--dam-card);
  border: 1px solid var(--dam-line-soft);
  box-shadow: var(--dam-card-inset);
}
.dam-msg--user .dam-msg-text {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-user) 12%, transparent),
    color-mix(in srgb, var(--dam-user) 6%, transparent));
  border-color: color-mix(in srgb, var(--dam-user) 26%, transparent);
}
.dam-msg--tool .dam-msg-text,
.dam-msg--tool-result .dam-msg-text {
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.55;
}
.dam-msg--tool .dam-msg-text {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-tool) 10%, transparent),
    color-mix(in srgb, var(--dam-tool) 5%, transparent));
  border: 1px solid color-mix(in srgb, var(--dam-tool) 24%, transparent);
  border-left: 3px solid var(--dam-tool);
  border-radius: 4px var(--dam-radius) var(--dam-radius) 4px;
}
.dam-msg--tool-result .dam-msg-text {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-tool-ok) 9%, transparent),
    color-mix(in srgb, var(--dam-tool-ok) 4%, transparent));
  border: 1px solid color-mix(in srgb, var(--dam-tool-ok) 24%, transparent);
  border-left: 3px solid var(--dam-tool-ok);
  border-radius: 4px var(--dam-radius) var(--dam-radius) 4px;
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
  font-size: 11px;
  color: var(--dam-muted);
  line-height: 1.5;
  padding: 12px 22px 16px;
  border-top: 1px solid var(--dam-line-soft);
  display: flex;
  align-items: center;
  gap: 6px;
}
.dam-hint::before { content: 'ⓘ'; opacity: 0.5; }

/* toast — a small frosted island floating over everything */
.dam-toast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  padding: 10px 14px;
  border-radius: var(--dam-radius);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-3, #1c1c1f) 86%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  backdrop-filter: blur(14px) saturate(140%);
  color: var(--dsw-alias-label-primary, #fff);
  font-size: 12.5px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent),
    0 12px 32px -8px rgba(0, 0, 0, 0.4);
  z-index: 200;
  max-width: 360px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: dam-toast-in 220ms cubic-bezier(.2,.9,.3,1);
}
.dam-toast--error {
  background: color-mix(in srgb, var(--dam-tool-err) 22%, color-mix(in srgb, var(--dsw-alias-bg-layer-3, #1c1c1f) 86%, transparent));
  border-color: color-mix(in srgb, var(--dam-tool-err) 40%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent),
    0 0 16px -4px color-mix(in srgb, var(--dam-tool-err) 45%, transparent),
    0 12px 32px -8px rgba(0, 0, 0, 0.4);
}
@keyframes dam-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* small responsive: stack */
@media (max-width: 767px) {
  .dam-surface { grid-template-columns: 1fr; min-height: 0; }
  .dam-list { border-right: 0; border-bottom: 1px solid var(--dam-line-soft); max-height: 280px; }
  .dam-list::after { display: none; }
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

/* ── dsh-layout material bridge ──────────────────────────────────────────
   When the dsh-layout plugin's frosted material is on, the main
   surfaces drop their light-wash gradients for translucent glass off
   the shared --dsh-layout-glass-base (cards 34% / panels 46%) with
   --dsh-layout-line borders. Role tints stay translucent so the glass
   keeps showing through. */
html[data-dsh-layout-material='on'] .dam-surface {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dam-list {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
}
html[data-dsh-layout-material='on'] .dam-list::after {
  background: linear-gradient(180deg,
    transparent,
    color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent) 18%,
    color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent) 82%,
    transparent);
}
html[data-dsh-layout-material='on'] .dam-detail-head {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-bottom-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dam-item {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dam-item:hover {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dam-item--active {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-accent) 15%, transparent),
    color-mix(in srgb, var(--dam-accent) 8%, transparent));
  border-color: color-mix(in srgb, var(--dam-accent) 42%, transparent);
}
html[data-dsh-layout-material='on'] .dam-msg-text {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dam-msg--user .dam-msg-text {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-user) 12%, transparent),
    color-mix(in srgb, var(--dam-user) 6%, transparent));
}
html[data-dsh-layout-material='on'] .dam-msg--tool .dam-msg-text {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-tool) 10%, transparent),
    color-mix(in srgb, var(--dam-tool) 5%, transparent));
}
html[data-dsh-layout-material='on'] .dam-msg--tool-result .dam-msg-text {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--dam-tool-ok) 9%, transparent),
    color-mix(in srgb, var(--dam-tool-ok) 4%, transparent));
}
html[data-dsh-layout-material='on'] .dam-toast {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 82%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}

/* transparency fallbacks — the toast is the only blurred surface; keep
   it readable when blur or transparency is unavailable/unwanted */
@media (prefers-reduced-transparency: reduce) {
  .dam-toast {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    background: var(--dsw-alias-bg-layer-3, #1c1c1f) !important;
  }
}
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .dam-toast { background: var(--dsw-alias-bg-layer-3, #1c1c1f); }
}

/* ── motion safety — drop every added displacement under reduced motion */
@media (prefers-reduced-motion: reduce) {
  .dam-item,
  .dam-item::before,
  .dam-item-chevron,
  .dam-btn {
    transition: none;
  }
  .dam-item:hover,
  .dam-btn:hover,
  .dam-btn:active {
    transform: none;
  }
  .dam-toast { animation: none; }
}
`
