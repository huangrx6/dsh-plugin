const STYLE_ID = 'dsh-skill-manager-styles'

/**
 * Frosted Modern — shared design language across the dsh-* plugins:
 *   - surfaces are layered light, never flat: a two-stop vertical gradient
 *     (label-primary 7% -> 3%) plus an inset top "catch light" hairline
 *     reads as frosted glass on the dark workspace canvas
 *   - every color rides a --dsw-alias-* token with a dark hex fallback;
 *     borders are hairlines mixed from label-primary, so both themes stay
 *     native without extra branches
 *   - radii bridge to the user's dsh-layout corner radii (small parts on
 *     --dsh-layout-radius-user, large surfaces on -user-lg), keeping the
 *     current px as the fallback
 *   - interaction grammar: cards lift (-1px) into a soft shadow, buttons
 *     press down via scale(0.98), status dots carry a tiny glow
 *   - the dsh-layout material (data-dsh-layout-material='on') swaps the
 *     main surfaces to translucent glass tints at the end of the sheet
 *   - motion stays polite: 150ms ease-in-out, and every displacement
 *     drops out under prefers-reduced-motion
 */
const CSS = `
/* ── shell ──────────────────────────────────────────────────────────────── */
.dshm-tab { width: 100%; max-width: 760px; display: flex; flex-direction: column; gap: 14px; color: var(--dsw-alias-label-primary, #f4f4f5); }
/* 独立分区头：设置页左侧菜单已有同名入口，这里补齐标题与一句话说明。 */
.dshm-head { display: flex; flex-direction: column; gap: 4px; }
.dshm-head h2 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
.dshm-head p { margin: 0; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12px; line-height: 1.5; }

/* ── toolbar: search + icon refresh in one row ─────────────────────────── */
.dshm-toolbar { display: flex; align-items: center; gap: 8px; }
.dshm-search { flex: 1; min-width: 0; display: flex; align-items: center; position: relative; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-search > svg { pointer-events: none; position: absolute; left: 11px; z-index: 1; }
.dshm-search input { width: 100%; height: 34px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 13px; border-radius: var(--dsh-layout-radius-user, 9px); outline: none; padding: 0 30px 0 34px; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); transition: border-color 150ms var(--ds-ease-in-out, ease), box-shadow 150ms var(--ds-ease-in-out, ease); }
.dshm-search input[type=search]::-webkit-search-cancel-button { -webkit-appearance: none; }
.dshm-search input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-search input:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-search input:focus-visible { border-color: var(--dsw-alias-state-business-primary, #6ea8fe); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent), 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 16%, transparent); }

/* ── heading row: title + count + primary action ───────────────────────── */
.dshm-heading { display: flex; align-items: center; gap: 8px; min-height: 32px; }
.dshm-heading h3 { font-size: 14px; font-weight: 600; letter-spacing: .01em; line-height: 20px; margin: 0; }
.dshm-count { min-width: 20px; height: 20px; padding: 0 7px; border-radius: 999px; background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; line-height: 18px; display: inline-flex; align-items: center; justify-content: center; }
.dshm-spacer { flex: 1; }

/* ── buttons ────────────────────────────────────────────────────────────── */
.dshm-button { height: 32px; padding: 0 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 13px; border-radius: var(--dsh-layout-radius-user, 9px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); transition: background-color 150ms var(--ds-ease-in-out, ease), border-color 150ms var(--ds-ease-in-out, ease), box-shadow 150ms var(--ds-ease-in-out, ease), transform 150ms var(--ds-ease-in-out, ease); }
.dshm-button:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 22%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent), 0 4px 12px rgba(0, 0, 0, 0.2); }
.dshm-button:active { transform: scale(0.98); background: var(--dsw-alias-interactive-bg-active, rgba(255, 255, 255, 0.1)); }
.dshm-button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-button[disabled] { opacity: .5; cursor: default; transform: none; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dshm-buttonIcon { width: 34px; height: 34px; padding: 0; justify-content: center; }
.dshm-buttonPrimary { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent)); color: var(--dsw-alias-label-primary, #f4f4f5); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 32%, transparent), 0 2px 10px rgba(0, 0, 0, 0.22); }
.dshm-buttonPrimary:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 48%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 34%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 22%, transparent)); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 36%, transparent), 0 4px 14px rgba(0, 0, 0, 0.26); }
.dshm-buttonPrimary:active { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 15%, transparent)); }
.dshm-buttonDanger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 34%, transparent); }
.dshm-buttonDanger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 52%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent), 0 4px 12px rgba(0, 0, 0, 0.2); }

/* ── status text / failure ──────────────────────────────────────────────── */
.dshm-status { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12.5px; line-height: 19px; margin: 0; }
.dshm-failure { color: var(--dsw-alias-state-error-primary, #ef5350); font-size: 12.5px; line-height: 19px; display: flex; align-items: center; gap: 10px; }
.dshm-failure p { margin: 0; }
.dshm-failure button { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 32%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; cursor: pointer; background: none; border-radius: var(--dsh-layout-radius-user, 8px); padding: 4px 10px; transition: background-color 150ms var(--ds-ease-in-out, ease), border-color 150ms var(--ds-ease-in-out, ease); }
.dshm-failure button:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 48%, transparent); }

/* ── loading skeletons ──────────────────────────────────────────────────── */
@keyframes dshm-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.dshm-skeleton { display: flex; flex-direction: column; gap: 8px; }
.dshm-skelRow { height: 60px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); background: linear-gradient(100deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent) 40%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent) 50%, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent) 60%); background-size: 200% 100%; animation: dshm-shimmer 1.4s linear infinite; }
@media (prefers-reduced-motion: reduce) { .dshm-skelRow { animation: none; } }

/* ── empty state ────────────────────────────────────────────────────────── */
.dshm-empty { padding: 40px 16px 32px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.dshm-emptyTile { width: 52px; height: 52px; border-radius: var(--dsh-layout-radius-user, 16px); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 11%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; margin-bottom: 8px; }
.dshm-emptyTitle { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); margin: 0; }
.dshm-empty p { font-size: 12px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin: 0; line-height: 19px; }

/* ── cards ──────────────────────────────────────────────────────────────── */
.dshm-cards { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin: 0; padding: 0; list-style: none; }
.dshm-card { border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); min-width: 0; overflow: hidden; transition: border-color 150ms var(--ds-ease-in-out, ease), box-shadow 150ms var(--ds-ease-in-out, ease), transform 150ms var(--ds-ease-in-out, ease); }
.dshm-card:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); transform: translateY(-1px); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent), 0 8px 24px rgba(0, 0, 0, 0.28); }
.dshm-cardContent { box-sizing: border-box; width: 100%; min-width: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; background: none; border: 0; display: flex; align-items: center; gap: 12px; padding: 11px 12px; }
.dshm-cardContent:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }
.dshm-tile { width: 38px; height: 38px; flex: none; border-radius: var(--dsh-layout-radius-user, 11px); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 14%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 7%, transparent)); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 22%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-state-business-primary, #6ea8fe); display: grid; place-items: center; }
.dshm-tileWarn { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 15%, transparent), color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 8%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 26%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-tileError { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 14%, transparent), color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 7%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-tileMuted { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-cardBody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dshm-cardTitle { font-size: 14px; font-weight: 600; letter-spacing: -.005em; line-height: 19px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-cardDesc { color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 12px; line-height: 19px; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.dshm-cardTrailing { flex: none; display: inline-flex; align-items: center; gap: 6px; }

/* ── tags ───────────────────────────────────────────────────────────────── */
.dshm-tag { height: 22px; padding: 0 8px; white-space: nowrap; border-radius: 999px; align-items: center; display: inline-flex; font-size: 11px; font-weight: 500; line-height: 20px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-tagOk { background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-tagWarn { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 12%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 20%, transparent); color: var(--dsw-alias-state-warning-primary, #d97706); }
.dshm-tagError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 18%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-tagCode { font-family: var(--ds-font-family-code); font-size: 10.5px; font-weight: 500; }
.dshm-statusDot { width: 8px; height: 8px; border-radius: 999px; background: var(--dsw-alias-label-tertiary, #8a8a8e); display: inline-block; flex: none; }
.dshm-statusDot[data-phase=active] { background: var(--dsw-alias-state-success-primary, #4caf50); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent), 0 0 8px var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-statusDot[data-phase=failed] { background: var(--dsw-alias-state-error-primary, #ef5350); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 16%, transparent), 0 0 8px var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-statusDot[data-phase=loading], .dshm-statusDot[data-phase=pending] { background: var(--dsw-alias-state-business-primary, #6ea8fe); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 16%, transparent), 0 0 8px var(--dsw-alias-state-business-primary, #6ea8fe); }
@keyframes dshm-breathe { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
.dshm-statusDot[data-phase=loading], .dshm-statusDot[data-phase=pending] { animation: dshm-breathe 1.6s var(--ds-ease-in-out, ease) infinite; }
@media (prefers-reduced-motion: reduce) { .dshm-statusDot { animation: none !important; } }

/* ── detail page ────────────────────────────────────────────────────────── */
.dshm-detailHead { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.dshm-heroTile { width: 44px; height: 44px; border-radius: var(--dsh-layout-radius-user, 13px); }
.dshm-hero { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; flex-wrap: wrap; }
.dshm-heroBody { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.dshm-heroName { font-size: 17px; font-weight: 650; letter-spacing: -.01em; line-height: 22px; margin: 0; overflow-wrap: anywhere; }
.dshm-heroTags { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.dshm-detailCard { border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 13px 15px; display: flex; flex-direction: column; gap: 10px; }
.dshm-detailCard > h4 { font-size: 11px; font-weight: 600; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin: 0; line-height: 16px; text-transform: uppercase; letter-spacing: .06em; }
.dshm-desc { font-size: 12.5px; line-height: 1.55; margin: 0; overflow-wrap: anywhere; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-callout { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 18%, transparent); border-left: 3px solid var(--dsw-alias-state-business-primary, #6ea8fe); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 8%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 4%, transparent)); border-radius: var(--dsh-layout-radius-user, 8px); padding: 9px 12px; font-size: 12.5px; line-height: 1.55; margin: 0; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-calloutWarn { border-color: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 22%, transparent); border-left-color: var(--dsw-alias-state-warning-primary, #d97706); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 9%, transparent), color-mix(in srgb, var(--dsw-alias-state-warning-primary, #d97706) 4%, transparent)); }
.dshm-calloutError { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 22%, transparent); border-left-color: var(--dsw-alias-state-error-primary, #ef5350); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 9%, transparent), color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 4%, transparent)); }
.dshm-details { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 7px 12px; margin: 0; }
.dshm-details div { display: contents; }
.dshm-details dt { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11.5px; line-height: 18px; padding-top: 1px; }
.dshm-details dd { overflow-wrap: anywhere; min-width: 0; color: var(--dsw-alias-label-secondary, #b3b3b8); margin: 0; font-size: 12px; line-height: 1.55; }
.dshm-path { font-family: var(--ds-font-family-code); font-size: 11.5px; }
.dshm-filePanel { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 10px); padding: 6px; }
.dshm-treeScroll { max-height: 340px; overflow: auto; border-radius: var(--dsh-layout-radius-user, 8px); }
.dshm-treeScroll .rct-tree-root { padding: 0; margin: 0; font: inherit; color: var(--dsw-alias-label-primary, #f4f4f5); outline: none; }
.dshm-treeScroll .rct-tree-root:focus-visible { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 35%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); }
.dshm-treeScroll .rct-tree-items-container { list-style: none; margin: 0; padding: 0; }
.dshm-treeItem { margin: 0; }
.dshm-treeRow { display: flex; align-items: center; gap: 5px; height: 27px; padding-right: 8px; border-radius: var(--dsh-layout-radius-user, 7px); color: var(--dsw-alias-label-secondary, #b3b3b8); transition: background-color 120ms var(--ds-ease-in-out, ease); }
.dshm-treeRow-folder { color: var(--dsw-alias-label-primary, #f4f4f5); }
.dshm-treeRow:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.dshm-treeRow.is-selected { background: linear-gradient(90deg, color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 14%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 5%, transparent)); }
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

/* ── forms ──────────────────────────────────────────────────────────────── */
.dshm-form { display: flex; flex-direction: column; gap: 14px; }
.dshm-formRow { display: flex; flex-direction: column; gap: 6px; }
.dshm-formRow > label { font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-formRow > span { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); line-height: 17px; }
.dshm-input, .dshm-select { width: 100%; box-sizing: border-box; height: 34px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 13px; border-radius: var(--dsh-layout-radius-user, 9px); outline: none; padding: 0 10px; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); transition: border-color 150ms var(--ds-ease-in-out, ease), box-shadow 150ms var(--ds-ease-in-out, ease); }
.dshm-input:hover, .dshm-select:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); }
.dshm-input:focus-visible, .dshm-select:focus-visible { border-color: var(--dsw-alias-state-business-primary, #6ea8fe); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent), 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 16%, transparent); }
.dshm-input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── segmented control ──────────────────────────────────────────────────── */
.dshm-seg { display: inline-flex; gap: 2px; padding: 3px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user, 11px); box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.14); }
.dshm-seg button { height: 28px; padding: 0 14px; border: 0; background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font: inherit; font-size: 12.5px; border-radius: var(--dsh-layout-radius-user, 8px); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: color 130ms var(--ds-ease-in-out, ease), background-color 130ms var(--ds-ease-in-out, ease), box-shadow 130ms var(--ds-ease-in-out, ease); }
.dshm-seg button:hover { color: var(--dsw-alias-label-primary, #f4f4f5); background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.dshm-seg button[aria-pressed=true] { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent)); color: var(--dsw-alias-label-primary, #f4f4f5); font-weight: 500; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent), 0 1px 3px rgba(0, 0, 0, 0.25); }
.dshm-seg button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #6ea8fe); outline-offset: -2px; }

/* ── file picker / upload ───────────────────────────────────────────────── */
.dshm-drop { display: flex; align-items: center; gap: 12px; border: 1.5px dashed color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); border-radius: var(--dsh-layout-radius-user, 11px); padding: 12px 14px; cursor: pointer; background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 1%, transparent)); transition: border-color 150ms var(--ds-ease-in-out, ease), background-color 150ms var(--ds-ease-in-out, ease); }
.dshm-drop:hover { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 45%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 7%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 2%, transparent)); }
.dshm-dropInput { display: none; }
.dshm-dropIcon { width: 36px; height: 36px; flex: none; border-radius: var(--dsh-layout-radius-user, 10px); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); display: grid; place-items: center; }
.dshm-dropBody { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dshm-dropTitle { font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-dropHint { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ── misc ───────────────────────────────────────────────────────────────── */
.dshm-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshm-warnList { margin: 0; padding-left: 18px; color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 12px; line-height: 18px; }
.dshm-warnList li { margin: 2px 0; }
.dshm-resultCard { border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 28%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 9%, transparent), color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 4%, transparent)); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.dshm-resultHead { display: flex; align-items: center; gap: 10px; }
.dshm-resultIcon { width: 34px; height: 34px; flex: none; border-radius: var(--dsh-layout-radius-user, 10px); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 18%, transparent), color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 9%, transparent)); border: 1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 26%, transparent); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); display: grid; place-items: center; }
.dshm-resultHead strong { font-size: 14px; }
.dshm-resultMeta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); line-height: 18px; }
.dshm-resultMeta code { font-family: var(--ds-font-family-code); font-size: 11.5px; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.dshm-visuallyHidden { clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; width: 1px; height: 1px; position: absolute; overflow: hidden; }
@media (width <= 680px) { .dshm-details { grid-template-columns: 76px minmax(0, 1fr); } .dshm-cardTrailing .dshm-tag:not(.dshm-tagWarn):not(.dshm-tagError) { display: none; } }

/* ── file preview (below the tree) ──────────────────────────────────────── */
.dshm-previewWrap { margin-top: 10px; }
.dshm-previewCard { border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)); box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 10px); display: flex; flex-direction: column; overflow: hidden; }
.dshm-previewHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 9px 12px; border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent)); }
.dshm-previewTile { width: 30px; height: 30px; border-radius: var(--dsh-layout-radius-user, 9px); }
.dshm-previewTile-text { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 16%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 8%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 24%, transparent); color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-previewTile-image { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 16%, transparent), color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 8%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 24%, transparent); color: var(--dsw-alias-state-success-primary, #4caf50); }
.dshm-previewTile-pdf { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 16%, transparent), color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 8%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 24%, transparent); color: var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-previewTile-audio, .dshm-previewTile-video { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 16%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 8%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #6ea8fe) 24%, transparent); color: var(--dsw-alias-state-business-primary, #6ea8fe); }
.dshm-previewTile-binary { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent)); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-previewMeta { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 3px; }
.dshm-previewName { font-family: var(--ds-font-family-code); font-size: 12.5px; font-weight: 600; line-height: 17px; color: var(--dsw-alias-label-primary, #f4f4f5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-previewChips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dshm-previewPath { font-family: var(--ds-font-family-code); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshm-segSm { padding: 2px; border-radius: var(--dsh-layout-radius-user, 9px); align-self: center; }
.dshm-segSm button { height: 24px; padding: 0 10px; font-size: 12px; border-radius: var(--dsh-layout-radius-user, 7px); }
.dshm-buttonGhostSm { height: 26px; padding: 0 9px; font-size: 12px; border-radius: var(--dsh-layout-radius-user, 7px); gap: 5px; align-self: center; text-decoration: none; }
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
.dshm-table tbody tr:hover td { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.dshm-tableNote { margin: 0; padding: 6px 12px; font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-imgWrap { display: grid; place-items: center; padding: 16px; min-height: 120px; }
.dshm-img { max-width: 100%; max-height: 420px; border-radius: var(--dsh-layout-radius-user, 6px); box-shadow: var(--dsw-shadow-lv1, 0 2px 8px rgba(0, 0, 0, 0.2)); }
.dshm-pdfFrame { display: block; width: 100%; height: 460px; border: 0; background: #fff; }
.dshm-audio { display: block; width: calc(100% - 32px); margin: 14px 16px; }
.dshm-video { display: block; width: calc(100% - 32px); max-height: 420px; margin: 14px 16px; border-radius: var(--dsh-layout-radius-user, 8px); background: #000; }
.dshm-previewEmpty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 34px 16px; color: var(--dsw-alias-label-tertiary, #8a8a8e); text-align: center; }
.dshm-previewEmpty p { margin: 0; font-size: 12px; line-height: 19px; }
.dshm-previewEmptyMeta { font-size: 11px; font-variant-numeric: tabular-nums; }

/* ── dsh-layout material bridge ──────────────────────────────────────────
   When the dsh-layout plugin turns its frosted material on (flag on
   <html>), the main surfaces swap their white-mix gradients for
   translucent glass tints over the blurred canvas: cards 34%, panels
   46%, icon bases 52%. The inset top catch light and hover behavior
   carry over untouched — only the fill and border recipe changes. */
html[data-dsh-layout-material='on'] .dshm-card,
html[data-dsh-layout-material='on'] .dshm-detailCard,
html[data-dsh-layout-material='on'] .dshm-previewCard,
html[data-dsh-layout-material='on'] .dshm-resultCard,
html[data-dsh-layout-material='on'] .dshm-skelRow {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
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
html[data-dsh-layout-material='on'] .dshm-resultIcon {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 52%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}

/* ── motion safety ────────────────────────────────────────────────────────
   The per-section rules above already drop the shimmer, the status-dot
   breathe and the tree arrow spin under reduced motion; this block also
   disables the new hover lift / press-scale displacements. */
@media (prefers-reduced-motion: reduce) {
  .dshm-card, .dshm-button, .dshm-search input, .dshm-input, .dshm-select, .dshm-seg button, .dshm-drop, .dshm-failure button { transition: none; }
  .dshm-card:hover { transform: none; }
  .dshm-button:active, .dshm-buttonPrimary:active, .dshm-buttonDanger:active { transform: none; }
}

/* ─── Marketplace shelf (vendored) ───
   Styles for the market grid / source chips / cards rendered by
   market/MarketShelf.tsx. Vendored from the shared Frosted Modern
   recipe — owned HERE since the launcher stopped shipping market
   styles; dsh-mcp-manager carries its own dshmcp-mkt-* copy. */
/* ─── Marketplace shared — also imported by dsh-skill-manager / dsh-mcp-manager ─── */
.dshm-mkt-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
  align-items: center;
}
.dshm-mkt-sources-label {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  margin-right: 4px;
}
.dshm-mkt-source-chip {
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
.dshm-mkt-source-chip:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); color: var(--dsw-alias-label-primary, #f4f4f5); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent); }
.dshm-mkt-source-chip.is-active {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent));
  color: var(--dsw-alias-label-primary, #f4f4f5);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
}
.dshm-mkt-source-chip .dshm-mkt-source-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #4caf50);
  box-shadow: 0 0 8px var(--dsw-alias-state-success-primary, #4caf50);
}
.dshm-mkt-source-chip.is-down .dshm-mkt-source-dot { background: var(--dsw-alias-state-error-primary, #ef5350); box-shadow: 0 0 8px var(--dsw-alias-state-error-primary, #ef5350); }
.dshm-mkt-source-chip.is-invalid .dshm-mkt-source-dot { background: var(--dsw-alias-state-business-primary, #ffb74d); box-shadow: 0 0 8px var(--dsw-alias-state-business-primary, #ffb74d); }
.dshm-mkt-source-add {
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
.dshm-mkt-source-add:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 32%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }

.dshm-mkt-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.dshm-mkt-search {
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
.dshm-mkt-search:focus-within {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 26%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent), 0 0 0 3px color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dshm-mkt-search input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 13px;
  min-width: 0;
}
.dshm-mkt-search input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-search svg { width: 14px; height: 14px; flex: 0 0 14px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-toolbar-btn {
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
.dshm-mkt-toolbar-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.07)); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent); }
.dshm-mkt-toolbar-btn:active { transform: scale(0.98); }
.dshm-mkt-toolbar-btn svg { width: 14px; height: 14px; }
.dshm-mkt-toolbar-btn.is-spin svg { animation: dshm-mkt-spin 1.2s linear infinite; }

.dshm-mkt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.dshm-mkt-card {
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
.dshm-mkt-card:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent);
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent), 0 12px 32px rgba(0, 0, 0, 0.28);
}
.dshm-mkt-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
.dshm-mkt-card-tile {
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
.dshm-mkt-card-tile svg { width: 18px; height: 18px; }
.dshm-mkt-card-titleline { flex: 1; min-width: 0; }
.dshm-mkt-card-title { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); margin: 0; letter-spacing: 0.01em; }
.dshm-mkt-card-meta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin-top: 2px; }
.dshm-mkt-card-desc { font-size: 12px; color: var(--dsw-alias-label-secondary, #b3b3b8); line-height: 1.55; margin: 0 0 12px; min-height: 36px; }
.dshm-mkt-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
.dshm-mkt-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dshm-mkt-tag-source { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dshm-mkt-card-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dshm-mkt-card-installed {
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
.dshm-mkt-card-action {
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
.dshm-mkt-card-action:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.07)); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); }
.dshm-mkt-card-action:active { transform: scale(0.97); }
.dshm-mkt-card-action.is-primary {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 20%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 11%, transparent));
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 34%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent);
}
.dshm-mkt-card-action.is-primary:hover { background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13%, transparent)); }
.dshm-mkt-card-action.is-danger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 32%, transparent); }
.dshm-mkt-card-action.is-danger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 12%, transparent); }
.dshm-mkt-card-action:disabled { opacity: 0.55; cursor: not-allowed; }
.dshm-mkt-card-action.is-spin svg { animation: dshm-mkt-spin 1.2s linear infinite; }

.dshm-mkt-empty {
  text-align: center;
  padding: 48px 0;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dshm-mkt-error {
  color: var(--dsw-alias-state-error-primary, #ef5350);
  font-size: 12px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  margin-bottom: 12px;
}

/* ─── Add-source form: wraps to clean rows on mobile ─── */
.dshm-mkt-addrow {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.dshm-mkt-addrow input {
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
.dshm-mkt-addrow input:focus {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 26%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dshm-mkt-addrow input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }

@keyframes dshm-mkt-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

/* dsh-layout material bridge (market surfaces) */
html[data-dsh-layout-material='on'] .dshm-mkt-card,
html[data-dsh-layout-material='on'] .dshm-mkt-search {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dshm-mkt-card-tile {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 52%, transparent);
}

@media (max-width: 767px) {
  .dshm-mkt-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .dshm-mkt-card { padding: 14px; border-radius: var(--dsh-layout-radius-user-lg, 12px); }

  .dshm-mkt-card-tile { width: 32px; height: 32px; flex: 0 0 32px; }

  .dshm-mkt-card-tile svg { width: 16px; height: 16px; }

  .dshm-mkt-card-title { font-size: 13px; }

  .dshm-mkt-card-desc { font-size: 11px; min-height: 0; }

  .dshm-mkt-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .dshm-mkt-search { min-width: 0; }

  .dshm-mkt-toolbar-btn { width: 100%; justify-content: center; }

  .dshm-mkt-sources { gap: 4px; }

  .dshm-mkt-source-chip { padding: 5px 10px; font-size: 11px; }

  .dshm-mkt-source-add { padding: 5px 10px; font-size: 11px; }

  .dshm-mkt-addrow { flex-direction: column; }

  .dshm-mkt-addrow input { flex: 1 1 auto; }
}

@media (max-width: 480px) {
  .dshm-mkt-grid { gap: 10px; }

  .dshm-mkt-card { padding: 12px; }

  .dshm-mkt-card-foot { flex-wrap: wrap; }

  .dshm-mkt-card-action { margin-left: 0; flex: 1 1 100%; justify-content: center; }
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
