const STYLE_ID = 'dsh-mcp-manager-styles'

/**
 * Design language: "Frosted Modern" (shared across the dsh plugins).
 *   - surfaces are translucent tint gradients over the workspace canvas,
 *     never flat fills: brighter at the top, settling towards the bottom,
 *     with an inset 1px light edge that reads as a top-lit rim
 *   - hairline borders via color-mix on --dsw-alias-label-primary, hover
 *     brightens the line, lifts the surface 1px and drops a soft shadow
 *   - radius bridges onto the layout tokens (--dsh-layout-radius-user /
 *     -lg) so the panes follow the user's corner preference
 *   - every color rides a --dsw-alias-* token with a dark hex fallback,
 *     status dots carry a small glow, primary actions use a luminous
 *     two-stop gradient
 *   - html[data-dsh-layout-material='on'] swaps the tint gradients for
 *     glass pours keyed off --dsh-layout-glass-base / --dsh-layout-line
 */
const CSS = `
/* ── shell ──────────────────────────────────────────────────────────────── */
/* 独立分区头：设置页左侧菜单已有同名入口，这里补齐标题与一句话说明。 */
.dshmcp-head { display: flex; flex-direction: column; gap: 4px; }
.dshmcp-head h2 { margin: 0; font-size: 16px; font-weight: 650; letter-spacing: -.01em; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-head p { margin: 0; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12px; line-height: 1.55; }
.dshmcp-tab { width: 100%; max-width: 760px; display: flex; flex-direction: column; gap: 14px; color: var(--dsw-alias-label-primary, #f4f4f5); }

/* ── heading row: title + count + actions ───────────────────────────────── */
.dshmcp-heading { display: flex; align-items: center; gap: 8px; min-height: 32px; flex-wrap: wrap; }
.dshmcp-heading h3 { font-size: 14px; font-weight: 600; letter-spacing: .01em; line-height: 20px; margin: 0; }
.dshmcp-count { min-width: 20px; height: 20px; padding: 0 7px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 18px; display: inline-flex; align-items: center; justify-content: center; }
.dshmcp-spacer { flex: 1; }

/* ── buttons ────────────────────────────────────────────────────────────── */
/* Secondary: hairline + faint tint gradient, hover fills and lifts.
   Primary: luminous two-stop gradient (white mixed 18% -> 28% into the
   accent) with a colored under-glow. Both press down via scale(.98). */
.dshmcp-button { height: 32px; padding: 0 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 13px; border-radius: var(--dsh-layout-radius-user, 9px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); transition: background .15s var(--ds-ease-in-out, ease), border-color .15s var(--ds-ease-in-out, ease), box-shadow .15s var(--ds-ease-in-out, ease), transform .15s var(--ds-ease-in-out, ease); }
.dshmcp-button:hover { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 11%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28), inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dshmcp-button:active { transform: translateY(0) scale(0.98); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-button[disabled] { opacity: .5; cursor: default; transform: none; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshmcp-buttonIcon { width: 34px; height: 34px; padding: 0; justify-content: center; }
.dshmcp-buttonPrimary { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 30%, var(--dsw-alias-state-business-primary, #ffb74d)); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, var(--dsw-alias-state-business-primary, #ffb74d)), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, var(--dsw-alias-state-business-primary, #ffb74d))); color: #fff; box-shadow: 0 6px 18px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 26%, transparent), inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 32%, transparent); }
.dshmcp-buttonPrimary:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 36%, var(--dsw-alias-state-business-primary, #ffb74d)); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, var(--dsw-alias-state-business-primary, #ffb74d)), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 34%, var(--dsw-alias-state-business-primary, #ffb74d))); box-shadow: 0 8px 24px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 34%, transparent), inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 36%, transparent); }
.dshmcp-buttonPrimary:active { transform: translateY(0) scale(0.98); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, var(--dsw-alias-state-business-primary, #ffb74d)), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 22%, var(--dsw-alias-state-business-primary, #ffb74d))); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent); }
.dshmcp-buttonDanger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 38%, transparent); }
.dshmcp-buttonDanger:hover { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 12%, transparent), color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 5%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 55%, transparent); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28), inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); }

/* ── status text / failure ──────────────────────────────────────────────── */
.dstmcp-status, .dshmcp-status { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12.5px; line-height: 1.55; margin: 0; }
.dstmcp-failure, .dshmcp-failure { color: var(--dsw-alias-state-error-primary, #ef5350); font-size: 12.5px; line-height: 1.55; display: flex; align-items: center; gap: 10px; }
.dstmcp-failure p, .dshmcp-failure p { margin: 0; }
.dstmcp-failure button, .dshmcp-failure button { border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; cursor: pointer; background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); border-radius: var(--dsh-layout-radius-user, 8px); padding: 4px 10px; transition: background-color .15s var(--ds-ease-in-out, ease), border-color .15s var(--ds-ease-in-out, ease); }
.dstmcp-failure button:hover, .dshmcp-failure button:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 26%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }

/* ── loading skeletons ──────────────────────────────────────────────────── */
@keyframes dshmcp-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.dstmcp-skeleton, .dshmcp-skeleton { display: flex; flex-direction: column; gap: 8px; }
.dstmcp-skelRow, .dshmcp-skelRow { height: 60px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); background: linear-gradient(100deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent) 40%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent) 50%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent) 60%); background-size: 200% 100%; animation: dshmcp-shimmer 1.4s linear infinite; }
@media (prefers-reduced-motion: reduce) { .dstmcp-skelRow, .dshmcp-skelRow { animation: none; } }

/* ── empty state ────────────────────────────────────────────────────────── */
.dstmcp-empty, .dshmcp-empty { padding: 40px 16px 32px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.dstmcp-emptyTile, .dshmcp-emptyTile { width: 52px; height: 52px; border-radius: var(--dsh-layout-radius-user-lg, 16px); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; margin-bottom: 8px; }
.dstmcp-emptyTitle, .dshmcp-emptyTitle { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); margin: 0; }
.dstmcp-empty p, .dshmcp-empty p { font-size: 12px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin: 0; line-height: 1.55; }

/* ── cards ──────────────────────────────────────────────────────────────── */
/* Double-layer tint gradient + inset top rim replaces the flat fill; the
   closed card lifts 1px on hover, the open one stays planted and picks up
   an accent hairline instead. */
.dstmcp-cards, .dshmcp-cards { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin: 0; padding: 0; list-style: none; }
.dstmcp-card, .dshmcp-card { border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); min-width: 0; overflow: hidden; transition: border-color .15s var(--ds-ease-in-out, ease), box-shadow .15s var(--ds-ease-in-out, ease), transform .15s var(--ds-ease-in-out, ease); }
.dstmcp-card:not([data-open=true]):hover, .dshmcp-card:not([data-open=true]):hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28), inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dstmcp-card[data-open=true], .dshmcp-card[data-open=true] { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 32%, transparent); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28), inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dstmcp-cardContent, .dshmcp-cardContent { box-sizing: border-box; width: 100%; min-width: 0; min-height: 62px; color: inherit; font: inherit; text-align: left; cursor: pointer; background: none; border: 0; display: flex; align-items: center; gap: 12px; padding: 11px 12px; transition: background-color .15s var(--ds-ease-in-out, ease); }
.dstmcp-cardContent:hover, .dshmcp-cardContent:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.dstmcp-cardContent:focus-visible, .dshmcp-cardContent:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dstmcp-tile, .dstmcp-heroTile, .dshmcp-tile, .dshmcp-heroTile { width: 38px; height: 38px; flex: none; border-radius: var(--dsh-layout-radius-user, 11px); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 16%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 7%, transparent)); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 22%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-state-business-primary, #ffb74d); display: grid; place-items: center; }
.dstmcp-tileError, .dstmcp-tileWarn, .dshmcp-tileError, .dshmcp-tileWarn { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 16%, transparent), color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 7%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 26%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dstmcp-tileMuted, .dshmcp-tileMuted { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dstmcp-heroTile, .dshmcp-heroTile { width: 44px; height: 44px; border-radius: var(--dsh-layout-radius-user, 13px); }
.dstmcp-cardBody, .dshmcp-cardBody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dstmcp-cardTitle, .dshmcp-cardTitle { font-size: 14px; font-weight: 600; letter-spacing: -.005em; line-height: 19px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dstmcp-summary, .dshmcp-summary { min-width: 0; display: inline-flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; line-height: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dstmcp-cardTrailing, .dshmcp-cardTrailing { flex: none; display: inline-flex; align-items: center; gap: 12px; padding-left: 12px; }
.dstmcp-cardChevron, .dshmcp-cardChevron { display: inline-flex; align-items: center; color: var(--dsw-alias-label-tertiary, #8a8a8e); transition: transform .15s var(--ds-ease-in-out, ease); }
.dstmcp-cardChevron.is-open, .dshmcp-cardChevron.is-open { transform: rotate(180deg); }

/* ── tags & status dots ─────────────────────────────────────────────────── */
.dstmcp-tag, .dshmcp-tag { height: 22px; padding: 0 8px; white-space: nowrap; border-radius: 999px; align-items: center; display: inline-flex; font-size: 11px; font-weight: 500; line-height: 20px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dstmcp-tagOk, .dshmcp-tagOk { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 20%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dstmcp-tagWarn, .dshmcp-tagWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 12%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 22%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dstmcp-tagError, .dshmcp-tagError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dstmcp-tagCode, .dshmcp-tagCode { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 10.5px; font-weight: 500; }
.dstmcp-summary .dshmcp-statusDot, .dshmcp-summary .dstmcp-statusDot, .dshmcp-summary .dshmcp-statusDot { flex: none; width: 7px; height: 7px; border-radius: 999px; background: var(--dsw-alias-label-tertiary, #8a8a8e); display: inline-block; flex: none; }
.dstmcp-statusDot[data-phase=active], .dshmcp-statusDot[data-phase=active] { background: var(--dsw-alias-state-success-primary, #4caf50); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent), 0 0 8px var(--dsw-alias-state-success-primary, #4caf50); }
.dstmcp-statusDot[data-phase=failed], .dshmcp-statusDot[data-phase=failed] { background: var(--dsw-alias-state-error-primary, #ef5350); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 16%, transparent), 0 0 8px var(--dsw-alias-state-error-primary, #ef5350); }
.dstmcp-statusDot[data-phase=loading], .dstmcp-statusDot[data-phase=pending], .dshmcp-statusDot[data-phase=loading], .dshmcp-statusDot[data-phase=pending] { background: var(--dsw-alias-state-business-primary, #ffb74d); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 16%, transparent), 0 0 8px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 70%, transparent); }
@keyframes dstmcp-breathe { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
.dstmcp-statusDot[data-phase=loading], .dstmcp-statusDot[data-phase=pending], .dshmcp-statusDot[data-phase=loading], .dshmcp-statusDot[data-phase=pending] { animation: dstmcp-breathe 1.6s var(--ds-ease-in-out, ease) infinite; }
@media (prefers-reduced-motion: reduce) { .dstmcp-statusDot, .dshmcp-statusDot { animation: none !important; } }

/* ── expanded card details ──────────────────────────────────────────────── */
.dstmcp-cardDetails, .dshmcp-cardDetails { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); background: color-mix(in srgb, var(--dsw-alias-bg-module-platform, #0f0f12) 55%, transparent); padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 10px; }
.dstmcp-details, .dshmcp-details { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 7px 12px; margin: 0; }
.dstmcp-details div, .dshmcp-details div { display: contents; }
.dstmcp-details dt, .dshmcp-details dt { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11.5px; line-height: 18px; padding-top: 1px; }
.dstmcp-details dd, .dshmcp-details dd { overflow-wrap: anywhere; min-width: 0; color: var(--dsw-alias-label-secondary, #b3b3b8); margin: 0; font-size: 12px; line-height: 1.55; }
.dstmcp-path, .dshmcp-path { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; }
.dstmcp-actions, .dshmcp-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dstmcp-callout, .dshmcp-callout { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 16%, transparent); border-left: 3px solid var(--dsw-alias-state-business-primary, #ffb74d); background: linear-gradient(90deg, color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 8%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 3%, transparent)); border-radius: var(--dsh-layout-radius-user, 8px); padding: 9px 12px; font-size: 12.5px; line-height: 1.55; margin: 0; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dstmcp-calloutWarn, .dshmcp-calloutWarn { border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 18%, transparent); border-left: 3px solid var(--dsw-alias-state-warning-primary, #d97706); background: linear-gradient(90deg, color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 8%, transparent), color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 3%, transparent)); }
.dstmcp-calloutError, .dshmcp-calloutError { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent); border-left: 3px solid var(--dsw-alias-state-error-primary, #ef5350); background: linear-gradient(90deg, color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent), color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 3%, transparent)); }

/* ── editor ─────────────────────────────────────────────────────────────── */
.dstmcp-editor, .dshmcp-editor { border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); box-shadow: var(--dsw-shadow-lv2, 0 16px 40px rgba(0, 0, 0, 0.35)), inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 14px); display: flex; flex-direction: column; overflow: hidden; }
.dstmcp-editorHead, .dshmcp-editorHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 13px 16px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dstmcp-editorHead h3, .dshmcp-editorHead h3 { font-size: 15px; font-weight: 650; letter-spacing: -.01em; margin: 0; flex: 1; }
.dstmcp-editorBody, .dshmcp-editorBody { padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; }
.dstmcp-editorFoot, .dshmcp-editorFoot { position: sticky; bottom: 0; display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); background: color-mix(in srgb, var(--dsw-alias-bg-layer-3, #232327) 88%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.dstmcp-detailHead, .dshmcp-detailHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dstmcp-detailHead h3, .dshmcp-detailHead h3 { font-size: 16px; font-weight: 650; line-height: 24px; margin: 0; overflow-wrap: anywhere; }

/* ── forms ──────────────────────────────────────────────────────────────── */
/* Inputs sit in recessed translucent wells; the border brightens on hover
   and snaps to the accent ring on focus. */
.dstmcp-form, .dshmcp-form { display: flex; flex-direction: column; gap: 14px; }
.dstmcp-formRow, .dshmcp-formRow { display: flex; flex-direction: column; gap: 6px; }
.dstmcp-formRow > label, .dshmcp-formRow > label { font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dstmcp-formRow > span, .dshmcp-formRow > span { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); line-height: 1.55; }
.dstmcp-input, .dstmcp-select, .dshmcp-input, .dshmcp-select { width: 100%; box-sizing: border-box; height: 34px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); background: color-mix(in srgb, var(--dsw-alias-bg-module-platform, #0f0f12) 50%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 13px; border-radius: var(--dsh-layout-radius-user, 9px); outline: none; padding: 0 10px; transition: border-color .15s var(--ds-ease-in-out, ease), box-shadow .15s var(--ds-ease-in-out, ease); }
.dstmcp-input:hover, .dstmcp-select:hover, .dshmcp-input:hover, .dshmcp-select:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent); }
.dstmcp-input:focus-visible, .dstmcp-select:focus-visible, .dshmcp-input:focus-visible, .dshmcp-select:focus-visible { border-color: var(--dsw-alias-state-business-primary, #ffb74d); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 16%, transparent); }
.dstmcp-input::placeholder, .dshmcp-input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dstmcp-textarea, .dshmcp-textarea { width: 100%; box-sizing: border-box; min-height: 200px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); background: color-mix(in srgb, var(--dsw-alias-bg-module-platform, #0f0f12) 50%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; line-height: 1.55; border-radius: var(--dsh-layout-radius-user, 10px); outline: none; padding: 12px; font-family: var(--ds-font-family-code, ui-monospace, monospace); resize: vertical; transition: border-color .15s var(--ds-ease-in-out, ease), box-shadow .15s var(--ds-ease-in-out, ease); }
.dstmcp-textarea:hover, .dshmcp-textarea:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent); }
.dstmcp-textarea:focus-visible, .dshmcp-textarea:focus-visible { border-color: var(--dsw-alias-state-business-primary, #ffb74d); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 14%, transparent); }
.dstmcp-checkRow, .dshmcp-checkRow { display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer; }
.dstmcp-radioRow, .dshmcp-radioRow { display: flex; gap: 16px; flex-wrap: wrap; }

/* ── segmented control ──────────────────────────────────────────────────── */
.dstmcp-seg, .dshmcp-seg { display: inline-flex; gap: 2px; padding: 3px; background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 11px); }
.dstmcp-seg button, .dshmcp-seg button { height: 28px; padding: 0 14px; border: 0; background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; font-size: 12.5px; border-radius: var(--dsh-layout-radius-user, 8px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: color .14s var(--ds-ease-in-out, ease), background-color .14s var(--ds-ease-in-out, ease), box-shadow .14s var(--ds-ease-in-out, ease); }
.dstmcp-seg button:hover, .dshmcp-seg button:hover { color: var(--dsw-alias-label-primary, #f4f4f5); }
.dstmcp-seg button[aria-pressed=true], .dshmcp-seg button[aria-pressed=true] { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent)); color: var(--dsw-alias-label-primary, #f4f4f5); font-weight: 500; box-shadow: var(--dsw-shadow-lv1, 0 1px 3px rgba(0, 0, 0, 0.28)), inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dstmcp-seg button:focus-visible, .dshmcp-seg button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }

/* ── key/value editor panel ─────────────────────────────────────────────── */
.dstmcp-kvList, .dshmcp-kvList { display: flex; flex-direction: column; gap: 6px; background: color-mix(in srgb, var(--dsw-alias-bg-module-platform, #0f0f12) 55%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 10px); padding: 10px; }
.dstmcp-kvRow, .dshmcp-kvRow { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) 28px; gap: 6px; align-items: center; }
.dstmcp-kvRow input, .dshmcp-kvRow input { width: 100%; box-sizing: border-box; height: 30px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; border-radius: var(--dsh-layout-radius-user, 7px); outline: none; padding: 0 8px; font-family: var(--ds-font-family-code, ui-monospace, monospace); transition: border-color .15s var(--ds-ease-in-out, ease), box-shadow .15s var(--ds-ease-in-out, ease); }
.dstmcp-kvRow input:hover, .dshmcp-kvRow input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); }
.dstmcp-kvRow input:focus-visible, .dshmcp-kvRow input:focus-visible { border-color: var(--dsw-alias-state-business-primary, #ffb74d); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 15%, transparent); }
.dstmcp-kvRow input[disabled], .dshmcp-kvRow input[disabled] { color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 6%, transparent); }
.dstmcp-kvRemove, .dshmcp-kvRemove { width: 28px; height: 28px; border: 1px solid transparent; background: none; color: var(--dsw-alias-label-tertiary, #8a8a8e); cursor: pointer; border-radius: var(--dsh-layout-radius-user, 7px); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; transition: color .14s var(--ds-ease-in-out, ease), background-color .14s var(--ds-ease-in-out, ease); }
.dstmcp-kvRemove:hover, .dshmcp-kvRemove:hover { color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 9%, transparent); }
.dstmcp-kvFoot, .dshmcp-kvFoot { padding: 0 2px; }

/* ── tools list ─────────────────────────────────────────────────────────── */
.dstmcp-toolsArea, .dshmcp-toolsArea { display: flex; flex-direction: column; gap: 8px; position: static; }
.dstmcp-toolSearch, .dshmcp-toolSearch { flex: none; display: inline-flex; align-items: center; gap: 8px; position: relative; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dstmcp-toolSearch > svg, .dshmcp-toolSearch > svg { pointer-events: none; position: absolute; left: 10px; z-index: 1; }
.dstmcp-toolSearch input, .dshmcp-toolSearch input { width: min(210px, 46vw); height: 28px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); background: color-mix(in srgb, var(--dsw-alias-bg-module-platform, #0f0f12) 50%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 10px 0 30px; transition: border-color .15s var(--ds-ease-in-out, ease), box-shadow .15s var(--ds-ease-in-out, ease); }
.dstmcp-toolSearch input:hover, .dshmcp-toolSearch input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent); }
.dstmcp-toolSearch input:focus-visible, .dshmcp-toolSearch input:focus-visible { border-color: var(--dsw-alias-state-business-primary, #ffb74d); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 14%, transparent); }
.dstmcp-toolSearch input::placeholder, .dshmcp-toolSearch input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dstmcp-toolSearchCount, .dshmcp-toolSearchCount { position: absolute; right: 10px; font-size: 11px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dstmcp-chipStatus, .dshmcp-chipStatus { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 9px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); }
.dstmcp-chipStatus.is-ok, .dshmcp-chipStatus.is-ok { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 20%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dstmcp-chipStatus.is-fail, .dshmcp-chipStatus.is-fail { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dstmcp-chipDot, .dshmcp-chipDot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; box-shadow: 0 0 8px currentColor; }
.dstmcp-toolList, .dshmcp-toolList { margin: 0; padding: 0; list-style: none; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 10px); background: color-mix(in srgb, var(--dsw-alias-bg-module-platform, #0f0f12) 45%, transparent); overflow: hidden; }
.dstmcp-toolList li + li, .dshmcp-toolList li + li { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dstmcp-toolHead, .dstmcp-toolHead, .dshmcp-toolHead { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 9px; padding: 8px 12px; background: none; border: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; transition: background-color .14s var(--ds-ease-in-out, ease); }
.dstmcp-toolHead:hover, .dshmcp-toolHead:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.dstmcp-toolHead:focus-visible, .dshmcp-toolHead:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dstmcp-toolHead.is-selected, .dshmcp-toolHead.is-selected { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 9%, transparent); }
.dstmcp-toolDot, .dshmcp-toolDot { flex: none; width: 6px; height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); }
.dstmcp-toolHead.is-selected .dshmcp-toolDot, .dshmcp-toolHead.is-selected .dshmcp-toolDot { background: var(--dsw-alias-state-business-primary, #ffb74d); box-shadow: 0 0 6px var(--dsw-alias-state-business-primary, #ffb74d); }
.dstmcp-toolMain, .dshmcp-toolMain { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dstmcp-toolName, .dshmcp-toolName { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dstmcp-toolDesc, .dshmcp-toolDesc { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 16px; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
.dstmcp-toolParamsHint, .dshmcp-toolParamsHint { flex: none; font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #8a8a8e); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: 999px; padding: 2px 7px; white-space: nowrap; }
.dstmcp-toolChevron, .dstmcp-toolChevron, .dshmcp-toolChevron { flex: none; display: inline-flex; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dstmcp-toolHead:hover .dshmcp-toolChevron, .dshmcp-toolHead:hover .dshmcp-toolChevron { color: var(--dsw-alias-state-business-primary, #ffb74d); }
[role="dialog"].dshmcp-toolModal { width: min(820px, 92vw); height: min(760px, 88dvh); max-height: 88dvh; box-sizing: border-box; overflow: hidden; }
.dstmcp-toolModalBody, .dshmcp-toolModalBody { width: 100%; height: 100%; min-height: 0; max-height: 100%; box-sizing: border-box; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 14px; }
/* Modal's platform header is the first child: keep title / close visible if the outer body scrolls. */
.dstmcp-toolModalBody > :first-child, .dshmcp-toolModalBody > :first-child { position: sticky; top: 0; z-index: 2; background: var(--dsw-alias-bg-layer-3, #232327); }
.dstmcp-toolModalBody h6, .dshmcp-toolModalBody h6 { margin: 0 0 6px; font-size: 11px; font-weight: 600; color: var(--dsw-alias-label-tertiary, #8a8a8e); text-transform: uppercase; letter-spacing: .05em; }
.dstmcp-toolModalDesc, .dshmcp-toolModalDesc { margin: 0; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary, #b3b3b8); white-space: normal; overflow-wrap: anywhere; }
.dstmcp-schemaSection, .dshmcp-schemaSection { min-height: 0; }
.dstmcp-schemaViewport, .dshmcp-schemaViewport { min-height: 140px; height: clamp(180px, 42dvh, 420px); max-height: 42dvh; box-sizing: border-box; overflow: auto; overscroll-behavior: contain; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-bg-module-platform, #0f0f12) 45%, transparent); padding: 6px 8px; scrollbar-gutter: stable; }
.dstmcp-schemaViewport:focus-visible, .dshmcp-schemaViewport:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dstmcp-paramTable, .dshmcp-paramTable { width: 100%; border-collapse: collapse; font-size: 12px; }
.dstmcp-paramTable td, .dshmcp-paramTable td { padding: 5px 8px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); vertical-align: top; }
.dstmcp-paramTable tr:last-child td, .dshmcp-paramTable tr:last-child td { border-bottom: 0; }
.dstmcp-paramName, .dshmcp-paramName { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11.5px; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dstmcp-paramType, .dshmcp-paramType { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11.5px; }
.dstmcp-paramRequired, .dshmcp-paramRequired { color: var(--dsw-alias-state-business-primary, #ffb74d); font-size: 11px; font-weight: 500; }
.dstmcp-paramOptional, .dshmcp-paramOptional { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; }

/* ── enable/disable switch (card head) ──────────────────────────────────── */
.dstmcp-switch, .dshmcp-switch { flex: none; width: 32px; height: 19px; padding: 0; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); cursor: pointer; position: relative; transition: background-color .16s var(--ds-ease-in-out, ease), border-color .16s var(--ds-ease-in-out, ease), box-shadow .16s var(--ds-ease-in-out, ease); }
.dstmcp-switch.is-on, .dshmcp-switch.is-on { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, var(--dsw-alias-state-business-primary, #ffb74d)), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, var(--dsw-alias-state-business-primary, #ffb74d))); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); box-shadow: 0 0 8px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 40%, transparent); }
.dstmcp-switch:focus-visible, .dshmcp-switch:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: 2px; }
.dstmcp-switch[disabled], .dshmcp-switch[disabled] { opacity: .5; cursor: default; }
.dstmcp-switchKnob, .dshmcp-switchKnob { position: absolute; top: 2px; left: 2px; width: 13px; height: 13px; border-radius: 999px; background: #fff; box-shadow: var(--dsw-shadow-lv1, 0 1px 3px rgba(0, 0, 0, 0.3)); transition: transform .16s var(--ds-ease-in-out, ease); display: block; }
.dstmcp-switch.is-on .dshmcp-switchKnob, .dshmcp-switch.is-on .dshmcp-switchKnob { transform: translateX(13px); }

/* ── tools section chrome (head row + status bar + retest) ──────────────── */
.dstmcp-toolsBlock, .dshmcp-toolsBlock { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.dstmcp-toolsHead, .dshmcp-toolsHead { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dstmcp-toolsHead h4, .dshmcp-toolsHead h4 { margin: 0; font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dstmcp-toolsBar, .dshmcp-toolsBar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dstmcp-toolsMeta, .dshmcp-toolsMeta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-variant-numeric: tabular-nums; display: inline-flex; align-items: center; gap: 5px; }
.dstmcp-buttonGhostSm, .dshmcp-buttonGhostSm { height: 26px; padding: 0 10px; font-size: 12px; border-radius: var(--dsh-layout-radius-user, 7px); }
.dstmcp-autoTest, .dshmcp-autoTest { display: inline-flex; align-items: center; gap: 5px; }
.dstmcp-spin, .dshmcp-spin { animation: dstmcp-rotate 1s linear infinite; }
@keyframes dstmcp-rotate { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .dstmcp-spin, .dshmcp-spin { animation: none !important; } }

/* ── material linkage (dsh-layout frosted glass) ────────────────────────── */
/* When the workspace layout turns the frosted material on, the tint
   gradients pour into translucent glass keyed off the layout's own base
   and hairline, so the panes sit on the canvas like native chrome.
   Tiers follow the shared recipe: cards 34 / panels 46 / tiles 52. */
html[data-dsh-layout-material='on'] .dstmcp-card,
html[data-dsh-layout-material='on'] .dshmcp-card { background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent); border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent); }
html[data-dsh-layout-material='on'] .dstmcp-editor,
html[data-dsh-layout-material='on'] .dshmcp-editor { background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent); border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent); }
html[data-dsh-layout-material='on'] .dstmcp-tile:not(.dstmcp-tileError):not(.dstmcp-tileWarn):not(.dstmcp-tileMuted):not(.dshmcp-tileError):not(.dshmcp-tileWarn):not(.dshmcp-tileMuted),
html[data-dsh-layout-material='on'] .dshmcp-tile:not(.dstmcp-tileError):not(.dstmcp-tileWarn):not(.dstmcp-tileMuted):not(.dshmcp-tileError):not(.dshmcp-tileWarn):not(.dshmcp-tileMuted),
html[data-dsh-layout-material='on'] .dstmcp-heroTile,
html[data-dsh-layout-material='on'] .dshmcp-heroTile,
html[data-dsh-layout-material='on'] .dstmcp-emptyTile,
html[data-dsh-layout-material='on'] .dshmcp-emptyTile { background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 52%, transparent); border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent); }
html[data-dsh-layout-material='on'] .dstmcp-editorFoot,
html[data-dsh-layout-material='on'] .dshmcp-editorFoot { background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 62%, transparent); border-top-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent); }
html[data-dsh-layout-material='on'] .dstmcp-cardDetails,
html[data-dsh-layout-material='on'] .dshmcp-cardDetails,
html[data-dsh-layout-material='on'] .dstmcp-kvList,
html[data-dsh-layout-material='on'] .dshmcp-kvList,
html[data-dsh-layout-material='on'] .dstmcp-toolList,
html[data-dsh-layout-material='on'] .dshmcp-toolList { border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent); }

/* ── motion safety ──────────────────────────────────────────────────────── */
/* Frosted Modern adds hover lifts and press scales; under reduced motion
   every new displacement (and its transition) switches off on top of the
   per-section shimmer / breathe / spin guards above. */
@media (prefers-reduced-motion: reduce) {
  .dstmcp-card, .dshmcp-card,
  .dstmcp-button, .dshmcp-button,
  .dstmcp-failure button, .dshmcp-failure button { transition: none !important; transform: none !important; }
}


/* ─── Marketplace shelf (vendored) ───
   Styles for the market grid / source chips / cards rendered by
   market/MarketShelf.tsx. Vendored from the shared Frosted Modern
   recipe — owned HERE since the launcher stopped shipping market
   styles; dsh-skill-manager carries its own dshm-mkt-* copy. */
/* ─── Marketplace shared — also imported by dsh-skill-manager / dsh-mcp-manager ─── */
.dshmcp-mkt-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
  align-items: center;
}
.dshmcp-mkt-sources-label {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  margin-right: 4px;
}
.dshmcp-mkt-source-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent), transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background 140ms var(--ds-ease-in-out, ease), color 140ms var(--ds-ease-in-out, ease), border-color 140ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-source-chip:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); color: var(--dsw-alias-label-primary, #f4f4f5); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent); }
.dshmcp-mkt-source-chip.is-active {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent));
  color: var(--dsw-alias-label-primary, #f4f4f5);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
}
.dshmcp-mkt-source-chip .dshmcp-mkt-source-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #4caf50);
  box-shadow: 0 0 8px var(--dsw-alias-state-success-primary, #4caf50);
}
.dshmcp-mkt-source-chip.is-down .dshmcp-mkt-source-dot { background: var(--dsw-alias-state-error-primary, #ef5350); box-shadow: 0 0 8px var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-mkt-source-chip.is-invalid .dshmcp-mkt-source-dot { background: var(--dsw-alias-state-business-primary, #ffb74d); box-shadow: 0 0 8px var(--dsw-alias-state-business-primary, #ffb74d); }
.dshmcp-mkt-source-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent);
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 140ms var(--ds-ease-in-out, ease), color 140ms var(--ds-ease-in-out, ease), background 140ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-source-add:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 32%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }

.dshmcp-mkt-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.dshmcp-mkt-search {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 10px);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  transition: border-color 140ms var(--ds-ease-in-out, ease), box-shadow 140ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-search:focus-within {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 26%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent), 0 0 0 3px color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dshmcp-mkt-search input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 13px;
  min-width: 0;
}
.dshmcp-mkt-search input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-mkt-search svg { width: 14px; height: 14px; flex: 0 0 14px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-mkt-toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 10px);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent), transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  transition: background 140ms var(--ds-ease-in-out, ease), border-color 140ms var(--ds-ease-in-out, ease), transform 140ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-toolbar-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.07)); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent); }
.dshmcp-mkt-toolbar-btn:active { transform: scale(0.98); }
.dshmcp-mkt-toolbar-btn svg { width: 14px; height: 14px; }
.dshmcp-mkt-toolbar-btn.is-spin svg { animation: dshmcp-mkt-spin 1.2s linear infinite; }

.dshmcp-mkt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.dshmcp-mkt-card {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 14px);
  padding: 16px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent), 0 1px 2px rgba(0, 0, 0, 0.12);
  transition: border-color 150ms var(--ds-ease-in-out, ease), transform 150ms var(--ds-ease-in-out, ease), box-shadow 150ms var(--ds-ease-in-out, ease);
  position: relative;
  overflow: hidden;
}
.dshmcp-mkt-card:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent);
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent), 0 12px 32px rgba(0, 0, 0, 0.28);
}
.dshmcp-mkt-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
.dshmcp-mkt-card-tile {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: var(--dsh-layout-radius-user, 10px);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 11%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  flex: 0 0 36px;
}
.dshmcp-mkt-card-tile svg { width: 18px; height: 18px; }
.dshmcp-mkt-card-titleline { flex: 1; min-width: 0; }
.dshmcp-mkt-card-title { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); margin: 0; letter-spacing: 0.01em; }
.dshmcp-mkt-card-meta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin-top: 2px; }
.dshmcp-mkt-card-desc { font-size: 12px; color: var(--dsw-alias-label-secondary, #b3b3b8); line-height: 1.55; margin: 0 0 12px; min-height: 36px; }
.dshmcp-mkt-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
.dshmcp-mkt-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dshmcp-mkt-tag-source { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-mkt-card-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dshmcp-mkt-card-installed {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 14%, transparent);
  color: var(--dsw-alias-state-success-primary, #4caf50);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent);
}
.dshmcp-mkt-card-action {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 13px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background 140ms var(--ds-ease-in-out, ease), border-color 140ms var(--ds-ease-in-out, ease), transform 140ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-card-action:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.07)); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }
.dshmcp-mkt-card-action:active { transform: scale(0.97); }
.dshmcp-mkt-card-action.is-primary {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 11%, transparent));
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 34%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent);
}
.dshmcp-mkt-card-action.is-primary:hover { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent)); }
.dshmcp-mkt-card-action.is-danger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 32%, transparent); }
.dshmcp-mkt-card-action.is-danger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 12%, transparent); }
.dshmcp-mkt-card-action:disabled { opacity: 0.55; cursor: not-allowed; }
.dshmcp-mkt-card-action.is-spin svg { animation: dshmcp-mkt-spin 1.2s linear infinite; }

.dshmcp-mkt-empty {
  text-align: center;
  padding: 48px 0;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dshmcp-mkt-error {
  color: var(--dsw-alias-state-error-primary, #ef5350);
  font-size: 12px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  margin-bottom: 12px;
}

/* ─── Add-source form: wraps to clean rows on mobile ─── */
.dshmcp-mkt-addrow {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.dshmcp-mkt-addrow input {
  flex: 1 1 220px;
  min-width: 0;
  padding: 9px 13px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent));
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 13px;
  outline: 0;
  transition: border-color 140ms var(--ds-ease-in-out, ease), box-shadow 140ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-addrow input:focus {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 26%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dshmcp-mkt-addrow input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }

@keyframes dshmcp-mkt-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

/* dsh-layout material bridge (market surfaces) */
html[data-dsh-layout-material='on'] .dshmcp-mkt-card,
html[data-dsh-layout-material='on'] .dshmcp-mkt-search {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dshmcp-mkt-card-tile {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 52%, transparent);
}

@media (max-width: 767px) {
  .dshmcp-mkt-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .dshmcp-mkt-card { padding: 14px; border-radius: var(--dsh-layout-radius-user-lg, 12px); }

  .dshmcp-mkt-card-tile { width: 32px; height: 32px; flex: 0 0 32px; }

  .dshmcp-mkt-card-tile svg { width: 16px; height: 16px; }

  .dshmcp-mkt-card-title { font-size: 13px; }

  .dshmcp-mkt-card-desc { font-size: 11px; min-height: 0; }

  .dshmcp-mkt-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .dshmcp-mkt-search { min-width: 0; }

  .dshmcp-mkt-toolbar-btn { width: 100%; justify-content: center; }

  .dshmcp-mkt-sources { gap: 4px; }

  .dshmcp-mkt-source-chip { padding: 5px 10px; font-size: 11px; }

  .dshmcp-mkt-source-add { padding: 5px 10px; font-size: 11px; }

  .dshmcp-mkt-addrow { flex-direction: column; }

  .dshmcp-mkt-addrow input { flex: 1 1 auto; }
}

@media (max-width: 480px) {
  .dshmcp-mkt-grid { gap: 10px; }

  .dshmcp-mkt-card { padding: 12px; }

  .dshmcp-mkt-card-foot { flex-wrap: wrap; }

  .dshmcp-mkt-card-action { margin-left: 0; flex: 1 1 100%; justify-content: center; }
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
