/**
 * Archive manager section styles — Finder / Linear master-detail.
 *
 * Visual direction: one topbar of pure whitespace (search left, quiet
 * export-all right), then a height-bounded two-pane shell. Both panes
 * are quiet group containers (bg-layer-2 fill, 1px label-primary 8%
 * border, 12px radius, 6px padding) that scroll independently — the
 * list is a fixed 300px column of 44px rows grouped by recency, the
 * detail is a header / scrollable transcript / footer action bar
 * sandwich. No glows, no hover lifts. Selection is an accent 2px inset
 * bar plus a 4% fill; hover is 3%. The only motion anywhere is
 * background/color 120ms transitions plus the mandated active
 * scale(0.97) on buttons.
 *
 * Design-token alignment (docs/design-tokens.md): spacing (xs→9xl),
 * typography (xs→4xl), radius (sm/md/lg/xl/full/round), color recipes
 * (surface/border/interaction/state), button specs (28px md, 26px sm).
 *
 * Token discipline (shared with other dsh-* plugins):
 *   - colors read `--dsw-alias-*` with dark-hex fallbacks
 *   - radii bridge to `--dsh-layout-radius-user[-lg]` (8px / 12px)
 *   - hairlines are label-primary color-mix percentages (6% inner, 8% outer)
 *   - material bridge block swaps group surfaces onto dsh-layout glass base
 *   - `prefers-reduced-motion` drops every transition
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
/* ── section root ─────────────────────────────────────────────────────────── */
.dam-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: var(--dsw-alias-font-sans, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", sans-serif);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}

/* inline error note (list load failure) — flat error-tinted row */
.dam-note {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
}
.dam-note--error {
  color: var(--dsw-alias-state-error-primary, #ef5350);
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent);
}

/* ── topbar: search + export all (whitespace is the material) ────────────── */
.dam-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.dam-topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* search field — 34px */
.dam-search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  flex: 1 1 240px;
  max-width: 380px;
  min-width: 0;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  transition: border-color 120ms var(--ds-ease-in-out, ease), background 120ms var(--ds-ease-in-out, ease);
}
.dam-search:focus-within {
  border-color: var(--dsw-alias-state-business-primary, #6ea8fe);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
}
.dam-search svg { width: 13px; height: 13px; flex-shrink: 0; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dam-search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12.5px;
  outline: none;
}
.dam-search-input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dam-search-input::-webkit-search-cancel-button { -webkit-appearance: none; }
.dam-search-count {
  flex-shrink: 0;
  font-size: 10.5px;
  line-height: 1;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  padding: 2px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}

/* ── blank state: no archives at all ─────────────────────────────────────── */
.dam-blank {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 340px;
  padding: 40px 24px;
  text-align: center;
  border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.dam-blank-icon {
  display: inline-flex;
  margin-bottom: 4px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  opacity: 0.55;
}
.dam-blank-icon svg { width: 30px; height: 30px; }
.dam-blank-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dam-blank-text {
  margin: 0;
  max-width: 360px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dam-blank-hint {
  margin: 3px 0 0;
  max-width: 360px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  opacity: 0.85;
}

/* ── master-detail shell ─────────────────────────────────────────────────── */
/* The host content area scrolls and caps children at 960px, so the shell
   bounds its own height for independent pane scrolling. */
.dam-shell {
  display: flex;
  gap: 12px;
  align-items: stretch;
  height: calc(100vh - 220px);
  height: calc(100dvh - 220px);
  min-height: 440px;
}

/* shared pane container */
.dam-list,
.dam-detail {
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}

/* ── master: session list (300px fixed, independent scroll) ──────────────── */
.dam-list {
  flex: 0 0 300px;
  width: 300px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 6px;
  overflow: hidden;
}
.dam-list-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 4px;
  overscroll-behavior: contain;
}
.dam-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 12px;
  line-height: 1.55;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* recency group head — 10px uppercase gray */
.dam-lgroup-head {
  padding: 10px 10px 5px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  user-select: none;
}

/* list row — 44px entry: title 13px/600 over 11px meta. Hover lightens 3%;
   selection is a 4% fill plus a 2px accent inset bar (no layout shift). */
.dam-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  min-height: 44px;
  padding: 8px 10px 8px 14px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  cursor: pointer;
  transition: background 120ms var(--ds-ease-in-out, ease);
}
.dam-row + .dam-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dam-row:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); }
.dam-row--active {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  box-shadow: inset 2px 0 0 0 var(--dsw-alias-state-business-primary, #6ea8fe);
}
.dam-row-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dam-row:hover .dam-row-title,
.dam-row--active .dam-row-title { color: var(--dsw-alias-label-primary, #f4f4f5); }
.dam-row-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  line-height: 1.2;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dam-dot { opacity: 0.5; flex-shrink: 0; }

/* ── detail pane: header / transcript / action bar ───────────────────────── */
.dam-detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* nothing selected — centered quiet prompt */
.dam-detail-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 280px;
  padding: 32px 20px;
  text-align: center;
}
.dam-detail-empty-icon {
  display: inline-flex;
  margin-bottom: 4px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  opacity: 0.5;
}
.dam-detail-empty-icon svg { width: 26px; height: 26px; }
.dam-detail-empty-title {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dam-detail-empty-hint {
  max-width: 320px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  opacity: 0.85;
}

/* header — title 16px/600 over an 11px meta line */
.dam-detail-head {
  flex-shrink: 0;
  padding: 15px 18px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dam-detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dam-detail-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px 7px;
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font-variant-numeric: tabular-nums;
}
.dam-detail-meta-id {
  min-width: 0;
  max-width: 100%;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  overflow-wrap: anywhere;
}
.dam-detail-meta-id code {
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 10.5px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* transcript — scrollable message timeline; rows carry their own card
   chrome, so the scroller only provides rhythm via the 6px gap. */
.dam-timeline {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 12px 14px;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dam-timeline-state {
  padding: 36px 16px;
  text-align: center;
  font-size: 12px;
  line-height: 1.55;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dam-timeline-state--error { color: var(--dsw-alias-state-error-primary, #ef5350); }

/* message rows — three visual tiers so the transcript reads at a glance:
     user      accent-tinted card (left bar + 6% fill) — the loudest voice
     assistant quiet 2.5% card — the reply
     tool      borderless whisper lines — plumbing, smallest + dimmest
   No more random 24px indents; separation comes from the tier styling
   and a 6px rhythm gap between rows. */
.dam-msg {
  position: relative;
  padding: 7px 10px 8px;
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
}
.dam-msg--user {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 6%, transparent);
  padding-left: 12px;
}
.dam-msg--user::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  border-radius: 1px;
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 70%, transparent);
}
.dam-msg--assistant {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2.5%, transparent);
}
.dam-msg--toolCall,
.dam-msg--toolResult {
  background: transparent;
  padding: 3px 10px 4px;
}
.dam-msg-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  margin-bottom: 2px;
}
.dam-msg-role {
  min-width: 0;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.3;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dam-msg-time {
  margin-left: auto;
  padding-left: 10px;
  flex-shrink: 0;
  font-size: 9.5px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font-variant-numeric: tabular-nums;
}
.dam-msg--user .dam-msg-text,
.dam-msg--assistant .dam-msg-text {
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 12px;
  line-height: 1.55;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dam-msg--toolCall .dam-msg-text,
.dam-msg--toolResult .dam-msg-text {
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dam-msg-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.dam-msg-text.is-clickable { cursor: pointer; }
.dam-msg-text.is-open {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
  cursor: pointer;
}

/* role tints on the tag only; bodies stay neutral */
.dam-msg--user .dam-msg-role { color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dam-msg--assistant .dam-msg-role { color: var(--dsw-alias-state-success-primary, #4caf50); }
.dam-msg--toolCall .dam-msg-role {
  color: var(--dsw-alias-state-warning-primary, #d97706);
  text-transform: none;
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 10px;
}
.dam-msg--toolResult .dam-msg-role { color: var(--dsw-alias-state-success-primary, #4caf50); text-transform: none; font-size: 10px; }

/* batched-rendering footer inside the transcript */
.dam-loadmore { display: flex; justify-content: center; padding: 10px 0 2px; }
.dam-loadmore-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 3px 14px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dam-loadmore-btn:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.dam-loadmore-btn:active { transform: scale(0.97); }
.dam-loadmore-btn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }

/* delete disclosure — inline error-tinted note above the action bar */
.dam-delete {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
  margin: 10px 12px 0;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent);
}
.dam-delete-text { min-width: 0; }
.dam-delete-path {
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 11px;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* action bar — pinned at the detail panel's foot: restore is a solid
   primary, exports are secondary, delete is a quiet icon-only danger */
.dam-detail-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dam-detail-actions-gap { flex: 1; }

/* buttons — 28px standard height. Secondary: 10% border only. Primary:
   solid business accent with dark ink. Active settles with scale(0.97). */
.dam-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  cursor: pointer;
  transition: background 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dam-btn:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
}
.dam-btn:active { transform: scale(0.97); }
.dam-btn:disabled { opacity: 0.45; cursor: default; }
.dam-btn:disabled:hover { background: transparent; border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); }
.dam-btn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dam-btn svg { width: 13px; height: 13px; flex-shrink: 0; opacity: 0.85; }

/* primary button: solid accent fill, near-black ink for contrast */
.dam-btn--primary {
  border-color: transparent;
  background: var(--dsw-alias-state-business-primary, #6ea8fe);
  color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 14%, #000);
  font-weight: 600;
}
.dam-btn--primary:hover {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 86%, #fff);
}
.dam-btn--primary:disabled:hover { background: var(--dsw-alias-state-business-primary, #6ea8fe); }

/* danger button: error border, error text */
.dam-btn--danger {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent);
  color: var(--dsw-alias-state-error-primary, #ef5350);
}
.dam-btn--danger:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 36%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent);
}

/* small + icon-only variants */
.dam-btn--sm { height: 26px; padding: 0 10px; font-size: 11px; }
.dam-btn--icon { width: 28px; padding: 0; }

/* keyboard focus — business-primary outline, never a shadow */
.dam-row:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe);
  outline-offset: -1px;
}

/* toast — flat surface, fade only */
.dam-toast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 200;
  max-width: 360px;
  padding: 9px 13px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: var(--dsw-alias-bg-layer-3, #232327);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font-size: 12px;
  line-height: 1.5;
  animation: dam-toast-in 120ms var(--ds-ease-in-out, ease);
}
.dam-toast--error {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 30%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, var(--dsw-alias-bg-layer-3, #232327));
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
@keyframes dam-toast-in { from { opacity: 0; } to { opacity: 1; } }

/* ── responsive — H5 (≤767px): stacked, list on top, touch targets ≥36px ── */
@media (max-width: 767px) {
  .dam-shell { flex-direction: column; height: auto; min-height: 0; }
  /* compact list on top */
  .dam-list { flex: 0 0 auto; width: auto; max-height: 262px; }
  /* detail below, transcript capped so the action bar stays reachable */
  .dam-timeline { flex: none; max-height: 54vh; max-height: 54dvh; }
  .dam-msg--assistant,
  .dam-msg--toolCall,
  .dam-msg--toolResult { margin-left: 16px; }
  /* search takes its own row; export-all goes full width below it */
  .dam-search { flex-basis: 100%; max-width: none; }
  .dam-topbar-actions { margin-left: 0; flex: 1; }
  .dam-topbar-actions .dam-btn { width: 100%; }
  .dam-detail-title { font-size: 15px; }
  /* button touch targets ≥36px */
  .dam-btn { height: 36px; padding: 0 12px; }
  .dam-btn--sm { height: 36px; }
  .dam-btn--icon { width: 36px; }
  /* long tokens must not stretch the layout past the viewport */
  .dam-note { overflow-wrap: anywhere; }
  .dam-detail-meta-id code { max-width: 160px; }
  .dam-delete-path { white-space: normal; overflow-wrap: anywhere; }
  .dam-toast { max-width: calc(100vw - 32px); overflow-wrap: anywhere; }
}

/* ── dsh-layout material bridge ─────────────────────────────────────────────
   When the dsh-layout plugin's frosted material is on, the pane
   containers sit on the shared glass base (34% fill) with
   --dsh-layout-line borders at 45-55%. */
html[data-dsh-layout-material='on'] .dam-list,
html[data-dsh-layout-material='on'] .dam-detail,
html[data-dsh-layout-material='on'] .dam-note {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent);
}
html[data-dsh-layout-material='on'] .dam-blank {
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dam-row + .dam-row,
html[data-dsh-layout-material='on'] .dam-detail-actions {
  border-top-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dam-detail-head {
  border-bottom-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dam-search {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dam-row:hover,
html[data-dsh-layout-material='on'] .dam-row--active {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
}
html[data-dsh-layout-material='on'] .dam-toast {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 82%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}

/* ── motion safety — transitions only, all dropped under reduced motion ──── */
@media (prefers-reduced-motion: reduce) {
  .dam-row,
  .dam-btn,
  .dam-loadmore-btn,
  .dam-search {
    transition: none;
  }
  .dam-btn:active,
  .dam-loadmore-btn:active {
    transform: none;
  }
  .dam-toast { animation: none; }
}
`
