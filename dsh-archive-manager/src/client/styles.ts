/**
 * Styles for the archive manager section — "Quiet Structure".
 *
 * Visual direction: a macOS-Settings / Linear list form. No cards, no
 * gradients, no glows, no hover lifts. The section is a master-detail
 * grid (300px list | detail); each side is one quiet group container
 * (bg-layer-2 fill, 1px label-primary 8% border, 12px radius, 6px
 * padding) whose rows are flat 44px hairline-separated entries. Hover
 * only lightens the background (label-primary 4%, 120ms). The only
 * motion anywhere is background/color 120ms transitions plus the
 * mandated active scale(0.97) on buttons.
 *
 * Token discipline (shared with the other dsh-* plugins):
 *   - colors read `--dsw-alias-*` with dark-hex fallbacks
 *   - radii bridge to `--dsh-layout-radius-user[-lg]` (8px / 12px)
 *   - hairlines are label-primary color-mix percentages (6% inner, 8% outer)
 *   - an `html[data-dsh-layout-material='on']` block at the end swaps the
 *     group surfaces onto the dsh-layout glass base (34% fill,
 *     --dsh-layout-line 45-55% borders)
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
/* ── design tokens ────────────────────────────────────────────────────────── */
.dam-section {
  --dam-r-lg: var(--dsh-layout-radius-user-lg, 12px);
  --dam-r: var(--dsh-layout-radius-user, 8px);
  --dam-fg: var(--dsw-alias-label-primary, #f4f4f5);
  --dam-fg-2: var(--dsw-alias-label-secondary, #b3b3b8);
  --dam-fg-3: var(--dsw-alias-label-tertiary, #8a8a8e);
  --dam-line: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  --dam-line-soft: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  --dam-group-bg: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  --dam-hover: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  --dam-selected: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  --dam-icon-bg: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  --dam-err: var(--dsw-alias-state-error-primary, #dc2626);
  --dam-ok: var(--dsw-alias-state-success-primary, #16a34a);
  --dam-tool: #d97706;
  --dam-accent: #3678ea;
  --dam-t: 120ms var(--ds-ease-in-out, ease);
  display: block;
  font-family: var(--dsw-alias-font-sans, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", sans-serif);
  color: var(--dam-fg);
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
  color: var(--dam-fg-2);
  border: 1px solid var(--dam-line);
  border-radius: var(--dam-r-lg);
  background: var(--dam-group-bg);
}
.dam-note--error {
  color: var(--dam-err);
  border-color: color-mix(in srgb, var(--dam-err) 28%, transparent);
  background: color-mix(in srgb, var(--dam-err) 7%, transparent);
}

/* ── master-detail shell ─────────────────────────────────────────────────── */
.dam-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
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
  background: var(--dam-group-bg);
  border: 1px solid var(--dam-line);
  border-radius: var(--dam-r-lg);
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
  border: 1px solid var(--dam-line-soft);
  border-radius: var(--dam-r);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  transition: border-color var(--dam-t), background var(--dam-t);
}
.dam-search:focus-within {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
  background: var(--dam-hover);
}
.dam-search svg { width: 13px; height: 13px; flex-shrink: 0; color: var(--dam-fg-3); }
.dam-search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--dam-fg);
  font: inherit;
  font-size: 12px;
  outline: none;
}
.dam-search-input::placeholder { color: var(--dam-fg-3); }
.dam-search-input::-webkit-search-cancel-button { -webkit-appearance: none; }
.dam-search-count {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--dam-fg-3);
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--dam-icon-bg);
}

.dam-list-scroll {
  overflow-y: auto;
  min-height: 0;
  padding-bottom: 2px;
  overscroll-behavior: contain;
}
.dam-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 12px;
  line-height: 1.55;
  color: var(--dam-fg-3);
}

/* list row — compact 44px entry: title 13px/600 over 11px meta, with a
   24px restore icon button on the trailing edge. Hover is a background
   lighten only; selection is a 6% fill. */
.dam-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 8px 8px 14px;
  cursor: pointer;
  transition: background var(--dam-t);
}
.dam-row + .dam-row { border-top: 1px solid var(--dam-line-soft); }
.dam-row:hover { background: var(--dam-hover); }
.dam-row--active { background: var(--dam-selected); }
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
  color: var(--dam-fg-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dam-row:hover .dam-row-title,
.dam-row--active .dam-row-title { color: var(--dam-fg); }
.dam-row-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  line-height: 1.2;
  color: var(--dam-fg-3);
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
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: 1px solid var(--dam-line-soft);
  border-radius: var(--dam-r);
  background: transparent;
  color: var(--dam-fg-2);
  cursor: pointer;
  opacity: 0;
  transition: background var(--dam-t), color var(--dam-t), border-color var(--dam-t), opacity var(--dam-t);
}
.dam-row:hover .dam-icon-btn,
.dam-row:focus-within .dam-icon-btn,
.dam-row--active .dam-icon-btn { opacity: 1; }
.dam-icon-btn:hover {
  background: var(--dam-hover);
  border-color: var(--dam-line);
  color: var(--dam-fg);
}
.dam-icon-btn:active { transform: scale(0.97); }
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
  padding: 40px 20px;
  text-align: center;
  font-size: 12px;
  line-height: 1.55;
  color: var(--dam-fg-3);
  border: 1px dashed var(--dam-line);
  border-radius: var(--dam-r-lg);
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
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--dam-fg);
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

/* buttons — 28px hairline controls. Primary: label-primary 14% fill +
   24% border. Secondary: 10% border only. Danger: error color. Active
   settles with scale(0.97); nothing else moves. */
.dam-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dam-r);
  background: transparent;
  color: var(--dam-fg);
  cursor: pointer;
  transition: background var(--dam-t), border-color var(--dam-t), color var(--dam-t);
}
.dam-btn:hover {
  background: var(--dam-hover);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
}
.dam-btn:active { transform: scale(0.97); }
.dam-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dam-btn:disabled:hover { background: transparent; }
.dam-btn svg { width: 13px; height: 13px; flex-shrink: 0; opacity: 0.85; }
.dam-btn--primary {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  color: var(--dam-fg);
  font-weight: 600;
}
.dam-btn--primary:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 30%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent);
}
.dam-btn--danger {
  border-color: color-mix(in srgb, var(--dam-err) 26%, transparent);
  color: var(--dam-err);
}
.dam-btn--danger:hover {
  border-color: color-mix(in srgb, var(--dam-err) 38%, transparent);
  background: color-mix(in srgb, var(--dam-err) 9%, transparent);
}
.dam-btn--sm { height: 26px; padding: 0 10px; font-size: 11px; }

/* delete disclosure — inline error-tinted note with the manual path */
.dam-delete {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 14px;
  font-size: 12px;
  color: var(--dam-fg-2);
  border: 1px solid color-mix(in srgb, var(--dam-err) 24%, transparent);
  border-radius: var(--dam-r-lg);
  background: color-mix(in srgb, var(--dam-err) 7%, transparent);
}
.dam-delete-text { min-width: 0; }
.dam-delete-path {
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
  font-size: 11px;
  color: var(--dam-fg);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── group containers (session summary / timeline) ───────────────────────── */
.dam-group {
  padding: 6px;
  background: var(--dam-group-bg);
  border: 1px solid var(--dam-line);
  border-radius: var(--dam-r-lg);
}
.dam-group-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 14px 6px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: var(--dam-fg-3);
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
.dam-kv + .dam-kv { border-top: 1px solid var(--dam-line-soft); }
.dam-kv-key { font-size: 12px; color: var(--dam-fg-3); flex-shrink: 0; }
.dam-kv-val {
  min-width: 0;
  font-size: 12px;
  color: var(--dam-fg);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}
.dam-kv-val--code {
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
  font-size: 11px;
  color: var(--dam-fg-2);
}

/* timeline rows — 24px role icon base + name/time + single-line excerpt.
   Rows share the group's hairline rhythm; each row (but the last) draws
   a 2px label-primary 10% thread from its icon down to the next icon. */
/* Batched timeline: the sentinel + button below the rendered slice. */
.dam-tl-more { display: flex; justify-content: center; padding: 10px 0 4px; }
.dam-tl-more-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 26px; padding: 3px 14px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-secondary, #b3b3b8); font: inherit; font-size: 12px; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
.dam-tl-more-btn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dam-tl-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 44px;
  padding: 8px 14px;
}
.dam-tl-row + .dam-tl-row { border-top: 1px solid var(--dam-line-soft); }
.dam-tl-row:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 34px;       /* 8px padding + 24px icon + 2px */
  bottom: -8px;    /* reach the next row's icon top edge */
  left: 25px;      /* 14px padding + 12px icon center − 1px */
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
  border-radius: var(--dam-r);
  background: var(--dam-icon-bg);
  font-size: 11px;
  font-weight: 600;
  color: var(--dam-fg-3);
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
  background: var(--dam-fg-3);
}
.dam-tl-name {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--dam-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dam-tl-time {
  margin-left: auto;
  padding-left: 10px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--dam-fg-3);
  font-variant-numeric: tabular-nums;
}
.dam-tl-text {
  font-size: 12px;
  line-height: 1.45;
  color: var(--dam-fg-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Click the excerpt to see the whole event: collapsed keeps the quiet
   one-line look, expanded wraps freely with a subtle side rule. */
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
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
  font-size: 11px;
}

/* role tints — dot + icon glyph only, bases stay neutral */
.dam-tl-row--user .dam-tl-dot { background: var(--dam-accent); }
.dam-tl-row--user .dam-tl-icon { color: var(--dam-accent); }
.dam-tl-row--assistant .dam-tl-dot { background: var(--dam-ok); }
.dam-tl-row--assistant .dam-tl-icon { color: var(--dam-ok); }
.dam-tl-row--toolCall .dam-tl-dot { background: var(--dam-tool); }
.dam-tl-row--toolCall .dam-tl-icon { color: var(--dam-tool); }
.dam-tl-row--toolResult .dam-tl-dot { background: var(--dam-ok); }
.dam-tl-row--toolResult .dam-tl-icon { color: var(--dam-ok); }

/* timeline state rows (loading / error / empty) */
.dam-tl-state {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 8px 14px;
  font-size: 12px;
  color: var(--dam-fg-3);
}
.dam-tl-state--error { color: var(--dam-err); }

/* keyboard focus — outline only, never a shadow */
.dam-row:focus-visible,
.dam-btn:focus-visible,
.dam-icon-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent);
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
  border-radius: var(--dam-r);
  background: var(--dsw-alias-bg-layer-3, #1c1c1f);
  color: var(--dsw-alias-label-primary, #fff);
  font-size: 12px;
  line-height: 1.5;
  animation: dam-toast-in 120ms ease;
}
.dam-toast--error {
  border-color: color-mix(in srgb, var(--dam-err) 38%, transparent);
  background: color-mix(in srgb, var(--dam-err) 16%, var(--dsw-alias-bg-layer-3, #1c1c1f));
  color: var(--dam-fg);
}
@keyframes dam-toast-in { from { opacity: 0; } to { opacity: 1; } }

/* ── responsive — collapse to a single column on H5 ──────────────────────── */
@media (max-width: 767px) {
  .dam-shell { grid-template-columns: 1fr; }
  .dam-list { position: static; max-height: none; }
  .dam-list-scroll { max-height: 264px; }
  .dam-toolbar-name { flex-basis: 100%; min-width: 0; }
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
