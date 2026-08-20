const STYLE_ID = 'dsh-skill-manager-styles'

/**
 * Quiet Structure — shared design language across the dsh-* plugins,
 * shaped after Raycast's store / macOS Settings pages:
 *   - content lives in grouped containers (bg layer-2, 1px hairline
 *     borders mixed from label-primary, radius bridged to the user's
 *     dsh-layout corner radii) holding compact rows separated by 1px
 *     hairlines — one list per group
 *   - the market's opt-in card grid and the installed catalog's card
 *     view are the single exception and carry the only "texture":
 *     each card gets a hue-keyed gradient icon base (name → djb2 hue,
 *     hsl(h,55%,55%) at 14%→7%, icon in a brighter tone of the hue) on
 *     a slightly dimensional surface (label-primary 5%→2% gradient +
 *     inset top highlight + a soft ambient shadow); hover only
 *     brightens the border and deepens the shadow — no lift, no shift
 *   - typography is fixed and small: names 13px/600, meta 11px tertiary,
 *     descriptions 12px secondary, section labels 11px/500 with wide
 *     tracking; the workspace shell owns the big titles
 *   - interaction grammar is background-only: list rows lighten 4% on
 *     hover (120ms), buttons press via scale(0.97); no translateY lifts,
 *     no glow (status dots stay flat)
 *   - every button is ONE recipe at 28px (toolbar, segmented controls,
 *     card action bars, modal footers): secondary = transparent fill +
 *     10% hairline with hover pouring 5% only; primary = 9% fill +
 *     24% border + top inset highlight, hover 13%/28%; the vendored
 *     market shelf runs the same recipes at the compact 26px height so
 *     it sits 1:1 beside dsh-mcp-manager's market page
 *   - every color rides a --dsw-alias-* token with a dark hex fallback
 *   - the dsh-layout material (data-dsh-layout-material='on') swaps the
 *     quiet fills for translucent glass tints: groups 34%, panels 46%,
 *     icon bases 52%, borders from --dsh-layout-line 45-55%; cards pour
 *     the 34% glass while keeping their top inset highlight, and the
 *     hue-keyed gradient bases survive the glass untouched
 *   - motion is background/color/shadow 120ms only;
 *     prefers-reduced-motion disables every transition and the loading
 *     animations
 */
const CSS = `
/* ── shell ──────────────────────────────────────────────────────────────── */
.dshm-tab { width: 100%; max-width: 960px; display: flex; flex-direction: column; gap: 12px; color: var(--dsw-alias-label-primary, #f4f4f5); background: radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent), transparent 70%); }

/* ── quiet atoms: section labels, grouped containers ───────────────────── */
.dshm-sectionLabel { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-group { background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 6px; }

/* ── toolbar: search + compact icon actions ────────────────────────────── */
.dshm-toolbar { display: flex; align-items: center; gap: 8px; }
.dshm-search { flex: 1; min-width: 0; display: flex; align-items: center; position: relative; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-search > svg { pointer-events: none; position: absolute; left: 10px; z-index: 1; }
.dshm-search input { width: 100%; height: 34px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 10px 0 30px; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-search input[type=search]::-webkit-search-cancel-button { -webkit-appearance: none; }
.dshm-search input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-search input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-search input:focus-visible { border-color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-searchDense input { height: 34px; padding-left: 30px; font-size: 12.5px; border-radius: var(--dsh-layout-radius-user, 8px); }

/* ── heading row (import view): quiet 13px title ───────────────────────── */
.dshm-heading { display: flex; align-items: center; gap: 8px; min-height: 28px; }
.dshm-heading h3 { font-size: 13px; font-weight: 600; letter-spacing: .01em; line-height: 18px; margin: 0; }
.dshm-spacer { flex: 1; }

/* ── buttons: ONE recipe plugin-wide (toolbar, segments, card bars,
   modal footers all converge here) — every control is 28px tall.
   Secondary: transparent fill + 10% hairline, hover pours 5% only.
   Primary ("退出空间"-light): 10% fill + 24% border + a top inset
   highlight; hover deepens to 13%/28%. Press = scale(0.97). ────────── */
.dshm-button { height: 28px; padding: 0 11px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshm-button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.dshm-button:active { transform: scale(0.97); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dshm-button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-button[disabled] { opacity: .5; cursor: default; transform: none; }
.dshm-buttonPrimary { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }
.dshm-buttonPrimary:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshm-buttonDanger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 30%, transparent); }
.dshm-buttonDanger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 40%, transparent); }
.dshm-iconBtn { width: 28px; height: 28px; padding: 0; justify-content: center; flex: none; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); cursor: pointer; display: inline-flex; align-items: center; border-radius: 6px; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshm-iconBtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.dshm-iconBtn:active { transform: scale(0.97); }
.dshm-iconBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-iconBtn.is-primary { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }
.dshm-iconBtn.is-primary:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }

/* ── icon bases: 32px flat pads ────────────────────────────────────────── */
.dshm-tile { width: 32px; height: 32px; flex: none; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); display: grid; place-items: center; }
.dshm-tile.is-warn, .dshm-tileWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 10%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-tile.is-error, .dshm-tileError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }

/* ── status text / failure ──────────────────────────────────────────────── */
.dshm-status { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12px; line-height: 18px; margin: 0; padding: 0 4px; }
.dshm-failure { color: var(--dsw-alias-state-error-primary, #ef5350); font-size: 12.5px; line-height: 19px; display: flex; align-items: center; gap: 10px; }
.dshm-failure p { margin: 0; }
.dshm-failure button { height: 28px; padding: 0 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; cursor: pointer; background: transparent; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshm-failure button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }

/* ── staggered row entrance animation ───────────────────────────────────── */
@keyframes dshm-rowIn { from { opacity: 0; transform: translateY(8px); } }
.dshm-instRow, .dshm-mkt-row { animation: dshm-rowIn 200ms var(--ds-ease-in-out, ease) both; }
.dshm-instRow:nth-child(n+2), .dshm-mkt-row:nth-child(n+2) { animation-delay: 40ms; }
.dshm-instRow:nth-child(n+3), .dshm-mkt-row:nth-child(n+3) { animation-delay: 80ms; }
.dshm-instRow:nth-child(n+4), .dshm-mkt-row:nth-child(n+4) { animation-delay: 120ms; }
.dshm-instRow:nth-child(n+5), .dshm-mkt-row:nth-child(n+5) { animation-delay: 160ms; }
.dshm-instRow:nth-child(n+6), .dshm-mkt-row:nth-child(n+6) { animation-delay: 200ms; }
.dshm-instRow:nth-child(n+7), .dshm-mkt-row:nth-child(n+7) { animation-delay: 240ms; }
.dshm-instRow:nth-child(n+8), .dshm-mkt-row:nth-child(n+8) { animation-delay: 280ms; }
.dshm-instRow:nth-child(n+9), .dshm-mkt-row:nth-child(n+9) { animation-delay: 320ms; }
.dshm-instRow:nth-child(n+10), .dshm-mkt-row:nth-child(n+10) { animation-delay: 360ms; }
.dshm-instRow:nth-child(n+11), .dshm-mkt-row:nth-child(n+11) { animation-delay: 400ms; }
.dshm-instRow:nth-child(n+12), .dshm-mkt-row:nth-child(n+12) { animation-delay: 440ms; }
.dshm-instRow:nth-child(n+13), .dshm-mkt-row:nth-child(n+13) { animation-delay: 480ms; }
.dshm-instRow:nth-child(n+14), .dshm-mkt-row:nth-child(n+14) { animation-delay: 520ms; }
.dshm-instRow:nth-child(n+15), .dshm-mkt-row:nth-child(n+15) { animation-delay: 560ms; }

/* ── loading skeletons: compact rows inside the group rhythm ───────────── */
@keyframes dshm-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.dshm-skeleton { display: flex; flex-direction: column; gap: 0; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 6px; }
.dshm-skelRow { height: 44px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); background: linear-gradient(100deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent) 40%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent) 50%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent) 60%); background-size: 200% 100%; animation: dshm-shimmer 1.4s linear infinite; }
.dshm-skelRow + .dshm-skelRow { margin-top: 6px; }
@media (prefers-reduced-motion: reduce) { .dshm-skelRow { animation: none; } }

/* ── empty state ────────────────────────────────────────────────────────── */
.dshm-empty { padding: 32px 16px 28px; display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent); }
.dshm-emptyTile { width: 44px; height: 44px; border-radius: var(--dsh-layout-radius-user, 10px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; margin-bottom: 6px; font-size: 16px; font-weight: 600; }
.dshm-emptyTitle { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); margin: 0; }
.dshm-empty p { font-size: 12px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin: 0; line-height: 18px; }
.dshm-emptyDense { padding: 26px 12px 22px; }

/* ── installed catalog: full-width list⇄cards + detail modal ────────────── */
.dshm-inst { max-width: none; }
.dshm-instToolbar { display: flex; align-items: center; gap: 6px; }
.dshm-instToolbar .dshm-search { flex: 1; min-width: 140px; }
.dshm-instHead { display: flex; align-items: center; gap: 8px; padding: 2px 4px 0; }
.dshm-instCount { margin-left: auto; font-size: 11px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-instImport { max-width: 720px; }

/* the grouped row list (same quiet container grammar as the market list) —
   scrolls in place past ~70vh so long catalogs ride the thin scrollbar */
.dshm-instList { margin: 0; padding: 6px; list-style: none; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-instRow { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 6px 8px; border-radius: calc(var(--dsh-layout-radius-user-lg, 12px) - 6px); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-instRow:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-instRow + .dshm-instRow { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-instRowMain { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; padding: 0; border-radius: calc(var(--dsh-layout-radius-user-lg, 12px) - 6px); }
.dshm-instRowMain:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-instRowId { flex: 0 1 auto; min-width: 0; max-width: 46%; display: flex; flex-direction: column; gap: 2px; }
.dshm-instRowName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-instRowMeta { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; white-space: nowrap; }
.dshm-instRowMeta > :not(.dshm-instFlag) { overflow: hidden; text-overflow: ellipsis; }
.dshm-instRowDesc { flex: 1; min-width: 0; align-self: center; font-size: 12px; line-height: 17px; color: var(--dsw-alias-label-secondary, #b3b3b8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-instRowSide { flex: none; display: flex; align-items: center; gap: 6px; }
.dshm-instFlag { flex: none; font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
.dshm-instFlag.is-warn { color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-instFlag.is-error { color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-mkt-iconBtn.is-danger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 28%, transparent); }
.dshm-mkt-iconBtn.is-danger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 40%, transparent); }

/* the card grid: auto-fill cards at ≥300px inside one grouped container.
   Cards are the installed catalog's one textured surface — same recipe
   as the market grid: a top-lit 5%→2% fill, inset highlight, soft
   ambient shadow; hover only brightens the border + deepens the shadow.
   Generous footprint: 18px padding, 12px section gaps, 46px tile,
   ~160px minimum height. */
.dshm-instCards { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; background: transparent; border: 0; }
.dshm-instCard { min-width: 0; min-height: 160px; display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: var(--dsh-layout-radius-user-lg, 12px); background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); transition: border-color 120ms var(--ds-ease-in-out, ease), transform 120ms var(--ds-ease-in-out, ease); }
.dshm-instCard:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); }
.dshm-instCardHead { display: flex; align-items: center; gap: 12px; min-width: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; padding: 0; }
.dshm-instCardHead:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: 2px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); }
/* hue-keyed gradient base: the card publishes --dshm-h (djb2 of its
   name); flagged tiles (is-warn / is-error) still outrank the identity */
.dshm-instCardTile { width: 40px; height: 40px; border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 8%, transparent); color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-instCardId { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dshm-instCardNameRow { min-width: 0; display: flex; align-items: center; gap: 6px; }
.dshm-instCardName { font-size: 14px; font-weight: 600; line-height: 19px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-instCardVer { flex: none; height: 19px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); font-family: var(--ds-font-family-code); font-size: 10px; font-weight: 500; line-height: 17px; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.06em; }
.dshm-instCardMeta { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-instCardDesc { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary, #b3b3b8); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.dshm-instCardInfo { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); flex-wrap: wrap; }
.dshm-instCardInfo > span { min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* status badges on cards graduate from plain colored text to small
   capsules in the matching hue (rows keep the quiet text form) */
.dshm-instCard .dshm-instFlag { flex: none; height: 18px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 999px; }
.dshm-instCard .dshm-instFlag.is-rank { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); font-variant-numeric: tabular-nums; }
.dshm-instCard .dshm-instFlag.is-warn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 10%, transparent); }
.dshm-instCard .dshm-instFlag.is-error { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); }
.dshm-instCardBar { margin-top: auto; display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-instCardBarMeta { min-width: 0; font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-instCardBarActions { margin-left: auto; display: flex; align-items: center; gap: 6px; flex: none; }

/* ── detail modal: dark blurred overlay + 760px slide-up dialog ───────── */
/* The mask rides a plain dark base (rgba(0,0,0,.45)) rather than a
   label-primary mix — label-primary goes white-ish in dark themes and
   washed the dialog out; the dialog itself stays an opaque bg-layer-1
   card so file previews never shimmer through. */
@keyframes dshm-modalFade { from { opacity: 0; } }
@keyframes dshm-modalUp { from { opacity: 0; transform: translateY(10px); } }
.dshm-modalOverlay { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 20px; background: rgba(0, 0, 0, 0.5); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: dshm-modalFade 160ms var(--ds-ease-in-out, ease); }
.dshm-modal { display: flex; flex-direction: column; width: min(1080px, 94vw); height: min(760px, 90vh); min-height: 0; background: var(--dsw-alias-bg-layer-1, #1c1c1f); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); overflow: hidden; outline: none; animation: dshm-modalUp 160ms var(--ds-ease-in-out, ease); }
/* compact variant for the market item 详情 dialog: height hugs content */
.dshm-modal.is-compact { height: auto; max-height: min(560px, 84vh); }

/* ── market item detail (compact modal body) ───────────────────────────── */
.dshm-mktDetail { flex: 1; min-height: 0; display: flex; flex-direction: column; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-mktDetailBody { flex: 1; min-height: 120px; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; }
.dshm-mktDetailFoot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 10px 14px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }

/* ── source delete confirm (compact modal shell, alertdialog) ───────────── */
.dshm-modal.dshm-mktConfirm { width: min(400px, 92vw); }
.dshm-mktConfirmBody { display: flex; flex-direction: column; gap: 6px; padding: 16px 16px 4px; }
.dshm-mktConfirmBody h4 { margin: 0; font-size: 13.5px; font-weight: 600; line-height: 18px; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-mktConfirmBody p { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--dsw-alias-label-secondary, #b3b3b8); overflow-wrap: anywhere; }

/* ── detail content (renders inside the modal dialog) ──────────────────── */
.dshm-detail { flex: 1; min-height: 0; display: flex; flex-direction: column; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-detailHead { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-detailHead .dshm-iconBtn { flex: none; }
.dshm-detailSkeleton { flex: 1; border: 0; background: none; padding: 14px; }
/* Skill facts strip under the hero: description one-liner + provider/path,
   with whenToUse / metadata folded into a disclosure. The main pane below
   is pure file preview — the info no longer repeats under every file. */
.dshm-heroInfo { display: flex; align-items: baseline; gap: 10px 14px; flex-wrap: wrap; padding: 8px 16px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
/* description row: the clamp toggle rides the text's tail edge; the text
   itself stays 2-line clamped until .is-open lifts the clamp */
.dshm-heroDescRow { flex: 1 1 240px; min-width: 0; display: flex; align-items: flex-end; gap: 4px; }
.dshm-heroDesc { flex: 1 1 auto; min-width: 0; margin: 0 0 2px; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary, #b3b3b8); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; cursor: pointer; }
.dshm-heroDesc.is-open { display: block; -webkit-line-clamp: unset; overflow: visible; }
.dshm-clampToggle { flex: none; width: 18px; height: 18px; margin-bottom: 1px; display: inline-flex; align-items: center; justify-content: center; padding: 0; border: 0; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 4px); background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); cursor: pointer; transition: color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-clampToggle:hover { color: var(--dsw-alias-label-secondary, #b3b3b8); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.dshm-clampToggle:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-clampToggle svg { transition: transform 120ms var(--ds-ease-in-out, ease); }
.dshm-clampToggle.is-open svg { transform: rotate(180deg); }
.dshm-heroMeta { flex: none; max-width: 40%; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-heroDetails { flex-basis: 100%; }
.dshm-heroDetails summary { cursor: pointer; list-style: none; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #8a8a8e); transition: color 120ms ease; user-select: none; }
.dshm-heroDetails summary::before { content: '› '; display: inline-block; transition: transform 120ms ease; }
.dshm-heroDetails[open] summary::before { transform: rotate(90deg); }
.dshm-heroDetails summary:hover { color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-heroDetailsBody { display: grid; gap: 8px; padding: 6px 0 2px; }
.dshm-heroDetailsBody h4 { margin: 0; font-size: 11px; font-weight: 500; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-detailBody { flex: 1; min-height: 0; display: grid; grid-template-columns: 264px minmax(0, 1fr); }
.dshm-detailBody.is-single { grid-template-columns: minmax(0, 1fr); }
.dshm-detailTree { min-width: 0; min-height: 0; display: flex; flex-direction: column; gap: 6px; padding: 10px; border-right: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); overflow: hidden; }
.dshm-detailTree .dshm-filePanel { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.dshm-detailTree .dshm-treeScroll { flex: 1; max-height: none; }
.dshm-detailMain { min-width: 0; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; }
.dshm-detailMain .dshm-previewWrap { margin-top: 0; }
.dshm-heroTile { width: 40px; height: 40px; border-radius: var(--dsh-layout-radius-user, 10px); }
.dshm-hero { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; flex-wrap: wrap; }
.dshm-heroBody { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.dshm-heroName { font-size: 14px; font-weight: 600; letter-spacing: -.005em; line-height: 19px; margin: 0; overflow-wrap: anywhere; }
.dshm-heroTags { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.dshm-detailCard { border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.dshm-detailCard > h4 { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin: 0; line-height: 16px; text-transform: uppercase; }
.dshm-desc { font-size: 12.5px; line-height: 1.55; margin: 0; overflow-wrap: anywhere; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-callout { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 18%, transparent); border-left: 3px solid var(--dsw-alias-state-business-primary, #6ea8fe); background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 7%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); padding: 9px 12px; font-size: 12.5px; line-height: 1.55; margin: 0; overflow-wrap: anywhere; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-calloutWarn { border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 22%, transparent); border-left-color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 8%, transparent); }
.dshm-calloutError { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 22%, transparent); border-left-color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); }
.dshm-details { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 7px 12px; margin: 0; }
.dshm-details div { display: contents; }
.dshm-details dt { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11.5px; line-height: 18px; padding-top: 1px; }
.dshm-details dd { overflow-wrap: anywhere; min-width: 0; color: var(--dsw-alias-label-secondary, #b3b3b8); margin: 0; font-size: 12px; line-height: 1.55; }
.dshm-path { font-family: var(--ds-font-family-code); font-size: 11.5px; }
.dshm-filePanel { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 6px; }
/* the tree pane scrolls on BOTH axes: rows refuse to wrap (nowrap) and
   the root sizes to its widest row (max-content), so long file names
   push the panel sideways instead of truncating */
.dshm-treeScroll { max-height: 380px; overflow: auto; overscroll-behavior: contain; border-radius: var(--dsh-layout-radius-user, 8px); }
.dshm-treeScroll .rct-tree-root { padding: 0; margin: 0; width: 100%; box-sizing: border-box; font: inherit; color: var(--dsw-alias-label-primary, #f4f4f5); outline: none; }
.dshm-treeScroll .rct-tree-root:focus-visible { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 35%, transparent); border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); }
.dshm-treeScroll .rct-tree-items-container { list-style: none; margin: 0; padding: 0; }
.dshm-treeItem { margin: 0; }
.dshm-treeRow { display: flex; align-items: center; gap: 5px; height: 30px; padding-right: 8px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); color: var(--dsw-alias-label-secondary, #b3b3b8); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-treeRow-folder { color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-treeRow:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.dshm-treeRow.is-selected { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 8%, transparent); }
.dshm-treeRow.is-focused { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 40%, transparent); }
.dshm-treeRow .rct-tree-item-arrow { width: 15px; height: 15px; flex: none; display: inline-flex; align-items: center; justify-content: center; color: var(--dsw-alias-label-tertiary, #8a8a8e); cursor: pointer; }
.dshm-treeRow .rct-tree-item-arrow svg { width: 10px; height: 10px; fill: currentColor; transition: transform 140ms var(--ds-ease-in-out, ease); }
.dshm-treeRow .rct-tree-item-arrow.rct-tree-item-arrow-expanded svg { transform: rotate(90deg); }
@media (prefers-reduced-motion: reduce) { .dshm-treeRow .rct-tree-item-arrow svg { transition: none; } }
.dshm-treeRow-file .rct-tree-item-arrow { visibility: hidden; }
.dshm-treeMain { flex: 1; min-width: 0; display: flex; align-items: center; gap: 7px; outline: none; }
.dshm-treeIcon { flex: none; display: inline-flex; align-items: center; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-treeRow-folder .dshm-treeIcon { color: var(--dsw-alias-state-business-primary, #6ea8fe); }
/* no ellipsis: the name keeps its natural width (white-space: nowrap) so
   the tree panel scrolls horizontally rather than clipping */
.dshm-treeName { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--ds-font-family-code); font-size: 12px; line-height: 17px; }
.dshm-treeRow-folder .dshm-treeName { font-weight: 500; }
.dshm-treeSize { flex: none; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; font-variant-numeric: tabular-nums; line-height: 16px; }
.dshm-fileDot { width: 5px; height: 5px; border-radius: 999px; background: var(--dsw-alias-label-tertiary, #8a8a8e); display: inline-block; flex: none; }
.dshm-md { font-size: 12.5px; line-height: 1.65; overflow-wrap: anywhere; }
.dshm-md > :first-child { margin-top: 0; }
.dshm-md :is(h1, h2, h3, h4) { font-size: 1.05em; margin: 1.1em 0 .4em; }

/* ── tags / flags (detail hero, preview) ───────────────────────────────── */
.dshm-tag { height: 20px; padding: 0 8px; white-space: nowrap; border-radius: 999px; align-items: center; display: inline-flex; font-size: 10px; font-weight: 500; line-height: 18px; text-transform: uppercase; letter-spacing: 0.06em; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-tagOk { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 10%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-tagWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 12%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-tagError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-tagCode { font-family: var(--ds-font-family-code); font-size: 10.5px; font-weight: 500; }

/* ── forms ──────────────────────────────────────────────────────────────── */
.dshm-form { display: flex; flex-direction: column; gap: 12px; }
.dshm-formRow { display: flex; flex-direction: column; gap: 6px; }
.dshm-formRow > label { font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-formRow > span { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); line-height: 17px; }
.dshm-input, .dshm-select { width: 100%; box-sizing: border-box; height: 32px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 10px; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-input:hover, .dshm-select:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-input:focus-visible, .dshm-select:focus-visible { border-color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── segmented control (import mode, mode tabs, preview switch) ───────────
   Same recipe as the market source seg (.dshm-mkt-seg): 2px 4% track,
   28px borderless pills, hover pours 5%, active sits on a 12% fill. */
.dshm-seg { display: inline-flex; gap: 2px; padding: 2px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }
.dshm-seg button { height: 28px; padding: 0 12px; border: 0; background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; font-size: 12px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-seg button:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.dshm-seg button[aria-pressed=true] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font-weight: 500; }
.dshm-seg button[aria-selected=true] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font-weight: 500; }
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
.dshm-segSm button { height: 28px; padding: 0 10px; font-size: 12px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); }
.dshm-buttonGhostSm { height: 28px; padding: 0 9px; font-size: 12px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); gap: 5px; align-self: center; text-decoration: none; }
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

/* shelf root: one column, 10px between toolbar / disclosures / list —
   the same rhythm dsh-mcp-manager's .dshmcp-mkt uses */
.dshm-mkt { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

/* toolbar: segmented sources + 34px search + view capsules + 28px icon buttons */
.dshm-mkt-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshm-mkt-seg { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); max-width: 420px; min-width: 0; overflow-x: auto; padding: 3px; gap: 2px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); scrollbar-width: none; }
.dshm-mkt-seg::-webkit-scrollbar { display: none; }
.dshm-mkt-segBtn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 26px; min-width: 56px; padding: 0 10px; border: 0; border-radius: 999px; background: transparent; color: var(--dsw-alias-label-secondary, #b3b3b8); font: inherit; font-size: 12px; cursor: pointer; white-space: nowrap; transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-segBtn:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.dshm-mkt-segBtn.is-active { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); font-weight: 500; }
.dshm-mkt-segBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-segLabel { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-segDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-mkt-segBtn.is-down .dshm-mkt-segDot { background: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-mkt-segBtn.is-invalid .dshm-mkt-segDot { background: var(--dsw-alias-state-business-primary, #6ea8fe); }

/* search: the label IS the 34px field (icon + input inside the box) */
.dshm-mkt-search { flex: 1; min-width: 180px; height: 34px; box-sizing: border-box; display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-search:focus-within { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-mkt-search input { flex: 1; min-width: 0; background: transparent; border: 0; outline: 0; color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; }
.dshm-mkt-search input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-search svg { width: 14px; height: 14px; flex: 0 0 14px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-iconBtn { width: 28px; height: 28px; flex: none; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; cursor: pointer; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-iconBtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-mkt-iconBtn:active { transform: scale(0.97); }
.dshm-mkt-iconBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-iconBtn[disabled] { opacity: .55; cursor: default; }
.dshm-mkt-iconBtn.is-active { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dshm-mkt-iconBtn svg { width: 14px; height: 14px; }
.dshm-mkt-iconBtn.is-spin svg { animation: dshm-mkt-spin 1.2s linear infinite; transform-box: fill-box; transform-origin: center; }

/* compact buttons (26px, mirroring dsh-mcp-manager's mkt-install /
   mkt-remove): secondary = transparent + 10% border, hover pours 5%;
   primary = 9% fill + 24% border + top inset highlight, hover 13%/28% */
.dshm-mkt-btn { height: 26px; padding: 0 10px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; cursor: pointer; white-space: nowrap; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-btn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-mkt-btn:active { transform: scale(0.97); }
.dshm-mkt-btn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-btn[disabled] { opacity: .55; cursor: default; transform: none; }
.dshm-mkt-btn.is-primary { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }
.dshm-mkt-btn.is-primary:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshm-mkt-btn.is-danger { color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-mkt-btn.is-danger:hover { color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent); }
/* quiet detail action ("详情") beside the primary install / update button */
.dshm-mkt-btn.is-quiet { color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-mkt-btn.is-quiet:hover { color: var(--dsw-alias-label-primary, #f4f4f5); }

/* view toggle: two 26px icon capsules in a 3px track (list ⇄ cards) */
.dshm-mkt-viewseg { flex: none; display: inline-flex; gap: 2px; padding: 3px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }
.dshm-mkt-viewseg button { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; padding: 0; border: 0; border-radius: 999px; background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; cursor: pointer; transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-viewseg button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-mkt-viewseg button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-viewseg button[aria-pressed=true] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-mkt-viewseg svg { width: 14px; height: 14px; }
/* toolbar tools cluster (view toggle + refresh + add-source + manage):
   transparent on desktop (display: contents) so the toolbar's five
   controls keep their one-row flex layout untouched; the ≤767px tier
   (responsive section) turns it into the stacked toolbar's trailing
   right-aligned actions row */
.dshm-mkt-tools { display: contents; }

/* add-source: compact inline disclosure row on a proper grouped surface */
.dshm-mkt-addrow { display: flex; gap: 8px; flex-wrap: wrap; padding: 8px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-mkt-addrow input { flex: 1 1 180px; min-width: 0; height: 30px; box-sizing: border-box; padding: 0 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; outline: 0; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-addrow input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-mkt-addrow input:focus { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-mkt-addrow input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-addbtn { flex: none; height: 26px; display: inline-flex; align-items: center; padding: 0 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); border-radius: 6px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; cursor: pointer; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-addbtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshm-mkt-addbtn:active { transform: scale(0.97); }
.dshm-mkt-addbtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-addbtn[disabled] { opacity: .5; cursor: default; }
.dshm-mkt-addbtn.is-quiet { background: transparent; border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-mkt-addbtn.is-quiet:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
/* discovery hint under the add-source inputs (what URLs are accepted) */
.dshm-mkt-addhint { flex: 1 1 100%; min-width: 0; padding: 0 2px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* the grouped row list (48px rows, MCP rhythm) */
.dshm-mkt-list { margin: 0; padding: 6px; list-style: none; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-mkt-row { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 5px 6px; border-radius: var(--dsh-layout-radius-user, 8px); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-row:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-mkt-row + .dshm-mkt-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-mkt-rowMain { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
button.dshm-mkt-rowMain { border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; padding: 0; }
button.dshm-mkt-rowMain:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: 2px; border-radius: var(--dsh-layout-radius-user, 8px); }
.dshm-mkt-rowTile { width: 32px; height: 32px; flex: none; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); display: grid; place-items: center; }
.dshm-mkt-rowTile svg { width: 16px; height: 16px; }
.dshm-mkt-rowId { flex: 0 0 clamp(150px, 26%, 230px); min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dshm-mkt-rowName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-rowMeta { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-rowDesc { flex: 1; min-width: 0; align-self: center; font-size: 12px; line-height: 16px; color: var(--dsw-alias-label-secondary, #b3b3b8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-rowSide { flex: none; display: flex; align-items: center; gap: 6px; }
.dshm-mkt-badge { height: 22px; padding: 0 9px; display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 8%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); font-size: 10px; font-weight: 500; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.06em; }
.dshm-mkt-badgeDot { width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-state-success-primary, #4caf50); }

/* empty / error (grouped quiet surfaces, MCP grammar) */
.dshm-more { display: flex; justify-content: center; padding: 10px 0 4px; }
.dshm-moreBtn { display: inline-flex; align-items: center; gap: 6px; min-height: 26px; padding: 3px 14px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-secondary, #b3b3b8); font: inherit; font-size: 12px; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
.dshm-moreBtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-mkt-empty { text-align: center; padding: 40px 16px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12px; line-height: 18px; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-mkt-error { color: var(--dsw-alias-state-error-primary, #ef5350); font-size: 12px; line-height: 18px; padding: 8px 12px; background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }

/* workspace dual-mode head: segmented 已安装 | 市场. The wrapper stays
   uncapped — both the market toolbar and the installed list⇄cards catalog
   want the full rail width. */
.dshm-ws { max-width: none; }
.dshm-wsHead { display: flex; align-items: center; gap: 10px; min-height: 30px; }

/* ── source manage panel: grouped container, one row per source ───────────
   Mirrors dsh-mcp-manager: health dot + name (+ built-in tag) + mono URL
   + 26px edit / delete actions; the editing row swaps in two inputs and
   the same confirm / cancel buttons the add form uses. */
.dshm-mkt-manage { display: flex; flex-direction: column; gap: 4px; padding: 8px 6px 6px; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-mkt-manageLabel { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #8a8a8e); padding: 0 8px; }
.dshm-mkt-srcList { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; }
.dshm-mkt-srcRow { display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 6px 8px; border-radius: var(--dsh-layout-radius-user, 8px); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-srcRow:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-mkt-srcDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-mkt-srcDot.is-down { background: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-mkt-srcDot.is-invalid { background: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-mkt-srcMain { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dshm-mkt-srcNameLine { min-width: 0; display: flex; align-items: center; gap: 6px; }
.dshm-mkt-srcName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-srcTag { flex: none; height: 20px; padding: 0 8px; display: inline-flex; align-items: center; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 10px; font-weight: 500; line-height: 18px; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.06em; }
.dshm-mkt-srcUrl { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-srcActions { flex: none; display: inline-flex; align-items: center; gap: 4px; }
.dshm-mkt-srcBtn { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; padding: 0; border: 1px solid transparent; border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; cursor: pointer; transition: color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-srcBtn:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); }
.dshm-mkt-srcBtn:active { transform: scale(0.97); }
.dshm-mkt-srcBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-mkt-srcBtn[disabled] { opacity: .45; cursor: default; }
.dshm-mkt-srcBtn.is-danger:hover { color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent); }
.dshm-mkt-srcEdit { flex: 1; min-width: 0; display: flex; gap: 8px; flex-wrap: wrap; }
.dshm-mkt-srcEdit input { flex: 1 1 160px; min-width: 0; height: 28px; box-sizing: border-box; padding: 0 10px; border-radius: var(--dsh-layout-radius-user, 8px); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; outline: 0; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-srcEdit input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-mkt-srcEdit input:focus { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshm-mkt-srcEdit input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* update state: business-colored badge + button (list rows and cards);
   the badge mirrors MCP's updatable capsule (20% border, 9% fill) */
.dshm-mkt-badge.is-update { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 9%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 20%, transparent); color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-mkt-badge.is-update .dshm-mkt-badgeDot { background: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-mkt-btn.is-update { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 9%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 24%, transparent); }
.dshm-mkt-btn.is-update:hover { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 13%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 28%, transparent); }

/* card grid view: one grouped container, auto-fill cards at ≥300px.
   Cards are the market's one textured surface (matching the installed
   catalog): a hue-keyed gradient icon base, a top-lit 5%→2% fill with
   an inset highlight and a soft ambient shadow; hover only brightens
   the border and deepens the shadow — no lift, no background shift.
   Generous footprint: 18px padding, 12px section gaps, 46px tile,
   ~160px minimum height. */
.dshm-mkt-cards { margin: 0; padding: 6px; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 8px; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-mkt-card { min-width: 0; min-height: 160px; display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: var(--dsh-layout-radius-user-lg, 12px); background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); transition: border-color 120ms var(--ds-ease-in-out, ease), transform 120ms var(--ds-ease-in-out, ease); }
.dshm-mkt-card:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); }
.dshm-mkt-cardHead { display: flex; align-items: center; gap: 12px; min-width: 0; }
/* hue-keyed gradient base: the card publishes --dshm-h (djb2 of the
   item name); the icon rides a brighter tone of the same hue while
   installed / updatable state stays on the badges below */
.dshm-mkt-cardTile { width: 40px; height: 40px; flex: none; border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 8%, transparent); color: var(--dsw-alias-state-business-primary, #6ea8fe); display: grid; place-items: center; }
.dshm-mkt-cardId { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dshm-mkt-cardNameRow { min-width: 0; display: flex; align-items: center; gap: 8px; }
.dshm-mkt-cardName { font-size: 14px; font-weight: 600; line-height: 19px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-cardVer { flex: none; height: 18px; padding: 0 7px; display: inline-flex; align-items: center; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 10px; font-weight: 500; line-height: 16px; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.06em; }
.dshm-mkt-cardMeta { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-cardDesc { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary, #b3b3b8); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.dshm-mkt-cardTags { display: flex; flex-wrap: wrap; gap: 4px; }
.dshm-mkt-cardTag { height: 20px; max-width: 130px; padding: 0 8px; display: inline-flex; align-items: center; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 10px; font-weight: 500; line-height: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; letter-spacing: 0.06em; }
.dshm-mkt-cardBar { margin-top: auto; display: flex; align-items: center; gap: 6px; padding-top: 10px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-mkt-cardKind { min-width: 0; display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); text-transform: capitalize; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-mkt-cardKind svg { width: 11px; height: 11px; flex: none; }
.dshm-mkt-cardActions { margin-left: auto; display: flex; align-items: center; gap: 6px; flex: none; }

/* no-sources blank state: guided CTA inside the group container */
.dshm-mkt-blank { padding: 38px 16px 34px; display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
.dshm-mkt-blankTile { width: 44px; height: 44px; border-radius: var(--dsh-layout-radius-user, 10px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; margin-bottom: 6px; font-size: 16px; font-weight: 600; }
.dshm-mkt-blankTitle { margin: 0; font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-mkt-blankHint { margin: 0 0 9px; max-width: 300px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

@keyframes dshm-mkt-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

/* ── scrollbars: one thin recipe over every plugin scroller ─────────────── */
/* All of this plugin's scroll containers (the market list / cards, the
   installed list / cards, the detail modal panes, the market item detail
   body, the file tree, the preview body and the table wrap) ride one thin
   quiet scrollbar — label color at 18% over a transparent track,
   brightening to 28% on hover — instead of the browser default the page
   layout cannot reach. Visibility follows dsh-layout's scrollbar setting:
   'hidden' removes the bars here as well (scrolling keeps working); the
   native default — and any overlay-style tier — keeps this thin style.
   (.dshm-mkt-seg deliberately keeps its own scrollbar-width: none: it is
   a toolbar strip, not a content scroller.) */
.dshm-mkt-list,
.dshm-mkt-cards,
.dshm-instList,
.dshm-instCards,
.dshm-detailMain,
.dshm-mktDetailBody,
.dshm-treeScroll,
.dshm-previewBody,
.dshm-tableWrap {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent) transparent;
}
.dshm-mkt-list::-webkit-scrollbar,
.dshm-mkt-cards::-webkit-scrollbar,
.dshm-instList::-webkit-scrollbar,
.dshm-instCards::-webkit-scrollbar,
.dshm-detailMain::-webkit-scrollbar,
.dshm-mktDetailBody::-webkit-scrollbar,
.dshm-treeScroll::-webkit-scrollbar,
.dshm-previewBody::-webkit-scrollbar,
.dshm-tableWrap::-webkit-scrollbar { width: 8px; height: 8px; }
.dshm-mkt-list::-webkit-scrollbar-thumb,
.dshm-mkt-cards::-webkit-scrollbar-thumb,
.dshm-instList::-webkit-scrollbar-thumb,
.dshm-instCards::-webkit-scrollbar-thumb,
.dshm-detailMain::-webkit-scrollbar-thumb,
.dshm-mktDetailBody::-webkit-scrollbar-thumb,
.dshm-treeScroll::-webkit-scrollbar-thumb,
.dshm-previewBody::-webkit-scrollbar-thumb,
.dshm-tableWrap::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent);
  border-radius: 999px;
}
.dshm-mkt-list::-webkit-scrollbar-thumb:hover,
.dshm-mkt-cards::-webkit-scrollbar-thumb:hover,
.dshm-instList::-webkit-scrollbar-thumb:hover,
.dshm-instCards::-webkit-scrollbar-thumb:hover,
.dshm-detailMain::-webkit-scrollbar-thumb:hover,
.dshm-mktDetailBody::-webkit-scrollbar-thumb:hover,
.dshm-treeScroll::-webkit-scrollbar-thumb:hover,
.dshm-previewBody::-webkit-scrollbar-thumb:hover,
.dshm-tableWrap::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshm-mkt-list::-webkit-scrollbar-track,
.dshm-mkt-cards::-webkit-scrollbar-track,
.dshm-instList::-webkit-scrollbar-track,
.dshm-instCards::-webkit-scrollbar-track,
.dshm-detailMain::-webkit-scrollbar-track,
.dshm-mktDetailBody::-webkit-scrollbar-track,
.dshm-treeScroll::-webkit-scrollbar-track,
.dshm-previewBody::-webkit-scrollbar-track,
.dshm-tableWrap::-webkit-scrollbar-track { background: transparent; }
html[data-dsh-layout-scrollbar='hidden'] .dshm-mkt-list,
html[data-dsh-layout-scrollbar='hidden'] .dshm-mkt-cards,
html[data-dsh-layout-scrollbar='hidden'] .dshm-instList,
html[data-dsh-layout-scrollbar='hidden'] .dshm-instCards,
html[data-dsh-layout-scrollbar='hidden'] .dshm-detailMain,
html[data-dsh-layout-scrollbar='hidden'] .dshm-mktDetailBody,
html[data-dsh-layout-scrollbar='hidden'] .dshm-previewBody,
html[data-dsh-layout-scrollbar='hidden'] .dshm-tableWrap { scrollbar-width: none; }
html[data-dsh-layout-scrollbar='hidden'] .dshm-mkt-list::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshm-mkt-cards::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshm-instList::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshm-instCards::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshm-detailMain::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshm-mktDetailBody::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshm-previewBody::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshm-tableWrap::-webkit-scrollbar { display: none; }

/* ── responsive ─────────────────────────────────────────────────────────── */
/* Phone tier (≤767px, 375px baseline): nothing may push the page wider
   than the viewport. Card grids clamp their minimum track to the
   container, the market toolbar stacks (source seg → search → one tools
   row), the installed toolbar wraps, modals go full-bleed minus a 12px
   rim with the detail tree stacked over the preview at a capped height,
   and long code / tables / URLs / paths ride horizontal scrollers or
   break instead of pushing the layout wide. Desktop rules above stay
   untouched — every fix below is scoped to this tier. */
@media (max-width: 767px) {
  /* market toolbar: stack, and the trailing controls share one row */
  .dshm-mkt-toolbar { align-items: stretch; flex-direction: column; }
  .dshm-mkt-seg { max-width: none; width: 100%; }
  .dshm-mkt-search { min-width: 0; }
  .dshm-mkt-tools { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
  /* installed toolbar: let the dense search shrink instead of forcing
     140px, and wrap the trailing controls when they no longer fit */
  .dshm-instToolbar { flex-wrap: wrap; }
  .dshm-instToolbar .dshm-search { min-width: 0; }
  /* segmented controls (mode tabs, import mode, preview switch) scroll
     inside their track instead of overflowing it — buttons stay one-line
     so the track scrolls rather than re-wrapping the label */
  .dshm-seg { max-width: 100%; overflow-x: auto; scrollbar-width: none; }
  .dshm-seg::-webkit-scrollbar { display: none; }
  .dshm-seg button { white-space: nowrap; }
  .dshm-wsHead { flex-wrap: wrap; }
  /* card grids: single column on H5 */
  .dshm-mkt-cards { grid-template-columns: 1fr; }
  .dshm-instCards { grid-template-columns: 1fr; }
  .dshm-mkt-card, .dshm-instCard { padding: 14px; gap: 10px; }
  /* narrow cards: the action cluster (badge + 详情 / 更新 / 移除) wraps
     under the meta instead of pushing past the card edge, and a long
     semver capsule caps inside the head row */
  .dshm-mkt-cardBar, .dshm-instCardBar { flex-wrap: wrap; }
  .dshm-instCardVer, .dshm-mkt-cardVer { max-width: 60%; overflow: hidden; }
  /* row sides wrap their 详情 / badge / action cluster on narrow rails */
  .dshm-mkt-rowSide { flex-wrap: wrap; justify-content: flex-end; }
  .dshm-instRowSide { flex-wrap: wrap; justify-content: flex-end; }
  /* modals: full-bleed minus a 12px rim; footer buttons wrap */
  .dshm-modalOverlay { padding: 12px; }
  .dshm-modal { width: 100%; }
  .dshm-modal.dshm-mktConfirm { width: 100%; }
  .dshm-mktDetailFoot { flex-wrap: wrap; justify-content: flex-end; }
  /* detail dialog: tree stacks over the preview, capped + scrollable */
  .dshm-detailBody { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
  .dshm-detailTree { border-right: 0; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
  .dshm-detailTree .dshm-treeScroll { flex: none; max-height: 180px; }
  /* hero facts strip: provider · path line may use the full width */
  .dshm-heroMeta { max-width: 100%; }
  /* the metadata disclosure (whenToUse + JSON tree) scrolls sideways
     rather than widening the dialog */
  .dshm-heroDetailsBody { min-width: 0; overflow-x: auto; }
  /* long inline content: break or scroll locally, never push the page */
  .dshm-previewPath { max-width: 100%; }
  .dshm-previewMeta { min-width: min(160px, 100%); }
  .dshm-md :is(table, pre) { display: block; max-width: 100%; overflow-x: auto; }
  .dshm-md :is(img, video) { max-width: 100%; height: auto; }
  .dshm-callout { overflow-wrap: anywhere; }
  .dshm-mkt-error { overflow-wrap: anywhere; }
  .dshm-failure { flex-wrap: wrap; }
  /* breathing room on phones: rows and button clusters stop hugging */
  .dshm-mkt-toolbar > * + * { margin-top: 10px; }
  .dshm-mkt-tools { gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
  .dshm-instToolbar { gap: 10px; }
  .dshm-mkt-search, .dshm-search { min-height: 38px; }
  .dshm-searchDense input { height: 38px; }
  .dshm-mkt-iconBtn, .dshm-iconBtn { width: 36px; height: 36px; }
  .dshm-button, .dshm-mkt-btn { height: 36px; }
  .dshm-instList, .dshm-mkt-list { padding: 8px; }
  .dshm-instCards, .dshm-mkt-cards { padding: 8px; gap: 10px; grid-template-columns: 1fr; }
  .dshm-mkt-card, .dshm-instCard { padding: 14px; gap: 10px; }
  .dshm-modal { max-height: calc(100dvh - 24px); }

  .dshm-failure p { min-width: 0; overflow-wrap: anywhere; }
  .dshm-resultHead { flex-wrap: wrap; }
  .dshm-resultHead strong { overflow-wrap: anywhere; }
  .dshm-resultMeta { min-width: 0; }
  .dshm-resultMeta code { overflow-wrap: anywhere; }
}
@media (max-width: 640px) {
  .dshm-mkt-rowDesc { display: none; }
  .dshm-mkt-rowId { flex: 1 1 auto; max-width: none; }
  .dshm-instRowDesc { display: none; }
  .dshm-instRowId { flex: 1 1 auto; max-width: none; }
}

/* ── dsh-layout material bridge ──────────────────────────────────────────
   When the dsh-layout plugin turns its frosted material on (flag on
   <html>), the quiet fills swap for translucent glass tints over the
   blurred canvas: grouped lists 34%, panels/inputs 46%, icon bases 52%;
   borders move to --dsh-layout-line at 45-55%. The textured cards pour
   the same 34% glass while keeping their top inset highlight and soft
   ambient shadow, and their hue-keyed gradient bases survive untouched.
   The detail dialog stays an OPAQUE bg-layer-1 card — previews must not
   shimmer through the glass. Hover stays a border/shadow-only change. */
html[data-dsh-layout-material='on'] .dshm-instList,
html[data-dsh-layout-material='on'] .dshm-instCards,
html[data-dsh-layout-material='on'] .dshm-detailCard,
html[data-dsh-layout-material='on'] .dshm-previewCard,
html[data-dsh-layout-material='on'] .dshm-resultCard,
html[data-dsh-layout-material='on'] .dshm-skeleton,
html[data-dsh-layout-material='on'] .dshm-mkt-list,
html[data-dsh-layout-material='on'] .dshm-mkt-cards,
html[data-dsh-layout-material='on'] .dshm-mkt-manage,
html[data-dsh-layout-material='on'] .dshm-mkt-addrow,
html[data-dsh-layout-material='on'] .dshm-mkt-seg,
html[data-dsh-layout-material='on'] .dshm-mkt-empty,
html[data-dsh-layout-material='on'] .dshm-mkt-blank {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}
/* card surfaces: same 34% glass pour + the native material blur — a real
   frosted card, not just a tinted one */
html[data-dsh-layout-material='on'] .dshm-instCard,
html[data-dsh-layout-material='on'] .dshm-mkt-card {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}
/* Accessibility fallback: without transparency support the frosted cards
   fall back to the solid material base, matching the native sheets. */
@media (prefers-reduced-transparency: reduce) {
  html[data-dsh-layout-material='on'] .dshm-instList,
  html[data-dsh-layout-material='on'] .dshm-instCards,
  html[data-dsh-layout-material='on'] .dshm-instCard,
  html[data-dsh-layout-material='on'] .dshm-mkt-card,
  html[data-dsh-layout-material='on'] .dshm-mkt-list,
  html[data-dsh-layout-material='on'] .dshm-mkt-cards,
  html[data-dsh-layout-material='on'] .dshm-detailCard,
  html[data-dsh-layout-material='on'] .dshm-previewCard {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    background: var(--dsh-layout-mat-solid, var(--dsh-layout-glass-base, #16161a)) !important;
  }
}
html[data-dsh-layout-material='on'] .dshm-filePanel,
html[data-dsh-layout-material='on'] .dshm-previewHead,
html[data-dsh-layout-material='on'] .dshm-seg,
html[data-dsh-layout-material='on'] .dshm-drop,
html[data-dsh-layout-material='on'] .dshm-search input,
html[data-dsh-layout-material='on'] .dshm-input,
html[data-dsh-layout-material='on'] .dshm-select {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent);
}
html[data-dsh-layout-material='on'] .dshm-tile,
html[data-dsh-layout-material='on'] .dshm-emptyTile,
html[data-dsh-layout-material='on'] .dshm-dropIcon,
html[data-dsh-layout-material='on'] .dshm-resultIcon,
html[data-dsh-layout-material='on'] .dshm-mkt-rowTile,
html[data-dsh-layout-material='on'] .dshm-mkt-blankTile {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 52%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}

/* ── motion safety ────────────────────────────────────────────────────────
   Everything above only transitions background/color/shadow at 120ms; under
   prefers-reduced-motion the transitions, the shimmer, the spin and the
   press scale all drop out. */
@media (prefers-reduced-motion: reduce) {
  .dshm-button, .dshm-iconBtn, .dshm-search input, .dshm-input, .dshm-select, .dshm-seg button, .dshm-segSm button, .dshm-drop, .dshm-failure button, .dshm-instRow, .dshm-instCard, .dshm-mkt-row, .dshm-mkt-card, .dshm-mkt-segBtn, .dshm-mkt-btn, .dshm-mkt-iconBtn, .dshm-mkt-addrow input, .dshm-mkt-addbtn, .dshm-mkt-srcRow, .dshm-mkt-srcBtn, .dshm-mkt-srcEdit input, .dshm-mkt-viewseg button, .dshm-clampToggle, .dshm-treeRow { transition: none !important; }
  .dshm-instRow, .dshm-mkt-row { animation: none !important; }
  .dshm-button:active, .dshm-iconBtn:active, .dshm-mkt-btn:active, .dshm-mkt-iconBtn:active, .dshm-mkt-addbtn:active, .dshm-mkt-srcBtn:active { transform: none; }
  .dshm-clampToggle svg { transition: none; }
  .dshm-modalOverlay, .dshm-modal { animation: none; }
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
