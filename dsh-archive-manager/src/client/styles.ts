/**
 * Archive manager section styles — "Quiet Structure".
 *
 * Visual direction: macOS Settings / Linear list form. No glows, no hover
 * lifts. The section is a master-detail grid (300px list | detail); each
 * side is one quiet group container (bg-layer-2 fill, 1px label-primary
 * 8% border, 12px radius, 6px padding) whose rows are flat 44px
 * hairline-separated entries. Hover only lightens the background
 * (label-primary 4%, 120ms). The only motion anywhere is background/
 * color 120ms transitions plus the mandated active scale(0.97) on
 * buttons.
 *
 * Design-token alignment: spacing (xs→9xl), typography (xs→4xl),
 * radius (sm/md/lg/xl/full/round), color recipes (surface/border/
 * interaction/state), button specs (28px md, 26px sm, 28px icon),
 * card specs, group container specs, modal specs — all sourced from
 * design-tokens.md.
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
  display: block;
  font-family: var(--dsw-alias-font-sans, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", sans-serif);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}

/* inline error note (list load failure) — flat error-tinted row */
.dam-note {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0 0 12px;
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

/* ── master-detail shell ─────────────────────────────────────────────────── */
.dam-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

/* ── master: session list group ──────────────────────────────────────────── */
.dam-list {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  max-height: calc(100vh - 150px);
  max-height: calc(100dvh - 150px);
  padding: 6px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}

/* search field — 34px cap on top of the group */
.dam-search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  flex-shrink: 0;
  margin: 2px 8px 8px;
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

.dam-list-scroll {
  overflow-y: auto;
  min-height: 0;
  padding-bottom: 2px;
  overscroll-behavior: contain;
}
.dam-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 12px;
  line-height: 1.55;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}

/* list row — 44px entry with card-like hover: title 13px/600 over 11px
   meta, with a 26px restore icon button on the trailing edge. Hover
   lightens background; selection is a 6% fill with stronger border. */
.dam-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 8px 8px 14px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  cursor: pointer;
  transition: background 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease);
}
.dam-row + .dam-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dam-row:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dam-row--active {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dam-row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
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
.dam-row-meta-dot { opacity: 0.5; flex-shrink: 0; }

/* trailing restore mini-button — revealed on row hover / selection */
.dam-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  cursor: pointer;
  opacity: 0;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), opacity 120ms var(--ds-ease-in-out, ease);
}
.dam-row:hover .dam-icon-btn,
.dam-row:focus-within .dam-icon-btn,
.dam-row--active .dam-icon-btn { opacity: 1; }
.dam-icon-btn:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.dam-icon-btn:active { transform: scale(0.97); }
.dam-icon-btn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dam-icon-btn svg { width: 13px; height: 13px; }

/* ── detail pane ─────────────────────────────────────────────────────────── */
.dam-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.dam-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 280px;
  padding: 32px 20px;
  text-align: center;
  font-size: 12px;
  line-height: 1.55;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.dam-detail-empty-hint { font-size: 11px; opacity: 0.8; }

/* action bar — title left, quiet buttons right */
.dam-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.dam-toolbar-name {
  flex: 1;
  min-width: 160px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dam-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* buttons — 28px standard height. Primary: label-primary 10% fill +
   24% border + inset highlight. Secondary: 10% border only. Danger:
   error color. Active settles with scale(0.97); nothing else moves. */
.dam-btn {
  display: inline-flex;
  align-items: center;
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

/* primary button: 10% fill, 24% border, inset top highlight */
.dam-btn--primary {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font-weight: 600;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
}
.dam-btn--primary:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
}

/* danger button: error border, error text */
.dam-btn--danger {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent);
  color: var(--dsw-alias-state-error-primary, #ef5350);
}
.dam-btn--danger:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 36%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent);
}

/* small button variant: 26px height */
.dam-btn--sm { height: 26px; padding: 0 10px; font-size: 11px; }

/* delete disclosure — inline error-tinted note with the manual path */
.dam-delete {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 14px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
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

/* ── group containers (session summary / timeline) ───────────────────────── */
.dam-group {
  padding: 6px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.dam-group-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 14px 6px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dam-group-count {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  font-weight: 400;
  opacity: 0.8;
}

/* summary rows — label left, value right */
.dam-kv {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 44px;
  padding: 8px 14px;
}
.dam-kv + .dam-kv { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dam-kv-key { font-size: 12px; color: var(--dsw-alias-label-tertiary, #8a8a8e); flex-shrink: 0; }
.dam-kv-val {
  min-width: 0;
  font-size: 12px;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}
.dam-kv-val--code {
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}

/* timeline rows — 24px role icon base + name/time + single-line excerpt.
   Rows share the group's hairline rhythm; each row (but the last) draws
   a 2px label-primary 10% thread from its icon down to the next icon. */
.dam-tl-more { display: flex; justify-content: center; padding: 10px 0 4px; }
.dam-tl-more-btn {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 26px; padding: 3px 14px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px);
  background: transparent; color: var(--dsw-alias-label-secondary, #b3b3b8);
  font: inherit; font-size: 12px; cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dam-tl-more-btn:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.dam-tl-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 44px;
  padding: 8px 14px;
}
.dam-tl-row + .dam-tl-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dam-tl-row:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 34px;
  bottom: -8px;
  left: 25px;
  width: 2px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  pointer-events: none;
}
.dam-tl-icon {
  width: 24px;
  height: 24px;
  margin-top: 1px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  font-size: 11px;
  font-weight: 600;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  position: relative;
  z-index: 1;
}
.dam-tl-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 1px 0;
}
.dam-tl-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.dam-tl-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dam-tl-name {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dam-tl-time {
  margin-left: auto;
  padding-left: 10px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font-variant-numeric: tabular-nums;
}
.dam-tl-text {
  font-size: 12px;
  line-height: 1.45;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dam-tl-text.is-clickable { cursor: pointer; }
.dam-tl-text.is-open {
  white-space: pre-wrap;
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;
  cursor: pointer;
}
.dam-tl-row--toolCall .dam-tl-text,
.dam-tl-row--toolResult .dam-tl-text {
  font-family: var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace);
  font-size: 11px;
}

/* role tints — dot + icon glyph only, bases stay neutral */
.dam-tl-row--user .dam-tl-dot { background: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dam-tl-row--user .dam-tl-icon { color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dam-tl-row--assistant .dam-tl-dot { background: var(--dsw-alias-state-success-primary, #4caf50); }
.dam-tl-row--assistant .dam-tl-icon { color: var(--dsw-alias-state-success-primary, #4caf50); }
.dam-tl-row--toolCall .dam-tl-dot { background: var(--dsw-alias-state-warning-primary, #d97706); }
.dam-tl-row--toolCall .dam-tl-icon { color: var(--dsw-alias-state-warning-primary, #d97706); }
.dam-tl-row--toolResult .dam-tl-dot { background: var(--dsw-alias-state-success-primary, #4caf50); }
.dam-tl-row--toolResult .dam-tl-icon { color: var(--dsw-alias-state-success-primary, #4caf50); }

/* timeline state rows (loading / error / empty) */
.dam-tl-state {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 8px 14px;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dam-tl-state--error { color: var(--dsw-alias-state-error-primary, #ef5350); }

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

/* ── responsive — H5 (≤767px): single column, touch targets ≥36px ──────── */
@media (max-width: 767px) {
  .dam-shell { grid-template-columns: minmax(0, 1fr); }
  .dam-list { position: static; max-height: none; }
  .dam-list-scroll { max-height: 264px; }
  .dam-toolbar-name { flex-basis: 100%; min-width: 0; }
  /* button touch targets ≥36px */
  .dam-btn { height: 36px; padding: 0 12px; }
  .dam-btn--sm { height: 36px; }
  .dam-icon-btn { width: 36px; height: 36px; }
  /* long tokens must not stretch the 1fr track past the viewport */
  .dam-note { overflow-wrap: anywhere; }
  .dam-kv-val { white-space: normal; overflow-wrap: anywhere; }
  .dam-tl-text.is-open { overflow-wrap: anywhere; }
  .dam-tl-state { overflow-wrap: anywhere; }
  .dam-toast { max-width: calc(100vw - 32px); overflow-wrap: anywhere; }
}

/* ── dsh-layout material bridge ─────────────────────────────────────────────
   When the dsh-layout plugin's frosted material is on, the group
   containers sit on the shared glass base (34% fill) with
   --dsh-layout-line borders at 45-55%. */
html[data-dsh-layout-material='on'] .dam-list,
html[data-dsh-layout-material='on'] .dam-group {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent);
}
html[data-dsh-layout-material='on'] .dam-row + .dam-row,
html[data-dsh-layout-material='on'] .dam-kv + .dam-kv,
html[data-dsh-layout-material='on'] .dam-tl-row + .dam-tl-row {
  border-top-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dam-search {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dam-row:hover,
html[data-dsh-layout-material='on'] .dam-row--active {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
}
html[data-dsh-layout-material='on'] .dam-detail-empty {
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dam-toast {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 82%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}

/* ── motion safety — transitions only, all dropped under reduced motion ──── */
@media (prefers-reduced-motion: reduce) {
  .dam-row,
  .dam-btn,
  .dam-icon-btn,
  .dam-search {
    transition: none;
  }
  .dam-btn:active,
  .dam-icon-btn:active {
    transform: none;
  }
  .dam-toast { animation: none; }
}
`
