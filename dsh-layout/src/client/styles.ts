import { TOKENS_CSS } from "./tokens.ts";

const STYLE_ID = "dsh-layout-styles";

/**
 * A deliberately small stylesheet: every rule belongs to exactly one setting,
 * and every setting changes only its own concern.
 *
 *   滚动条      hides the conversation / session-list scrollbars
 *   材质        one frosted sheet over the whole page (sidebar + content)
 *   阅读宽度    full-width geometry ONLY — no card, chip or dock restyling
 *   收笔        bounded scroll geometry ONLY — the composer keeps its native
 *               look; the scroll-to-bottom button keeps its native offset
 *   输入框行数  textarea min-height
 *   气泡/轨迹/统计  their own surfaces
 *
 * Every rule keys off a plugin-owned data attribute that a JS pass placed on
 * a STABLE native DSH landmark — never off generated CSS-module hashes.
 * Disabling a setting removes its attributes and variables, so the page
 * degrades to native on its own.
 */
const CSS = `${TOKENS_CSS}

/* ── Behaviour guards ────────────────────────────────────────────────────── */
html:has([data-dsh-layout-workbench]) { overflow-x: hidden !important; overscroll-behavior: none !important; }
[data-dsh-layout-scroll-root] { overscroll-behavior: none !important; }

/* ── 滚动条（全局）─────────────────────────────────────────────────────────
   Visibility is a user choice, not a side effect: bars only hide behind the
   explicit setting, scoped to the conversation scroller and the session list. */
html[data-dsh-layout-scrollbar='hidden'] [data-conversation-scroll],
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root],
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root] [data-conversation-scroll],
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-sidebar-list] {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
html[data-dsh-layout-scrollbar='hidden'] [data-conversation-scroll]::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root]::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root] [data-conversation-scroll]::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-sidebar-list]::-webkit-scrollbar {
  width: 0 !important; height: 0 !important; display: none !important;
}

/* ── 页面背景（L0 画布）与全局开关 ──────────────────────────────────────────
   The native shell paints opaque surfaces (frame, conversation root, seat);
   when a background is set, lift #root above the fixed canvas and neutralize
   exactly the surfaces that are "the page" — never component surfaces. The
   material sheets below come after this block so they win where they apply. */
html[data-dsh-layout-bg] #root { position: relative; z-index: 1; }
html[data-dsh-layout-bg] [data-dsh-layout-frame],
html[data-dsh-layout-bg] [data-dsh-layout-sidebar-col],
html[data-dsh-layout-bg] [data-dsh-layout-center-col],
html[data-dsh-layout-bg] [data-dsh-layout-details-col],
html[data-dsh-layout-bg] [data-dsh-layout-chat-root],
html[data-dsh-layout-bg] [data-composer-seat],
html[data-dsh-layout-bg] [data-dsh-layout-details-col] > * > * {
  background-color: transparent !important;
  background-image: none !important;
}
.dsh-layout-background { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; contain: strict; background: #f4f6f9; }
.dsh-layout-background[hidden] { display: none; }
.dsh-layout-background__layer { position: absolute; inset: -5%; background-position: center; background-repeat: no-repeat; transition: background 180ms ease; }
.dsh-layout-background__video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

/* ── 界面圆角 ────────────────────────────────────────────────────────────────
   Off unless set. While set, the token pair follows the user value with a
   concentric offset (cards rounder than controls) and a curated whitelist of
   stable surfaces picks it up; round shapes (avatars, switches) stay round. */
html[data-dsh-layout-radius] {
  --dsh-layout-radius: var(--dsh-layout-radius-user);
  --dsh-layout-radius-lg: var(--dsh-layout-radius-user-lg);
}
html[data-dsh-layout-radius] :where(button, input, textarea, select, [data-composer-card], [data-queue-dock], [data-dsh-layout-composer-card], [role='menu'], [role='dialog'], [role='tooltip'], [role='listbox']) {
  border-radius: var(--dsh-layout-radius-user) !important;
}
/* The hero workspace-trigger card draws its dashed drop-zone ring as an SVG
   mask on ::after with the corner radius baked into the data URI (rx='22'),
   out of reach of any border-radius override. While the radius setting is
   active, ShellRuntime re-issues that SVG with the user's radius as the
   --dsh-layout-ring-mask variable; the readonly textarea identifies the
   trigger variant so regular composer cards keep their native ring. */
html[data-dsh-layout-radius] [data-composer-card]:has(textarea[readonly])::after {
  -webkit-mask-image: var(--dsh-layout-ring-mask) !important;
  mask-image: var(--dsh-layout-ring-mask) !important;
  border-radius: var(--dsh-layout-radius-user) !important;
}

/* ── 设置弹窗尺寸 ───────────────────────────────────────────────────────────
   The overlay centers the panel, so only the box changes; DSH's own
   max-width (100vw − 48px) still caps the width and the height keeps its
   viewport guard via min(). */
html[data-dsh-layout-dialog] [role='dialog'] {
  width: var(--dsh-layout-dialog-width, 800px) !important;
  height: min(var(--dsh-layout-dialog-height, 800px), calc(100vh - 48px)) !important;
}

/* ── 页面边距 token ──────────────────────────────────────────────────────────
   One pipeline, logical properties, zero scattering: desktop full-width
   presets → mobile preset → explicit user overrides (inline vars win).
   Native width mode defines nothing, so DSH's own paddings stay untouched.
   Consumers below only read tokens; they never know the current mode. */
html[data-dsh-layout-read-width='full'] {
  --dsh-layout-pad-header-start: 20px;
  --dsh-layout-pad-header-end: 28px;
  --dsh-layout-pad-content-start: 28px;
  --dsh-layout-pad-content-end: 28px;
  --dsh-layout-pad-composer-start: 28px;
  --dsh-layout-pad-composer-end: 28px;
}
@media (max-width: 767px) {
  html[data-dsh-layout-read-width='full'] {
    --dsh-layout-pad-header-start: 0px;
    --dsh-layout-pad-header-end: 8px;
    --dsh-layout-pad-content-start: 8px;
    --dsh-layout-pad-content-end: 8px;
    --dsh-layout-pad-composer-start: 8px;
    --dsh-layout-pad-composer-end: 8px;
  }
}
html[data-dsh-layout-read-width='full'] [data-dsh-layout-chrome-header] {
  padding-inline-start: var(--dsh-layout-pad-header-start, 20px) !important;
  padding-inline-end: var(--dsh-layout-pad-header-end, 28px) !important;
}

/* ── 磨砂材质（L1，整页一张）──────────────────────────────────────────────
   Parameters arrive as CSS variables from the settings store
   (--dsh-layout-mat / -solid / -blur / -sat). Two sheets total — one for the
   sidebar column, one for the content column — painted on ::before layers so
   no host ever carries a backdrop-filter itself: a filtered ancestor would
   become the containing block for fixed descendants, and DSH renders its
   settings dialog inside the sidebar column. The surfaces between #root and
   the sheets are cleared, everything deeper (cards, dialogs, hovers) keeps
   its native paint. */
html[data-dsh-layout-material='on'] #root { position: relative; z-index: 1; }
html[data-dsh-layout-material='on'] [data-dsh-layout-frame],
html[data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col],
html[data-dsh-layout-material='on'] [data-dsh-layout-center-col],
html[data-dsh-layout-material='on'] [data-dsh-layout-chat-root],
html[data-dsh-layout-material='on'] [data-composer-seat],
html[data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col] > * > * {
  background-color: transparent !important;
  background-image: none !important;
}
/* The native session-list bottom fade gradients toward the sidebar fill
   color; over the sheet it reads as a visible band, so it goes away with the
   material. Hash-suffix match scoped inside our marked column — a rename
   degrades to the native fade. */
html[data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col] [class*='_fade'] {
  background: none !important;
}
html[data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col],
html[data-dsh-layout-material='on'] [data-dsh-layout-center-col] {
  position: relative;
}
html[data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col]::before,
html[data-dsh-layout-material='on'] [data-dsh-layout-center-col]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: var(--dsh-layout-mat, var(--dsh-layout-glass-base));
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}
/* Accessibility and capability fallbacks: the sheet keeps its tint at full
   opacity and drops the blur entirely — readable everywhere, cheap always. */
@media (prefers-reduced-transparency: reduce) {
  html[data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col]::before,
  html[data-dsh-layout-material='on'] [data-dsh-layout-center-col]::before {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    background: var(--dsh-layout-mat-solid, var(--dsh-layout-glass-base)) !important;
  }
}
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  html[data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col]::before,
  html[data-dsh-layout-material='on'] [data-dsh-layout-center-col]::before {
    background: var(--dsh-layout-mat-solid, var(--dsh-layout-glass-base)) !important;
  }
}

/* ── 消息气泡 ───────────────────────────────────────────────────────────────
   Glass mode swaps DSH's blue-tinted fill for a frosted chip: the theme-base
   tint at a light opacity, one hairline to mark the edge, and — while the
   page material is on — its blur so the bubble reads whatever is behind it.
   Hash-suffix match scoped to the marked column; a rename degrades to the
   native fill. */
html[data-dsh-layout-bubble='glass'] [data-dsh-layout-chat-column] [class*='_bubble'] {
  background: color-mix(in srgb, var(--dsh-layout-glass-base) 55%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 60%, transparent) !important;
  box-shadow: none !important;
}
html[data-dsh-layout-bubble='solid'] [data-dsh-layout-chat-column] [class*='_bubble'] {
  background: var(--dsh-layout-solid) !important;
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 60%, transparent) !important;
  box-shadow: none !important;
}
html[data-dsh-layout-bubble='transparent'] [data-dsh-layout-chat-column] [class*='_bubble'] {
  background: transparent !important;
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 60%, transparent) !important;
  box-shadow: none !important;
}
html[data-dsh-layout-material='on'][data-dsh-layout-bubble='glass'] [data-dsh-layout-chat-column] [class*='_bubble'] {
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}

/* ── 轨迹页 ─────────────────────────────────────────────────────────────────
   The trace view marks its scroller with a composer-overlay attribute, so
   every rule scopes to it without touching the conversation. Clear mode
   drops DSH's stacked white layers so the page material shows through. */
html[data-dsh-layout-trace-bg='clear'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [class$='_root'],
html[data-dsh-layout-trace-bg='clear'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [class$='_plot'],
html[data-dsh-layout-trace-bg='clear'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [class$='_split'],
html[data-dsh-layout-trace-bg='clear'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [class$='_table'] {
  background: transparent !important;
}
/* DSH's trace seat reserves the scrollbar gutter (right: var(--dsh-scrollbar-
   width), 8px) so it never sits under the scrollbar. Once the scrollbar is
   hidden that gutter is dead space — stretch the seat flush. */
html[data-dsh-layout-scrollbar='hidden'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) > [data-composer-seat] {
  right: 0 !important;
}
/* The ledger pane's 202px tail keeps the last rows clear of the floating
   input; with the above-end reserving its own tail it is dead space. */
html[data-dsh-layout-trace-tail='none'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [class$='_tablePane'] {
  padding-bottom: 0 !important;
}
/* Aligned to the reading measure; falls back to native when the measure is
   'none' (full mode) — inset covers that case already. */
html:not([data-dsh-layout-read-width='full'])[data-dsh-layout-trace-width='message'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [data-slot='conversation.view'] > [class$='_root'] {
  max-width: calc(var(--dsh-chat-content-width, 748px) + 64px);
  margin-inline: auto;
}
html[data-dsh-layout-trace-width='inset'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [data-slot='conversation.view'] > [class$='_root'] {
  padding-left: var(--dsh-layout-pad-content-start, 28px) !important;
  padding-right: var(--dsh-layout-pad-content-end, 28px) !important;
}

/* ── 阅读宽度（纯几何）─────────────────────────────────────────────────────
   Full width stretches the reading measure and the composer card to the
   window edges and puts messages, card and header on one 28px line — nothing
   else. The native hero posture (new-session centered card) is skipped via
   the workbench mark, so it keeps the native 748px rhythm. */
html[data-dsh-layout-read-width='full'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]) { --dsh-chat-content-width: none; }
[data-dsh-layout-chat-root]:has([data-dsh-layout-workbench])[data-dsh-layout-composer-width='full'] { --dsh-composer-card-max-width: none; }
/* The composer seat is sticky inside the conversation scroller, so it spans
   the client area minus a classic-scrollbar gutter while the header above
   spans the full column — stretching the seat by the measured gutter keeps
   both edges aligned. Skipped in 'above' mode: the seat pins to the
   conversation root there and stretches via left/right. */
html:not([data-dsh-layout-scroll-end='above']) [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench])[data-dsh-layout-composer-width='full'] [data-composer-seat] {
  width: calc(100% + var(--dsh-layout-scroll-gutter, 0px));
}
[data-dsh-layout-chat-root]:has([data-dsh-layout-workbench])[data-dsh-layout-composer-width='full'] [data-dsh-layout-workbench] {
  padding-left: var(--dsh-layout-pad-composer-start, 28px) !important;
  padding-right: var(--dsh-layout-pad-composer-end, 28px) !important;
}
/* The native conversation scroller pads its column 32px; in full mode the
   messages take the same 28px line as the composer card. Hash-suffix match
   scoped inside the marked chain; a rename degrades to the native 32px. */
html[data-dsh-layout-read-width='full'] [data-dsh-layout-chat-column][class*='_scroll'] {
  padding-left: var(--dsh-layout-pad-content-start, 28px) !important;
  padding-right: var(--dsh-layout-pad-content-end, 28px) !important;
}

/* ── 收笔（止于输入区上方，纯几何）─────────────────────────────────────────
   The composer is pulled out of the scroll flow: the seat pins to the
   conversation root (absolute, escaping the static scroller) and the
   scroller's bottom margin tracks the seat's live height, so the log
   physically ends above the input. The composer itself keeps every native
   surface — radius, buttons, colors — untouched. Scoped through the
   workbench mark: the hero posture keeps the native in-flow composer. */
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]) { position: relative; }
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]):not(:has([data-conversation-composer-overlay])) [data-composer-seat] {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  top: auto !important;
  z-index: 1;
}
/* The pinned seat spans the conversation root, whose width INCLUDES the
   scroller's classic-scrollbar gutter — natively the seat only fills the
   client area, so a centered card would shift right by half the gutter
   against the conversation column above. Native reading width re-anchors
   the right edge to the live measured gutter (0 with overlay or hidden
   scrollbars); full width keeps spanning everything to stay aligned with
   the header row. The seat still lives inside the scroller in the DOM, so
   the gutter var set on the scroll root reaches it by inheritance. */
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]):not(:has([data-conversation-composer-overlay])):not([data-dsh-layout-composer-width='full']) [data-composer-seat] {
  right: var(--dsh-layout-scroll-gutter, 0px) !important;
}
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]):not(:has([data-conversation-composer-overlay])) [data-conversation-scroll] {
  margin-bottom: var(--dsh-layout-seat-height, 0px);
}
/* Trace view: DSH pins the seat inside the (positioned) scroller itself —
   our absolute override would glue it to the margin-raised scroller bottom
   and float it mid-air. Keep DSH's positioning and reserve the canvas tail
   with padding so the trace ends above the input. */
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]):has([data-conversation-composer-overlay]) [data-conversation-scroll] {
  padding-bottom: var(--dsh-layout-seat-height, 0px);
}
/* DSH pins the scroll-to-bottom slot sticky at calc(var(--dsh-composer-
   height) + 16px) from the scrollport bottom. Once the scroller ends at the
   seat top, that offset would lift the button by a full composer height;
   re-anchoring to the native 16px gap keeps its on-screen position
   unchanged. The button itself is an unpositioned flex child — only the
   slot carries the sticky offset. */
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]):not(:has([data-conversation-composer-overlay])) [data-conversation-scroll] [class*='_toBottomSlot'] {
  bottom: 16px !important;
}

/* ── 输入框行数 ─────────────────────────────────────────────────────────────
   The textarea (and its layout mirror) hold the configured number of lines
   instead of the single native row. */
html[data-dsh-layout-input-rows] [data-dsh-layout-composer-text],
html[data-dsh-layout-input-rows] [data-dsh-layout-composer-card] [data-input-mirror] {
  min-height: calc(var(--dsh-layout-input-rows, 3) * 24px);
}

/* ── 设置弹窗加固 ───────────────────────────────────────────────────────────
   DSH renders the settings dialog panel with overflow:hidden, which still
   makes it a programmatically scrollable box; focus scrolling can displace
   the whole dialog content. overflow:clip is not a scroll container at all,
   so focus scrolling routes to the real scroller. Visually clip === hidden. */
[role='dialog'] { overflow: clip !important; }

/* ── 统计入口 ─────────────────────────────────────────────────────────────── */
.dsh-layout-root { position: relative; display: inline-flex; flex: none; color: var(--dsw-alias-label-secondary); }
.dsh-layout-root--dock { width: auto; max-width: none; min-width: 0; padding-top: 0; overflow: visible; margin-top: 12px !important; }
.dsh-layout-root--dock.dsh-layout-root--inline { align-self: stretch; justify-content: flex-start; width: 100%; max-width: var(--dsh-composer-card-max-width); margin: 0 auto; overflow: hidden; }
.dsh-layout-trigger { height: 24px; max-width: 260px; display: inline-flex; align-items: center; gap: 5px; padding: 0; border: 0; background: transparent; box-shadow: none; color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-xs-13); font-variant-numeric: tabular-nums; cursor: pointer; transition: color .14s; }
.dsh-layout-trigger:hover, .dsh-layout-trigger[aria-expanded='true'] { color: var(--dsw-alias-label-primary); }
.dsh-layout-trigger--icon { width: 26px; height: 26px; padding: 0; justify-content: center; border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 52%, transparent); border-radius: var(--dsh-layout-radius); background: color-mix(in srgb, var(--dsh-layout-subtle) 88%, transparent); }
.dsh-layout-trigger--icon:hover, .dsh-layout-trigger--icon[aria-expanded='true'] { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 24%, var(--dsh-layout-line)); background: color-mix(in srgb, var(--dsh-layout-subtle) 100%, transparent); }
.dsh-layout-trigger--icon:active { transform: translateY(1px); }
.dsh-layout-trigger:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
.dsh-layout-trigger__label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dsh-layout-inline-summary { min-width: 0; display: flex; align-items: center; height: 24px; box-sizing: border-box; padding-inline: 0; overflow: hidden; color: var(--dsw-alias-label-tertiary); font: var(--dsh-font-xs-13); font-size: 11px; line-height: 18px; font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }
.dsh-layout-inline-summary__group { flex: none; }
.dsh-layout-inline-summary__divider { flex: none; margin: 0 8px; color: var(--dsw-alias-label-tertiary); opacity: .48; }
.dsh-layout-panel { z-index: 120; width: 304px; box-sizing: border-box; position: fixed; padding: 14px 16px 12px; border: 1px solid var(--dsh-layout-line); border-radius: var(--dsh-layout-radius-lg); background: var(--dsh-layout-solid); color: var(--dsw-alias-label-secondary); box-shadow: 0 18px 48px light-dark(rgb(23 32 44 / .14), rgb(0 0 0 / .48)), 0 2px 8px rgb(0 0 0 / .06); font-size: 12px; line-height: 20px; animation: dsh-layout-in .12s ease-out; }
.dsh-layout-panel::after { content: none; }
.dsh-layout-root--dock .dsh-layout-panel { animation-name: dsh-layout-dock-in; }
.dsh-layout-panel__header { display: flex; align-items: center; gap: 10px; color: var(--dsw-alias-label-primary); padding: 1px 1px 12px; }
.dsh-layout-panel__icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: var(--dsh-layout-radius); border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 72%, transparent); background: transparent; color: var(--dsw-alias-label-secondary); }
.dsh-layout-panel__header div { min-width: 0; display: grid; line-height: 17px; }
.dsh-layout-panel__header strong { font-weight: 650; }
.dsh-layout-panel__header span:not(.dsh-layout-panel__icon) { color: var(--dsw-alias-label-tertiary); font-size: 11px; font-variant-numeric: tabular-nums; }
.dsh-layout-panel__heroes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; margin: 0 0 2px; padding: 0 0 10px; border-bottom: 1px solid color-mix(in srgb, var(--dsh-layout-line) 60%, transparent); }
.dsh-layout-panel__hero { display: flex; min-width: 0; flex-direction: column; justify-content: center; padding: 2px 0 0; border: 0; background: transparent; }
.dsh-layout-panel__hero dt { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }
.dsh-layout-panel__hero dd { margin: 1px 0 0; overflow: hidden; color: var(--dsw-alias-label-primary); font-size: 17px; font-weight: 620; font-variant-numeric: tabular-nums; line-height: 23px; text-overflow: ellipsis; white-space: nowrap; }
.dsh-layout-panel__details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; margin: 0; padding: 2px 0 0; }
.dsh-layout-panel__detail { min-width: 0; display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 6px 0; border-bottom: 1px solid color-mix(in srgb, var(--dsh-layout-line) 34%, transparent); }
.dsh-layout-panel__detail:nth-last-child(-n + 2) { border-bottom: 0; }
.dsh-layout-panel__detail dt { min-width: 0; overflow: hidden; color: var(--dsw-alias-label-tertiary); text-overflow: ellipsis; white-space: nowrap; }
.dsh-layout-panel__detail dd { margin: 0; color: var(--dsw-alias-label-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.dsh-layout-panel__tokens { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-top: 2px; padding: 9px 0 1px; border-top: 1px solid color-mix(in srgb, var(--dsh-layout-line) 60%, transparent); background: transparent; }
.dsh-layout-panel__tokens span { color: var(--dsw-alias-label-tertiary); font-size: 11px; }
.dsh-layout-panel__tokens strong { overflow: hidden; color: var(--dsw-alias-label-primary); font-size: 12px; font-weight: 550; font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }
.dsh-layout-panel__empty { margin: 0; padding: 14px 10px; border-radius: var(--dsh-layout-radius); background: var(--dsh-layout-subtle); color: var(--dsw-alias-label-tertiary); text-align: center; }
@keyframes dsh-layout-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes dsh-layout-dock-in { from { opacity: 0; } to { opacity: 1; } }

/* ── 设置页 ───────────────────────────────────────────────────────────────── */
.dsh-layout-settings { display: grid; gap: 16px; max-width: 880px; color: var(--dsw-alias-label-primary); }
.dsh-layout-settings * { box-sizing: border-box; }
.dsh-layout-settings__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 4px 2px 6px; }
.dsh-layout-settings h2 { margin: 0 0 6px; font-size: 19px; letter-spacing: .01em; line-height: 26px; }
.dsh-layout-settings h3 { margin: 0; font-size: 14px; line-height: 20px; }
.dsh-layout-settings p { margin: 5px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 19px; }
/* Tab bar: one raised rail, content-sized segments, the active pill lifts. */
.dsh-layout-tabs { display: inline-flex; justify-self: start; gap: 2px; padding: 3px; border-radius: 10px; background: var(--dsw-alias-interactive-bg-hover); }
.dsh-layout-tabs button { flex: none; min-height: 32px; padding: 4px 16px; border: 0; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 13px; font-weight: 550; white-space: nowrap; cursor: pointer; transition: color .14s ease, background-color .14s ease, box-shadow .14s ease; }
.dsh-layout-tabs button:hover { color: var(--dsw-alias-label-primary); }
.dsh-layout-tabs button[aria-selected='true'] { background: var(--dsw-specific-input-major); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 4px rgb(0 0 0 / 9%); }
/* Two-rail field rows: icon + label on the left, controls in one aligned
   column on the right — every control starts at the same x, nothing drifts. */
.dsh-layout-settings__field { display: grid; grid-template-columns: 168px minmax(0, 1fr); gap: 6px 20px; align-items: center; padding: 11px 0; border-bottom: 1px solid color-mix(in srgb, var(--dsh-layout-line) 30%, transparent); }
.dsh-layout-settings__group { display: flex; align-items: center; gap: 12px; margin: 18px 0 2px; color: var(--dsw-alias-label-tertiary); font-size: 11px; font-weight: 600; letter-spacing: .07em; }
.dsh-layout-settings__group::after { content: ''; flex: 1; height: 1px; background: color-mix(in srgb, var(--dsh-layout-line) 45%, transparent); }
.dsh-layout-settings__group:first-child { margin-top: 2px; }
.dsh-layout-settings__field:last-child { border-bottom: 0; padding-bottom: 2px; }
.dsh-layout-settings__field:first-of-type { padding-top: 13px; }
.dsh-layout-settings__label { display: flex; align-items: center; gap: 9px; min-width: 0; }
.dsh-layout-settings__label strong { overflow: hidden; color: var(--dsw-alias-label-secondary); font-size: 12px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
.dsh-layout-settings__icon { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 7px; background: color-mix(in srgb, var(--dsh-layout-subtle) 78%, transparent); color: var(--dsw-alias-label-tertiary); }
.dsh-layout-settings__field .dsh-layout-settings__icon { color: var(--dsw-alias-label-secondary); }
.dsh-layout-settings__control { display: grid; gap: 8px; min-width: 0; }
.dsh-layout-settings__control > .dsh-layout-segmented, .dsh-layout-settings__control > .dsh-layout-tiers { margin-top: 0; }
.dsh-layout-settings__card { padding: 16px 18px; border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 55%, transparent); border-radius: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 84%, transparent); box-shadow: 0 1px 2px rgb(0 0 0 / 2%); }
.dsh-layout-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--dsh-layout-line) 40%, transparent); }
.dsh-layout-section-heading .dsh-layout-settings__label { align-items: flex-start; }
.dsh-layout-section-heading .dsh-layout-settings__icon { margin-top: 1px; color: var(--dsw-alias-label-secondary); }
.dsh-layout-section-heading h3 { margin: 0; font-size: 14px; line-height: 20px; }
.dsh-layout-section-heading p { margin: 2px 0 0; }
.dsh-layout-toggle { display: inline-flex; align-items: center; gap: 9px; color: var(--dsw-alias-label-secondary); font-size: 12px; white-space: nowrap; cursor: pointer; }
.dsh-layout-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.dsh-layout-toggle i { position: relative; width: 38px; height: 22px; border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover-solid); box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l2); transition: background .16s, box-shadow .16s; }
.dsh-layout-toggle i::after { content: ''; position: absolute; width: 16px; height: 16px; top: 3px; left: 3px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.24); transition: transform .16s; }
.dsh-layout-toggle input:checked + i { background: #3678ea; box-shadow: inset 0 0 0 1px rgba(29,91,205,.25); }
.dsh-layout-toggle input:checked + i::after { transform: translateX(16px); }
.dsh-layout-toggle input:focus-visible + i { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
.dsh-layout-segmented { display: inline-flex; flex-wrap: wrap; gap: 3px; padding: 3px; border-radius: 9px; background: var(--dsw-alias-interactive-bg-hover); }
.dsh-layout-segmented button { min-height: 30px; padding: 4px 13px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; white-space: nowrap; cursor: pointer; transition: color .14s ease, background-color .14s ease; }
.dsh-layout-segmented button[aria-pressed='true'] { background: var(--dsw-specific-input-major); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 4px rgb(0 0 0 / 9%); }
/* 材质档位: equal cards, poetic name over a one-line hint. */
.dsh-layout-tiers { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.dsh-layout-tiers button { min-height: 54px; padding: 9px 11px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); text-align: left; font: inherit; cursor: pointer; transition: border-color .14s ease, box-shadow .14s ease; }
.dsh-layout-tiers button:hover { border-color: color-mix(in srgb, #3678ea 45%, var(--dsw-alias-border-l2)); }
.dsh-layout-tiers button[aria-pressed='true'] { border-color: #3678ea; box-shadow: inset 0 0 0 1px #3678ea; }
.dsh-layout-tiers strong { display: block; overflow: hidden; font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }
.dsh-layout-tiers span { display: block; overflow: hidden; margin-top: 2px; color: var(--dsw-alias-label-tertiary); font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
.dsh-layout-range { display: flex; align-items: center; gap: 10px; }
.dsh-layout-range input[type='range'] { flex: 1; min-height: 24px; margin: 0; accent-color: #3678ea; }
.dsh-layout-range output { min-width: 52px; color: var(--dsw-alias-label-secondary); font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.dsh-layout-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.dsh-layout-chips label { display: inline-flex; align-items: center; gap: 5px; min-height: 28px; padding: 3px 11px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 12px; white-space: nowrap; cursor: pointer; }
.dsh-layout-chips label:has(input:checked) { border-color: #3678ea; color: var(--dsw-alias-label-primary); }
.dsh-layout-chips input { accent-color: #3678ea; }
.dsh-layout-colors { display: flex; align-items: center; gap: 12px; }
.dsh-layout-colors input[type='color'] { width: 42px; height: 32px; padding: 2px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: transparent; }
.dsh-layout-settings input[type='url'], .dsh-layout-settings input[type='text'] { width: 100%; min-height: 32px; padding: 5px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; }
/* Custom page-padding editor: one compact row per area, preset placeholders. */
.dsh-layout-pads { display: grid; gap: 6px; }
.dsh-layout-pads__row { display: flex; align-items: center; gap: 12px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.dsh-layout-pads__row > span { flex: none; width: 44px; }
.dsh-layout-pads__row label { display: inline-flex; align-items: center; gap: 6px; }
.dsh-layout-pads__row input { width: 64px; min-height: 28px; padding: 3px 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-variant-numeric: tabular-nums; }
.dsh-layout-pads__hint { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 11px; }
.dsh-layout-file-button { display: inline-flex; align-items: center; min-height: 32px; padding: 5px 14px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; white-space: nowrap; cursor: pointer; user-select: none; transition: border-color .14s ease; }
.dsh-layout-file-button:hover { border-color: color-mix(in srgb, #3678ea 45%, var(--dsw-alias-border-l2)); }
label:has(> .dsh-layout-file-button) { display: inline-flex; }
.dsh-layout-dirty { flex: none; margin-top: 4px; padding: 3px 10px; border-radius: 999px; background: color-mix(in srgb, #3678ea 12%, transparent); color: #3678ea; font-size: 11px; font-weight: 600; white-space: nowrap; }
.dsh-layout-field-status { flex: none; padding: 1px 6px; border-radius: 999px; background: color-mix(in srgb, #3678ea 10%, transparent); color: #3678ea; font-size: 10px; font-weight: 600; white-space: nowrap; }
.dsh-layout-field-reset { flex: none; width: 20px; height: 20px; padding: 0; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 1; cursor: pointer; }
.dsh-layout-field-reset:hover { border-color: #3678ea; color: #3678ea; }
.dsh-layout-settings footer { display: flex; justify-content: flex-end; }
.dsh-layout-settings footer button { min-height: 34px; padding: 6px 14px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; white-space: nowrap; cursor: pointer; transition: border-color .14s ease, background-color .14s ease; }
.dsh-layout-settings footer button:hover { border-color: color-mix(in srgb, #3678ea 45%, var(--dsw-alias-border-l2)); }
@media (prefers-reduced-motion: reduce) { .dsh-layout-panel { animation: none; } .dsh-layout-trigger { transition: none; } }

/* ── 窄屏（< 768px）─────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .dsh-layout-settings__field { grid-template-columns: 1fr; gap: 6px; }
  .dsh-layout-settings__label { align-items: center; }
  .dsh-layout-tabs { display: flex; overflow-x: auto; max-width: 100%; }
  .dsh-layout-tabs button { padding: 4px 12px; }
  .dsh-layout-tiers { grid-template-columns: repeat(2, minmax(0, 1fr)); }

  /* DSH's outer settings panel is desktop row-based by default (188px nav
     + a tiny content column at phone widths). Collapse it into a full-width
     vertical sheet: horizontal section navigation on top, content below. */
  [role='dialog'][class*='_panel'] {
    width: 100vw !important;
    max-width: none !important;
    height: 100dvh !important;
    max-height: none !important;
    border-radius: 0 !important;
    flex-direction: column !important;
  }
  [role='dialog'][class*='_panel'] > nav {
    flex: none !important;
    width: 100% !important;
    height: auto !important;
    min-height: 68px;
    max-height: 112px;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    border-bottom: 1px solid color-mix(in srgb, var(--dsh-layout-line) 55%, transparent);
  }
  [role='dialog'][class*='_panel'] > nav > * { white-space: nowrap; }
  [role='dialog'][class*='_panel'] > nav [class*='_navTitle'] { display: none !important; }
  [role='dialog'][class*='_panel'] > nav [class*='_navList'] {
    display: flex !important;
    flex-direction: row !important;
    align-items: center;
    width: max-content !important;
    min-width: 100%;
    height: 100%;
    gap: 4px;
    padding: 10px 0 !important;
  }
  [role='dialog'][class*='_panel'] > nav [class*='_navCell'] {
    flex: none !important;
    width: auto !important;
    min-width: max-content;
    min-height: 38px;
    padding-inline: 14px !important;
    white-space: nowrap;
  }
  [role='dialog'][class*='_panel'] > nav [class*='_navLabel'] { width: auto !important; white-space: nowrap; }
  [role='dialog'][class*='_panel'] > [class*='_content'] {
    flex: 1 1 auto !important;
    width: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }
  [role='dialog'][class*='_panel'] > [class*='_content'] > [class*='_options'] {
    min-width: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    padding-inline: 16px !important;
  }

  /* Narrow header wrap: the crowded row flows to a second line instead of
     overlapping while the setting is on (default). */
  html[data-dsh-layout-narrow-wrap] [data-dsh-layout-chrome-header] > *:first-child {
    flex-wrap: wrap;
  }

  /* 输入面板（手机）：the native row squeezes tools to 4px while trailing
     controls keep their intrinsic widths, so buttons overlap. Use the stable
     adapter marks to create two intentional rows: commands/permission above,
     model/context/send below. */
  [data-dsh-layout-composer-actions] {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
    grid-template-rows: auto auto !important;
    align-items: center;
    column-gap: 8px;
    row-gap: 6px;
    min-width: 0;
    height: auto !important;
  }
  [data-dsh-layout-composer-tools] {
    display: flex !important;
    grid-column: 1 / -1;
    grid-row: 1;
    min-width: 0 !important;
    width: auto !important;
    overflow: hidden;
    gap: 6px !important;
  }
  [data-dsh-layout-composer-tools] > * { flex: none !important; min-width: 0 !important; }
  [data-dsh-layout-composer-trailing] {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 30px 36px;
    grid-column: 1 / -1;
    grid-row: 2;
    min-width: 0 !important;
    width: auto !important;
    align-items: center;
    gap: 6px;
  }
  [data-dsh-layout-composer-trailing] > * { min-width: 0 !important; }
  [data-dsh-layout-composer-trailing] [class*='_root'] { min-width: 0 !important; overflow: hidden; }
  [data-dsh-layout-composer-trailing] [class*='_triggerLabel'] { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  [data-dsh-layout-composer-trailing] [class*='_trigger'] { max-width: 100%; min-width: 0 !important; overflow: hidden; }
  [data-dsh-layout-composer-trailing] [class*='_primary'] { width: 36px !important; min-width: 36px !important; }
  [data-dsh-layout-composer-tools] [class*='_triggerLabel'] { max-width: 118px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

/* ── 手机抽屉（< 768px）───────────────────────────────────────────────────
   The app defaults the sidebar to a 72px icon rail on phones, which reads as
   a shrunken desktop column. The MobileSidebarRuntime instead presents it as
   a native-style off-canvas drawer: the conversation keeps the full viewport,
   the drawer is flush to the edges (min(85vw, 340px), full height) with a
   mask over the page, one floating entry button, and the rail is expanded
   into its labeled form while the drawer is in use. Everything keys off the
   plugin-owned data-dsh-layout-mobile-sidebar attribute; hash-suffix matches
   stay scoped inside the marked column and degrade to native on a rename. */
.dsh-layout-mobile-sidebar-trigger,
.dsh-layout-mobile-sidebar-mask { display: none; }
@media (max-width: 767px) {
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-frame] {
    grid-template-columns: minmax(0, 1fr) var(--dsh-layout-details, 0px) !important;
  }
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-center-col] { grid-column: 1; min-width: 0; }
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-details-col] { grid-column: 2; }
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] {
    position: fixed !important;
    z-index: 42;
    inset-block: 0;
    inset-inline-start: 0;
    width: min(85vw, 340px) !important;
    max-width: 340px;
    height: 100vh;
    height: 100dvh;
    box-sizing: border-box;
    padding-block: env(safe-area-inset-top, 0px) env(safe-area-inset-bottom, 0px);
    border: 0 !important;
    border-inline-end: 1px solid var(--dsh-layout-line) !important;
    background: var(--dsh-layout-solid, var(--dsw-alias-bg-layer-2));
    overflow: hidden;
    transform: translateX(-100%);
    transition: transform 220ms ease;
  }
  html[data-dsh-layout-mobile-sidebar][data-dsh-layout-mobile-sidebar-open] [data-dsh-layout-sidebar-col] { transform: translateX(0); }
  /* The app panel inside keeps its own fixed width and chrome; stretch it
     edge to edge so the drawer reads as one flat surface. The intermediate
     wrapper is display:contents, so the panel lays out against the column. */
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] > div > div {
    width: 100% !important;
    height: 100%;
    padding-inline: 8px !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  /* Drawer top row: keep the brand, drop the app's own collapse toggle (the
     floating X owns closing) and clear space for that X button. */
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] [class*='logoRow'] {
    padding-inline-start: 52px !important;
  }
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] [class*='logoRow'] button[class*='toggle'] { display: none; }
  /* Compact native-app list rows; inline nodes ignore min-height, so the
     suffix match can only affect the row boxes themselves. */
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] [class*='projectRow'],
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] [class*='sessionRow'] {
    min-height: 44px;
  }
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] button[class*='newSession'] {
    min-height: 44px;
  }

  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-trigger {
    position: fixed;
    z-index: 44;
    inset-block-start: calc(10px + env(safe-area-inset-top, 0px));
    inset-inline-start: calc(10px + env(safe-area-inset-left, 0px));
    width: 38px;
    height: 38px;
    padding: 0;
    border: 1px solid var(--dsw-alias-border-l2);
    border-radius: 10px;
    background: color-mix(in srgb, var(--dsw-alias-bg-layer-3) 88%, transparent);
    color: var(--dsw-alias-label-primary);
    box-shadow: var(--dsw-shadow-lv1);
    -webkit-backdrop-filter: blur(14px) saturate(125%);
    backdrop-filter: blur(14px) saturate(125%);
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
  }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-trigger > span {
    width: 16px;
    height: 1.5px;
    border-radius: 2px;
    background: currentColor;
    transition: transform 160ms ease, opacity 160ms ease;
  }
  html[data-dsh-layout-mobile-sidebar-open] .dsh-layout-mobile-sidebar-trigger > span:first-child { transform: translateY(5.5px) rotate(45deg); }
  html[data-dsh-layout-mobile-sidebar-open] .dsh-layout-mobile-sidebar-trigger > span:nth-child(2) { opacity: 0; }
  html[data-dsh-layout-mobile-sidebar-open] .dsh-layout-mobile-sidebar-trigger > span:last-child { transform: translateY(-5.5px) rotate(-45deg); }
  html[data-dsh-layout-mobile-sidebar-open] .dsh-layout-mobile-sidebar-trigger { background: var(--dsw-alias-bg-layer-3); }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-mask {
    position: fixed;
    z-index: 41;
    inset: 0;
    border: 0;
    padding: 0;
    background: color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
    display: block;
  }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-mask[hidden] { display: none; }
}

/* Notched phones: the pinned seat clears the home-indicator zone. */
@media (max-width: 768px) {
  [data-dsh-layout-workbench] { padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important; }
}
`;

export function installStyles(doc: Document): () => void {
  const existing = doc.getElementById(STYLE_ID);
  if (existing !== null) return () => {};
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.dataset.plugin = "dsh-layout";
  style.textContent = CSS;
  doc.head.append(style);
  return () => {
    style.remove();
  };
}
