const STYLE_ID = 'dsh-mcp-manager-styles'

/**
 * Design language: "Quiet Structure" (Raycast-store / macOS-Settings shape).
 *   - content lives in grouped containers — flat translucent fills
 *     (bg-layer-2) with an 8% hairline and the user's large radius —
 *     holding compact rows separated by 6% hairlines
 *   - hover is background-only (4% brighten, 120ms); no translateY,
 *     no drop shadows, no gradients, no glow, anywhere
 *   - buttons are small (26–28px): primary = 14% fill + 24% border,
 *     secondary = 10% border, press feedback via scale(.97)
 *   - status is a 6px dot in the status color; icons sit on 32px plinths
 *     filled 6%; type scale: names 13/600, meta 11 tertiary,
 *     descriptions 12 secondary, block labels 11/500 +0.05em
 *   - every color rides a --dsw-alias-* token with a dark hex fallback;
 *     radii bridge onto --dsh-layout-radius-user / -lg
 *   - html[data-dsh-layout-material='on'] pours glass keyed off
 *     --dsh-layout-glass-base / --dsh-layout-line: groups 34% /
 *     panels 46%, line borders 45–55%
 *   - the only motion is background/color 120ms transitions (plus the
 *     switch knob slide and the loading spinners, both disabled under
 *     prefers-reduced-motion)
 */
const CSS = `
/* ── shell ──────────────────────────────────────────────────────────────── */
.dshmcp-tab { width: 100%; display: flex; flex-direction: column; gap: 12px; color: var(--dsw-alias-label-primary, #f4f4f5); }

/* ── toolbar row: small label + count + actions ─────────────────────────── */
.dshmcp-bar { display: flex; align-items: center; gap: 8px; min-height: 28px; flex-wrap: wrap; }
.dshmcp-barLabel { font-size: 11px; font-weight: 500; letter-spacing: 0.05em; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-count { min-width: 18px; height: 18px; padding: 0 6px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 16px; display: inline-flex; align-items: center; justify-content: center; }
.dshmcp-spacer { flex: 1; }

/* ── block label (11px eyebrow above a grouped block) ───────────────────── */
.dshmcp-label { font-size: 11px; font-weight: 500; letter-spacing: 0.05em; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── grouped container recipe ───────────────────────────────────────────── */
/* Flat translucent fill + 8% hairline + the user's large radius; rows sit
   on 6% hairlines (first row carries none). Shared by the master nav, the
   detail field list, the tool list and the market list. */
.dshmcp-nav,
.dshmcp-fields,
.dshmcp-toolList,
.dshmcp-mkt-list {
  margin: 0; padding: 6px; list-style: none;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}

/* ── buttons ────────────────────────────────────────────────────────────── */
/* 26–28px controls. Primary: 14% fill + 24% border. Secondary: 10% border.
   Press = scale(.97); hover brightens the fill only. */
.dshmcp-button {
  height: 28px; padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit; font-size: 12.5px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-button:active { transform: scale(0.97); }
.dshmcp-button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-button[disabled] { opacity: .5; cursor: default; }
.dshmcp-buttonIcon { width: 28px; height: 28px; padding: 0; justify-content: center; }
.dshmcp-buttonPrimary { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }
.dshmcp-buttonPrimary:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshmcp-buttonDanger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent); }
.dshmcp-buttonDanger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 32%, transparent); }
.dshmcp-buttonGhostSm { height: 26px; padding: 0 9px; font-size: 12px; }

/* ── status text / failure ──────────────────────────────────────────────── */
.dshmcp-status { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12px; line-height: 1.55; margin: 0; }
.dshmcp-failure { color: var(--dsw-alias-state-error-primary, #ef5350); font-size: 12.5px; line-height: 1.55; display: flex; align-items: center; gap: 10px; }
.dshmcp-failure p { margin: 0; }
.dshmcp-failure button { height: 26px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; cursor: pointer; background: transparent; border-radius: var(--dsh-layout-radius-user, 8px); padding: 0 10px; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-failure button:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }

/* ── loading skeleton: grouped rows with a soft opacity pulse ───────────── */
.dshmcp-skeleton { padding: 6px; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshmcp-skelRow { height: 44px; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); animation: dshmcp-pulse 1.6s var(--ds-ease-in-out, ease) infinite; }
.dshmcp-skelRow + .dshmcp-skelRow { margin-top: 6px; }
@keyframes dshmcp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
@media (prefers-reduced-motion: reduce) { .dshmcp-skelRow { animation: none !important; } }

/* ── empty state ────────────────────────────────────────────────────────── */
.dshmcp-empty { padding: 36px 16px 32px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.dshmcp-emptyTile { width: 40px; height: 40px; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; margin-bottom: 6px; }
.dshmcp-emptyTitle { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); margin: 0; }
.dshmcp-empty p { font-size: 12px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin: 0; line-height: 1.55; }

/* ── master–detail split ────────────────────────────────────────────────── */
.dshmcp-split { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 12px; align-items: start; }
@media (max-width: 767px) {
  .dshmcp-split { grid-template-columns: minmax(0, 1fr); }
  .dshmcp-nav { max-height: 40vh; overflow-y: auto; }
}

/* ── master list: compact rows (dot + name / meta) ──────────────────────── */
.dshmcp-navRow { margin: 0; }
.dshmcp-navRow + .dshmcp-navRow { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshmcp-navBtn { box-sizing: border-box; width: 100%; min-width: 0; min-height: 46px; padding: 7px 8px 7px 10px; display: flex; flex-direction: column; gap: 2px; background: none; border: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; border-radius: var(--dsh-layout-radius-user, 8px); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-navBtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-navBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-navRow[data-selected=true] .dshmcp-navBtn { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent); }
.dshmcp-navLine { min-width: 0; display: flex; align-items: center; gap: 7px; }
.dshmcp-navName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-navName.is-muted { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-weight: 500; }
.dshmcp-navMeta { min-width: 0; display: inline-flex; align-items: center; gap: 5px; padding-left: 13px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── detail panel ───────────────────────────────────────────────────────── */
.dshmcp-detail { background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.dshmcp-detailHead { display: flex; flex-direction: column; gap: 4px; }
.dshmcp-detailTitleLine { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dshmcp-detailTitle { font-size: 14px; font-weight: 600; line-height: 19px; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-detailTitle.is-muted { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-detailTitle.is-error { color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-detailTag { flex: none; height: 18px; padding: 0 7px; border-radius: 999px; font-size: 10.5px; font-weight: 500; line-height: 16px; display: inline-flex; align-items: center; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-detailMeta { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; line-height: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-detailActions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 4px; }
.dshmcp-block { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.dshmcp-blockHead { display: flex; align-items: center; gap: 8px; min-height: 20px; flex-wrap: wrap; }

/* ── grouped field rows (dl in the detail panel) ────────────────────────── */
.dshmcp-fields { display: flex; flex-direction: column; }
.dshmcp-fields > div { display: grid; grid-template-columns: 108px minmax(0, 1fr); gap: 4px 12px; align-items: baseline; padding: 7px 8px 7px 10px; border-radius: var(--dsh-layout-radius-user, 8px); }
.dshmcp-fields > div + div { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshmcp-fields dt { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 16px; }
.dshmcp-fields dd { overflow-wrap: anywhere; min-width: 0; color: var(--dsw-alias-label-secondary, #b3b3b8); margin: 0; font-size: 12px; line-height: 1.5; display: inline-flex; align-items: center; gap: 5px; }
.dshmcp-path { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; }

/* ── status dots: 6px, flat status color, no glow ───────────────────────── */
.dshmcp-statusDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-label-tertiary, #8a8a8e); display: inline-block; }
.dshmcp-statusDot[data-phase=active] { background: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-statusDot[data-phase=failed] { background: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-statusDot[data-phase=loading], .dshmcp-statusDot[data-phase=pending] { background: var(--dsw-alias-state-business-primary, #ffb74d); }
.dshmcp-statusDot[data-phase=disabled] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); }
@keyframes dshmcp-breathe { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
.dshmcp-statusDot[data-phase=loading], .dshmcp-statusDot[data-phase=pending] { animation: dshmcp-breathe 1.6s var(--ds-ease-in-out, ease) infinite; }
@media (prefers-reduced-motion: reduce) { .dshmcp-statusDot { animation: none !important; } }

/* ── callouts: flat tint + colored left rule ────────────────────────────── */
.dshmcp-callout { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 16%, transparent); border-left: 3px solid var(--dsw-alias-state-business-primary, #ffb74d); background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 6%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); padding: 8px 12px; font-size: 12px; line-height: 1.55; margin: 0; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-calloutWarn { border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 18%, transparent); border-left-color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 6%, transparent); }
.dshmcp-calloutError { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent); border-left-color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent); }

/* ── editor (panel) ─────────────────────────────────────────────────────── */
.dshmcp-editor { background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); display: flex; flex-direction: column; overflow: hidden; }
.dshmcp-editorHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 14px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshmcp-editorHead h3 { font-size: 14px; font-weight: 600; margin: 0; flex: 1; }
.dshmcp-editorBody { padding: 14px; display: flex; flex-direction: column; gap: 14px; }
.dshmcp-editorFoot { position: sticky; bottom: 0; display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); background: var(--dsw-alias-bg-layer-3, #232327); }

/* ── forms ──────────────────────────────────────────────────────────────── */
.dshmcp-form { display: flex; flex-direction: column; gap: 12px; }
.dshmcp-formRow { display: flex; flex-direction: column; gap: 6px; }
.dshmcp-formRow > label { font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshmcp-formRow > span { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); line-height: 1.55; }
.dshmcp-input, .dshmcp-select { width: 100%; box-sizing: border-box; height: 30px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 10px; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-input:hover, .dshmcp-select:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-input:focus-visible, .dshmcp-select:focus-visible { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-textarea { width: 100%; box-sizing: border-box; min-height: 200px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; line-height: 1.55; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 10px; font-family: var(--ds-font-family-code, ui-monospace, monospace); resize: vertical; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-textarea:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-textarea:focus-visible { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-checkRow { display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer; }
.dshmcp-radioRow { display: flex; gap: 16px; flex-wrap: wrap; }

/* ── segmented control (editor modes) ───────────────────────────────────── */
.dshmcp-seg { display: inline-flex; gap: 2px; padding: 3px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }
.dshmcp-seg button { height: 26px; padding: 0 12px; border: 0; background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; font-size: 12px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 3px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-seg button:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-seg button[aria-pressed=true] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font-weight: 500; }
.dshmcp-seg button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }

/* ── key/value editor panel ─────────────────────────────────────────────── */
.dshmcp-kvList { display: flex; flex-direction: column; gap: 6px; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 8px; }
.dshmcp-kvRow { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) 26px; gap: 6px; align-items: center; }
.dshmcp-kvRow input { width: 100%; box-sizing: border-box; height: 28px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 8px; font-family: var(--ds-font-family-code, ui-monospace, monospace); transition: border-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-kvRow input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-kvRow input:focus-visible { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); }
.dshmcp-kvRow input[disabled] { color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 6%, transparent); }
.dshmcp-kvRemove { width: 26px; height: 26px; border: 1px solid transparent; background: none; color: var(--dsw-alias-label-tertiary, #8a8a8e); cursor: pointer; border-radius: var(--dsh-layout-radius-user, 8px); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; transition: color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-kvRemove:hover { color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); }
.dshmcp-kvFoot { padding: 0 2px; }

/* ── tags ───────────────────────────────────────────────────────────────── */
.dshmcp-tag { height: 20px; padding: 0 8px; white-space: nowrap; border-radius: 999px; align-items: center; display: inline-flex; font-size: 11px; font-weight: 500; line-height: 18px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshmcp-tagOk { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-tagWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 18%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshmcp-tagError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-tagCode { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 10.5px; font-weight: 500; }

/* ── editor test-result panel ───────────────────────────────────────────── */
.dshmcp-testPanel { background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 10px 12px; display: flex; flex-direction: column; gap: 10px; }
.dshmcp-testPanel pre { margin: 0; padding: 8px 10px; overflow: auto; font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; line-height: 1.5; color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 5%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }
.dshmcp-testHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dshmcp-testIcon { flex: none; display: inline-flex; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-testOk .dshmcp-testIcon { color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-testFail .dshmcp-testIcon { color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-testHeadBody { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dshmcp-testHeadBody strong { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-testMeta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── tools area (detail block + editor) ─────────────────────────────────── */
.dshmcp-toolsArea { display: flex; flex-direction: column; gap: 8px; position: static; }
.dshmcp-toolsBar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dshmcp-toolsMeta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-variant-numeric: tabular-nums; display: inline-flex; align-items: center; gap: 5px; }
.dshmcp-autoTest { display: inline-flex; align-items: center; gap: 5px; }
.dshmcp-chipStatus { display: inline-flex; align-items: center; gap: 6px; height: 20px; padding: 0 8px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dshmcp-chipStatus.is-ok { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-chipStatus.is-fail { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-chipDot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.dshmcp-toolSearch { flex: none; display: inline-flex; align-items: center; gap: 8px; position: relative; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-toolSearch > svg { pointer-events: none; position: absolute; left: 9px; z-index: 1; }
.dshmcp-toolSearch input { width: min(200px, 46vw); height: 26px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 8px 0 28px; transition: border-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-toolSearch input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-toolSearch input:focus-visible { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); }
.dshmcp-toolSearch input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-toolSearchCount { position: absolute; right: 9px; font-size: 11px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── tool rows (grouped container, hairline separated) ──────────────────── */
.dshmcp-toolList li + li { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshmcp-toolHead { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 9px; min-height: 38px; padding: 5px 8px; background: none; border: 0; border-radius: var(--dsh-layout-radius-user, 8px); color: inherit; font: inherit; text-align: left; cursor: pointer; transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-toolHead:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-toolHead:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-toolHead.is-selected { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 8%, transparent); }
.dshmcp-toolDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 45%, transparent); }
.dshmcp-toolHead.is-selected .dshmcp-toolDot { background: var(--dsw-alias-state-business-primary, #ffb74d); }
.dshmcp-toolMain { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dshmcp-toolName { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-toolDesc { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 15px; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
.dshmcp-toolParamsHint { flex: none; font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #8a8a8e); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: 999px; padding: 1px 7px; white-space: nowrap; }
.dshmcp-toolChevron { flex: none; display: inline-flex; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-toolHead:hover .dshmcp-toolChevron { color: var(--dsw-alias-label-secondary, #b3b3b8); }

/* ── tool detail modal ──────────────────────────────────────────────────── */
[role="dialog"].dshmcp-toolModal { width: min(820px, 92vw); height: min(760px, 88dvh); max-height: 88dvh; box-sizing: border-box; overflow: hidden; }
.dshmcp-toolModalBody { width: 100%; height: 100%; min-height: 0; max-height: 100%; box-sizing: border-box; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 14px; }
.dshmcp-toolModalBody > :first-child { position: sticky; top: 0; z-index: 2; background: var(--dsw-alias-bg-layer-3, #232327); }
.dshmcp-toolModalBody h6 { margin: 0 0 6px; font-size: 11px; font-weight: 500; letter-spacing: 0.05em; color: var(--dsw-alias-label-tertiary, #8a8a8e); text-transform: uppercase; }
.dshmcp-toolModalDesc { margin: 0; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary, #b3b3b8); white-space: normal; overflow-wrap: anywhere; }
.dshmcp-schemaSection { min-height: 0; }
.dshmcp-schemaViewport { min-height: 140px; height: clamp(180px, 42dvh, 420px); max-height: 42dvh; box-sizing: border-box; overflow: auto; overscroll-behavior: contain; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); padding: 6px 8px; scrollbar-gutter: stable; }
.dshmcp-schemaViewport:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-paramTable { width: 100%; border-collapse: collapse; font-size: 12px; }
.dshmcp-paramTable td { padding: 5px 8px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); vertical-align: top; }
.dshmcp-paramTable tr:last-child td { border-bottom: 0; }
.dshmcp-paramName { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11.5px; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-paramType { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11.5px; }
.dshmcp-paramRequired { color: var(--dsw-alias-state-business-primary, #ffb74d); font-size: 11px; font-weight: 500; }
.dshmcp-paramOptional { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; }

/* ── enable/disable switch ──────────────────────────────────────────────── */
.dshmcp-switch { flex: none; width: 30px; height: 18px; padding: 0; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); cursor: pointer; position: relative; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-switch.is-on { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 26%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 32%, transparent); }
.dshmcp-switch:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: 2px; }
.dshmcp-switch[disabled] { opacity: .5; cursor: default; }
.dshmcp-switchKnob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 999px; background: #fff; transition: transform 120ms var(--ds-ease-in-out, ease); display: block; }
.dshmcp-switch.is-on .dshmcp-switchKnob { transform: translateX(12px); }

/* ── spinner ────────────────────────────────────────────────────────────── */
.dshmcp-spin { animation: dshmcp-rotate 1s linear infinite; }
@keyframes dshmcp-rotate { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .dshmcp-spin { animation: none !important; } }


/* ─── Marketplace shelf (vendored) ───
   Styles for the toolbar / row list rendered by market/MarketShelf.tsx.
   Vendored from the shared Quiet Structure recipe — owned HERE since
   the launcher stopped shipping market styles; dsh-skill-manager
   carries its own dshm-mkt-* copy. */
.dshmcp-mkt { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

/* toolbar: segmented sources + search + icon buttons */
.dshmcp-mkt-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshmcp-mkt-seg {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  max-width: 420px;
  min-width: 0;
  gap: 2px;
  padding: 3px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  overflow-x: auto;
  scrollbar-width: none;
}
.dshmcp-mkt-segItem {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 26px;
  min-width: 56px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-segItem:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-mkt-segItem:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-mkt-segItem.is-active { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font-weight: 500; }
.dshmcp-mkt-segName { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.dshmcp-mkt-segDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-mkt-segItem.is-down .dshmcp-mkt-segDot { background: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-mkt-segItem.is-invalid .dshmcp-mkt-segDot { background: var(--dsw-alias-state-business-primary, #ffb74d); }

.dshmcp-mkt-search {
  flex: 1;
  min-width: 180px;
  height: 34px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-search:focus-within { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-mkt-search input { flex: 1; background: transparent; border: 0; outline: 0; color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; min-width: 0; }
.dshmcp-mkt-search input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-mkt-search svg { width: 14px; height: 14px; flex: 0 0 14px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

.dshmcp-mkt-iconbtn {
  flex: none;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-iconbtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-mkt-iconbtn:active { transform: scale(0.97); }
.dshmcp-mkt-iconbtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-mkt-iconbtn[disabled] { opacity: .5; cursor: default; }
.dshmcp-mkt-iconbtn.is-active { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dshmcp-mkt-iconbtn svg { width: 14px; height: 14px; }
.dshmcp-mkt-iconbtn.is-spin svg { animation: dshmcp-mkt-spin 1.2s linear infinite; }
@media (prefers-reduced-motion: reduce) { .dshmcp-mkt-iconbtn.is-spin svg { animation: none !important; } }

/* add-source: compact inline disclosure row */
.dshmcp-mkt-addrow { display: flex; gap: 8px; flex-wrap: wrap; }
.dshmcp-mkt-addrow input {
  flex: 1 1 180px;
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  padding: 0 10px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12.5px;
  outline: 0;
  transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-addrow input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-mkt-addrow input:focus { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-mkt-addrow input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-mkt-addbtn {
  flex: none;
  height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-addbtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshmcp-mkt-addbtn:active { transform: scale(0.97); }
.dshmcp-mkt-addbtn[disabled] { opacity: .5; cursor: default; }
.dshmcp-mkt-addbtn.is-quiet { background: transparent; border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshmcp-mkt-addbtn.is-quiet:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }

/* the list: one grouped container of compact rows */
.dshmcp-mkt-row { margin: 0; }
.dshmcp-mkt-row + .dshmcp-mkt-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshmcp-mkt-rowInner {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 5px 6px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  transition: background-color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-rowInner:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-mkt-rowTile {
  flex: none;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dshmcp-mkt-rowTile svg { width: 16px; height: 16px; }
.dshmcp-mkt-rowId {
  flex: 0 0 clamp(150px, 26%, 230px);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.dshmcp-mkt-rowIdBtn { background: none; border: 0; padding: 0; font: inherit; text-align: left; cursor: pointer; color: inherit; }
.dshmcp-mkt-rowIdBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: 2px; border-radius: var(--dsh-layout-radius-user, 8px); }
.dshmcp-mkt-rowName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-mkt-rowMeta { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-mkt-rowDesc { flex: 1; min-width: 0; font-size: 12px; line-height: 16px; color: var(--dsw-alias-label-secondary, #b3b3b8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-mkt-rowSide { flex: none; display: inline-flex; align-items: center; gap: 6px; }
.dshmcp-mkt-installed {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 8%, transparent);
  color: var(--dsw-alias-state-success-primary, #4caf50);
}
.dshmcp-mkt-installedDot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.dshmcp-mkt-install {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-install:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshmcp-mkt-install:active { transform: scale(0.97); }
.dshmcp-mkt-install:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-mkt-install[disabled] { opacity: .55; cursor: default; }
.dshmcp-mkt-remove {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-remove:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-mkt-remove:active { transform: scale(0.97); }
.dshmcp-mkt-remove:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-mkt-remove[disabled] { opacity: .55; cursor: default; }

.dshmcp-mkt-empty {
  text-align: center;
  padding: 40px 16px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font-size: 12px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.dshmcp-mkt-error {
  color: var(--dsw-alias-state-error-primary, #ef5350);
  font-size: 12px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
}

@keyframes dshmcp-mkt-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

/* ── material linkage (dsh-layout frosted glass) ────────────────────────── */
/* Groups pour 34% glass, panels 46%, with --dsh-layout-line borders
   (45–55%) so the quiet containers sit on the canvas like native
   chrome when the workspace material is on. */
html[data-dsh-layout-material='on'] .dshmcp-nav,
html[data-dsh-layout-material='on'] .dshmcp-fields,
html[data-dsh-layout-material='on'] .dshmcp-toolList,
html[data-dsh-layout-material='on'] .dshmcp-kvList,
html[data-dsh-layout-material='on'] .dshmcp-mkt-list,
html[data-dsh-layout-material='on'] .dshmcp-mkt-seg,
html[data-dsh-layout-material='on'] .dshmcp-mkt-empty {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dshmcp-detail,
html[data-dsh-layout-material='on'] .dshmcp-editor,
html[data-dsh-layout-material='on'] .dshmcp-testPanel {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dshmcp-editorFoot { background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 55%, transparent); border-top-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent); }

/* ── motion safety ──────────────────────────────────────────────────────── */
/* Quiet Structure only animates background/color; under reduced motion
   every transition switches off (the spinners / pulse / breathe are
   already guarded per-section above). */
@media (prefers-reduced-motion: reduce) {
  .dshmcp-navBtn,
  .dshmcp-button,
  .dshmcp-failure button,
  .dshmcp-mkt-rowInner,
  .dshmcp-mkt-segItem,
  .dshmcp-mkt-iconbtn,
  .dshmcp-mkt-addbtn,
  .dshmcp-mkt-install,
  .dshmcp-mkt-remove,
  .dshmcp-switch,
  .dshmcp-switchKnob { transition: none !important; }
}

/* ── narrow viewports ───────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .dshmcp-mkt-bar { align-items: stretch; flex-direction: column; }
  .dshmcp-mkt-seg { max-width: none; width: 100%; }
  .dshmcp-mkt-search { min-width: 0; }
  .dshmcp-mkt-bar .dshmcp-mkt-iconbtn { align-self: flex-end; }
  .dshmcp-mkt-rowDesc { display: none; }
  .dshmcp-mkt-rowId { flex-basis: auto; flex: 1; }
}
@media (max-width: 480px) {
  .dshmcp-mkt-rowSide { flex-direction: column; align-items: flex-end; gap: 4px; }
}
`

export function installStyles(doc: Document): () => void {
  const existing = doc.getElementById(STYLE_ID)
  if (existing !== null) return () => {}
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.dataset.plugin = 'dsh-mcp-manager'
  style.textContent = CSS
  doc.head.append(style)
  return () => {
    style.remove()
  }
}
