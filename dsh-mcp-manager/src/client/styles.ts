const STYLE_ID = 'dsh-mcp-manager-styles'

/**
 * Design language shared with dsh-skill-manager:
 *   - heading row with count chip + primary action
 *   - skeleton loading, centered empty states, tinted icon tiles on cards
 *   - segmented controls instead of raw radios, inset kv panels
 *   - sticky editor action bar, status dots with halo
 *   - every color rides a --dsw-alias-* token (with a warning fallback),
 *     so the light and dark themes both stay native
 */
const CSS = `
/* ── shell ──────────────────────────────────────────────────────────────── */
.dshmcp-tab { width: 100%; max-width: 760px; display: flex; flex-direction: column; gap: 14px; color: var(--dsw-alias-label-primary); }

/* ── heading row: title + count + actions ───────────────────────────────── */
.dshmcp-heading { display: flex; align-items: center; gap: 8px; min-height: 32px; flex-wrap: wrap; }
.dshmcp-heading h3 { font-size: 13px; font-weight: 600; letter-spacing: .01em; line-height: 20px; margin: 0; }
.dshmcp-count { min-width: 20px; height: 20px; padding: 0 7px; border-radius: 999px; background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-tertiary); font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 18px; display: inline-flex; align-items: center; justify-content: center; }
.dshmcp-spacer { flex: 1; }

/* ── buttons ────────────────────────────────────────────────────────────── */
.dshmcp-button { height: 32px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; border-radius: 9px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background-color .14s var(--ds-ease-in-out), border-color .14s var(--ds-ease-in-out), box-shadow .14s var(--ds-ease-in-out), transform .06s var(--ds-ease-in-out); }
.dshmcp-button:hover { background: var(--dsw-alias-interactive-bg-hover); border-color: color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent); }
.dshmcp-button:active { transform: translateY(1px); background: var(--dsw-alias-interactive-bg-active); }
.dshmcp-button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; }
.dshmcp-button[disabled] { opacity: .5; cursor: default; transform: none; }
.dshmcp-buttonIcon { width: 34px; height: 34px; padding: 0; justify-content: center; }
.dshmcp-buttonPrimary { border-color: var(--dsw-alias-state-business-primary); background: var(--dsw-alias-state-business-primary); color: #fff; box-shadow: var(--dsw-shadow-lv1); }
.dshmcp-buttonPrimary:hover { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 88%, #000); background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 90%, #000); }
.dshmcp-buttonPrimary:active { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 82%, #000); }
.dshmcp-buttonDanger { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 38%, transparent); }
.dshmcp-buttonDanger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 55%, transparent); }

/* ── status text / failure ──────────────────────────────────────────────── */
.dstmcp-status, .dshmcp-status { color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 20px; margin: 0; }
.dstmcp-failure, .dshmcp-failure { color: var(--dsw-alias-state-error-primary); font-size: 13px; line-height: 20px; display: flex; align-items: center; gap: 10px; }
.dstmcp-failure p, .dshmcp-failure p { margin: 0; }
.dstmcp-failure button, .dshmcp-failure button { border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); font: inherit; cursor: pointer; background: none; border-radius: 8px; padding: 4px 10px; }

/* ── loading skeletons ──────────────────────────────────────────────────── */
@keyframes dshmcp-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.dstmcp-skeleton, .dshmcp-skeleton { display: flex; flex-direction: column; gap: 8px; }
.dstmcp-skelRow, .dshmcp-skelRow { height: 60px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: linear-gradient(100deg, var(--dsw-alias-bg-module-platform) 40%, var(--dsw-alias-bg-layer-3) 50%, var(--dsw-alias-bg-module-platform) 60%); background-size: 200% 100%; animation: dshmcp-shimmer 1.4s linear infinite; }
@media (prefers-reduced-motion: reduce) { .dstmcp-skelRow, .dshmcp-skelRow { animation: none; } }

/* ── empty state ────────────────────────────────────────────────────────── */
.dstmcp-empty, .dshmcp-empty { padding: 40px 16px 32px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.dstmcp-emptyTile, .dshmcp-emptyTile { width: 52px; height: 52px; border-radius: 16px; background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-tertiary); display: grid; place-items: center; margin-bottom: 8px; }
.dstmcp-emptyTitle, .dshmcp-emptyTitle { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary); margin: 0; }
.dstmcp-empty p, .dshmcp-empty p { font-size: 12.5px; color: var(--dsw-alias-label-tertiary); margin: 0; line-height: 19px; }

/* ── cards ──────────────────────────────────────────────────────────────── */
.dstmcp-cards, .dshmcp-cards { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin: 0; padding: 0; list-style: none; }
.dstmcp-card, .dshmcp-card { border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); border-radius: 12px; min-width: 0; overflow: hidden; }
.dstmcp-card[data-open=true], .dshmcp-card[data-open=true] { border-color: color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent); box-shadow: var(--dsw-shadow-lv1); }
.dstmcp-cardContent, .dshmcp-cardContent { box-sizing: border-box; width: 100%; min-width: 0; min-height: 62px; color: inherit; font: inherit; text-align: left; cursor: pointer; background: none; border: 0; display: flex; align-items: center; gap: 12px; padding: 11px 12px; transition: background-color .14s var(--ds-ease-in-out); }
.dstmcp-cardContent:hover, .dshmcp-cardContent:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dstmcp-cardContent:focus-visible, .dshmcp-cardContent:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; }
.dstmcp-tile, .dstmcp-heroTile, .dshmcp-tile, .dshmcp-heroTile { width: 38px; height: 38px; flex: none; border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent); color: var(--dsw-alias-state-business-primary); display: grid; place-items: center; }
.dstmcp-tileError, .dstmcp-tileWarn, .dshmcp-tileError, .dshmcp-tileWarn { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 18%, transparent); color: var(--dsw-alias-state-error-primary); }
.dstmcp-tileMuted, .dshmcp-tileMuted { background: var(--dsw-alias-bg-module-platform); border-color: var(--dsw-alias-border-l1); color: var(--dsw-alias-label-tertiary); }
.dstmcp-heroTile, .dshmcp-heroTile { width: 44px; height: 44px; border-radius: 13px; }
.dstmcp-cardBody, .dshmcp-cardBody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dstmcp-cardTitle, .dshmcp-cardTitle { font-size: 14px; font-weight: 600; letter-spacing: -.005em; line-height: 19px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dstmcp-summary, .dshmcp-summary { color: var(--dsw-alias-label-tertiary); font-family: var(--ds-font-family-code); font-size: 11.5px; line-height: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dstmcp-cardTrailing, .dshmcp-cardTrailing { flex: none; display: inline-flex; align-items: center; gap: 6px; }

/* ── tags & status dots ─────────────────────────────────────────────────── */
.dstmcp-tag, .dshmcp-tag { height: 22px; padding: 0 8px; white-space: nowrap; border-radius: 999px; align-items: center; display: inline-flex; font-size: 11px; font-weight: 500; line-height: 20px; background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent); color: var(--dsw-alias-label-secondary); }
.dstmcp-tagOk, .dshmcp-tagOk { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent); color: var(--dsw-alias-state-success-primary); }
.dstmcp-tagWarn, .dshmcp-tagWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 12%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dstmcp-tagError, .dshmcp-tagError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); color: var(--dsw-alias-state-error-primary); }
.dstmcp-tagCode, .dshmcp-tagCode { font-family: var(--ds-font-family-code); font-size: 10.5px; font-weight: 500; }
.dstmcp-statusDot, .dshmcp-statusDot { width: 8px; height: 8px; border-radius: 999px; background: var(--dsw-alias-label-tertiary); display: inline-block; flex: none; }
.dstmcp-statusDot[data-phase=active], .dshmcp-statusDot[data-phase=active] { background: var(--dsw-alias-state-success-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary) 18%, transparent); }
.dstmcp-statusDot[data-phase=failed], .dshmcp-statusDot[data-phase=failed] { background: var(--dsw-alias-state-error-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-error-primary) 16%, transparent); }
.dstmcp-statusDot[data-phase=loading], .dstmcp-statusDot[data-phase=pending], .dshmcp-statusDot[data-phase=loading], .dshmcp-statusDot[data-phase=pending] { background: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent); }
@keyframes dstmcp-breathe { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
.dstmcp-statusDot[data-phase=loading], .dstmcp-statusDot[data-phase=pending], .dshmcp-statusDot[data-phase=loading], .dshmcp-statusDot[data-phase=pending] { animation: dstmcp-breathe 1.6s var(--ds-ease-in-out) infinite; }
@media (prefers-reduced-motion: reduce) { .dstmcp-statusDot, .dshmcp-statusDot { animation: none !important; } }

/* ── expanded card details ──────────────────────────────────────────────── */
.dstmcp-cardDetails, .dshmcp-cardDetails { border-top: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-module-platform); padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 10px; }
.dstmcp-details, .dshmcp-details { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 7px 12px; margin: 0; }
.dstmcp-details div, .dshmcp-details div { display: contents; }
.dstmcp-details dt, .dshmcp-details dt { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; padding-top: 1px; }
.dstmcp-details dd, .dshmcp-details dd { overflow-wrap: anywhere; min-width: 0; color: var(--dsw-alias-label-secondary); margin: 0; font-size: 12.5px; line-height: 18px; }
.dstmcp-path, .dshmcp-path { font-family: var(--ds-font-family-code); font-size: 11.5px; }
.dstmcp-actions, .dshmcp-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dstmcp-callout, .dshmcp-callout { border-left: 3px solid var(--dsw-alias-state-business-primary); background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, transparent); border-radius: 8px; padding: 9px 12px; font-size: 13px; line-height: 20px; margin: 0; color: var(--dsw-alias-label-primary); }
.dstmcp-calloutWarn, .dshmcp-calloutWarn { border-left-color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 7%, transparent); }
.dstmcp-calloutError, .dshmcp-calloutError { border-left-color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, transparent); }

/* ── editor ─────────────────────────────────────────────────────────────── */
.dstmcp-editor, .dshmcp-editor { border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); box-shadow: var(--dsw-shadow-lv2); border-radius: 14px; display: flex; flex-direction: column; overflow: hidden; }
.dstmcp-editorHead, .dshmcp-editorHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 13px 16px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.dstmcp-editorHead h3, .dshmcp-editorHead h3 { font-size: 15px; font-weight: 650; letter-spacing: -.01em; margin: 0; flex: 1; }
.dstmcp-editorBody, .dshmcp-editorBody { padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; }
.dstmcp-editorFoot, .dshmcp-editorFoot { position: sticky; bottom: 0; display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid var(--dsw-alias-border-l1); background: color-mix(in srgb, var(--dsw-alias-bg-layer-3) 88%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.dstmcp-detailHead, .dshmcp-detailHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dstmcp-detailHead h3, .dshmcp-detailHead h3 { font-size: 16px; font-weight: 650; line-height: 24px; margin: 0; overflow-wrap: anywhere; }

/* ── forms ──────────────────────────────────────────────────────────────── */
.dstmcp-form, .dshmcp-form { display: flex; flex-direction: column; gap: 14px; }
.dstmcp-formRow, .dshmcp-formRow { display: flex; flex-direction: column; gap: 6px; }
.dstmcp-formRow > label, .dshmcp-formRow > label { font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-secondary); }
.dstmcp-formRow > span, .dshmcp-formRow > span { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); line-height: 17px; }
.dstmcp-input, .dstmcp-select, .dshmcp-input, .dshmcp-select { width: 100%; box-sizing: border-box; height: 34px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; border-radius: 9px; outline: none; padding: 0 10px; transition: border-color .15s var(--ds-ease-in-out), box-shadow .15s var(--ds-ease-in-out); }
.dstmcp-input:focus-visible, .dstmcp-select:focus-visible, .dshmcp-input:focus-visible, .dshmcp-select:focus-visible { border-color: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent); }
.dstmcp-input::placeholder, .dshmcp-input::placeholder { color: var(--dsw-alias-label-tertiary); }
.dstmcp-textarea, .dshmcp-textarea { width: 100%; box-sizing: border-box; min-height: 200px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; line-height: 19px; border-radius: 10px; outline: none; padding: 12px; font-family: var(--ds-font-family-code); resize: vertical; transition: border-color .15s var(--ds-ease-in-out), box-shadow .15s var(--ds-ease-in-out); }
.dstmcp-textarea:focus-visible, .dshmcp-textarea:focus-visible { border-color: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent); }
.dstmcp-checkRow, .dshmcp-checkRow { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
.dstmcp-radioRow, .dshmcp-radioRow { display: flex; gap: 16px; flex-wrap: wrap; }

/* ── segmented control ──────────────────────────────────────────────────── */
.dstmcp-seg, .dshmcp-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l1); border-radius: 11px; }
.dstmcp-seg button, .dshmcp-seg button { height: 28px; padding: 0 14px; border: 0; background: transparent; color: var(--dsw-alias-label-tertiary); font: inherit; font-size: 12.5px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: color .13s var(--ds-ease-in-out), background-color .13s var(--ds-ease-in-out), box-shadow .13s var(--ds-ease-in-out); }
.dstmcp-seg button:hover, .dshmcp-seg button:hover { color: var(--dsw-alias-label-primary); }
.dstmcp-seg button[aria-pressed=true], .dshmcp-seg button[aria-pressed=true] { background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font-weight: 500; box-shadow: var(--dsw-shadow-lv1); }
.dstmcp-seg button:focus-visible, .dshmcp-seg button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; }

/* ── key/value editor panel ─────────────────────────────────────────────── */
.dstmcp-kvList, .dshmcp-kvList { display: flex; flex-direction: column; gap: 6px; background: var(--dsw-alias-bg-module-platform); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 10px; }
.dstmcp-kvRow, .dshmcp-kvRow { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) 28px; gap: 6px; align-items: center; }
.dstmcp-kvRow input, .dshmcp-kvRow input { width: 100%; box-sizing: border-box; height: 30px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; border-radius: 7px; outline: none; padding: 0 8px; font-family: var(--ds-font-family-code); transition: border-color .15s var(--ds-ease-in-out), box-shadow .15s var(--ds-ease-in-out); }
.dstmcp-kvRow input:focus-visible, .dshmcp-kvRow input:focus-visible { border-color: var(--dsw-alias-state-business-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 15%, transparent); }
.dstmcp-kvRow input[disabled], .dshmcp-kvRow input[disabled] { color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 6%, transparent); }
.dstmcp-kvRemove, .dshmcp-kvRemove { width: 28px; height: 28px; border: 1px solid transparent; background: none; color: var(--dsw-alias-label-tertiary); cursor: pointer; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; transition: color .13s var(--ds-ease-in-out), background-color .13s var(--ds-ease-in-out); }
.dstmcp-kvRemove:hover, .dshmcp-kvRemove:hover { color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent); }
.dstmcp-kvFoot, .dshmcp-kvFoot { padding: 0 2px; }

/* ── tools list ─────────────────────────────────────────────────────────── */
.dstmcp-toolList, .dshmcp-toolList { display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 0; list-style: none; }
.dstmcp-tool, .dshmcp-tool { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; overflow: hidden; background: var(--dsw-alias-bg-layer-3); }
.dstmcp-toolHead, .dshmcp-toolHead { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: none; border: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; transition: background-color .13s var(--ds-ease-in-out); }
.dstmcp-toolHead:hover, .dshmcp-toolHead:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dstmcp-toolHead:focus-visible, .dshmcp-toolHead:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; }
.dstmcp-toolName, .dshmcp-toolName { font-family: var(--ds-font-family-code); font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dstmcp-toolDesc, .dshmcp-toolDesc { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.dstmcp-toolBody, .dshmcp-toolBody { border-top: 1px solid var(--dsw-alias-border-l1); padding: 10px; display: flex; flex-direction: column; gap: 6px; background: var(--dsw-alias-bg-module-platform); }
.dstmcp-toolBodyLabel, .dshmcp-toolBodyLabel { font-size: 11px; font-weight: 600; color: var(--dsw-alias-label-tertiary); text-transform: uppercase; letter-spacing: .05em; }

/* ── test result panel ──────────────────────────────────────────────────── */
.dstmcp-testPanel, .dshmcp-testPanel { border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; line-height: 19px; background: var(--dsw-alias-bg-layer-3); }
.dstmcp-testPanel pre, .dshmcp-testPanel pre { margin: 0; font-family: var(--ds-font-family-code); font-size: 11px; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--dsw-alias-label-secondary); }
.dstmcp-testOk, .dshmcp-testOk { border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 5%, transparent); }
.dstmcp-testFail, .dshmcp-testFail { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 5%, transparent); }
.dstmcp-testHead, .dshmcp-testHead { display: flex; align-items: center; gap: 10px; }
.dstmcp-testIcon, .dshmcp-testIcon { width: 32px; height: 32px; flex: none; border-radius: 10px; display: grid; place-items: center; }
.dstmcp-testOk .dstmcp-testIcon, .dshmcp-testOk .dshmcp-testIcon { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent); color: var(--dsw-alias-state-success-primary); }
.dstmcp-testFail .dstmcp-testIcon, .dshmcp-testFail .dshmcp-testIcon { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent); color: var(--dsw-alias-state-error-primary); }
.dstmcp-testHeadBody, .dshmcp-testHeadBody { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.dstmcp-testHead strong, .dshmcp-testHead strong { font-size: 13.5px; }
.dstmcp-testMeta, .dshmcp-testMeta { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dstmcp-testMeta code, .dshmcp-testMeta code { font-family: var(--ds-font-family-code); font-size: 11px; color: var(--dsw-alias-label-secondary); }
.dstmcp-visuallyHidden, .dshmcp-visuallyHidden { clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; width: 1px; height: 1px; position: absolute; overflow: hidden; }
@media (width <= 680px) { .dstmcp-details, .dshmcp-details { grid-template-columns: 76px minmax(0, 1fr); } .dshmcp-cardTrailing .dshmcp-tag:not(.dshmcp-tagWarn):not(.dshmcp-tagError) { display: none; } }

/* ── tools list (shared by card + editor test panel) ────────────────────── */
.dshmcp-toolsBlock { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.dstmcp-toolsHead, .dshmcp-toolsHead { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dstmcp-toolsHead h4, .dshmcp-toolsHead h4 { margin: 0; font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.dstmcp-toolsMeta, .dshmcp-toolsMeta { font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; display: inline-flex; align-items: center; gap: 5px; }
.dstmcp-toolsMeta.is-ok, .dshmcp-toolsMeta.is-ok { color: var(--dsw-alias-state-success-primary); }
.dstmcp-toolsMeta.is-fail, .dshmcp-toolsMeta.is-fail { color: var(--dsw-alias-state-error-primary); }
.dstmcp-buttonGhostSm, .dshmcp-buttonGhostSm { height: 26px; padding: 0 10px; font-size: 12px; border-radius: 7px; }
.dstmcp-autoTest, .dshmcp-autoTest { display: inline-flex; align-items: center; gap: 5px; }
.dstmcp-spin, .dshmcp-spin { animation: dstmcp-rotate 1s linear infinite; }
@keyframes dstmcp-rotate { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .dstmcp-spin, .dshmcp-spin { animation: none !important; } }
.dstmcp-toolList, .dshmcp-toolList { margin: 0; padding: 0; list-style: none; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.dstmcp-tool + .dstmcp-tool, .dshmcp-tool + .dshmcp-tool { border-top: 1px solid var(--dsw-alias-border-l1); }
.dstmcp-toolHead, .dshmcp-toolHead { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: none; border: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; transition: background-color .13s var(--ds-ease-in-out); }
.dstmcp-toolHead:hover, .dshmcp-toolHead:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dstmcp-toolHead:focus-visible, .dshmcp-toolHead:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: -2px; }
.dstmcp-toolDot, .dshmcp-toolDot { flex: none; width: 6px; height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 65%, transparent); }
.dstmcp-tool.is-open .dshmcp-toolDot, .dshmcp-tool.is-open .dshmcp-toolDot { background: var(--dsw-alias-state-business-primary); }
.dstmcp-toolName, .dshmcp-toolName { font-family: var(--ds-font-family-code); font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dstmcp-toolChevron, .dshmcp-toolChevron { flex: none; display: inline-flex; color: var(--dsw-alias-label-tertiary); transition: transform .14s var(--ds-ease-in-out); }
.dstmcp-toolChevron.is-open, .dshmcp-toolChevron.is-open { transform: rotate(180deg); color: var(--dsw-alias-state-business-primary); }
.dstmcp-toolDesc, .dshmcp-toolDesc { margin: 0; padding: 0 12px 9px 26px; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; line-height: 17px; white-space: normal; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.dstmcp-tool.is-open .dshmcp-toolDesc, .dshmcp-tool.is-open .dshmcp-toolDesc { -webkit-line-clamp: unset; color: var(--dsw-alias-label-secondary); padding-bottom: 10px; }
.dstmcp-toolBody, .dshmcp-toolBody { border-top: 1px dashed var(--dsw-alias-border-l1); padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; background: var(--dsw-alias-bg-module-platform); }
.dstmcp-toolBodyLabel, .dshmcp-toolBodyLabel { font-size: 11px; font-weight: 600; color: var(--dsw-alias-label-tertiary); text-transform: uppercase; letter-spacing: .05em; }

/* ── enable/disable switch (card head) ──────────────────────────────────── */
.dstmcp-switch, .dshmcp-switch { flex: none; width: 32px; height: 19px; padding: 0; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-module-platform); cursor: pointer; position: relative; transition: background-color .16s var(--ds-ease-in-out), border-color .16s var(--ds-ease-in-out); }
.dstmcp-switch.is-on, .dshmcp-switch.is-on { background: var(--dsw-alias-state-business-primary); border-color: var(--dsw-alias-state-business-primary); }
.dstmcp-switch:focus-visible, .dshmcp-switch:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
.dstmcp-switch[disabled], .dshmcp-switch[disabled] { opacity: .5; cursor: default; }
.dstmcp-switchKnob, .dshmcp-switchKnob { position: absolute; top: 2px; left: 2px; width: 13px; height: 13px; border-radius: 999px; background: #fff; box-shadow: var(--dsw-shadow-lv1); transition: transform .16s var(--ds-ease-in-out); display: block; }
.dstmcp-switch.is-on .dshmcp-switchKnob, .dshmcp-switch.is-on .dshmcp-switchKnob { transform: translateX(13px); }
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
