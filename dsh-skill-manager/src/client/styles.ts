const STYLE_ID = 'dsh-skill-manager-styles'

/**
 * Design language shared with dsh-mcp-manager:
 *   - one toolbar row (search + icon refresh), one heading row (title +
 *     count chip + primary action)
 *   - skeleton loading, centered empty states, tinted icon tiles on cards
 *   - segmented controls instead of raw radios, inset kv panels
 *   - every color rides a --dsw-alias-* token (with a warning fallback),
 *     so the light and dark themes both stay native
 */
const CSS = `
/* ── shell ──────────────────────────────────────────────────────────────── */
.dshm-tab { width: 100%; max-width: 760px; display: flex; flex-direction: column; gap: 14px; color: var(--dsw-alias-label-primary); }

/* ── toolbar: search + icon refresh in one row ─────────────────────────── */
.dshm-toolbar { display: flex; align-items: center; gap: 8px; }
.dshm-search { flex: 1; min-width: 0; display: flex; align-items: center; position: relative; color: var(--dsw-alias-label-tertiary); }
.dshm-search > svg { pointer-events: none; position: absolute; left: 11px; z-index: 1; }
.dshm-search input { width: 100%; height: 34px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; border-radius: 9px; outline: none; padding: 0 30px 0 34px; transition: border-color .15s var(--ds-ease-in-out), box-shadow .15s var(--ds-ease-in-out); }
.dshm-search input[type=search]::-webkit-search-cancel-button { -webkit-appearance: none; }
.dshm-search input::placeholder { color: var(--dsw-alias-label-tertiary); }
.dshm-search input:focus-visible { border-color: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent); }

/* ── heading row: title + count + primary action ───────────────────────── */
.dshm-heading { display: flex; align-items: center; gap: 8px; min-height: 32px; }
.dshm-heading h3 { font-size: 13px; font-weight: 600; letter-spacing: .01em; line-height: 20px; margin: 0; }
.dshm-count { min-width: 20px; height: 20px; padding: 0 7px; border-radius: 999px; background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-tertiary); font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 18px; display: inline-flex; align-items: center; justify-content: center; }
.dshm-spacer { flex: 1; }

/* ── buttons ────────────────────────────────────────────────────────────── */
.dshm-button { height: 32px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; border-radius: 9px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background-color .14s var(--ds-ease-in-out), border-color .14s var(--ds-ease-in-out), box-shadow .14s var(--ds-ease-in-out), transform .06s var(--ds-ease-in-out); }
.dshm-button:hover { background: var(--dsw-alias-interactive-bg-hover); border-color: color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent); }
.dshm-button:active { transform: translateY(1px); background: var(--dsw-alias-interactive-bg-active); }
.dshm-button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; }
.dshm-button[disabled] { opacity: .5; cursor: default; transform: none; }
.dshm-buttonIcon { width: 34px; height: 34px; padding: 0; justify-content: center; }
.dshm-buttonPrimary { border-color: var(--dsw-alias-state-business-primary); background: var(--dsw-alias-state-business-primary); color: #fff; box-shadow: var(--dsw-shadow-lv1); }
.dshm-buttonPrimary:hover { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 88%, #000); background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 90%, #000); }
.dshm-buttonPrimary:active { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 82%, #000); }
.dshm-buttonDanger { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 38%, transparent); }
.dshm-buttonDanger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 55%, transparent); }

/* ── status text / failure ──────────────────────────────────────────────── */
.dshm-status { color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 20px; margin: 0; }
.dshm-failure { color: var(--dsw-alias-state-error-primary); font-size: 13px; line-height: 20px; display: flex; align-items: center; gap: 10px; }
.dshm-failure p { margin: 0; }
.dshm-failure button { border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); font: inherit; cursor: pointer; background: none; border-radius: 8px; padding: 4px 10px; }

/* ── loading skeletons ──────────────────────────────────────────────────── */
@keyframes dshm-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.dshm-skeleton { display: flex; flex-direction: column; gap: 8px; }
.dshm-skelRow { height: 60px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: linear-gradient(100deg, var(--dsw-alias-bg-module-platform) 40%, var(--dsw-alias-bg-layer-3) 50%, var(--dsw-alias-bg-module-platform) 60%); background-size: 200% 100%; animation: dshm-shimmer 1.4s linear infinite; }
@media (prefers-reduced-motion: reduce) { .dshm-skelRow { animation: none; } }

/* ── empty state ────────────────────────────────────────────────────────── */
.dshm-empty { padding: 40px 16px 32px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.dshm-emptyTile { width: 52px; height: 52px; border-radius: 16px; background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-tertiary); display: grid; place-items: center; margin-bottom: 8px; }
.dshm-emptyTitle { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary); margin: 0; }
.dshm-empty p { font-size: 12.5px; color: var(--dsw-alias-label-tertiary); margin: 0; line-height: 19px; }

/* ── cards ──────────────────────────────────────────────────────────────── */
.dshm-cards { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin: 0; padding: 0; list-style: none; }
.dshm-card { border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); border-radius: 12px; min-width: 0; overflow: hidden; transition: border-color .16s var(--ds-ease-in-out), box-shadow .16s var(--ds-ease-in-out); }
.dshm-card:hover { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 42%, var(--dsw-alias-border-l2)); box-shadow: var(--dsw-shadow-lv1); }
.dshm-cardContent { box-sizing: border-box; width: 100%; min-width: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; background: none; border: 0; display: flex; align-items: center; gap: 12px; padding: 11px 12px; }
.dshm-cardContent:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; }
.dshm-tile { width: 38px; height: 38px; flex: none; border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent); color: var(--dsw-alias-state-business-primary); display: grid; place-items: center; }
.dshm-tileWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 9%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 20%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-tileError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 18%, transparent); color: var(--dsw-alias-state-error-primary); }
.dshm-tileMuted { background: var(--dsw-alias-bg-module-platform); border-color: var(--dsw-alias-border-l1); color: var(--dsw-alias-label-tertiary); }
.dshm-cardBody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dshm-cardTitle { font-size: 14px; font-weight: 600; letter-spacing: -.005em; line-height: 19px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-cardDesc { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 17px; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.dshm-cardTrailing { flex: none; display: inline-flex; align-items: center; gap: 6px; }

/* ── tags ───────────────────────────────────────────────────────────────── */
.dshm-tag { height: 22px; padding: 0 8px; white-space: nowrap; border-radius: 999px; align-items: center; display: inline-flex; font-size: 11px; font-weight: 500; line-height: 20px; background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent); color: var(--dsw-alias-label-secondary); }
.dshm-tagOk { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent); color: var(--dsw-alias-state-success-primary); }
.dshm-tagWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 12%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-tagError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); color: var(--dsw-alias-state-error-primary); }
.dshm-tagCode { font-family: var(--ds-font-family-code); font-size: 10.5px; font-weight: 500; }
.dshm-statusDot { width: 8px; height: 8px; border-radius: 999px; background: var(--dsw-alias-label-tertiary); display: inline-block; flex: none; }
.dshm-statusDot[data-phase=active] { background: var(--dsw-alias-state-success-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary) 18%, transparent); }
.dshm-statusDot[data-phase=failed] { background: var(--dsw-alias-state-error-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-error-primary) 16%, transparent); }
.dshm-statusDot[data-phase=loading], .dshm-statusDot[data-phase=pending] { background: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent); }
@keyframes dshm-breathe { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
.dshm-statusDot[data-phase=loading], .dshm-statusDot[data-phase=pending] { animation: dshm-breathe 1.6s var(--ds-ease-in-out) infinite; }
@media (prefers-reduced-motion: reduce) { .dshm-statusDot { animation: none !important; } }

/* ── detail page ────────────────────────────────────────────────────────── */
.dshm-detailHead { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.dshm-heroTile { width: 44px; height: 44px; border-radius: 13px; }
.dshm-hero { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; flex-wrap: wrap; }
.dshm-heroBody { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.dshm-heroName { font-size: 17px; font-weight: 650; letter-spacing: -.01em; line-height: 22px; margin: 0; overflow-wrap: anywhere; }
.dshm-heroTags { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.dshm-detailCard { border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); border-radius: 12px; padding: 13px 15px; display: flex; flex-direction: column; gap: 10px; }
.dshm-detailCard > h4 { font-size: 11px; font-weight: 600; color: var(--dsw-alias-label-tertiary); margin: 0; line-height: 16px; text-transform: uppercase; letter-spacing: .06em; }
.dshm-desc { font-size: 13px; line-height: 20px; margin: 0; overflow-wrap: anywhere; color: var(--dsw-alias-label-primary); }
.dshm-callout { border-left: 3px solid var(--dsw-alias-state-business-primary); background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, transparent); border-radius: 8px; padding: 9px 12px; font-size: 13px; line-height: 20px; margin: 0; color: var(--dsw-alias-label-primary); }
.dshm-calloutWarn { border-left-color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 7%, transparent); }
.dshm-calloutError { border-left-color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent); }
.dshm-details { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 7px 12px; margin: 0; }
.dshm-details div { display: contents; }
.dshm-details dt { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; padding-top: 1px; }
.dshm-details dd { overflow-wrap: anywhere; min-width: 0; color: var(--dsw-alias-label-secondary); margin: 0; font-size: 12.5px; line-height: 18px; }
.dshm-path { font-family: var(--ds-font-family-code); font-size: 11.5px; }
.dshm-filePanel { background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 6px; }
.dshm-treeScroll { max-height: 340px; overflow: auto; border-radius: 8px; }
.dshm-treeScroll .rct-tree-root { padding: 0; margin: 0; font: inherit; color: var(--dsw-alias-label-primary); outline: none; }
.dshm-treeScroll .rct-tree-root:focus-visible { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 35%, transparent); border-radius: 8px; }
.dshm-treeScroll .rct-tree-items-container { list-style: none; margin: 0; padding: 0; }
.dshm-treeItem { margin: 0; }
.dshm-treeRow { display: flex; align-items: center; gap: 5px; height: 27px; padding-right: 8px; border-radius: 7px; color: var(--dsw-alias-label-secondary); transition: background-color .12s var(--ds-ease-in-out); }
.dshm-treeRow-folder { color: var(--dsw-alias-label-primary); }
.dshm-treeRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dshm-treeRow.is-selected { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent); }
.dshm-treeRow.is-focused { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 40%, transparent); }
.dshm-treeRow .rct-tree-item-arrow { width: 15px; height: 15px; flex: none; display: inline-flex; align-items: center; justify-content: center; color: var(--dsw-alias-label-tertiary); cursor: pointer; }
.dshm-treeRow .rct-tree-item-arrow svg { width: 10px; height: 10px; fill: currentColor; transition: transform .14s var(--ds-ease-in-out); }
.dshm-treeRow .rct-tree-item-arrow.rct-tree-item-arrow-expanded svg { transform: rotate(90deg); }
@media (prefers-reduced-motion: reduce) { .dshm-treeRow .rct-tree-item-arrow svg { transition: none; } }
.dshm-treeRow-file .rct-tree-item-arrow { visibility: hidden; }
.dshm-treeMain { flex: 1; min-width: 0; display: flex; align-items: center; gap: 7px; outline: none; }
.dshm-treeIcon { flex: none; display: inline-flex; align-items: center; color: var(--dsw-alias-label-tertiary); }
.dshm-treeRow-folder .dshm-treeIcon { color: var(--dsw-alias-state-business-primary); }
.dshm-treeName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--ds-font-family-code); font-size: 12px; line-height: 17px; }
.dshm-treeRow-folder .dshm-treeName { font-weight: 500; }
.dshm-treeSize { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 11px; font-variant-numeric: tabular-nums; line-height: 16px; }
.dshm-fileDot { width: 5px; height: 5px; border-radius: 999px; background: var(--dsw-alias-label-tertiary); display: inline-block; flex: none; }
.dshm-md { font-size: 13px; line-height: 1.65; overflow-wrap: anywhere; }
.dshm-md > :first-child { margin-top: 0; }
.dshm-md :is(h1, h2, h3, h4) { font-size: 1.05em; margin: 1.1em 0 .4em; }

/* ── forms ──────────────────────────────────────────────────────────────── */
.dshm-form { display: flex; flex-direction: column; gap: 14px; }
.dshm-formRow { display: flex; flex-direction: column; gap: 6px; }
.dshm-formRow > label { font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-secondary); }
.dshm-formRow > span { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); line-height: 17px; }
.dshm-input, .dshm-select { width: 100%; box-sizing: border-box; height: 34px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; border-radius: 9px; outline: none; padding: 0 10px; transition: border-color .15s var(--ds-ease-in-out), box-shadow .15s var(--ds-ease-in-out); }
.dshm-input:focus-visible, .dshm-select:focus-visible { border-color: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent); }
.dshm-input::placeholder { color: var(--dsw-alias-label-tertiary); }

/* ── segmented control ──────────────────────────────────────────────────── */
.dshm-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l1); border-radius: 11px; }
.dshm-seg button { height: 28px; padding: 0 14px; border: 0; background: transparent; color: var(--dsw-alias-label-tertiary); font: inherit; font-size: 12.5px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: color .13s var(--ds-ease-in-out), background-color .13s var(--ds-ease-in-out), box-shadow .13s var(--ds-ease-in-out); }
.dshm-seg button:hover { color: var(--dsw-alias-label-primary); }
.dshm-seg button[aria-pressed=true] { background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font-weight: 500; box-shadow: var(--dsw-shadow-lv1); }
.dshm-seg button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; }

/* ── file picker / upload ───────────────────────────────────────────────── */
.dshm-drop { display: flex; align-items: center; gap: 12px; border: 1.5px dashed var(--dsw-alias-border-l2); border-radius: 11px; padding: 12px 14px; cursor: pointer; transition: border-color .15s var(--ds-ease-in-out), background-color .15s var(--ds-ease-in-out); }
.dshm-drop:hover { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, var(--dsw-alias-border-l2)); background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 3%, transparent); }
.dshm-dropInput { display: none; }
.dshm-dropIcon { width: 36px; height: 36px; flex: none; border-radius: 10px; background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-tertiary); display: grid; place-items: center; }
.dshm-dropBody { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dshm-dropTitle { font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-dropHint { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); }

/* ── misc ───────────────────────────────────────────────────────────────── */
.dshm-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshm-warnList { margin: 0; padding-left: 18px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
.dshm-warnList li { margin: 2px 0; }
.dshm-resultCard { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 6%, transparent); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.dshm-resultHead { display: flex; align-items: center; gap: 10px; }
.dshm-resultIcon { width: 34px; height: 34px; flex: none; border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); color: var(--dsw-alias-state-success-primary); display: grid; place-items: center; }
.dshm-resultHead strong { font-size: 14px; }
.dshm-resultMeta { font-size: 12px; color: var(--dsw-alias-label-tertiary); line-height: 18px; }
.dshm-resultMeta code { font-family: var(--ds-font-family-code); font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.dshm-visuallyHidden { clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; width: 1px; height: 1px; position: absolute; overflow: hidden; }
@media (width <= 680px) { .dshm-details { grid-template-columns: 76px minmax(0, 1fr); } .dshm-cardTrailing .dshm-tag:not(.dshm-tagWarn):not(.dshm-tagError) { display: none; } }

/* ── file preview (below the tree) ──────────────────────────────────────── */
.dshm-previewWrap { margin-top: 10px; }
.dshm-previewCard { border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; }
.dshm-previewHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 9px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-module-platform); }
.dshm-previewTile { width: 30px; height: 30px; border-radius: 9px; }
.dshm-previewTile-text { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent); color: var(--dsw-alias-state-business-primary); }
.dshm-previewTile-image { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); color: var(--dsw-alias-state-success-primary); }
.dshm-previewTile-pdf { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #e5484d) 12%, transparent); color: var(--dsw-alias-state-error-primary, #e5484d); }
.dshm-previewTile-audio, .dshm-previewTile-video { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent); color: var(--dsw-alias-state-business-primary); }
.dshm-previewTile-binary { background: color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent); color: var(--dsw-alias-label-tertiary); }
.dshm-previewMeta { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 3px; }
.dshm-previewName { font-family: var(--ds-font-family-code); font-size: 12.5px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-previewChips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dshm-previewPath { font-family: var(--ds-font-family-code); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-segSm { padding: 2px; border-radius: 9px; align-self: center; }
.dshm-segSm button { height: 24px; padding: 0 10px; font-size: 12px; border-radius: 7px; }
.dshm-buttonGhostSm { height: 26px; padding: 0 9px; font-size: 12px; border-radius: 7px; gap: 5px; align-self: center; text-decoration: none; }
.dshm-previewBody { position: relative; max-height: 460px; overflow: auto; }
.dshm-previewLoading { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.dshm-previewBody .dshm-md { padding: 6px 16px 14px; }
.dshm-codeBody .shiki { margin: 0; padding: 13px 15px; background-color: transparent !important; font-family: var(--ds-font-family-code); font-size: 12.5px; line-height: 1.7; }
.dshm-codeBody .shiki code { display: block; padding: 0; background: transparent; font: inherit; }
.dshm-previewDark .dshm-codeBody .shiki, .dshm-previewDark .dshm-codeBody .shiki span { color: var(--shiki-dark) !important; }
.dshm-tableWrap { overflow: auto; }
.dshm-table { border-collapse: collapse; width: 100%; font-size: 12px; }
.dshm-table th { position: sticky; top: 0; z-index: 1; background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-secondary); font-weight: 600; font-size: 11px; text-align: left; padding: 6px 12px; white-space: nowrap; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.dshm-table td { padding: 5px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); white-space: nowrap; max-width: 320px; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.dshm-table tbody tr:hover td { background: var(--dsw-alias-interactive-bg-hover); }
.dshm-tableNote { margin: 0; padding: 6px 12px; font-size: 11.5px; color: var(--dsw-alias-label-tertiary); }
.dshm-imgWrap { display: grid; place-items: center; padding: 16px; min-height: 120px; }
.dshm-img { max-width: 100%; max-height: 420px; border-radius: 6px; box-shadow: var(--dsw-shadow-lv1); }
.dshm-pdfFrame { display: block; width: 100%; height: 460px; border: 0; background: #fff; }
.dshm-audio { display: block; width: calc(100% - 32px); margin: 14px 16px; }
.dshm-video { display: block; width: calc(100% - 32px); max-height: 420px; margin: 14px 16px; border-radius: 8px; background: #000; }
.dshm-previewEmpty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 34px 16px; color: var(--dsw-alias-label-tertiary); text-align: center; }
.dshm-previewEmpty p { margin: 0; font-size: 12.5px; line-height: 19px; }
.dshm-previewEmptyMeta { font-size: 11.5px; font-variant-numeric: tabular-nums; }
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
