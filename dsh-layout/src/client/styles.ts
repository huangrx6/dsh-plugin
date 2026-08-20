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
/* 全局视口锁：PC 与手机都固定 100% 视口，页面本体不产生拖拽/弹性位移。
   对话滚动、设置弹窗等都在各自的内部容器里滚，body 永久不滚。 */
html,
body {
  height: 100%;
  overflow: hidden !important;
  overscroll-behavior: none !important;
}
html:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])) { overflow-x: hidden !important; overscroll-behavior: none !important; }
[data-dsh-layout-scroll-root] { overscroll-behavior: none !important; }

/* ── 滚动条（全局）─────────────────────────────────────────────────────────
   Visibility is a user choice, not a side effect: bars only hide behind the
   explicit setting, scoped to the conversation scroller and the session list. */
html[data-dsh-layout-scrollbar='hidden'] [data-conversation-scroll],
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root],
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root] [data-conversation-scroll],
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-sidebar-list],
html[data-dsh-layout-scrollbar='hidden'] [role='dialog'][class*='_panel'] [class*='_options'],
html[data-dsh-layout-scrollbar='hidden'] [role='dialog'][class*='_panel'] [class*='_content'] {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
html[data-dsh-layout-scrollbar='hidden'] [data-conversation-scroll]::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root]::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root] [data-conversation-scroll]::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-sidebar-list]::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [role='dialog'][class*='_panel'] [class*='_options']::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [role='dialog'][class*='_panel'] [class*='_content']::-webkit-scrollbar {
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
html[data-dsh-layout-radius] :where(button, input, textarea, select, [data-composer-card], [data-queue-dock], [data-dsh-layout-composer-card], [class*='_bubble'], .dsh-layout-settings__card, .dsh-layout-segmented, .dsh-layout-field-status, [role='menu'], [role='dialog'], [role='tooltip'], [role='listbox']) {
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
html[data-dsh-layout-read-width='full'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])) { --dsh-chat-content-width: none; }
[data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero]))[data-dsh-layout-composer-width='full'] { --dsh-composer-card-max-width: none; }
/* The composer seat is sticky inside the conversation scroller, so it spans
   the client area minus a classic-scrollbar gutter while the header above
   spans the full column — stretching the seat by the measured gutter keeps
   both edges aligned. Skipped in 'above' mode: the seat pins to the
   conversation root there and stretches via left/right. */
html:not([data-dsh-layout-scroll-end='above']) [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero]))[data-dsh-layout-composer-width='full'] [data-composer-seat] {
  width: calc(100% + var(--dsh-layout-scroll-gutter, 0px));
}
[data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero]))[data-dsh-layout-composer-width='full'] [data-dsh-layout-workbench]:not([data-dsh-layout-hero]) {
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

/* ── 页面边距（自定义，desktop/mobile 独立）────────────────────────────────
   'custom' 模式下 ShellRuntime 写入 desktop/mobile 两套内联变量（显式值或
   预设）；这些规则直接钉到内容列 / 头部 / 输入区，与阅读宽度等其它特性无关。
   'auto' 模式移除属性与变量，页面回到 DSH 原生边距。 */
html[data-dsh-layout-padding-custom] [data-dsh-layout-chat-column][class*='_scroll'] {
  padding-left: var(--dsh-layout-pad-content-start) !important;
  padding-right: var(--dsh-layout-pad-content-end) !important;
}
html[data-dsh-layout-padding-custom] [data-dsh-layout-chrome-header],
html[data-dsh-layout-padding-custom] [data-dsh-layout-chrome-header] [class$='header'] {
  padding-inline-start: var(--dsh-layout-pad-header-start) !important;
  padding-inline-end: var(--dsh-layout-pad-header-end) !important;
}
html[data-dsh-layout-padding-custom] [data-dsh-layout-composer-root] {
  padding-left: var(--dsh-layout-pad-composer-start) !important;
  padding-right: var(--dsh-layout-pad-composer-end) !important;
}
@media (max-width: 767px) {
  html[data-dsh-layout-padding-custom] [data-dsh-layout-chat-column][class*='_scroll'] {
    padding-left: var(--dsh-layout-pad-mobile-content-start) !important;
    padding-right: var(--dsh-layout-pad-mobile-content-end) !important;
  }
  html[data-dsh-layout-padding-custom] [data-dsh-layout-chrome-header],
  html[data-dsh-layout-padding-custom] [data-dsh-layout-chrome-header] [class$='header'] {
    padding-inline-start: var(--dsh-layout-pad-mobile-header-start) !important;
    padding-inline-end: var(--dsh-layout-pad-mobile-header-end) !important;
  }
  html[data-dsh-layout-padding-custom] [data-dsh-layout-composer-root] {
    padding-left: var(--dsh-layout-pad-mobile-composer-start) !important;
    padding-right: var(--dsh-layout-pad-mobile-composer-end) !important;
  }
}

/* ── 收笔（止于输入区上方，纯几何）─────────────────────────────────────────
   The composer is pulled out of the scroll flow: the seat pins to the
   conversation root (absolute, escaping the static scroller) and the
   scroller's bottom margin tracks the seat's live height, so the log
   physically ends above the input. The composer itself keeps every native
   surface — radius, buttons, colors — untouched. Scoped through the
   workbench mark: the hero posture keeps the native in-flow composer. */
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])) { position: relative; }
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])):not(:has([data-conversation-composer-overlay])) [data-composer-seat] {
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
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])):not(:has([data-conversation-composer-overlay])):not([data-dsh-layout-composer-width='full']) [data-composer-seat] {
  right: var(--dsh-layout-scroll-gutter, 0px) !important;
}
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])):not(:has([data-conversation-composer-overlay])) [data-conversation-scroll] {
  margin-bottom: var(--dsh-layout-seat-height, 0px);
}
/* Trace view: DSH pins the seat inside the (positioned) scroller itself —
   our absolute override would glue it to the margin-raised scroller bottom
   and float it mid-air. Keep DSH's positioning and reserve the canvas tail
   with padding so the trace ends above the input. */
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])):has([data-conversation-composer-overlay]) [data-conversation-scroll] {
  padding-bottom: var(--dsh-layout-seat-height, 0px);
}
/* DSH pins the scroll-to-bottom slot sticky at calc(var(--dsh-composer-
   height) + 16px) from the scrollport bottom. Once the scroller ends at the
   seat top, that offset would lift the button by a full composer height;
   re-anchoring to the native 16px gap keeps its on-screen position
   unchanged. The button itself is an unpositioned flex child — only the
   slot carries the sticky offset. */
html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])):not(:has([data-conversation-composer-overlay])) [data-conversation-scroll] [class*='_toBottomSlot'] {
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
   so focus scrolling routes to the real scroller. Visually clip === hidden.
   Scoped to the settings panel (_panel): centered z-1000 modals portal to
   document.body and must stay untouched. On phones the settings-topbar
   runtime re-homes the nav into its topbar wrapper, so the wrapper must
   count as the marker too — a direct-child nav selector alone misses the
   restructured panel. */
[role='dialog'][class*='_panel']:has(> nav, > .dsh-layout-settings-topbar) { overflow: clip !important; }

/* 统计入口 */
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

/* 手机窄屏：官方 composer 的 trailing 行 flex:0 0 auto 永不收缩，注入的
   统计芯片（icon 26px / brief 标签 126px+）会把它顶出视口（360px 实测行内容
   333px > 行宽 270px）。窄屏下只需让我们的根可收缩 + brief 标签设上限
   （省略号已有）；trailing 本身的重排/收缩由手机端 grid 重排层
   （[data-dsh-layout-composer-trailing] 的两行 grid）接管，不额外干预。 */
@media (max-width: 767px) {
  .dsh-layout-root--toolbar { flex: 0 1 auto; min-width: 0; }
  .dsh-layout-trigger { max-width: 88px; }
  .dsh-layout-trigger--icon { flex: none; max-width: none; }
}
.dsh-layout-panel { z-index: 120; width: 304px; box-sizing: border-box; position: fixed; left: var(--dsh-layout-popover-x, 0px); padding: 14px 16px 12px; border: 1px solid var(--dsh-layout-line); border-radius: var(--dsh-layout-radius-lg); background: var(--dsh-layout-solid); color: var(--dsw-alias-label-secondary); box-shadow: 0 18px 48px light-dark(rgb(23 32 44 / .14), rgb(0 0 0 / .48)), 0 2px 8px rgb(0 0 0 / .06); font-size: 12px; line-height: 20px; overflow: visible !important; animation: dsh-layout-in .12s ease-out; }
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

/* ── 设置页 ─────────────────────────────────────────────────────────────────
   macOS System Settings anatomy, Quiet Structure tokens: flat surfaces only —
   no gradients, no glows, no recessed wells. A segmented tab control up top,
   then section labels over group boxes; each box stacks setting rows (label
   + description left, control right, 44px min-height, 1px hairline between).
   Motion vocabulary is exactly background-color/color at 120ms; radius rides
   the --dsh-layout-radius-user bridge. */
.dsh-layout-settings { display: grid; gap: 16px; max-width: 760px; color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-layout-settings * { box-sizing: border-box; }
@media (max-width: 767px) {
  /* 隐藏 DSH 头部里的「打开配置文件」动作（桌面操作，手机端拥挤） */
  [role='dialog'][class*='_panel'] [class$='_action'] { display: none !important; }
}
.dsh-layout-toprow { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
.dsh-layout-settings h2 { margin: 0 0 4px; font-size: 17px; font-weight: 650; letter-spacing: .01em; line-height: 24px; }
.dsh-layout-settings p { margin: 0; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 12px; line-height: 1.55; }
.dsh-layout-settings__actions { display: flex; flex: none; align-items: center; gap: 8px; }
/* Tab bar: one equal-width segmented control — quiet well, flat 10% active
   chip, hover stays at 4% background. */
.dsh-layout-tabs { display: inline-flex; justify-self: start; gap: 2px; padding: 3px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); }
.dsh-layout-tabs button { flex: 1 1 0; min-width: 84px; min-height: 30px; padding: 4px 24px; border: 0; border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-secondary, #b3b3b8); font: inherit; font-size: 13px; font-weight: 500; white-space: nowrap; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
.dsh-layout-tabs button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-layout-tabs button[aria-selected='true'] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
/* Content column: section label over a group box, groups breathe one beat. */
.dsh-layout-settings__body { display: grid; gap: 30px; }
.dsh-layout-settings__section { display: grid; gap: 8px; }
.dsh-layout-settings__group { margin: 0; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; font-weight: 500; letter-spacing: .05em; }
.dsh-layout-group { padding: 8px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); border-radius: var(--dsh-layout-radius-user-lg, 12px); background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03)); }
/* Unified card/group surface recipe across all workspace plugins:
   bg-layer-2 + 8% border + 12px radius — same as the usage stat cards
   and skill/mcp cards. Under the page material the groups frost like
   every other surface. */
html[data-dsh-layout-material='on'] .dsh-layout-group { background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent); border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent); -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%)); backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%)); }
@media (prefers-reduced-transparency: reduce) { html[data-dsh-layout-material='on'] .dsh-layout-group { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; background: var(--dsh-layout-mat-solid, var(--dsh-layout-glass-base, #16161a)) !important; } }
/* Setting row: label rail on the left, control right-aligned and vertically
   centered; 1px hairline between rows keeps the rhythm. Wide rows stack the
   control under the label at full width (editors, card grids, long segmented
   groups). */
.dsh-layout-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 24px; min-height: 52px; padding: 12px 18px; }
.dsh-layout-row + .dsh-layout-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.dsh-layout-row__label { display: grid; gap: 2px; min-width: 0; }
.dsh-layout-row__title { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0; }
.dsh-layout-row__title strong { font-size: 13px; font-weight: 500; line-height: 18px; }
.dsh-layout-row__desc { color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 16px; }
.dsh-layout-row__control { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px 10px; min-width: 0; }
.dsh-layout-row--wide { grid-template-columns: minmax(0, 1fr); }
.dsh-layout-row--wide .dsh-layout-row__control { justify-content: flex-start; margin-top: 6px; }
.dsh-layout-inline { display: inline-flex; flex: 1 1 100%; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px 10px; min-width: 0; }
.dsh-layout-row--wide .dsh-layout-inline { justify-content: flex-start; }
/* Switch: 36×20 capsule; ON reads as a 30% label-primary fill with a white
   knob — quiet on both themes. */
.dsh-layout-toggle { display: inline-flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 12px; white-space: nowrap; cursor: pointer; }
.dsh-layout-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.dsh-layout-toggle i { position: relative; flex: none; width: 36px; height: 20px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent); transition: background-color 120ms ease; }
.dsh-layout-toggle i::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; }
.dsh-layout-toggle input:checked + i { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 30%, transparent); }
.dsh-layout-toggle input:checked + i::after { transform: translateX(16px); }
.dsh-layout-toggle input:focus-visible + i { outline: 2px solid var(--dsw-alias-state-business-primary, #3678ea); outline-offset: 2px; }
/* Inner segmented control: small equal-weight capsules in a quiet 5% well;
   the pressed segment is the same flat 10% chip as the active tab. */
.dsh-layout-segmented { display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 2px; border-radius: var(--dsh-layout-radius-user, 8px); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent); }
.dsh-layout-segmented button { min-height: 24px; padding: 2px 10px; border: 0; border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px); background: transparent; color: var(--dsw-alias-label-secondary, #b3b3b8); font: inherit; font-size: 12px; white-space: nowrap; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
.dsh-layout-segmented button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-layout-segmented button[aria-pressed='true'] { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-layout-segmented--fill { width: 100%; }
.dsh-layout-segmented--fill button { flex: 1 1 0; min-width: 0; text-align: center; }
/* Slider: 2px track, 12px accent knob; --dsh-layout-fill (set inline) fills
   the travelled run in WebKit, ::-moz-range-progress covers Firefox. */
.dsh-layout-range { display: flex; align-items: center; gap: 10px; min-width: 0; }
.dsh-layout-range__name { flex: none; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; }
.dsh-layout-range input[type='range'] { -webkit-appearance: none; appearance: none; width: 160px; height: 20px; margin: 0; background: transparent; cursor: pointer; }
.dsh-layout-range input[type='range']::-webkit-slider-runnable-track { height: 2px; border-radius: 1px; background: linear-gradient(to right, var(--dsw-alias-state-business-primary, #3678ea) var(--dsh-layout-fill, 50%), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent) var(--dsh-layout-fill, 50%)); }
.dsh-layout-range input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; margin-top: -5px; border: 0; border-radius: 50%; background: var(--dsw-alias-state-business-primary, #3678ea); }
.dsh-layout-range input[type='range']::-moz-range-track { height: 2px; border-radius: 1px; background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); }
.dsh-layout-range input[type='range']::-moz-range-progress { height: 2px; border-radius: 1px; background: var(--dsw-alias-state-business-primary, #3678ea); }
.dsh-layout-range input[type='range']::-moz-range-thumb { width: 12px; height: 12px; border: 0; border-radius: 50%; background: var(--dsw-alias-state-business-primary, #3678ea); }
.dsh-layout-range input[type='range']:focus-visible { outline: 2px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #3678ea) 60%, transparent); outline-offset: 2px; }
.dsh-layout-range output { flex: none; min-width: 44px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.dsh-layout-row--wide .dsh-layout-range { flex: 1 1 100%; }
.dsh-layout-row--wide .dsh-layout-range input[type='range'] { flex: 1; width: auto; }
/* 材质档位: a 4-column card grid — name over hint; the selected card is a
   flat 8% fill with a 24% edge. */
.dsh-layout-tiers { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; width: 100%; }
.dsh-layout-tiers button { padding: 8px 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); text-align: left; font: inherit; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
.dsh-layout-tiers button:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dsh-layout-tiers button[aria-pressed='true'] { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); }
.dsh-layout-tiers strong { display: block; overflow: hidden; font-size: 12px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
.dsh-layout-tiers span { display: block; overflow: hidden; margin-top: 2px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
/* Metric chips: flat checkboxes; checked mirrors the selected card recipe. */
.dsh-layout-chips { display: flex; flex-wrap: wrap; gap: 4px 6px; width: 100%; }
.dsh-layout-chips label { display: inline-flex; align-items: center; gap: 5px; min-height: 24px; padding: 1px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 8px); background: transparent; color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 12px; white-space: nowrap; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
.dsh-layout-chips label:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-layout-chips label:has(input:checked) { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent); background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-layout-chips input { margin: 0; accent-color: var(--dsw-alias-state-business-primary, #3678ea); }
.dsh-layout-colors { display: flex; align-items: center; gap: 10px; }
.dsh-layout-colors input[type='color'] { width: 40px; height: 26px; padding: 2px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); border-radius: var(--dsh-layout-radius-user, 6px); background: transparent; cursor: pointer; }
.dsh-layout-colors input[type='color']:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
/* Text/URL fields: bare hairline fields, transparent at rest, 4% on hover. */
.dsh-layout-settings input[type='url'], .dsh-layout-settings input[type='text'] { width: 100%; min-height: 28px; padding: 4px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 6px); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; }
.dsh-layout-settings input[type='url']:hover, .dsh-layout-settings input[type='text']:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dsh-layout-settings input[type='url']:focus, .dsh-layout-settings input[type='text']:focus { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #3678ea) 55%, transparent); outline: none; }
.dsh-layout-settings input[type='url']::placeholder, .dsh-layout-settings input[type='text']::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
/* Custom page-padding editor: one compact row per area; number fields are
   60px, right-aligned, tabular. */
.dsh-layout-pads { display: grid; gap: 4px; width: 100%; }
.dsh-layout-pads__row { display: flex; align-items: center; gap: 10px; color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 12px; }
.dsh-layout-pads__row > span { flex: none; width: 44px; }
.dsh-layout-pads__row label { display: inline-flex; align-items: center; gap: 5px; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; }
.dsh-layout-pads__row input { width: 60px; min-height: 24px; padding: 2px 6px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent); border-radius: var(--dsh-layout-radius-user, 6px); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; }
.dsh-layout-pads__row input:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
.dsh-layout-pads__row input:focus { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #3678ea) 55%, transparent); outline: none; }
.dsh-layout-pads__hint { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; }
/* Secondary actions (file pickers, 恢复默认): one quiet recipe — hairline
   edge, transparent fill, 4% background on hover. */
.dsh-layout-file-button, .dsh-layout-settings__reset { display: inline-flex; align-items: center; justify-content: center; min-height: 26px; padding: 3px 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); border-radius: var(--dsh-layout-radius-user, 6px); background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5); font: inherit; font-size: 12px; white-space: nowrap; cursor: pointer; user-select: none; transition: background-color 120ms ease, color 120ms ease; }
.dsh-layout-file-button:hover, .dsh-layout-settings__reset:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }
label:has(> .dsh-layout-file-button) { display: inline-flex; }
/* Status badges: flat accent tints, no rings. */
.dsh-layout-dirty { flex: none; display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #3678ea) 14%, transparent); color: var(--dsw-alias-state-business-primary, #6f9df7); font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.dsh-layout-field-status { flex: none; display: inline-flex; align-items: center; height: 16px; padding: 0 6px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #3678ea) 12%, transparent); color: var(--dsw-alias-state-business-primary, #6f9df7); font-size: 10px; font-weight: 500; white-space: nowrap; }
.dsh-layout-field-reset { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; padding: 0; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent); border-radius: 999px; background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e); font-size: 11px; line-height: 1; cursor: pointer; transition: background-color 120ms ease, color 120ms ease; }
.dsh-layout-field-reset:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
/* Settings-panel motion guard: the whole panel drops to zero transition when
   the user prefers reduced motion (the popover rules below are separate). */
@media (prefers-reduced-motion: reduce) {
  .dsh-layout-settings, .dsh-layout-settings * { transition: none !important; }
}
@media (prefers-reduced-motion: reduce) { .dsh-layout-panel { animation: none; } .dsh-layout-trigger { transition: none; } }

/* ── 窄屏（< 768px）─────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  /* ── 原生对话顶栏加固 ─────────────────────────────────────────────────
     The stock conversation header keeps its action clusters on one
     no-wrap flex line (headerActions / headerUtilities are flex:0 0 auto),
     so once plugins and the agent preset register buttons (session stats,
     compact, subagents, background tasks, share…) the row overflows the
     390px viewport and the buttons stack over each other. Let the row
     wrap, shrink the breadcrumb trail, and keep the action clusters
     right-aligned on their wrapped lines. Class names are CSS-module
     hashes, so we match the stable _semantic suffixes instead. */
  [class*='_titleRow'] { flex-wrap: wrap; row-gap: 6px; }
  [class*='_titleCluster'] { flex: 1 1 100%; min-width: 0; }
  [class*='_crumbs'] { min-width: 0; }
  [class*='_crumb']:not([class*='_crumbSep']) { max-width: 44vw; }
  [class*='_headerActions'],
  [class*='_headerUtilities'] {
    flex-wrap: wrap;
    justify-content: flex-end;
    margin-left: auto;
    gap: 6px;
  }
  [class*='_headerUtilities'] { margin-left: 0; }
  /* Popover panels anchored to those buttons (subagents / background
     tasks) can compute desktop-sized offsets; clamp any absolutely or
     fixed positioned popover to the phone viewport so it never spills. */
  [class*='_popover'], [role='menu'] {
    max-width: calc(100vw - 24px);
    box-sizing: border-box;
  }

  /* 窄屏：标题行纵排、tab 铺满、设置行改为上下堆叠、档位卡 2 列。 */
  .dsh-layout-toprow { align-items: stretch; flex-direction: column; }
  .dsh-layout-settings__actions { margin-top: 0; justify-content: flex-start; }
  .dsh-layout-tabs { display: flex; width: 100%; }
  .dsh-layout-row { grid-template-columns: minmax(0, 1fr); }
  .dsh-layout-row__control { justify-content: flex-start; margin-top: 6px; }
  .dsh-layout-inline { justify-content: flex-start; }
  .dsh-layout-tiers { grid-template-columns: repeat(2, minmax(0, 1fr)); }

  /* DSH's outer settings panel is desktop row-based by default (188px nav
     + a tiny content column at phone widths). SettingsTopbarRuntime wraps the
     nav + close into a 52px topbar; the content scrolls below. */
  /* Scoped to the settings dialog: it owns a nav rail — and on phones the
     settings-topbar runtime moves that nav into its topbar wrapper, so the
     runtime-injected topbar must count as the marker too. DSH's context-usage
     panel is also role=dialog + _panel but owns neither — the broad selector
     blew it up to a fullscreen sheet (太大/太高溢出). */
  [role='dialog'][class*='_panel']:has(> nav, > .dsh-layout-settings-topbar) {
    width: 100vw !important;
    max-width: none !important;
    height: 100dvh !important;
    max-height: none !important;
    border-radius: 0 !important;
    flex-direction: column !important;
  }
  .dsh-layout-settings-topbar {
    display: flex;
    align-items: center;
    flex: none;
    height: 52px;
    margin-bottom: 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--dsh-layout-line) 55%, transparent);
  }
  .dsh-layout-settings-tabs {
    flex: 1;
    min-width: 0;
    width: auto !important;
    height: 100%;
    padding: 0 !important;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    scrollbar-width: thin;
  }
  .dsh-layout-settings-tabs::-webkit-scrollbar { height: 3px; }
  .dsh-layout-settings-tabs::-webkit-scrollbar-thumb { border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-tertiary) 35%, transparent); }
  .dsh-layout-settings-tabs [class*='_navTitle'] { display: none !important; }
  .dsh-layout-settings-tabs [class*='_navList'] {
    display: flex !important;
    flex-direction: row !important;
    align-items: center;
    width: max-content !important;
    min-width: 100%;
    height: 100%;
    gap: 4px;
    padding: 8px 0 !important;
  }
  .dsh-layout-settings-tabs [class*='_navCell'] {
    flex: none !important;
    width: auto !important;
    min-width: max-content;
    min-height: 34px;
    padding-inline: 12px !important;
    white-space: nowrap;
  }
  .dsh-layout-settings-tabs [class*='_navLabel'] { width: auto !important; white-space: nowrap; }
  .dsh-layout-settings-close {
    flex: 0 0 52px;
    align-self: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dsh-layout-settings-content {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    /* 顶栏与内容的间距由 topbar 的 margin-bottom 提供（16px）。 */
  }
  .dsh-layout-settings-content > [class*='_options'] {
    min-width: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding-inline: 16px;
  }

  /* Narrow header wrap: the crowded row flows to a second line instead of
     overlapping while the setting is on (default). */
  html[data-dsh-layout-narrow-wrap] [data-dsh-layout-chrome-header] > *:first-child {
    flex-wrap: wrap;
  }

  /* 繁忙时快捷提交（手机）：agent 运行中原生主按钮变为「停止」，排队/插话
     没有入口（「繁忙时 Enter 键行为」只管键盘）。工具行右缘注入
     排队/插话 胶囊（busy-submit runtime，点击合成 Enter 走原生策略）。 */
  .dsh-layout-busy-pill { display: inline-flex; flex: none; gap: 6px; margin-inline-start: auto; align-self: center; }
  .dsh-layout-busy-pill button { height: 26px; padding: 0 12px; border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 72%, transparent); border-radius: 999px; background: color-mix(in srgb, var(--dsh-layout-subtle) 88%, transparent); color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1; cursor: pointer; }
  .dsh-layout-busy-pill button:active { transform: translateY(1px); }

  /* 输入面板（手机）：the native row squeezes tools to 4px while trailing
     controls keep their intrinsic widths, so buttons overlap. Use the stable
     adapter marks to create two intentional rows: commands/permission above,
     model/context/send below. */
  [data-dsh-layout-composer-actions] {    display: grid !important;
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
    flex-wrap: wrap;
    grid-column: 1 / -1;
    grid-row: 1;
    min-width: 0 !important;
    width: auto !important;
    gap: 6px !important;
  }
  [data-dsh-layout-composer-tools] > * { flex: none !important; min-width: 0 !important; }
  [data-dsh-layout-composer-trailing] {
    display: flex !important;
    grid-column: 1 / -1;
    grid-row: 2;
    align-items: center;
    gap: 8px;
    min-width: 0 !important;
    width: auto !important;
    height: auto !important;
  }
  [data-dsh-layout-composer-trailing] > * { min-width: 0 !important; }
  /* 视觉裁切放在 trigger（按钮）层：菜单（_menu）是 absolute 挂在芯片 root 下的，
     root 一旦 overflow:hidden 会连同菜单一起裁掉（推理强度/模型菜单点不开）。
     按钮自身 overflow:hidden 即可实现窄屏省略号，root 保持 visible。 */
  /* 统计触发与发送键固定自然宽度；模型/推理强度 trigger 吃掉剩余宽度，
     标签不再被压成 30px（原来是三列 grid，模型标签被截成 “hig”）。 */
  [data-dsh-layout-composer-trailing] .dsh-layout-trigger,
  [data-dsh-layout-composer-trailing] [class*='_primary'] { flex: none; }
  [data-dsh-layout-composer-trailing] [class*='_primary'] { width: 36px !important; min-width: 36px !important; }
  [data-dsh-layout-composer-trailing] [class*='_root'] { flex: 1 1 auto; min-width: 0 !important; }
  [data-dsh-layout-composer-trailing] [class*='_trigger']:not(.dsh-layout-trigger) { flex: 1 1 auto; min-width: 0 !important; max-width: 100%; overflow: hidden; }
  [data-dsh-layout-composer-trailing] [class*='_triggerLabel'] { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  [data-dsh-layout-composer-tools] [class*='_triggerLabel'] { max-width: 118px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* 每条 AI 回复末尾的运行统计脚注（DSH MessageIconActions）：手机上长文字
     太突兀，把 timeEnd 折叠成与前面操作图标一致的 28px 小图标（时钟），
     保持单行不换行。 */
  [data-time-hover-root] [class*='timeEnd'] {
    width: 28px;
    height: 28px;
    padding: 0 !important;
    margin-inline-start: 4px;
    font-size: 0 !important;
    line-height: 28px;
    white-space: nowrap !important;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  [data-time-hover-root] [class*='timeEnd']::before {
    content: '';
    width: 15px;
    height: 15px;
    background: currentColor;
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='9' fill='none' stroke='black' stroke-width='2'/%3E%3Cpath d='M12 7v5l3 2' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='9' fill='none' stroke='black' stroke-width='2'/%3E%3Cpath d='M12 7v5l3 2' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
  }
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
.dsh-layout-mobile-sidebar-mask,
.dsh-layout-mobile-sidebar-close { display: none; }
@media (max-width: 767px) {
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-frame] {
    grid-template-columns: minmax(0, 1fr) var(--dsh-layout-details, 0px) !important;
  }
  /* 手机上把 AppFrame 锁到动态视口高度：DSH 用 height:100%（解析到布局视口），
     iOS 地址栏收起/展开时页面会超出可视区、可上下滚动。 */
  [data-dsh-layout-frame] {
    height: 100vh;
    height: 100dvh;
  }
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-center-col] { grid-column: 1; min-width: 0; }
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-details-col] { grid-column: 2; }
  /* 全屏形态：抽屉铺满整个视口（100% 宽 + safe-area 内边距）。
     float 模式（任意宽度生效）的定位/面板规则在媒体查询外的通用层，
     这里只覆盖「铺满」这一窄屏专属差异。 */
  html[data-dsh-layout-mobile-sidebar]:not([data-dsh-layout-sidebar-float]) [data-dsh-layout-sidebar-col] {
    width: 100% !important;
    border-radius: 0 !important;
    padding-block: env(safe-area-inset-top, 0px) env(safe-area-inset-bottom, 0px);
  }
  html[data-dsh-layout-mobile-sidebar]:not([data-dsh-layout-sidebar-float]) [data-dsh-layout-sidebar-col] > div > div {
    border-radius: 0 !important;
  }
}

/* ── 通用层（任意视口）：off-canvas 抽屉的定位、面板、开关、mask ───────────────
   属性 data-dsh-layout-mobile-sidebar 由运行时在 fullscreen（窄屏）或
   float（任意宽度）时写入。这里的规则不依赖视口宽：抽屉永远 fixed 贴左、
   隐藏于画布外（inset-inline-start: -100%），打开态归零；mask/handle/X 按钮
   同理。PC 窄窗选 float 时，内容列 grid 独占（见下 float 专属规则），
   侧边栏悬浮其上，内容永不重排。 */
  /* Off-canvas via inset-inline-start, NOT transform: a transformed ancestor
     becomes the containing block for fixed-position descendants, and DSH
     mounts its settings dialog inside the sidebar column — with a transform
     the dialog gets dragged off-screen / mispositioned with the drawer
     (设置 / 添加模型等弹框弹不出来). inset keeps fixed overlays viewport-anchored. */
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] {
    position: fixed !important;
    z-index: 42;
    inset-block-start: 0;
    /* 全高必须显式锚定：fixed 脱离了 grid，item 不再被拉伸，
       只写 inset-block-start 会让高度随内容塌缩（抽屉底部悬空）。 */
    inset-block-end: 0;
    inset-inline-start: -100%;
    box-sizing: border-box;
    /* Deterministically opaque: the drawer must never show the scrim (blur +
       dim) through a translucent surface — that reads as a foggy mask. */
    background: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-layer-2)) !important;
    overflow: hidden;
    transition: inset-inline-start 220ms ease;
    box-shadow: var(--dsw-shadow-lv2);
  }
  html[data-dsh-layout-mobile-sidebar][data-dsh-layout-mobile-sidebar-open] [data-dsh-layout-sidebar-col] { inset-inline-start: 0; }
  /* Lock the page scroll while the fullscreen drawer is open: otherwise the
     conversation behind keeps scrolling (and iOS toggles the URL bar),
     pulling the fixed drawer out of its full viewport. */
  html[data-dsh-layout-mobile-sidebar-open],
  html[data-dsh-layout-mobile-sidebar-open] body {
    overflow: hidden !important;
  }
  /* The app panel inside keeps its own fixed width and chrome; stretch it
     edge to edge so the drawer reads as one flat surface. The intermediate
     wrapper is display:contents, so the panel lays out against the column. */
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] > div > div {
    width: 100% !important;
    height: 100%;
    padding-inline: 8px !important;
    border: 0 !important;
    box-shadow: none !important;
    background: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-layer-2)) !important;
  }
  /* Frosted material drives the drawer too: clear the opaque fills so the
     material ::before sheet (blur/opacity/saturation from the 材质 setting)
     shows through the fullscreen drawer. */
  html[data-dsh-layout-mobile-sidebar][data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col],
  html[data-dsh-layout-mobile-sidebar][data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col] > div > div {
    background: transparent !important;
  }
  /* Compact native-app list rows; inline nodes ignore min-height, so the
     suffix match can only affect the row boxes themselves. */
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] [class*='projectRow'],
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] [class*='sessionRow'] {
    min-height: 44px;
  }
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] button[class*='newSession'] {
    min-height: 44px;
  }
  /* 工作区/会话树（官方 qDHVXG_list，role=tree）：官方 padding-right 是
     calc(--dsh-session-list-edge-inset - 10px)，随 --dsh-sidebar-inline-padding
     动态变化，抽屉内计算值不稳定（真机上过长，激活行背景贴边）。固定 8px。 */
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] [role='tree'] {
    padding-right: 8px !important;
  }

  /* 工作区区块头的操作按钮（新增工作区 + / 搜索 / 更多）：DSH 宽态下把
     headerActions 限到 60px 并溢出裁剪，而触摸屏没有 hover 展开，导致最左
     的「新增工作区」+ 被裁掉。off-canvas 抽屉（fullscreen 与 float）里
     放开，三个按钮都可见。 */
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] [class*='headerActions'] {
    max-width: none !important;
  }

  /* Edge handle: a slim bar at mid-height that OPENS the drawer; hidden once
     open (closing moves to the top-right X button). */
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-trigger {
    position: fixed;
    z-index: 44;
    inset-block-start: 50%;
    inset-inline-start: 0;
    width: 6px;
    height: 60px;
    margin-block-start: -30px;
    padding: 0;
    border: 0;
    border-radius: 0 6px 6px 0;
    background: color-mix(in srgb, var(--dsw-alias-bg-layer-3) 82%, transparent);
    color: var(--dsw-alias-label-primary);
    box-shadow: var(--dsw-shadow-lv1);
    -webkit-backdrop-filter: blur(14px) saturate(125%);
    backdrop-filter: blur(14px) saturate(125%);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  /* Hidden while the drawer is open — closing moves to the drawer's own
     X (and the mask). Previously only the comment claimed this. */
  /* The floated / drawer sidebar's close must always be reachable while
     it is open — author display wins over the runtime's hidden flag, so
     the X cannot be lost to a state/attribute mismatch. */
  html[data-dsh-layout-mobile-sidebar-open] .dsh-layout-mobile-sidebar-close {
    display: grid;
    place-items: center;
  }
  html[data-dsh-layout-mobile-sidebar-open] .dsh-layout-mobile-sidebar-trigger {
    display: none;
  }
  /* Enlarged invisible tap target for the open handle. */
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-trigger::before {
    content: '';
    position: absolute;
    inset: -12px -32px -12px 0;
  }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-trigger > span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  /* Close button: a bare X (no chrome) pinned to the drawer's top row —
     vertically centered on the OFFICIAL logo row (hHd-Xa_logoRow, 60px tall
     + 8px padding both sides). Positioning off env(safe-area) + 12px was a
     constant guess that ignored the row's own padding; anchoring to the row
     guarantees alignment with the brand/logo in every mode.
     Horizontal: fullscreen = viewport edge + 12px; float = measured from the
     floating panel's right edge (100vw - min(320px, 86vw) + 12px) so the X
     sits ON the panel, flush with the brand row, never over the content. */
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-close {
    position: absolute;
    z-index: 46;
    top: 22px;
    inset-inline-end: 12px;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--dsw-alias-label-secondary);
    box-shadow: none;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  /* The drawer column owns a containing block (fixed + overflow hidden), so
     absolute keeps the X glued to the drawer even while it slides. */
  html[data-dsh-layout-mobile-sidebar] [data-dsh-layout-sidebar-col] { position: fixed !important; }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-close {
    top: calc(env(safe-area-inset-top, 0px) + 22px);
  }
  html[data-dsh-layout-mobile-sidebar][data-dsh-layout-sidebar-float] .dsh-layout-mobile-sidebar-close {
    inset-inline-end: 12px;
  }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-close > span {
    position: relative;
    width: 14px;
    height: 14px;
  }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-close > span::before,
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-close > span::after {
    content: '';
    position: absolute;
    inset-inline-start: 1px;
    inset-block-start: 6px;
    width: 12px;
    height: 2px;
    background: currentColor;
    border-radius: 1px;
  }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-close > span::before { transform: rotate(45deg); }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-close > span::after { transform: rotate(-45deg); }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-close[hidden] { display: none; }
  /* 设置弹窗等对话框打开时，抽屉的 X 与对话框的 X 重叠——隐藏抽屉的 */
  html:has([role='dialog']) .dsh-layout-mobile-sidebar-close { display: none !important; }
  /* Mask: a quiet dim BELOW #root's stacking context. #root lifts to z:1
     when a background or material is on, which would trap the drawer (z:42)
     under a z:41 mask — drop the mask to z:0 so it never fogs or covers the
     drawer, and never blurs. */
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-mask {
    position: fixed;
    z-index: 0;
    inset: 0;
    border: 0;
    padding: 0;
    background: color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    display: block;
  }
  html[data-dsh-layout-mobile-sidebar] .dsh-layout-mobile-sidebar-mask[hidden] { display: none; }

/* ── float 模式（任意宽度）：定宽悬浮面板 + 内容列独占 grid ─────────────────
   侧边栏不挤压内容：内容列永远独占第一列，侧边栏是 fixed 定宽浮层
   （min(320px, 86vw)），盖在内容上方；抽屉内是 DSH 真实宽态内容。 */
html[data-dsh-layout-sidebar-float] [data-dsh-layout-frame] {
  grid-template-columns: minmax(0, 1fr) var(--dsh-layout-details, 0px) !important;
}
html[data-dsh-layout-sidebar-float] [data-dsh-layout-center-col] { grid-column: 1; min-width: 0; }
html[data-dsh-layout-sidebar-float] [data-dsh-layout-details-col] { grid-column: 2; }
html[data-dsh-layout-sidebar-float] [data-dsh-layout-sidebar-col] {
  width: min(320px, 86vw) !important;
  border-radius: 0 14px 14px 0 !important;
}

/* ── 触屏提示气泡 ─────────────────────────────────────────────────────────────
   DSH's hover/focus tooltips have no touch counterpart: a tap flashes the
   bubble and it sticks until something else is tapped. Devices without a
   hover capability never benefit from tooltips — hide them outright. */
@media (hover: none) {
  [role='tooltip'] { display: none !important; }
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
