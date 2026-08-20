const STYLE_ID = 'dsh-mcp-manager-styles'

/**
 * Design language: "Quiet Structure" (Raycast-store / macOS-Settings shape).
 *
 * Design-token reference: dsh-plugin/docs/design-tokens.md
 *
 * All numeric values follow the unified spacing / typography / radius /
 * color-mix recipes defined in that document.  The CSS string below is
 * annotated with the token name each value comes from so future audits
 * can cross-check in one pass.
 *
 * PC / H5 tables:
 *   spacing  — --dsh-space-xs(2) … --dsh-space-9xl(32/20)
 *   font     — --dsh-font-size-xs(10.5) … --dsh-font-size-hero(17)
 *   radius   — --dsh-radius-sm(6) … --dsh-radius-round(50%)
 *   buttons  --dsh-btn-height-sm(26/36) / -md(28/36) / -icon(28/36)
 *   cards    --dsh-card-padding(18/12-14) / -gap(12-13/10) / -radius(8)
 *   modals   --dsh-modal-width-md(560) / -lg(640) / -radius(12)
 *   inputs   --dsh-input-height(30-32/38) / -radius(8)
 *
 * Glass-material linkage: html[data-dsh-layout-material='on']
 *   groups 34% / panels 46% / modal 88% / borders 45-55%
 *
 * motion: 120ms ease for interactions; 160ms slide-up for modals;
 * reduced-motion kills everything.
 */
const CSS = `
/* ── shell ──────────────────────────────────────────────────────────────── */
/* --dsh-space-2xl gap (12px) */
.dshmcp-tab { width: 100%; display: flex; flex-direction: column; gap: 12px; color: var(--dsw-alias-label-primary, #f4f4f5); background: radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent), transparent 70%); }

/* ── toolbar row: small label + count + actions ─────────────────────────── */
/* --dsh-space-lg gap (8px), min-height --dsh-btn-height-md (28px) */
.dshmcp-bar { display: flex; align-items: center; gap: 8px; min-height: 28px; flex-wrap: wrap; }
/* --dsh-font-size-sm (11px/500) + --dsh-label-spacing (0.05em) */
.dshmcp-barLabel { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
/* pill badge: --dsh-space-md x padding, --dsh-radius-full, surface-icon-base bg, border-group */
.dshmcp-count { min-width: 18px; height: 18px; padding: 0 6px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 16px; display: inline-flex; align-items: center; justify-content: center; }
.dshmcp-spacer { flex: 1; }

/* ── block label (11px eyebrow above a grouped block) ───────────────────── */
/* --dsh-font-size-sm (11px/500) + --dsh-label-spacing (0.05em) */
.dshmcp-label { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── grouped container recipe ───────────────────────────────────────────── */
/* --dsh-group-bg (bg-layer-2), --dsh-group-border (label-primary 8%),
   --dsh-group-radius (radius-lg 12px), --dsh-group-padding (6px) */
.dshmcp-list,
.dshmcp-fields,
.dshmcp-toolList,
.dshmcp-detailTools,
.dshmcp-mkt-list {
  margin: 0; padding: 6px; list-style: none;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}

/* ── buttons ────────────────────────────────────────────────────────────── */
/* --dsh-btn-height-md (28px), --dsh-btn-padding-x (10px), --dsh-btn-gap (6px),
   --dsh-btn-font-size (12.5px), --dsh-btn-radius (radius-md 8px) */
.dshmcp-button {
  height: 28px; padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit; font-size: 12.5px;
  border-radius: 6px;
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
/* secondary hover: --dsh-hover-bg-strong (5%), --dsh-border-card-hover (16%) */
.dshmcp-button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
/* press: scale(.97) per design token 5.3 */
.dshmcp-button:active { transform: scale(0.97); }
.dshmcp-button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-button[disabled] { opacity: .5; cursor: default; }
/* --dsh-btn-height-icon (28px) */
.dshmcp-buttonIcon { width: 28px; height: 28px; padding: 0; justify-content: center; }
/* primary: --dsh-primary-bg (9%), --dsh-border-active (24%), --dsh-primary-highlight (8%) */
.dshmcp-buttonPrimary {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
}
/* primary hover: --dsh-primary-bg-hover (13%), --dsh-border-primary-hover (28%) */
.dshmcp-buttonPrimary:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
/* danger: error border 20% */
.dshmcp-buttonDanger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 20%, transparent); }
/* danger hover: error bg 6%, error border 30% */
.dshmcp-buttonDanger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 30%, transparent); }
/* ghost small: --dsh-btn-height-sm (26px), --dsh-btn-font-size (12px) */
.dshmcp-buttonGhostSm { height: 26px; padding: 0 9px; font-size: 12px; }

/* ── status text / failure ──────────────────────────────────────────────── */
/* --dsh-font-size-md (12px) description */
.dshmcp-status { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12px; line-height: 1.55; margin: 0; }
/* --dsh-font-size-base (12.5px) failure text, --dsh-space-xl gap (10px) */
.dshmcp-failure { color: var(--dsw-alias-state-error-primary, #ef5350); font-size: 12.5px; line-height: 1.55; display: flex; align-items: center; gap: 10px; }
.dshmcp-failure p { margin: 0; }
/* retry: --dsh-btn-height-sm (26px), --dsh-border-input (10%), --dsh-btn-radius (8px) */
.dshmcp-failure button { height: 26px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; cursor: pointer; background: transparent; border-radius: var(--dsh-layout-radius-user, 8px); padding: 0 10px; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-failure button:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }

/* ── staggered row entrance animation ───────────────────────────────────── */
@keyframes dshmcp-rowIn { from { opacity: 0; transform: translateY(8px); } }
.dshmcp-instRow, .dshmcp-mkt-rowInner { animation: dshmcp-rowIn 200ms var(--ds-ease-in-out, ease) both; }
.dshmcp-instRow:nth-child(n+2), .dshmcp-mkt-row:nth-child(n+2) .dshmcp-mkt-rowInner { animation-delay: 40ms; }
.dshmcp-instRow:nth-child(n+3), .dshmcp-mkt-row:nth-child(n+3) .dshmcp-mkt-rowInner { animation-delay: 80ms; }
.dshmcp-instRow:nth-child(n+4), .dshmcp-mkt-row:nth-child(n+4) .dshmcp-mkt-rowInner { animation-delay: 120ms; }
.dshmcp-instRow:nth-child(n+5), .dshmcp-mkt-row:nth-child(n+5) .dshmcp-mkt-rowInner { animation-delay: 160ms; }
.dshmcp-instRow:nth-child(n+6), .dshmcp-mkt-row:nth-child(n+6) .dshmcp-mkt-rowInner { animation-delay: 200ms; }
.dshmcp-instRow:nth-child(n+7), .dshmcp-mkt-row:nth-child(n+7) .dshmcp-mkt-rowInner { animation-delay: 240ms; }
.dshmcp-instRow:nth-child(n+8), .dshmcp-mkt-row:nth-child(n+8) .dshmcp-mkt-rowInner { animation-delay: 280ms; }
.dshmcp-instRow:nth-child(n+9), .dshmcp-mkt-row:nth-child(n+9) .dshmcp-mkt-rowInner { animation-delay: 320ms; }
.dshmcp-instRow:nth-child(n+10), .dshmcp-mkt-row:nth-child(n+10) .dshmcp-mkt-rowInner { animation-delay: 360ms; }
.dshmcp-instRow:nth-child(n+11), .dshmcp-mkt-row:nth-child(n+11) .dshmcp-mkt-rowInner { animation-delay: 400ms; }
.dshmcp-instRow:nth-child(n+12), .dshmcp-mkt-row:nth-child(n+12) .dshmcp-mkt-rowInner { animation-delay: 440ms; }
.dshmcp-instRow:nth-child(n+13), .dshmcp-mkt-row:nth-child(n+13) .dshmcp-mkt-rowInner { animation-delay: 480ms; }
.dshmcp-instRow:nth-child(n+14), .dshmcp-mkt-row:nth-child(n+14) .dshmcp-mkt-rowInner { animation-delay: 520ms; }
.dshmcp-instRow:nth-child(n+15), .dshmcp-mkt-row:nth-child(n+15) .dshmcp-mkt-rowInner { animation-delay: 560ms; }

/* ── loading skeleton: grouped rows with a soft opacity pulse ───────────── */
/* --dsh-group-padding (6px), --dsh-group-bg, --dsh-group-border (8%), --dsh-group-radius (12px) */
.dshmcp-skeleton { padding: 6px; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); }
/* --dsh-surface-input (4%), --dsh-radius-md (8px) */
.dshmcp-skelRow { height: 44px; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); animation: dshmcp-pulse 1.6s var(--ds-ease-in-out, ease) infinite; }
/* --dsh-space-md gap (6px) */
.dshmcp-skelRow + .dshmcp-skelRow { margin-top: 6px; }
@keyframes dshmcp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
@media (prefers-reduced-motion: reduce) { .dshmcp-skelRow { animation: none !important; } }

/* ── empty state ────────────────────────────────────────────────────────── */
/* --dsh-space-9xl/7xl padding (32px 16px), --dsh-space-md gap (6px) */
.dshmcp-empty { padding: 36px 16px 32px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
/* --dsh-card-tile-size (40px), --dsh-radius-md (8px), --dsh-surface-icon-base (6%) */
.dshmcp-emptyTile { width: 40px; height: 40px; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; margin-bottom: 6px; font-size: 16px; font-weight: 600; }
/* --dsh-font-size-lg (13px/600) */
.dshmcp-emptyTitle { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); margin: 0; }
/* --dsh-font-size-md (12px) */
.dshmcp-empty p { font-size: 12px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin: 0; line-height: 1.55; }

/* ── installed pane: full-width list ⇄ card dual view ───────────────────── */
/* Compact row: 32px tile / name + transport & tool-count meta / command or
   URL line (flex, ellipsized) / enable switch + 详情/编辑/删除. */
/* --dsh-space-xl gap (10px), min-height 48px, --dsh-space-md+xs padding (5px 6px), --dsh-radius-md (8px) */
.dshmcp-instRow {
  margin: 0; display: flex; align-items: center; gap: 10px;
  min-height: 48px; padding: 5px 6px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  transition: background-color 120ms var(--ds-ease-in-out, ease);
}
/* --dsh-border-row (6%) */
.dshmcp-instRow + .dshmcp-instRow { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
/* --dsh-hover-bg (4%) */
.dshmcp-instRow:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
/* --dsh-card-tile-size (32px), --dsh-radius-md (8px), --dsh-surface-icon-base (6%) */
.dshmcp-instTile {
  flex: none; width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dshmcp-instTile svg { width: 16px; height: 16px; }
.dshmcp-instId { flex: 0 0 clamp(150px, 26%, 230px); min-width: 0; display: flex; flex-direction: column; gap: 1px; }
/* --dsh-font-size-lg (13px/600) */
.dshmcp-instName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-instName.is-muted { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-weight: 500; }
/* --dsh-font-size-sm (11px), --dsh-space-sm gap (5px) */
.dshmcp-instMeta { min-width: 0; display: inline-flex; align-items: center; gap: 5px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-font-size-sm+ (11.5px), mono font */
.dshmcp-instDesc { flex: 1; min-width: 0; font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-secondary, #b3b3b8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-space-md gap (6px) */
.dshmcp-instSide { flex: none; display: inline-flex; align-items: center; gap: 6px; }

/* Card grid: textured cards in one grouped container, auto-fill >=300px. */
/* --dsh-group-padding (6px), --dsh-card-grid-min (300px), --dsh-card-grid-gap (8px),
   --dsh-group-bg, --dsh-group-border (8%), --dsh-group-radius (12px) */
.dshmcp-instCards {
  margin: 0; padding: 0; list-style: none;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;
  background: transparent;
  border: 0;
}
/* --dsh-card-min-height (160px), --dsh-card-gap (13px), --dsh-card-padding (18px),
   --dsh-card-border (8%), --dsh-card-radius (12px), --dsh-card-bg (bg-layer-2)
   Unified card surface: same recipe as usage stat cards and dsh-layout-group. */
.dshmcp-instCard {
  min-width: 0; min-height: 160px; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 13px; padding: 16px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  transition: border-color 120ms var(--ds-ease-in-out, ease), transform 120ms var(--ds-ease-in-out, ease);
}
/* --dsh-card-border-hover (14%) */
.dshmcp-instCard:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
}
/* --dsh-space-2xl gap (12px) */
.dshmcp-instCardHead { display: flex; align-items: flex-start; gap: 12px; }
/* --dsh-card-tile-size (46px), --dsh-radius-md (8px), --dsh-card-tile-bg (hue gradient) */
.dshmcp-instCardTile {
  flex: none; width: 40px; height: 40px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 8%, transparent);
  color: var(--dsw-alias-state-business-primary, #ffb74d);
}
.dshmcp-instCardTile svg { width: 20px; height: 20px; }
/* --dsh-space-sm gap (2px) */
.dshmcp-instCardId { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
/* --dsh-space-lg gap (8px) */
.dshmcp-instCardNameLine { min-width: 0; display: flex; align-items: center; gap: 8px; }
/* --dsh-font-size-xl (14px/600) card name */
.dshmcp-instCard .dshmcp-instName { font-size: 14px; line-height: 19px; }
/* --dsh-font-size-base (12.5px) description */
.dshmcp-instCardDesc {
  margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--dsw-alias-label-secondary, #b3b3b8);
  overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
  overflow-wrap: anywhere;
}
/* --dsh-space-xl (10px) separator, --dsh-border-row (6%), --dsh-space-md gap (6px) */
.dshmcp-instCardFoot {
  margin-top: auto; padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}

/* ── detail modal tool rows (expandable: description + schema) ──────────── */
.dshmcp-detailTools { display: flex; flex-direction: column; }
.dshmcp-detailTools li {
  display: flex; flex-direction: column; min-width: 0;
  border-radius: var(--dsh-layout-radius-user, 8px);
}
/* --dsh-border-row (6%) */
.dshmcp-detailTools li + li { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
/* --dsh-space-lg gap (8px), min-height 40px, --dsh-space-md+lg padding */
.dshmcp-detailToolHead {
  width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 8px;
  min-height: 40px; padding: 6px 8px 6px 10px;
  background: none; border: 0; border-radius: var(--dsh-layout-radius-user, 8px);
  color: inherit; font: inherit; text-align: left; cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease);
}
/* --dsh-hover-bg (4%) */
.dshmcp-detailToolHead:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-detailToolHead:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
/* --dsh-space-xs gap (1px) */
.dshmcp-detailToolMain { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
/* --dsh-font-size-md (12px/600) code name */
.dshmcp-detailToolName { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-font-size-sm (11px) */
.dshmcp-detailToolDesc { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-detailToolChevron { flex: none; display: inline-flex; color: var(--dsw-alias-label-tertiary, #8a8a8e); transition: transform 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-detailToolHead:hover .dshmcp-detailToolChevron { color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshmcp-detailToolHead[aria-expanded=true] .dshmcp-detailToolChevron { transform: rotate(90deg); color: var(--dsw-alias-label-secondary, #b3b3b8); }
/* --dsh-space-sm+lg+2xl padding (2px 8px 10px 26px), --dsh-space-lg gap (8px) */
.dshmcp-detailToolBody { padding: 2px 8px 10px 26px; display: flex; flex-direction: column; gap: 8px; }
/* --dsh-font-size-md (12px) */
.dshmcp-detailToolFull { margin: 0; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary, #b3b3b8); white-space: normal; overflow-wrap: anywhere; }
/* --dsh-font-size-xs+ (11.5px) */
.dshmcp-paramDesc { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11.5px; }

/* ── grouped blocks (detail modal, editor) ──────────────────────────────── */
/* --dsh-space-md gap (6px) */
.dshmcp-block { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
/* --dsh-space-lg gap (8px) */
.dshmcp-blockHead { display: flex; align-items: center; gap: 8px; min-height: 20px; flex-wrap: wrap; }

/* ── grouped field rows (dl in the detail panel) ────────────────────────── */
.dshmcp-fields { display: flex; flex-direction: column; }
/* 108px label column, --dsh-space-sm gap (4px), --dsh-space-2xl gap (12px),
   --dsh-space-md+lg padding */
.dshmcp-fields > div { display: grid; grid-template-columns: 108px minmax(0, 1fr); gap: 4px 12px; align-items: baseline; padding: 7px 8px 7px 10px; border-radius: var(--dsh-layout-radius-user, 8px); }
/* --dsh-border-row (6%) */
.dshmcp-fields > div + div { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
/* --dsh-font-size-sm (11px) */
.dshmcp-fields dt { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 16px; }
/* --dsh-font-size-md (12px), --dsh-space-sm gap (5px) */
.dshmcp-fields dd { overflow-wrap: anywhere; min-width: 0; color: var(--dsw-alias-label-secondary, #b3b3b8); margin: 0; font-size: 12px; line-height: 1.5; display: inline-flex; align-items: center; gap: 5px; }
/* --dsh-font-size-sm (11px), mono font */
.dshmcp-path { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; }

/* ── status dots: 6px, status color; online adds a soft 6px halo ────────── */
/* --dsh-radius-full (999px) */
.dshmcp-statusDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-label-tertiary, #8a8a8e); display: inline-block; }
/* --dsh-state-success-bg/border */
.dshmcp-statusDot[data-phase=active] { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 80%, transparent); box-shadow: 0 0 6px color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); }
.dshmcp-statusDot[data-phase=failed] { background: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-statusDot[data-phase=loading], .dshmcp-statusDot[data-phase=pending] { background: var(--dsw-alias-state-business-primary, #ffb74d); }
.dshmcp-statusDot[data-phase=disabled] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); }
@keyframes dshmcp-breathe { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
.dshmcp-statusDot[data-phase=loading], .dshmcp-statusDot[data-phase=pending] { animation: dshmcp-breathe 1.6s var(--ds-ease-in-out, ease) infinite; }
@media (prefers-reduced-motion: reduce) { .dshmcp-statusDot { animation: none !important; } }

/* ── callouts: flat tint + colored left rule ────────────────────────────── */
/* --dsh-state-business-bg (6%), --dsh-state-business-border (16%), --dsh-radius-md (8px),
   --dsh-space-lg+2xl padding (8px 12px), --dsh-font-size-md (12px) */
.dshmcp-callout { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 16%, transparent); border-left: 3px solid var(--dsw-alias-state-business-primary, #ffb74d); background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 6%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); padding: 8px 12px; font-size: 12px; line-height: 1.55; margin: 0; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-calloutWarn { border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 18%, transparent); border-left-color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 6%, transparent); }
.dshmcp-calloutError { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent); border-left-color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent); }

/* ── editor (panel) ─────────────────────────────────────────────────────── */
/* --dsh-surface-panel bg, --dsh-border-input (10%), --dsh-radius-lg (12px) */
.dshmcp-editor { background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); display: flex; flex-direction: column; overflow: hidden; }
/* --dsh-space-xl gap (10px), --dsh-space-3xl+3xl padding (12px 14px),
   --dsh-border-row (6%) */
.dshmcp-editorHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 14px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
/* --dsh-font-size-xl (14px/600) */
.dshmcp-editorHead h3 { font-size: 14px; font-weight: 600; margin: 0; flex: 1; }
/* --dsh-space-3xl padding (14px), --dsh-space-3xl gap (14px) */
.dshmcp-editorBody { padding: 14px; display: flex; flex-direction: column; gap: 14px; }
/* --dsh-space-xl+3xl padding (10px 14px), --dsh-border-row (6%), --dsh-surface-elevated bg */
.dshmcp-editorFoot { position: sticky; bottom: 0; display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); background: var(--dsw-alias-bg-layer-3, #232327); }

/* ── forms ──────────────────────────────────────────────────────────────── */
/* --dsh-space-2xl gap (12px) */
.dshmcp-form { display: flex; flex-direction: column; gap: 12px; }
/* --dsh-space-md gap (6px) */
.dshmcp-formRow { display: flex; flex-direction: column; gap: 6px; }
/* --dsh-font-size-md (12px/500) label */
.dshmcp-formRow > label { font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-secondary, #b3b3b8); }
/* --dsh-font-size-sm (11px) hint */
.dshmcp-formRow > span { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); line-height: 1.55; }
/* --dsh-input-height (30px), --dsh-border-input (10%), --dsh-surface-input (3%),
   --dsh-font-size-base (12.5px), --dsh-radius-md (8px), --dsh-input-padding-x (10px) */
.dshmcp-input, .dshmcp-select { width: 100%; box-sizing: border-box; height: 30px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12.5px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 10px; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
/* --dsh-input-border-hover (16%) */
.dshmcp-input:hover, .dshmcp-select:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
/* --dsh-input-border-focus (business-primary 55%) */
.dshmcp-input:focus-visible, .dshmcp-select:focus-visible { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
/* --dsh-textarea-min-height (200px), --dsh-textarea-font-size (12px),
   --dsh-textarea-line-height (1.55), --dsh-textarea-padding (10px) */
.dshmcp-textarea { width: 100%; box-sizing: border-box; min-height: 200px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; line-height: 1.55; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 10px; font-family: var(--ds-font-family-code, ui-monospace, monospace); resize: vertical; transition: border-color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-textarea:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-textarea:focus-visible { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
/* --dsh-space-lg gap (8px), --dsh-font-size-base (12.5px) */
.dshmcp-checkRow { display: flex; align-items: center; gap: 8px; font-size: 12.5px; cursor: pointer; }
/* --dsh-space-4xl gap (16px) */
.dshmcp-radioRow { display: flex; gap: 16px; flex-wrap: wrap; }

/* ── segmented control (editor modes) ───────────────────────────────────── */
/* --dsh-seg-track-bg (4%), --dsh-seg-track-border (8%), --dsh-seg-track-radius (8px),
   --dsh-seg-track-padding (3px) */
.dshmcp-seg { display: inline-flex; gap: 2px; padding: 3px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }
/* --dsh-seg-btn-height (26px), --dsh-btn-radius-sm (calc(8px - 3px) = 5px) */
.dshmcp-seg button { height: 26px; padding: 0 12px; border: 0; background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; font-size: 12px; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 3px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-seg button:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
/* --dsh-selected-bg (12%) */
.dshmcp-seg button[aria-pressed=true] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font-weight: 500; }
.dshmcp-seg button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }

/* ── key/value editor panel ─────────────────────────────────────────────── */
/* --dsh-group-bg, --dsh-group-border (8%), --dsh-group-radius (12px), --dsh-space-lg padding (8px) */
.dshmcp-kvList { display: flex; flex-direction: column; gap: 6px; background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 8px; }
/* --dsh-space-md gap (6px), --dsh-btn-height-sm (26px) remove column */
.dshmcp-kvRow { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) 26px; gap: 6px; align-items: center; }
/* --dsh-input-height-sm (28px), --dsh-border-input (10%), --dsh-surface-input (3%),
   --dsh-font-size-md (12px), --dsh-radius-md (8px) */
.dshmcp-kvRow input { width: 100%; box-sizing: border-box; height: 28px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 8px; font-family: var(--ds-font-family-code, ui-monospace, monospace); transition: border-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-kvRow input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-kvRow input:focus-visible { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); }
.dshmcp-kvRow input[disabled] { color: var(--dsw-alias-state-warning-primary, #d97706); background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 6%, transparent); }
/* --dsh-btn-height-sm (26px), --dsh-radius-md (8px) */
.dshmcp-kvRemove { width: 26px; height: 26px; border: 1px solid transparent; background: none; color: var(--dsw-alias-label-tertiary, #8a8a8e); cursor: pointer; border-radius: var(--dsh-layout-radius-user, 8px); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; transition: color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-kvRemove:hover { color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent); }
.dshmcp-kvFoot { padding: 0 2px; }

/* ── tags ───────────────────────────────────────────────────────────────── */
/* --dsh-radius-full (999px), --dsh-font-size-sm (11px/500) */
.dshmcp-tag { height: 20px; padding: 0 8px; white-space: nowrap; border-radius: 999px; align-items: center; display: inline-flex; font-size: 10px; font-weight: 500; line-height: 18px; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
/* --dsh-state-success-bg (8%), --dsh-state-success-border (18%) */
.dshmcp-tagOk { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-tagWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 18%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshmcp-tagError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
/* --dsh-font-size-xs (10.5px/500) */
.dshmcp-tagCode { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 10.5px; font-weight: 500; }

/* ── editor test-result panel ───────────────────────────────────────────── */
/* --dsh-group-bg, --dsh-group-border (8%), --dsh-group-radius (12px),
   --dsh-space-xl+2xl padding (10px 12px), --dsh-space-xl gap (10px) */
.dshmcp-testPanel { background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 10px 12px; display: flex; flex-direction: column; gap: 10px; }
/* --dsh-font-size-sm (11px), --dsh-radius-md (8px) */
.dshmcp-testPanel pre { margin: 0; padding: 8px 10px; overflow: auto; font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; line-height: 1.5; color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 5%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }
/* --dsh-space-xl gap (10px) */
.dshmcp-testHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dshmcp-testIcon { flex: none; display: inline-flex; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-testOk .dshmcp-testIcon { color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-testFail .dshmcp-testIcon { color: var(--dsw-alias-state-error-primary, #ef5350); }
/* --dsh-space-xs gap (1px) */
.dshmcp-testHeadBody { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
/* --dsh-font-size-lg (13px/600) */
.dshmcp-testHeadBody strong { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); }
/* --dsh-font-size-sm (11px) */
.dshmcp-testMeta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── tools area (detail block + editor) ─────────────────────────────────── */
/* --dsh-space-lg gap (8px) */
.dshmcp-toolsArea { display: flex; flex-direction: column; gap: 8px; position: static; }
/* --dsh-space-xl gap (10px) */
.dshmcp-toolsBar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
/* --dsh-font-size-sm (11px), --dsh-space-sm gap (5px) */
.dshmcp-toolsMeta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-variant-numeric: tabular-nums; display: inline-flex; align-items: center; gap: 5px; }
.dshmcp-autoTest { display: inline-flex; align-items: center; gap: 5px; }
/* --dsh-radius-full (999px), --dsh-font-size-sm (11px/500) */
.dshmcp-chipStatus { display: inline-flex; align-items: center; gap: 6px; height: 20px; padding: 0 8px; border-radius: 999px; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dshmcp-chipStatus.is-ok { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-chipStatus.is-fail { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-chipDot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
/* --dsh-space-lg gap (8px), --dsh-btn-height-sm (26px), --dsh-radius-sm (6px) */
.dshmcp-toolSearch { flex: none; display: inline-flex; align-items: center; gap: 8px; position: relative; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-toolSearch > svg { pointer-events: none; position: absolute; left: 9px; z-index: 1; }
.dshmcp-toolSearch input { width: min(200px, 46vw); height: 26px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; border-radius: var(--dsh-layout-radius-user, 8px); outline: none; padding: 0 8px 0 28px; transition: border-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-toolSearch input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-toolSearch input:focus-visible { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 55%, transparent); }
.dshmcp-toolSearch input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
/* --dsh-font-size-sm (11px) */
.dshmcp-toolSearchCount { position: absolute; right: 9px; font-size: 11px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── tool rows (grouped container, hairline separated) ──────────────────── */
/* --dsh-border-row (6%) */
.dshmcp-toolList li + li { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
/* --dsh-space-lg gap (9px), min-height 38px, --dsh-space-sm+lg padding (5px 8px),
   --dsh-radius-md (8px) */
.dshmcp-toolHead { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 9px; min-height: 38px; padding: 5px 8px; background: none; border: 0; border-radius: var(--dsh-layout-radius-user, 8px); color: inherit; font: inherit; text-align: left; cursor: pointer; transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-toolHead:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-toolHead:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
/* --dsh-focus-bg (business-primary 8%) */
.dshmcp-toolHead.is-selected { background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 8%, transparent); }
.dshmcp-toolDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 45%, transparent); }
.dshmcp-toolHead.is-selected .dshmcp-toolDot { background: var(--dsw-alias-state-business-primary, #ffb74d); }
.dshmcp-toolMain { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
/* --dsh-font-size-md (12px/600) */
.dshmcp-toolName { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-font-size-sm (11px) */
.dshmcp-toolDesc { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 15px; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
/* --dsh-font-size-xs (10.5px), --dsh-surface-input (4%), --dsh-group-border (8%) */
.dshmcp-toolParamsHint { flex: none; font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #8a8a8e); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: 999px; padding: 1px 7px; white-space: nowrap; }
.dshmcp-toolChevron { flex: none; display: inline-flex; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshmcp-toolHead:hover .dshmcp-toolChevron { color: var(--dsw-alias-label-secondary, #b3b3b8); }

/* ── tool detail modal ──────────────────────────────────────────────────── */
/* --dsh-modal-width-xl (820px), --dsh-modal-max-height (88dvh),
   --dsh-modal-bg (bg-layer-1), --dsh-modal-border (10%), --dsh-modal-radius (12px),
   --dsh-modal-enter-duration (160ms) */
[role="dialog"].dshmcp-toolModal {
  width: min(820px, 92vw); height: min(760px, 88dvh); max-height: 88dvh; box-sizing: border-box; overflow: hidden;
  background: var(--dsw-alias-bg-layer-1, #1c1c1f);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  animation: dshmcp-modalUp 160ms var(--ds-ease-in-out, ease);
}
.dshmcp-toolModalBody { width: 100%; height: 100%; min-height: 0; max-height: 100%; box-sizing: border-box; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 14px; }
.dshmcp-toolModalBody > :first-child { position: sticky; top: 0; z-index: 2; background: var(--dsw-alias-bg-layer-3, #232327); }
/* --dsh-label-size (11px/500/uppercase/0.05em) */
.dshmcp-toolModalBody h6 { margin: 0 0 6px; font-size: 10px; font-weight: 500; letter-spacing: 0.06em; color: var(--dsw-alias-label-tertiary, #8a8a8e); text-transform: uppercase; }
/* --dsh-font-size-md (12px) */
.dshmcp-toolModalDesc { margin: 0; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary, #b3b3b8); white-space: normal; overflow-wrap: anywhere; }
.dshmcp-schemaSection { min-height: 0; }
/* --dsh-group-border (8%), --dsh-radius-md (8px), --dsh-surface-input (3%) */
.dshmcp-schemaViewport { min-height: 140px; height: clamp(180px, 42dvh, 420px); max-height: 42dvh; box-sizing: border-box; overflow: auto; overscroll-behavior: contain; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent); padding: 6px 8px; scrollbar-gutter: stable; }
.dshmcp-schemaViewport:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
/* --dsh-font-size-md (12px) */
.dshmcp-paramTable { width: 100%; border-collapse: collapse; font-size: 12px; }
/* --dsh-space-sm+lg padding (5px 8px), --dsh-border-row (6%) */
.dshmcp-paramTable td { padding: 5px 8px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); vertical-align: top; }
.dshmcp-paramTable tr:last-child td { border-bottom: 0; }
/* --dsh-font-size-xs+ (11.5px) */
.dshmcp-paramName { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11.5px; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-paramType { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11.5px; }
.dshmcp-paramRequired { color: var(--dsw-alias-state-business-primary, #ffb74d); font-size: 11px; font-weight: 500; }
.dshmcp-paramOptional { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; }

/* ── enable/disable switch ──────────────────────────────────────────────── */
/* --dsh-switch-width (30px), --dsh-switch-height (18px), --dsh-switch-radius (999px),
   --dsh-switch-off-bg (6%), --dsh-switch-off-border (10%) */
.dshmcp-switch { flex: none; width: 30px; height: 18px; padding: 0; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); cursor: pointer; position: relative; transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease); }
/* --dsh-switch-on-bg (45%), --dsh-switch-on-border (55%) */
.dshmcp-switch.is-on { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 45%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 55%, transparent); }
.dshmcp-switch:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: 2px; }
.dshmcp-switch[disabled] { opacity: .5; cursor: default; }
/* --dsh-switch-knob (12px) */
.dshmcp-switchKnob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 999px; background: #fff; transition: transform 120ms var(--ds-ease-in-out, ease); display: block; }
.dshmcp-switch.is-on .dshmcp-switchKnob { transform: translateX(12px); }

/* ── shared modal shell (edit + 详情 dialogs) ───────────────────────────── */
/* --dsh-modal-overlay-bg (rgba(0,0,0,0.45)), --dsh-modal-overlay-blur (blur(6px)),
   --dsh-modal-overlay-padding (24px PC) */
[role="presentation"]:has(> [role="dialog"].dshmcp-modal) { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 24px; }
[role="presentation"]:has(> [role="dialog"].dshmcp-toolModal) { position: fixed; inset: 0; z-index: 10001; display: grid; place-items: center; padding: 24px; }
[role="presentation"]:has(> [role="dialog"].dshmcp-modal) > [aria-hidden="true"],
[role="presentation"]:has(> [role="dialog"].dshmcp-toolModal) > [aria-hidden="true"] { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: dshmcp-modalFade 160ms var(--ds-ease-in-out, ease); }
@keyframes dshmcp-modalFade { from { opacity: 0; } }
/* --dsh-modal-width-md (560px), --dsh-modal-max-height (calc(100dvh - 48px)),
   --dsh-modal-bg (bg-layer-1), --dsh-modal-border (10%), --dsh-modal-radius (12px),
   --dsh-modal-enter-duration (160ms) */
.dshmcp-modal {
  position: relative; box-sizing: border-box; min-width: 0;
  width: min(640px, 100%); max-height: calc(100dvh - 48px);
  display: flex; flex-direction: column;
  background: var(--dsw-alias-bg-layer-1, #1c1c1f);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  overflow: hidden;
  animation: dshmcp-modalUp 160ms var(--ds-ease-in-out, ease);
}
/* --dsh-modal-width-lg (640px) */
.dshmcp-modal.is-lg { width: min(640px, 100%); }
@keyframes dshmcp-modalUp { from { opacity: 0; transform: translateY(10px); } }
@media (prefers-reduced-motion: reduce) { .dshmcp-modal, .dshmcp-toolModal, [role="presentation"]:has(> [role="dialog"].dshmcp-modal) > [aria-hidden="true"], [role="presentation"]:has(> [role="dialog"].dshmcp-toolModal) > [aria-hidden="true"] { animation: none !important; } }
.dshmcp-modalInner { display: flex; flex-direction: column; min-height: 0; max-height: calc(100dvh - 48px); }
/* --dsh-space-xl gap (10px), head padding (12px 14px), --dsh-border-row (6%) */
.dshmcp-modalHead { flex: none; display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
/* --dsh-font-size-xl (14px/600) */
.dshmcp-modalTitle { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; line-height: 19px; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-btn-height-sm (26px), --dsh-radius-md (8px) */
.dshmcp-modalClose { flex: none; width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; padding: 0; border: 1px solid transparent; border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); cursor: pointer; transition: color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-modalClose:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.dshmcp-modalClose:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
/* --dsh-space-3xl padding (14px), --dsh-space-2xl gap (12px) */
.dshmcp-modalBody { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
/* --dsh-space-xl+3xl padding (10px 14px), --dsh-space-lg gap (8px), --dsh-border-row (6%) */
.dshmcp-modalFoot { flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 10px 14px; border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshmcp-modal .dshmcp-modalBody:has(> .dshmcp-editor) { padding: 0; gap: 0; }
.dshmcp-modal .dshmcp-editor { border: 0; border-radius: 0; background: transparent; }
.dshmcp-modal .dshmcp-editorFoot { background: var(--dsw-alias-bg-layer-1, #1c1c1f); }

/* ── scrollbars: one thin recipe over every plugin scroller ─────────────── */
.dshmcp-modalBody,
.dshmcp-toolModalBody,
.dshmcp-schemaViewport,
.dshmcp-testPanel pre,
.dshmcp-textarea {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent) transparent;
}
.dshmcp-modalBody::-webkit-scrollbar,
.dshmcp-toolModalBody::-webkit-scrollbar,
.dshmcp-schemaViewport::-webkit-scrollbar,
.dshmcp-testPanel pre::-webkit-scrollbar,
.dshmcp-textarea::-webkit-scrollbar { width: 8px; height: 8px; }
.dshmcp-modalBody::-webkit-scrollbar-thumb,
.dshmcp-toolModalBody::-webkit-scrollbar-thumb,
.dshmcp-schemaViewport::-webkit-scrollbar-thumb,
.dshmcp-testPanel pre::-webkit-scrollbar-thumb,
.dshmcp-textarea::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent);
  border-radius: 999px;
}
.dshmcp-modalBody::-webkit-scrollbar-thumb:hover,
.dshmcp-toolModalBody::-webkit-scrollbar-thumb:hover,
.dshmcp-schemaViewport::-webkit-scrollbar-thumb:hover,
.dshmcp-testPanel pre::-webkit-scrollbar-thumb:hover,
.dshmcp-textarea::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshmcp-modalBody::-webkit-scrollbar-track,
.dshmcp-toolModalBody::-webkit-scrollbar-track,
.dshmcp-schemaViewport::-webkit-scrollbar-track,
.dshmcp-testPanel pre::-webkit-scrollbar-track,
.dshmcp-textarea::-webkit-scrollbar-track { background: transparent; }
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-modalBody,
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-toolModalBody,
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-schemaViewport,
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-testPanel pre,
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-textarea { scrollbar-width: none; }
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-modalBody::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-toolModalBody::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-schemaViewport::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-testPanel pre::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] .dshmcp-textarea::-webkit-scrollbar { display: none; }

/* ── spinner ────────────────────────────────────────────────────────────── */
.dshmcp-spin { animation: dshmcp-rotate 1s linear infinite; }
@keyframes dshmcp-rotate { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .dshmcp-spin { animation: none !important; } }


/* ─── Marketplace shelf (vendored) ───
   Styles for the toolbar / row list rendered by market/MarketShelf.tsx.
   Vendored from the shared Quiet Structure recipe — owned HERE since
   the launcher stopped shipping market styles; dsh-skill-manager
   carries its own dshm-mkt-* copy. */
/* --dsh-space-xl gap (10px) */
.dshmcp-mkt { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

/* toolbar: segmented sources + search + icon buttons */
/* --dsh-space-lg gap (8px) */
.dshmcp-mkt-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
/* --dsh-seg-track-bg (4%), --dsh-seg-track-border (8%), --dsh-seg-track-radius (8px),
   --dsh-seg-track-padding (3px), --dsh-card-grid-min (420px max-width) */
.dshmcp-mkt-seg {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  max-width: 420px;
  min-width: 0;
  gap: 2px;
  padding: 3px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  overflow-x: auto;
  scrollbar-width: none;
}
/* --dsh-btn-height-sm (26px), --dsh-radius-full (999px), --dsh-btn-font-size (12px) */
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
.dshmcp-mkt-segItem:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-mkt-segItem:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
/* --dsh-selected-bg (12%) */
.dshmcp-mkt-segItem.is-active { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font-weight: 500; }
.dshmcp-mkt-segName { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.dshmcp-mkt-segDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-mkt-segItem.is-down .dshmcp-mkt-segDot { background: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-mkt-segItem.is-invalid .dshmcp-mkt-segDot { background: var(--dsw-alias-state-business-primary, #ffb74d); }

/* search: --dsh-input-height-search (34px), --dsh-border-input (10%),
   --dsh-radius-md (8px), --dsh-surface-input (3%), --dsh-btn-font-size (12.5px) */
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

/* icon buttons: --dsh-btn-height-icon (28px), --dsh-border-input (10%),
   --dsh-radius-md (8px) */
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
/* --dsh-hover-bg-strong (5%), --dsh-border-card-hover (16%) */
.dshmcp-mkt-iconbtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-mkt-iconbtn:active { transform: scale(0.97); }
.dshmcp-mkt-iconbtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-mkt-iconbtn[disabled] { opacity: .5; cursor: default; }
/* --dsh-active-bg-strong (8%) */
.dshmcp-mkt-iconbtn.is-active { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dshmcp-mkt-iconbtn svg { width: 14px; height: 14px; }
.dshmcp-mkt-iconbtn.is-spin svg { animation: dshmcp-mkt-spin 1.2s linear infinite; transform-box: fill-box; transform-origin: center; }
@media (prefers-reduced-motion: reduce) { .dshmcp-mkt-iconbtn.is-spin svg { animation: none !important; } }

/* add-source: --dsh-group-bg (6%), --dsh-group-border (8%), --dsh-group-radius (12px),
   --dsh-space-lg padding (8px) */
.dshmcp-mkt-addrow {
  display: flex; gap: 8px; flex-wrap: wrap;
  padding: 8px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
/* --dsh-input-height (30px), --dsh-border-input (10%), --dsh-surface-input (3%),
   --dsh-font-size-base (12.5px), --dsh-radius-md (8px) */
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
/* --dsh-btn-height-sm (26px), --dsh-btn-padding-x (10px),
   --dsh-primary-bg (9%), --dsh-border-active (24%), --dsh-primary-highlight (8%) */
.dshmcp-mkt-addbtn {
  flex: none;
  height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease);
}
/* --dsh-primary-bg-hover (13%), --dsh-border-primary-hover (28%) */
.dshmcp-mkt-addbtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshmcp-mkt-addbtn:active { transform: scale(0.97); }
.dshmcp-mkt-addbtn[disabled] { opacity: .5; cursor: default; }
/* quiet: transparent, --dsh-border-input (10%) */
.dshmcp-mkt-addbtn.is-quiet { background: transparent; border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshmcp-mkt-addbtn.is-quiet:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
/* --dsh-font-size-sm (11px) */
.dshmcp-mkt-addhint { flex: 1 1 100%; font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* the list: one grouped container of compact rows */
.dshmcp-mkt-row { margin: 0; }
/* --dsh-border-row (6%) */
.dshmcp-mkt-row + .dshmcp-mkt-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
/* --dsh-space-xl gap (10px), min-height 48px, --dsh-space-sm+md padding,
   --dsh-radius-md (8px) */
.dshmcp-mkt-rowInner {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 5px 6px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  transition: background-color 120ms var(--ds-ease-in-out, ease);
}
/* --dsh-hover-bg (4%) */
.dshmcp-mkt-rowInner:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
/* --dsh-card-tile-size (32px), --dsh-radius-md (8px), --dsh-surface-icon-base (6%) */
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
/* --dsh-font-size-lg (13px/600) */
.dshmcp-mkt-rowName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-font-size-sm (11px) */
.dshmcp-mkt-rowMeta { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-font-size-md (12px) */
.dshmcp-mkt-rowDesc { flex: 1; min-width: 0; font-size: 12px; line-height: 16px; color: var(--dsw-alias-label-secondary, #b3b3b8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-space-md gap (6px) */
.dshmcp-mkt-rowSide { flex: none; display: inline-flex; align-items: center; gap: 6px; }
/* installed badge: --dsh-state-success-bg (8%), --dsh-state-success-border (18%),
   --dsh-radius-full (999px), --dsh-font-size-sm (11px/500) */
.dshmcp-mkt-installed {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 8%, transparent);
  color: var(--dsw-alias-state-success-primary, #4caf50);
}
.dshmcp-mkt-installedDot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
/* install button: --dsh-btn-height-sm (26px), --dsh-primary-bg (9%),
   --dsh-border-active (24%), --dsh-primary-highlight (8%) */
.dshmcp-mkt-install {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease);
}
/* --dsh-primary-bg-hover (13%), --dsh-border-primary-hover (28%) */
.dshmcp-mkt-install:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent); }
.dshmcp-mkt-install:active { transform: scale(0.97); }
.dshmcp-mkt-install:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-mkt-install[disabled] { opacity: .55; cursor: default; }
/* remove: --dsh-btn-height-sm (26px), --dsh-border-input (10%) */
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
/* danger hover: error bg 6%, error border 24% */
.dshmcp-mkt-remove:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-mkt-remove:active { transform: scale(0.97); }
.dshmcp-mkt-remove:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-mkt-remove[disabled] { opacity: .55; cursor: default; }

/* ── quiet 详情 action on market rows / cards ───────────────────────────── */
/* --dsh-btn-height-sm (26px), --dsh-border-input (10%), --dsh-radius-md (8px) */
.dshmcp-mkt-detail {
  flex: none;
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
/* --dsh-hover-bg-strong (5%), --dsh-border-card-hover (16%) */
.dshmcp-mkt-detail:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-mkt-detail:active { transform: scale(0.97); }
.dshmcp-mkt-detail:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }

/* --dsh-space-9xl padding (32px 16px), --dsh-group-bg, --dsh-group-border (8%),
   --dsh-group-radius (12px) */
.dshmcp-mkt-empty {
  text-align: center;
  padding: 40px 16px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font-size: 12px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
/* --dsh-state-error-bg (6%), --dsh-state-error-border (18%), --dsh-radius-md (8px) */
.dshmcp-mkt-error {
  color: var(--dsw-alias-state-error-primary, #ef5350);
  font-size: 12px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
}

/* ── dual-mode section shell ────────────────────────────────────────────── */
/* --dsh-space-2xl gap (12px) */
.dshmcp-section { width: 100%; display: flex; flex-direction: column; gap: 12px; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-modeSeg { align-self: flex-start; }

/* ── market view toggle ─────────────────────────────────────────────────── */
/* --dsh-seg-track-bg (4%), --dsh-seg-track-border (8%), --dsh-seg-track-radius (8px),
   --dsh-seg-track-padding (3px) */
.dshmcp-mkt-viewseg {
  flex: none;
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
}
/* --dsh-btn-height-icon-sm (26px), --dsh-radius-full (999px) */
.dshmcp-mkt-viewseg button {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font: inherit;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-mkt-viewseg button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-mkt-viewseg button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-mkt-viewseg button[aria-pressed=true] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-mkt-viewseg svg { width: 14px; height: 14px; }

/* ── source manage panel ────────────────────────────────────────────────── */
/* --dsh-group-bg, --dsh-group-border (8%), --dsh-group-radius (12px),
   --dsh-space-lg+md padding (8px 6px 6px) */
.dshmcp-mkt-manage {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 6px 6px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
/* --dsh-label-size (11px/500/uppercase/0.05em) */
.dshmcp-mkt-manageLabel { font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #8a8a8e); padding: 0 8px; }
.dshmcp-mkt-srcList { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; }
/* --dsh-space-xl gap (10px), min-height 46px, --dsh-space-md+lg padding (6px 8px),
   --dsh-radius-md (8px) */
.dshmcp-mkt-srcRow { display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 6px 8px; border-radius: var(--dsh-layout-radius-user, 8px); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshmcp-mkt-srcRow:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-mkt-srcDot { flex: none; width: 6px; height: 6px; border-radius: 999px; background: var(--dsw-alias-state-success-primary, #4caf50); }
.dshmcp-mkt-srcDot.is-down { background: var(--dsw-alias-state-error-primary, #ef5350); }
.dshmcp-mkt-srcDot.is-invalid { background: var(--dsw-alias-state-business-primary, #ffb74d); }
.dshmcp-mkt-srcMain { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.dshmcp-mkt-srcNameLine { min-width: 0; display: flex; align-items: center; gap: 6px; }
/* --dsh-font-size-lg (13px/600) */
.dshmcp-mkt-srcName { font-size: 13px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-font-size-sm (11px), mono font */
.dshmcp-mkt-srcUrl { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-font-size-sm (11px) */
.dshmcp-mkt-srcErr { font-size: 11px; line-height: 15px; color: var(--dsw-alias-state-error-primary, #ef5350); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-mkt-srcActions { flex: none; display: inline-flex; align-items: center; gap: 4px; }
/* --dsh-btn-height-icon-sm (26px), --dsh-radius-md (8px) */
.dshmcp-mkt-srcBtn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font: inherit;
  cursor: pointer;
  transition: color 120ms var(--ds-ease-in-out, ease), background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease);
}
/* --dsh-hover-bg-strong (5%), --dsh-border-input (10%) */
.dshmcp-mkt-srcBtn:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); }
.dshmcp-mkt-srcBtn:active { transform: scale(0.97); }
.dshmcp-mkt-srcBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }
.dshmcp-mkt-srcBtn[disabled] { opacity: .45; cursor: default; }
.dshmcp-mkt-srcBtn.is-danger:hover { color: var(--dsw-alias-state-error-primary, #ef5350); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent); }
.dshmcp-mkt-srcEdit { flex: 1; min-width: 0; display: flex; gap: 8px; flex-wrap: wrap; }
/* --dsh-input-height-sm (28px), --dsh-border-input (10%), --dsh-surface-input (3%),
   --dsh-font-size-base (12.5px), --dsh-radius-md (8px) */
.dshmcp-mkt-srcEdit input {
  flex: 1 1 160px;
  min-width: 0;
  height: 28px;
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
.dshmcp-mkt-srcEdit input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshmcp-mkt-srcEdit input:focus { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dshmcp-mkt-srcEdit input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── updatable badge: business tint ─────────────────────────────────────── */
/* --dsh-state-business-bg (9%), --dsh-state-business-border (20%),
   --dsh-radius-full (999px), --dsh-font-size-sm (11px/500) */
.dshmcp-mkt-updatable {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: default;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 20%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 9%, transparent);
  color: var(--dsw-alias-state-business-primary, #ffb74d);
}

/* ── card grid: textured cards in one grouped container, >=300px ────────── */
/* --dsh-group-padding (6px), --dsh-card-grid-min (300px), --dsh-card-grid-gap (8px),
   --dsh-group-bg, --dsh-group-border (8%), --dsh-group-radius (12px) */
.dshmcp-mkt-cards {
  margin: 0;
  padding: 6px;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 8px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.dshmcp-mkt-cardWrap { margin: 0; min-width: 0; display: flex; }
/* --dsh-card-min-height (160px), --dsh-card-gap (13px), --dsh-card-padding (18px),
   --dsh-card-border (6%), --dsh-card-radius (8px), --dsh-card-bg (gradient 5%->2%),
   --dsh-card-shadow */
.dshmcp-mkt-card {
  flex: 1;
  min-width: 0;
  min-height: 160px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  transition: border-color 120ms var(--ds-ease-in-out, ease), transform 120ms var(--ds-ease-in-out, ease);
}
/* --dsh-card-border-hover (14%) */
.dshmcp-mkt-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
}
/* --dsh-space-2xl gap (12px) */
.dshmcp-mkt-cardHead { display: flex; align-items: center; gap: 12px; }
/* --dsh-card-tile-size (46px), --dsh-radius-md (8px), --dsh-card-tile-bg (hue gradient) */
.dshmcp-mkt-cardTile {
  flex: none;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 8%, transparent);
  color: var(--dsw-alias-state-business-primary, #ffb74d);
}
.dshmcp-mkt-cardTile svg { width: 20px; height: 20px; }
.dshmcp-mkt-cardId { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dshmcp-mkt-cardNameLine { min-width: 0; display: flex; align-items: center; gap: 8px; }
/* --dsh-font-size-xl (14px/600) card name */
.dshmcp-mkt-cardName { flex: 0 1 auto; min-width: 0; font-size: 14px; font-weight: 600; line-height: 19px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshmcp-mkt-cardNameBtn { background: none; border: 0; padding: 0; font: inherit; text-align: left; cursor: pointer; color: inherit; }
.dshmcp-mkt-cardNameBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: 2px; border-radius: var(--dsh-layout-radius-user, 8px); }
/* --dsh-font-size-sm (11px) */
.dshmcp-mkt-cardMeta { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --dsh-font-size-xs (10.5px/500), --dsh-radius-full (999px) */
.dshmcp-mkt-ver {
  flex: none;
  height: 18px;
  padding: 0 7px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font-family: var(--ds-font-family-code, ui-monospace, monospace);
  font-size: 10px;
  font-weight: 500;
  line-height: 16px;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
/* --dsh-font-size-base (12.5px) */
.dshmcp-mkt-cardDesc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
/* --dsh-space-sm gap (4px) */
.dshmcp-mkt-tags { display: flex; flex-wrap: wrap; gap: 4px; }
/* --dsh-space-xl (10px) separator, --dsh-border-row (6%), --dsh-space-md gap (6px) */
.dshmcp-mkt-cardFoot {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dshmcp-mkt-cardFoot .dshmcp-mkt-install { flex: 1 1 auto; justify-content: center; }
.dshmcp-mkt-footSpacer { flex: 1; }

@keyframes dshmcp-mkt-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

/* ── progressive reveal tail ───────────────────────────────────────────── */
.dshmcp-more { display: flex; justify-content: center; padding: 10px 0 2px; }
/* --dsh-radius-full (999px), --dsh-surface-input (4%), --dsh-border-input (10%) */
.dshmcp-moreBtn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 5px 14px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font: inherit;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 120ms var(--ds-ease-in-out, ease), border-color 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dshmcp-moreBtn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshmcp-moreBtn:active { transform: scale(0.97); }
.dshmcp-moreBtn:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #ffb74d); outline-offset: -2px; }

/* ── material linkage (dsh-layout frosted glass) ────────────────────────── */
/* groups 34%, panels 46%, modal 88%, borders 45-55% */
html[data-dsh-layout-material='on'] .dshmcp-list,
html[data-dsh-layout-material='on'] .dshmcp-fields,
html[data-dsh-layout-material='on'] .dshmcp-toolList,
html[data-dsh-layout-material='on'] .dshmcp-detailTools,
html[data-dsh-layout-material='on'] .dshmcp-kvList,
html[data-dsh-layout-material='on'] .dshmcp-instCards,
html[data-dsh-layout-material='on'] .dshmcp-mkt-list,
html[data-dsh-layout-material='on'] .dshmcp-mkt-cards,
html[data-dsh-layout-material='on'] .dshmcp-mkt-manage,
html[data-dsh-layout-material='on'] .dshmcp-mkt-addrow,
html[data-dsh-layout-material='on'] .dshmcp-mkt-seg,
html[data-dsh-layout-material='on'] .dshmcp-mkt-empty {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}
/* individual cards were missing from the bridge — they stayed flat
   bg-layer-2 while the skill cards frosted. Same 34% pour + native blur. */
html[data-dsh-layout-material='on'] .dshmcp-instCard,
html[data-dsh-layout-material='on'] .dshmcp-mkt-card {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}
/* Accessibility fallback: frosted surfaces fall back to the solid base. */
@media (prefers-reduced-transparency: reduce) {
  html[data-dsh-layout-material='on'] .dshmcp-list,
  html[data-dsh-layout-material='on'] .dshmcp-instCards,
  html[data-dsh-layout-material='on'] .dshmcp-instCard,
  html[data-dsh-layout-material='on'] .dshmcp-mkt-card,
  html[data-dsh-layout-material='on'] .dshmcp-mkt-list,
  html[data-dsh-layout-material='on'] .dshmcp-mkt-cards,
  html[data-dsh-layout-material='on'] .dshmcp-toolList {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    background: var(--dsh-layout-mat-solid, var(--dsh-layout-glass-base, #16161a)) !important;
  }
}
html[data-dsh-layout-material='on'] [role="dialog"].dshmcp-modal,
html[data-dsh-layout-material='on'] [role="dialog"].dshmcp-toolModal {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 88%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dshmcp-editor,
html[data-dsh-layout-material='on'] .dshmcp-testPanel {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dshmcp-editorFoot { background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 88%, transparent); border-top-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent); }
html[data-dsh-layout-material='on'] .dshmcp-modalFoot { border-top-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 50%, transparent); }
html[data-dsh-layout-material='on'] .dshmcp-toolModalBody > :first-child { background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 88%, transparent); }

/* ── motion safety ──────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .dshmcp-instRow,
  .dshmcp-instCard,
  .dshmcp-button,
  .dshmcp-failure button,
  .dshmcp-detailToolHead,
  .dshmcp-detailToolChevron,
  .dshmcp-mkt-rowInner,
  .dshmcp-mkt-segItem,
  .dshmcp-mkt-iconbtn,
  .dshmcp-mkt-addbtn,
  .dshmcp-mkt-install,
  .dshmcp-mkt-remove,
  .dshmcp-mkt-detail,
  .dshmcp-mkt-srcRow,
  .dshmcp-mkt-srcBtn,
  .dshmcp-mkt-viewseg button,
  .dshmcp-mkt-card,
  .dshmcp-moreBtn,
  .dshmcp-switch,
  .dshmcp-switchKnob { transition: none !important; }
  .dshmcp-instRow, .dshmcp-mkt-rowInner { animation: none !important; }
}

/* ── narrow viewports (phones, <=767px) ─────────────────────────────────── */
/* --dsh-breakpoint-h5: max-width: 767px */
@media (max-width: 767px) {
  /* market toolbar: sources strip full-width, search full-width */
  .dshmcp-mkt-seg { max-width: none; width: 100%; }
  .dshmcp-mkt-search { flex-basis: 100%; min-width: 0; }
  .dshmcp-mkt-bar .dshmcp-mkt-viewseg { margin-left: auto; }

  /* compact rows: hide description column */
  .dshmcp-mkt-rowDesc { display: none; }
  .dshmcp-mkt-rowId { flex-basis: auto; flex: 1; }
  .dshmcp-instDesc { display: none; }
  .dshmcp-instId { flex-basis: auto; flex: 1; }

  /* card grids: single column on H5 */
  .dshmcp-mkt-cards { grid-template-columns: 1fr; gap: 10px; }
  .dshmcp-instCards { grid-template-columns: 1fr; gap: 10px; }
  /* --dsh-card-padding H5 (12px), --dsh-card-gap H5 (10px) */
  .dshmcp-instCard, .dshmcp-mkt-card { padding: 12px; gap: 10px; }

  /* breathing room on phones */
  .dshmcp-mkt-bar { gap: 10px; }
  .dshmcp-mkt-bar > * { min-height: 36px; }
  /* --dsh-btn-height H5 (36px) */
  .dshmcp-mkt-viewseg { min-height: 36px; flex-wrap: wrap; }
  .dshmcp-mkt-iconbtn, .dshmcp-iconBtn { width: 36px; height: 36px; }
  /* --dsh-group-padding H5 (8px) */
  .dshmcp-mkt-list, .dshmcp-instList { padding: 8px; }
  .dshmcp-mkt-cards, .dshmcp-instCards { padding: 8px; }

  .dshmcp-mkt-cardDesc { overflow-wrap: anywhere; }

  /* long unbreakable content wraps inside its box */
  .dshmcp-fields dt,
  .dshmcp-paramName,
  .dshmcp-paramType,
  .dshmcp-paramDesc,
  .dshmcp-callout,
  .dshmcp-status,
  .dshmcp-failure p,
  .dshmcp-mkt-error,
  .dshmcp-testMeta { overflow-wrap: anywhere; }
  .dshmcp-testPanel pre { max-width: 100%; }

  /* dialogs: --dsh-modal-overlay-padding H5 (12px), --dsh-modal-max-height H5 (calc(100dvh - 24px)) */
  [role="presentation"]:has(> [role="dialog"].dshmcp-modal),
  [role="presentation"]:has(> [role="dialog"].dshmcp-toolModal) { padding: 12px; }
  [role="dialog"].dshmcp-toolModal { width: 100%; }
  .dshmcp-modal { max-height: calc(100dvh - 24px); }
  .dshmcp-modalInner { max-height: calc(100dvh - 24px); }
  .dshmcp-modalFoot, .dshmcp-editorFoot { flex-wrap: wrap; }

  /* expanded tool rows: shallower indent */
  .dshmcp-detailToolBody { padding: 2px 8px 10px 12px; }
}

/* --dsh-breakpoint-tiny: max-width: 480px */
@media (max-width: 480px) {
  .dshmcp-mkt-rowSide { flex-direction: column; align-items: flex-end; gap: 4px; }
  .dshmcp-instSide { flex-direction: column; align-items: flex-end; gap: 4px; }
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
