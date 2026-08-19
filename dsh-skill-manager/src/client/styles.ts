const STYLE_ID = 'dsh-skill-manager-styles'

/**
 * Quiet Structure — shared design language across the dsh-* plugins,
 * shaped after Raycast's store / macOS Settings pages:
 *   - content lives in grouped containers (bg layer-2, 1px hairline
 *     borders mixed from label-primary, radius bridged to the user's
 *     dsh-layout corner radii) holding compact rows separated by 1px
 *     hairlines — one list per group; the market's opt-in card grid is
 *     the single exception, built from the same quiet fills (3% base,
 *     4% hover, no lift / shadow / gradient)
 *   - typography is fixed and small: names 13px/600, meta 11px tertiary,
 *     descriptions 12px secondary, section labels 11px/500 with wide
 *     tracking; the workspace shell owns the big titles
 *   - interaction grammar is background-only: rows lighten 4% on hover
 *     (120ms), buttons press via scale(0.97); no translateY lifts, no
 *     drop shadows, no gradient fills, no glow (status dots stay flat)
 *   - every color rides a --dsw-alias-* token with a dark hex fallback
 *   - the dsh-layout material (data-dsh-layout-material='on') swaps the
 *     quiet fills for translucent glass tints: groups 34%, panels 46%,
 *     icon bases 52%, borders from --dsh-layout-line 45-55%
 *   - motion is background/color 120ms only; prefers-reduced-motion
 *     disables every transition and the loading animations
 */
const CSS = `
/* ── shell ──────────────────────────────────────────────────────────────── */
.dshm-tab { width: 100%; max-width: 960px; display: flex; flex-direction: column; gap: 12px; color: var(--dsw-alias-label-primary, #f4f4f5); }

/* ── quiet atoms: section labels, grouped containers ───────────────────── */
.dshm-sectionLabel { font-size: 11px; font-weight: 500; letter-spacing: 0.05em; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-group { background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 6px; }

/* ── toolbar: search + compact icon actions ────────────────────────────── */
.dshm-toolbar { display: flex; align-items: center; gap: 8px; }
.dshm-search { flex: 1; min-width: 0; display: flex; align-items: center; position: relative; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-search > svg { pointer-events: none; position: absolute; left: 10px; z-index: 1; }
.dshm-search input { width: 100%; height: 34px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 13px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 10px 0 30px; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-search input[type=search]::-webkit-search-cancel-button { -webkit-appearance: none; }
.dshm-search input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-search input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-search input:focus-visible { border-color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-searchDense input { height: 28px; padding-left: 28px; font-size: 12.5px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); }

/* ── heading row (import view): quiet 13px title ───────────────────────── */
.dshm-heading { display: flex; align-items: center; gap: 8px; min-height: 28px; }
.dshm-heading h3 { font-size: 13px; font-weight: 600; letter-spacing: .01em; line-height: 18px; margin: 0; }
.dshm-spacer { flex: 1; }

/* ── buttons: 26-28px, flat fills, press-down only ─────────────────────── */
.dshm-button { height: 28px; padding: 0 11px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshm-button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-button:active { transform: scale(0.97); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dshm-button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-button[disabled] { opacity: .5; cursor: default; transform: none; }
.dshm-buttonPrimary { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }
.dshm-buttonPrimary:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 17%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshm-buttonDanger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 30%, transparent); }
.dshm-buttonDanger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 40%, transparent); }
.dshm-iconBtn { width: 28px; height: 28px; padding: 0; justify-content: center; flex: none; }
.dshm-iconBtn.is-primary { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }

/* ── icon bases: 32px flat pads ────────────────────────────────────────── */
.dshm-tile { width: 32px; height: 32px; flex: none; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); display: grid; place-items: center; }
.dshm-tile.is-warn, .dshm-tileWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 10%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-tile.is-error, .dshm-tileError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }

/* ── status text / failure ──────────────────────────────────────────────── */
.dshm-status { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12px; line-height: 18px; margin: 0; padding: 0 4px; }
.dshm-failure { color: var(--dsw-alias-state-error-primary, #ef5350); font-size: 12.5px; line-height: 19px; display: flex; align-items: center; gap: 10px; }
.dshm-failure p { margin: 0; }
.dshm-failure button { height: 26px; padding: 0 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 30%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; cursor: pointer; background: none; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshm-failure button:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 42%, transparent); }

/* ── loading skeletons: compact rows inside the group rhythm ───────────── */
@keyframes dshm-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.dshm-skeleton { display: flex; flex-direction: column; gap: 0; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 6px; }
.dshm-skelRow { height: 44px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); background: linear-gradient(100deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent) 40%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent) 50%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent) 60%); background-size: 200% 100%; animation: dshm-shimmer 1.4s linear infinite; }
.dshm-skelRow + .dshm-skelRow { margin-top: 6px; }
@media (prefers-reduced-motion: reduce) { .dshm-skelRow { animation: none; } }

/* ── empty state ────────────────────────────────────────────────────────── */
.dshm-empty { padding: 32px 16px 28px; display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; }
.dshm-emptyTile { width: 44px; height: 44px; border-radius: var(--dsh-layout-radius-user, 10px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; margin-bottom: 6px; }
.dshm-emptyTitle { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); margin: 0; }
.dshm-empty p { font-size: 12px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin: 0; line-height: 18px; }
.dshm-emptyDense { padding: 26px 12px 22px; }

/* ── manager (own catalog): master-detail ───────────────────────────────── */
.dshm-managerGrid { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 14px; align-items: start; }
.dshm-managerMaster { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.dshm-managerBar { display: flex; align-items: center; gap: 6px; }
.dshm-managerLabelRow { display: flex; align-items: center; gap: 8px; padding: 2px 4px 0; }
.dshm-managerCount { margin-left: auto; font-size: 11px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-managerList { margin: 0; padding: 6px; list-style: none; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-managerRow { min-width: 0; }
.dshm-managerRow + .dshm-managerRow { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-managerRowBtn { box-sizing: border-box; width: 100%; min-width: 0; display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 6px 8px; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; border-radius: calc(var(--dsh-layout-radius-user-lg, 12px) - 6px); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-managerRowBtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-managerRow.is-selected .dshm-managerRowBtn { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-managerRowBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-managerTile { color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-managerRowBody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dshm-managerRowName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-managerRowMeta { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; white-space: nowrap; }
.dshm-managerRowMeta > :not(.dshm-managerFlag) { overflow: hidden; text-overflow: ellipsis; }
.dshm-managerFlag { flex: none; font-size: 10.5px; font-weight: 500; letter-spacing: 0.02em; }
.dshm-managerFlag.is-warn { color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-managerFlag.is-error { color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-managerDetail { min-width: 0; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 14px; }
.dshm-managerDetail > .dshm-tab { max-width: none; width: auto; gap: 12px; }
.dshm-managerHint { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 56px 16px; text-align: center; }
.dshm-managerHintTile { width: 36px; height: 36px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-managerHint p { margin: 0; max-width: 240px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── detail page (renders inside the manager detail panel) ─────────────── */
.dshm-detailHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dshm-heroTile { width: 40px; height: 40px; border-radius: var(--dsh-layout-radius-user, 10px); }
.dshm-hero { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; flex-wrap: wrap; }
.dshm-heroBody { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.dshm-heroName { font-size: 15px; font-weight: 600; letter-spacing: -.005em; line-height: 20px; margin: 0; overflow-wrap: anywhere; }
.dshm-heroTags { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.dshm-detailCard { border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.dshm-detailCard > h4 { font-size: 11px; font-weight: 500; letter-spacing: 0.05em; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin: 0; line-height: 16px; text-transform: uppercase; }
.dshm-desc { font-size: 12.5px; line-height: 1.55; margin: 0; overflow-wrap: anywhere; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-callout { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 18%, transparent); border-left: 3px solid var(--dsw-alias-state-business-primary, #6ea8fe); background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 7%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); padding: 9px 12px; font-size: 12.5px; line-height: 1.55; margin: 0; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-calloutWarn { border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 22%, transparent); border-left-color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 8%, transparent); }
.dshm-calloutError { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 22%, transparent); border-left-color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); }
.dshm-details { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 7px 12px; margin: 0; }
.dshm-details div { display: contents; }
.dshm-details dt { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11.5px; line-height: 18px; padding-top: 1px; }
.dshm-details dd { overflow-wrap: anywhere; min-width: 0; color: var(--dsw-alias-label-secondary, #b3b3b8); margin: 0; font-size: 12px; line-height: 1.55; }
.dshm-path { font-family: var(--ds-font-family-code); font-size: 11.5px; }
.dshm-filePanel { background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 10px); padding: 6px; }
.dshm-treeScroll { max-height: 340px; overflow: auto; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); }
.dshm-treeScroll .rct-tree-root { padding: 0; margin: 0; font: inherit; color: var(--dsw-alias-label-primary, #f4f4f5); outline: none; }
.dshm-treeScroll .rct-tree-root:focus-visible { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 35%, transparent); border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); }
.dshm-treeScroll .rct-tree-items-container { list-style: none; margin: 0; padding: 0; }
.dshm-treeItem { margin: 0; }
.dshm-treeRow { display: flex; align-items: center; gap: 5px; height: 27px; padding-right: 8px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); color: var(--dsw-alias-label-secondary, #b3b3b8); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-treeRow-folder { color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-treeRow:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-treeRow.is-selected { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 12%, transparent); }
.dshm-treeRow.is-focused { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 40%, transparent); }
.dshm-treeRow .rct-tree-item-arrow { width: 15px; height: 15px; flex: none; display: inline-flex; align-items: center; justify-content: center; color: var(--dsw-alias-label-tertiary, #8a8a8e); cursor: pointer; }
.dshm-treeRow .rct-tree-item-arrow svg { width: 10px; height: 10px; fill: currentColor; transition: transform 140ms var(--ds-ease-in-out, ease); }
.dshm-treeRow .rct-tree-item-arrow.rct-tree-item-arrow-expanded svg { transform: rotate(90deg); }
@media (prefers-reduced-motion: reduce) { .dshm-treeRow .rct-tree-item-arrow svg { transition: none; } }
.dshm-treeRow-file .rct-tree-item-arrow { visibility: hidden; }
.dshm-treeMain { flex: 1; min-width: 0; display: flex; align-items: center; gap: 7px; outline: none; }
.dshm-treeIcon { flex: none; display: inline-flex; align-items: center; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-treeRow-folder .dshm-treeIcon { color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-treeName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--ds-font-family-code); font-size: 12px; line-height: 17px; }
.dshm-treeRow-folder .dshm-treeName { font-weight: 500; }
.dshm-treeSize { flex: none; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; font-variant-numeric: tabular-nums; line-height: 16px; }
.dshm-fileDot { width: 5px; height: 5px; border-radius: 999px; background: var(--dsw-alias-label-tertiary, #8a8a8e); display: inline-block; flex: none; }
.dshm-md { font-size: 12.5px; line-height: 1.65; overflow-wrap: anywhere; }
.dshm-md > :first-child { margin-top: 0; }
.dshm-md :is(h1, h2, h3, h4) { font-size: 1.05em; margin: 1.1em 0 .4em; }

/* ── tags / flags (detail hero, preview) ───────────────────────────────── */
.dshm-tag { height: 20px; padding: 0 8px; white-space: nowrap; border-radius: 999px; align-items: center; display: inline-flex; font-size: 11px; font-weight: 500; line-height: 18px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-tagOk { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 10%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-tagWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 12%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-tagError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-tagCode { font-family: var(--ds-font-family-code); font-size: 10.5px; font-weight: 500; }

/* ── forms ──────────────────────────────────────────────────────────────── */
.dshm-form { display: flex; flex-direction: column; gap: 12px; }
.dshm-formRow { display: flex; flex-direction: column; gap: 6px; }
.dshm-formRow > label { font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-formRow > span { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); line-height: 17px; }
.dshm-input, .dshm-select { width: 100%; box-sizing: border-box; height: 32px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 13px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 10px; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-input:hover, .dshm-select:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-input:focus-visible, .dshm-select:focus-visible { border-color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── segmented control (import mode, preview switch) ────────────────────── */
.dshm-seg { display: inline-flex; gap: 2px; padding: 2px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }
.dshm-seg button { height: 26px; padding: 0 12px; border: 0; background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; font-size: 12px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-seg button:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-seg button[aria-pressed=true] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font-weight: 500; }
.dshm-seg button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }

/* ── file picker / upload ───────────────────────────────────────────────── */
.dshm-drop { display: flex; align-items: center; gap: 12px; border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); border-radius: var(--dsh-layout-radius-user, 10px); padding: 12px 14px; cursor: pointer; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent); transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-drop:hover { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 42%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 4%, transparent); }
.dshm-dropInput { display: none; }
.dshm-dropIcon { width: 32px; height: 32px; flex: none; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; }
.dshm-dropBody { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dshm-dropTitle { font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-dropHint { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── misc ───────────────────────────────────────────────────────────────── */
.dshm-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshm-warnList { margin: 0; padding-left: 18px; color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 12px; line-height: 18px; }
.dshm-warnList li { margin: 2px 0; }
.dshm-resultCard { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 24%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 7%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.dshm-resultHead { display: flex; align-items: center; gap: 10px; }
.dshm-resultIcon { width: 32px; height: 32px; flex: none; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 12%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); display: grid; place-items: center; }
.dshm-resultHead strong { font-size: 13px; }
.dshm-resultMeta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); line-height: 18px; }
.dshm-resultMeta code { font-family: var(--ds-font-family-code); font-size: 11.5px; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-visuallyHidden { clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; width: 1px; height: 1px; position: absolute; overflow: hidden; }
@media (width <= 680px) { .dshm-details { grid-template-columns: 76px minmax(0, 1fr); } }

/* ── file preview (below the tree) ──────────────────────────────────────── */
.dshm-previewWrap { margin-top: 10px; }
.dshm-previewCard { border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border-radius: var(--dsh-layout-radius-user, 10px); display: flex; flex-direction: column; overflow: hidden; }
.dshm-previewHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 8px 12px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent); }
.dshm-previewTile { width: 28px; height: 28px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); }
.dshm-previewTile-text { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 10%, transparent); color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-previewTile-image { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 10%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-previewTile-pdf { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-previewTile-audio, .dshm-previewTile-video { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 10%, transparent); color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-previewTile-binary { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-previewMeta { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 3px; }
.dshm-previewName { font-family: var(--ds-font-family-code); font-size: 12.5px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-previewChips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dshm-previewPath { font-family: var(--ds-font-family-code); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-segSm { padding: 2px; border-radius: var(--dsh-layout-radius-user, 8px); align-self: center; }
.dshm-segSm button { height: 24px; padding: 0 10px; font-size: 12px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 3px); }
.dshm-buttonGhostSm { height: 26px; padding: 0 9px; font-size: 12px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); gap: 5px; align-self: center; text-decoration: none; }
.dshm-previewBody { position: relative; max-height: 460px; overflow: auto; }
.dshm-previewLoading { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.dshm-previewBody .dshm-md { padding: 6px 16px 14px; }
.dshm-codeBody .shiki { margin: 0; padding: 13px 15px; background-color: transparent !important; font-family: var(--ds-font-family-code); font-size: 12.5px; line-height: 1.7; }
.dshm-codeBody .shiki code { display: block; padding: 0; background: transparent; font: inherit; }
.dshm-previewDark .dshm-codeBody .shiki, .dshm-previewDark .dshm-codeBody .shiki span { color: var(--shiki-dark) !important; }
.dshm-tableWrap { overflow: auto; }
.dshm-table { border-collapse: collapse; width: 100%; font-size: 12px; }
.dshm-table th { position: sticky; top: 0; z-index: 1; background: var(--dsw-alias-bg-layer-1, #1c1c1f); color: var(--dsw-alias-label-secondary, #b3b3b8); font-weight: 600; font-size: 11px; text-align: left; padding: 6px 12px; white-space: nowrap; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); }
.dshm-table td { padding: 5px 12px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); white-space: nowrap; max-width: 320px; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.dshm-table tbody tr:hover td { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-tableNote { margin: 0; padding: 6px 12px; font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-imgWrap { display: grid; place-items: center; padding: 16px; min-height: 120px; }
.dshm-img { max-width: 100%; max-height: 420px; border-radius: var(--dsh-layout-radius-user, 6px); }
.dshm-pdfFrame { display: block; width: 100%; height: 460px; border: 0; background: #fff; }
.dshm-audio { display: block; width: calc(100% - 32px); margin: 14px 16px; }
.dshm-video { display: block; width: calc(100% - 32px); max-height: 420px; margin: 14px 16px; border-radius: var(--dsh-layout-radius-user, 8px); background: #000; }
.dshm-previewEmpty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 34px 16px; color: var(--dsw-alias-label-tertiary, #8a8a8e); text-align: center; }
.dshm-previewEmpty p { margin: 0; font-size: 12px; line-height: 19px; }
.dshm-previewEmptyMeta { font-size: 11px; font-variant-numeric: tabular-nums; }

/* ─── Marketplace shelf (vendored, Quiet Structure) ───
   Styles for the market toolbar / segmented sources / compact row list
   rendered by market/MarketShelf.tsx. Owned HERE since the launcher
   stopped shipping market styles; dsh-mcp-manager carries its own
   dshmcp-mkt-* copy. */

/* toolbar: segmented sources + 34px search + 28px icon refresh */
.dshm-mkt-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshm-mkt-seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; max-width: 100%; overflow-x: auto; padding: 2px; gap: 2px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); scrollbar-width: none; }
.dshm-mkt-seg::-webkit-scrollbar { display: none; }
.dshm-mkt-segBtn { height: 26px; min-width: 0; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 0; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; font-size: 12px; cursor: pointer; transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-segBtn:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-mkt-segBtn.is-active { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); font-weight: 500; }
.dshm-mkt-segBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-segLabel { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-segDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-segBtn.is-up .dshm-mkt-segDot { background: var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-mkt-segBtn.is-down .dshm-mkt-segDot { background: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-mkt-segBtn.is-invalid .dshm-mkt-segDot { background: var(--dsw-alias-state-warning-primary, #ffb74d); }
.dshm-mkt-segAdd { flex: none; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-segAdd:hover { color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-mkt-search { flex: 1; min-width: 160px; height: 34px; display: flex; align-items: center; position: relative; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-search > svg { pointer-events: none; position: absolute; left: 10px; z-index: 1; width: 13px; height: 13px; }
.dshm-mkt-search input { width: 100%; height: 34px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 13px; outline: none; padding: 0 10px 0 29px; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-search input[type=search]::-webkit-search-cancel-button { -webkit-appearance: none; }
.dshm-mkt-search input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-search input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-mkt-search input:focus-visible { border-color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-mkt-iconBtn { width: 28px; height: 28px; flex: none; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); cursor: pointer; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-iconBtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-mkt-iconBtn:active { transform: scale(0.97); }
.dshm-mkt-iconBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-iconBtn[disabled] { opacity: .55; cursor: default; }
.dshm-mkt-iconBtn svg { width: 14px; height: 14px; }
.dshm-mkt-iconBtn.is-spin svg { animation: dshm-mkt-spin 1.2s linear infinite; }

/* compact buttons: install (primary) / remove (danger) / add-form */
.dshm-mkt-btn { height: 26px; padding: 0 10px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; cursor: pointer; white-space: nowrap; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-btn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-mkt-btn:active { transform: scale(0.97); }
.dshm-mkt-btn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-btn[disabled] { opacity: .55; cursor: default; transform: none; }
.dshm-mkt-btn.is-primary { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }
.dshm-mkt-btn.is-primary:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 17%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshm-mkt-btn.is-danger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 28%, transparent); }
.dshm-mkt-btn.is-danger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 40%, transparent); }

/* add-source: compact inline row (28px inputs) */
.dshm-mkt-addrow { display: flex; gap: 6px; flex-wrap: wrap; }
.dshm-mkt-addrow input { flex: 1 1 180px; min-width: 0; height: 28px; box-sizing: border-box; padding: 0 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; outline: none; transition: border-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-addrow input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-mkt-addrow input:focus { border-color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-mkt-addrow input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* the grouped row list */
.dshm-mkt-list { margin: 0; padding: 6px; list-style: none; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-mkt-row { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 6px 8px; border-radius: calc(var(--dsh-layout-radius-user-lg, 12px) - 6px); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-row:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-mkt-row + .dshm-mkt-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-mkt-rowMain { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
button.dshm-mkt-rowMain { border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; padding: 0; }
button.dshm-mkt-rowMain:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: 2px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); }
.dshm-mkt-rowTile { width: 32px; height: 32px; flex: none; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); display: grid; place-items: center; }
.dshm-mkt-rowTile svg { width: 15px; height: 15px; }
.dshm-mkt-rowId { flex: 0 1 auto; min-width: 0; max-width: 42%; display: flex; flex-direction: column; gap: 1px; }
.dshm-mkt-rowName { font-size: 13px; font-weight: 600; line-height: 18px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-rowMeta { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-rowDesc { flex: 1; min-width: 0; align-self: center; font-size: 12px; line-height: 17px; color: var(--dsw-alias-label-secondary, #b3b3b8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-rowSide { flex: none; display: flex; align-items: center; gap: 6px; }
.dshm-mkt-badge { height: 24px; padding: 0 8px; display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 10%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); font-size: 11px; font-weight: 500; white-space: nowrap; }
.dshm-mkt-badgeDot { width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-state-success-primary, #4caf50); }

/* empty / error */
.dshm-mkt-empty { padding: 36px 12px; text-align: center; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12px; line-height: 18px; }
.dshm-mkt-error { color: var(--dsw-alias-state-error-primary, #ef5350); font-size: 12px; line-height: 18px; padding: 8px 12px; background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }

/* workspace dual-mode head: segmented 已安装 | 市场. The wrapper stays
   uncapped (the market toolbar wants the full rail width); the nested
   manager keeps its own 960px reading measure. */
.dshm-ws { max-width: none; }
.dshm-wsHead { display: flex; align-items: center; gap: 10px; min-height: 30px; }

/* source chips: positioned wrapper so hover actions sit beside the pick
   button (no nested buttons); actions fade in on hover / focus-within */
.dshm-mkt-chip { position: relative; display: block; min-width: 0; }
.dshm-mkt-chip > .dshm-mkt-segBtn { width: 100%; }
.dshm-mkt-chipActs { position: absolute; top: 2px; bottom: 2px; right: 2px; display: flex; align-items: center; gap: 1px; padding-left: 4px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 4px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 120ms var(--ds-ease-in-out, ease), visibility 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-chip:hover .dshm-mkt-chipActs, .dshm-mkt-chip:focus-within .dshm-mkt-chipActs { opacity: 1; visibility: visible; pointer-events: auto; }
.dshm-mkt-chipAct { width: 19px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--dsw-alias-label-secondary, #b3b3b8); cursor: pointer; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 5px); transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-chipAct:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-mkt-chipAct.is-danger:hover { color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-mkt-chipAct:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-chipAct svg { width: 11px; height: 11px; }

/* add / edit source row: quiet 11px heading chip before the inputs */
.dshm-mkt-addrowLabel { flex: none; align-self: center; padding-left: 2px; font-size: 11px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* view toggle: auto-width icon segments inside the seg grammar */
.dshm-mkt-viewSeg { grid-auto-columns: auto; flex: none; }
.dshm-mkt-segIcon { width: 26px; min-width: 26px; padding: 0; justify-content: center; }
.dshm-mkt-segIcon svg { width: 14px; height: 14px; }

/* update state: business-colored badge + button (list rows and cards) */
.dshm-mkt-badge.is-update { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 12%, transparent); color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-mkt-badge.is-update .dshm-mkt-badgeDot { background: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-mkt-btn.is-update { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 16%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 30%, transparent); }
.dshm-mkt-btn.is-update:hover { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 20%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 38%, transparent); }

/* card grid view: one grouped container, auto-fill cards at ≥240px */
.dshm-mkt-cards { margin: 0; padding: 6px; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-mkt-card { min-width: 0; display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: calc(var(--dsh-layout-radius-user-lg, 12px) - 5px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-card:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); }
.dshm-mkt-card.is-installed .dshm-mkt-cardTile { color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-mkt-cardHead { display: flex; align-items: center; gap: 10px; min-width: 0; }
.dshm-mkt-cardTile { width: 40px; height: 40px; flex: none; border-radius: var(--dsh-layout-radius-user, 10px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); display: grid; place-items: center; }
.dshm-mkt-cardId { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dshm-mkt-cardNameRow { min-width: 0; display: flex; align-items: center; gap: 6px; }
.dshm-mkt-cardName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-cardVer { flex: none; height: 17px; padding: 0 6px; display: inline-flex; align-items: center; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); font-family: var(--ds-font-family-code); font-size: 10px; font-weight: 500; line-height: 15px; white-space: nowrap; }
.dshm-mkt-cardMeta { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-cardDesc { margin: 0; font-size: 12px; line-height: 17px; color: var(--dsw-alias-label-secondary, #b3b3b8); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.dshm-mkt-cardTags { display: flex; flex-wrap: wrap; gap: 4px; }
.dshm-mkt-cardTag { height: 18px; max-width: 130px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 10.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dshm-mkt-cardBar { margin-top: auto; display: flex; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-mkt-cardKind { min-width: 0; display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); text-transform: capitalize; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-cardKind svg { width: 11px; height: 11px; flex: none; }
.dshm-mkt-cardActions { margin-left: auto; display: flex; align-items: center; gap: 6px; flex: none; }

/* no-sources blank state: guided CTA inside the group container */
.dshm-mkt-blank { padding: 38px 16px 34px; display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-mkt-blankTile { width: 44px; height: 44px; border-radius: var(--dsh-layout-radius-user, 10px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; margin-bottom: 6px; }
.dshm-mkt-blankTitle { margin: 0; font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-mkt-blankHint { margin: 0 0 9px; max-width: 300px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

@keyframes dshm-mkt-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

/* ── responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .dshm-managerGrid { grid-template-columns: 1fr; }
  .dshm-managerMaster { order: 0; }
  .dshm-mkt-toolbar { gap: 6px; }
  .dshm-mkt-cards { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
}
@media (max-width: 640px) {
  .dshm-mkt-rowDesc { display: none; }
  .dshm-mkt-rowId { flex: 1 1 auto; max-width: none; }
  .dshm-mkt-cards { grid-template-columns: 1fr; }
}

/* ── dsh-layout material bridge ──────────────────────────────────────────
   When the dsh-layout plugin turns its frosted material on (flag on
   <html>), the quiet fills swap for translucent glass tints over the
   blurred canvas: grouped lists 34%, panels/inputs 46%, icon bases 52%;
   borders move to --dsh-layout-line at 45-55%. Hover stays a flat 4%
   lighten — only the fill and border recipes change. */
html[data-dsh-layout-material='on'] .dshm-managerList,
html[data-dsh-layout-material='on'] .dshm-detailCard,
html[data-dsh-layout-material='on'] .dshm-previewCard,
html[data-dsh-layout-material='on'] .dshm-resultCard,
html[data-dsh-layout-material='on'] .dshm-skeleton,
html[data-dsh-layout-material='on'] .dshm-mkt-list,
html[data-dsh-layout-material='on'] .dshm-mkt-cards,
html[data-dsh-layout-material='on'] .dshm-mkt-blank {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dshm-managerDetail,
html[data-dsh-layout-material='on'] .dshm-filePanel,
html[data-dsh-layout-material='on'] .dshm-previewHead,
html[data-dsh-layout-material='on'] .dshm-seg,
html[data-dsh-layout-material='on'] .dshm-drop,
html[data-dsh-layout-material='on'] .dshm-search input,
html[data-dsh-layout-material='on'] .dshm-input,
html[data-dsh-layout-material='on'] .dshm-select,
html[data-dsh-layout-material='on'] .dshm-mkt-seg,
html[data-dsh-layout-material='on'] .dshm-mkt-search input,
html[data-dsh-layout-material='on'] .dshm-mkt-addrow input {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent);
}
html[data-dsh-layout-material='on'] .dshm-tile,
html[data-dsh-layout-material='on'] .dshm-emptyTile,
html[data-dsh-layout-material='on'] .dshm-dropIcon,
html[data-dsh-layout-material='on'] .dshm-resultIcon,
html[data-dsh-layout-material='on'] .dshm-managerHintTile,
html[data-dsh-layout-material='on'] .dshm-mkt-rowTile,
html[data-dsh-layout-material='on'] .dshm-mkt-cardTile,
html[data-dsh-layout-material='on'] .dshm-mkt-blankTile {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 52%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}

/* ── motion safety ────────────────────────────────────────────────────────
   Everything above only transitions background/color at 120ms; under
   prefers-reduced-motion the transitions, the shimmer, the spin and the
   press scale all drop out. */
@media (prefers-reduced-motion: reduce) {
  .dshm-button, .dshm-iconBtn, .dshm-search input, .dshm-input, .dshm-select, .dshm-seg button, .dshm-segSm button, .dshm-drop, .dshm-failure button, .dshm-managerRowBtn, .dshm-mkt-row, .dshm-mkt-card, .dshm-mkt-segBtn, .dshm-mkt-btn, .dshm-mkt-iconBtn, .dshm-mkt-addrow input, .dshm-mkt-chipAct, .dshm-mkt-chipActs, .dshm-treeRow { transition: none; }
  .dshm-button:active, .dshm-iconBtn:active, .dshm-mkt-btn:active, .dshm-mkt-iconBtn:active { transform: none; }
  .dshm-mkt-iconBtn.is-spin svg { animation: none; }
}
`

export function installStyles(doc: Document): () => void {
  const existing = doc.getElementById(STYLE_ID)
  if (existing !== null) return () => {}
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.dataset.plugin = 'dsh-skill-manager'
  style.textContent = CSS
  doc.head.append(style)
  return () => {
    style.remove()
  }
}
