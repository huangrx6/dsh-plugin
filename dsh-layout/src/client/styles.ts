import { TOKENS_CSS } from "./tokens.ts";

const STYLE_ID = "dsh-layout-styles";

/**
 * Layout, composer and background overrides.
 *
 * Material architecture (macOS-style, four layers):
 *   L0 background canvas  — fixed color/image/video, never scrolls, no events
 *   L1 material layer     — sidebar / header / content column / footer strip;
 *                           the ONLY layers allowed to backdrop-filter
 *   L2 fill layer         — composer card, dock strips, buttons: translucent
 *                           fills stacked on L1, never their own backdrop
 *                           (Apple: avoid glass on glass; fills are cheaper)
 *   L3 popovers           — stats panel etc.: opaque, readability first
 *
 * Every rule keys off a plugin-owned data attribute that a JS pass placed on
 * a STABLE native DSH landmark — never off generated CSS-module hashes, and
 * never a document-wide `*` rewrite. Disabling a section removes its
 * attributes and variables, so the stylesheet degrades to native on its own.
 *
 * Widths ride the native custom properties (--dsh-chat-content-width,
 * --dsh-composer-card-max-width) so the content column, composer card and
 * dock strips always agree.
 */
const CSS = `${TOKENS_CSS}

/* ── Behaviour guards ────────────────────────────────────────────────────── */
html:has([data-dsh-layout-workbench]) { overflow-x: hidden !important; overscroll-behavior: none !important; }
[data-dsh-layout-scroll-root] { overscroll-behavior: none !important; }

/* Scrollbar visibility is a user choice, not a side effect: it only hides
   behind the explicit setting, scoped to the conversation scroller. */
html[data-dsh-layout-scrollbar='hidden'] [data-conversation-scroll],
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root],
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root] [data-conversation-scroll] {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
html[data-dsh-layout-scrollbar='hidden'] [data-conversation-scroll]::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root]::-webkit-scrollbar,
html[data-dsh-layout-scrollbar='hidden'] [data-dsh-layout-scroll-root] [data-conversation-scroll]::-webkit-scrollbar {
  width: 0 !important; height: 0 !important; display: none !important;
}

/* ── Message bubbles ─────────────────────────────────────────────────────────
   Glass mode swaps DSH's blue-tinted fill for a frosted chip: the theme-base
   tint at a light opacity, one hairline to mark the edge, and — with a page
   background — the content material's blur so the bubble reads whatever is
   behind it. Hash-suffix match scoped to the marked column; a rename
   degrades to the native fill. */
html[data-dsh-layout-bubble='glass'] [data-dsh-layout-chat-column] [class*='_bubble'] {
  background: color-mix(in srgb, var(--dsh-layout-glass-base) 55%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 60%, transparent) !important;
  border-radius: var(--dsh-layout-radius-user-lg, 18px) !important;
  box-shadow: none !important;
}
html[data-dsh-layout-bubble='solid'] [data-dsh-layout-chat-column] [class*='_bubble'] {
  background: var(--dsh-layout-solid) !important;
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 60%, transparent) !important;
  border-radius: var(--dsh-layout-radius-user-lg, 18px) !important;
  box-shadow: none !important;
}
html[data-dsh-layout-bubble='transparent'] [data-dsh-layout-chat-column] [class*='_bubble'] {
  background: transparent !important;
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 60%, transparent) !important;
  border-radius: var(--dsh-layout-radius-user-lg, 18px) !important;
  box-shadow: none !important;
}
/* ── Trace tab ───────────────────────────────────────────────────────────────
   The trace view marks its scroller with a composer-overlay attribute, so
   both rules scope to it without touching the conversation. DSH paints the
   canvas as stacked white layers (_root/_plot/_split suffix classes); the
   clear mode drops them so the content glass shows through, and the inset
   mode pads the canvas root to the header row's 28px rhythm. */
html[data-dsh-layout-trace-bg='clear'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [class$='_root'],
html[data-dsh-layout-trace-bg='clear'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [class$='_plot'],
html[data-dsh-layout-trace-bg='clear'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [class$='_split'] {
  background: transparent !important;
}
html[data-dsh-layout-trace-bg='clear'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) [class$='_table'] {
  background: transparent !important;
}
/* DSH's trace seat reserves the scrollbar gutter (right: var(--dsh-scrollbar-
   width), 8px) so it never sits under the scrollbar. Once the conversation
   scrollbar is hidden that gutter is dead space — stretch the seat flush. */
html[data-dsh-layout-scrollbar='hidden'] [data-conversation-scroll]:has([data-conversation-composer-overlay]) > [data-composer-seat] {
  right: 0 !important;
}
/* The ledger pane's 202px tail keeps the last rows clear of the floating
   input; with the above-plate reserving its own tail it is dead space. */
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
  padding-left: calc(var(--dsh-layout-pad-content-start, 28px) / var(--dsh-layout-scale-factor, 1)) !important;
  padding-right: calc(var(--dsh-layout-pad-content-end, 28px) / var(--dsh-layout-scale-factor, 1)) !important;
}

html[data-dsh-layout-bubble='glass'][data-dsh-layout-bg]:not([data-dsh-layout-fluid]) [data-dsh-layout-chat-column] [class*='_bubble'] {
  -webkit-backdrop-filter: blur(var(--dsh-glass-content-blur, 16px)) saturate(var(--dsh-glass-content-sat, 120%));
  backdrop-filter: blur(var(--dsh-glass-content-blur, 16px)) saturate(var(--dsh-glass-content-sat, 120%));
}

/* ── Global radius ──────────────────────────────────────────────────────────
   Off unless set. While set, the token pair follows the user value with a
   concentric offset (cards rounder than controls) and a curated whitelist of
   stable surfaces picks it up; round shapes (avatars, switches) stay round. */
html[data-dsh-layout-radius] {
  --dsh-layout-radius: var(--dsh-layout-radius-user);
  --dsh-layout-radius-lg: var(--dsh-layout-radius-user-lg);
}
html[data-dsh-layout-radius] :where(button, input, textarea, select, [data-composer-card], [data-queue-dock], [data-dsh-layout-dock-item], [data-dsh-layout-composer-card], [role='menu'], [role='dialog'], [role='tooltip'], [role='listbox']) {
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

/* ── Reading width / message density / content scale ─────────────────────── */
html[data-dsh-layout-read-width='custom'] [data-dsh-layout-chat-root] { --dsh-chat-content-width: var(--dsh-layout-read-width); }
/* 'none' poisons the hero card's calc(none + 32px) measure (the welcome
   card collapses to its content width) — the full measure only applies once
   the workbench is marked, so the hero keeps the native 748px rhythm. */
html[data-dsh-layout-read-width='full'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]) { --dsh-chat-content-width: none; }
html[data-dsh-layout-density] [data-dsh-layout-chat-column] { gap: var(--dsh-layout-density) !important; }
html[data-dsh-layout-scale] [data-conversation-scroll] { zoom: var(--dsh-layout-scale); }

/* ── Page background (L0) ───────────────────────────────────────────────────
   The native shell paints opaque surfaces (frame, conversation root, seat);
   when a background is set, lift #root above the fixed canvas and neutralize
   exactly the surfaces that are "the page" — never component surfaces. Glass
   rules below come after this block so materials win where they apply. */
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

/* ── Frosted materials (L1) ─────────────────────────────────────────────────
   Parameters arrive as CSS variables from the settings store
   (--dsh-glass-<area>, -blur, -sat, -solid); 'fluid' mode strips every blur,
   and reduced-transparency / no-backdrop-support fall back to the solid
   variant so text contrast never depends on the effect.

   One continuous sheet owns the whole center region: the content material
   paints a single layer spanning the header AND the conversation, and the
   header never paints its own material — stacking a second sheet behind the
   header would double the tint there and the top strip would no longer match
   the conversation area.

   Two paint modes split on the page background:
   - NATIVE background: the material is a translucent tint painted directly
     on the host surface (chat-root wraps the header too). Blurring a flat
     native page is invisible, and a real ancestor with backdrop-filter would
     become the containing block for fixed-position descendants — DSH renders
     its settings dialog inside the sidebar column, so no filter may ever sit
     on these hosts. Nothing is cleared, so every native backing (including
     the dialog panel's) stays.
   - WITH a background: the full material (tint + blur + saturation) paints
     on a ::before layer at z-index:-1 inside the #root stacking context,
     behind the host's content and above the L0 canvas. The hosts get
     position:relative and nothing else — no z-index, no isolation: a
     stacking context on a column would cap the dialog's z-index:1000 below
     the composer stack's native z-index:1 and the input box would paint
     over open dialogs. */
html[data-dsh-layout-sidebar='glass'] [data-dsh-layout-sidebar-col] > * > * {
  background-color: transparent !important;
  background-image: none !important;
}
/* The native session-list bottom fade gradients toward the sidebar fill
   color; over a custom material it reads as a visible band, so it goes away
   with the material. Hash-suffix match scoped inside our marked column —
   a rename degrades to the native fade. */
html[data-dsh-layout-sidebar='glass'] [data-dsh-layout-sidebar-col] [class*='_fade'] {
  background: none !important;
}
/* The drag handle between sidebar and content, hidden on request. */
html[data-dsh-layout-sidebar-divider='hidden'] [data-dsh-layout-frame] > [data-side='sidebar'] {
  display: none !important;
}
html[data-dsh-layout-sidebar='glass'] [data-dsh-layout-sidebar-col],
html[data-dsh-layout-content='glass'] [data-dsh-layout-center-col] {
  position: relative;
}
html[data-dsh-layout-sidebar='glass']:not([data-dsh-layout-bg]) [data-dsh-layout-sidebar-col] { background: var(--dsh-glass-sidebar-solid) !important; }
/* Native page: the tint goes down as the opaque base color — there is
   nothing behind a flat native page to blend with, and translucency here
   only invites #fff-vs-#fafafa mismatches between the conversation and the
   input base. One variable feeds both (see the embedded-footer block). */
html[data-dsh-layout-content='glass']:not([data-dsh-layout-bg]) [data-dsh-layout-chat-root] { background: var(--dsh-glass-content-solid) !important; }

html[data-dsh-layout-bg][data-dsh-layout-sidebar='glass'] [data-dsh-layout-sidebar-col]::before,
html[data-dsh-layout-bg][data-dsh-layout-content='glass'] [data-dsh-layout-center-col]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
html[data-dsh-layout-bg][data-dsh-layout-sidebar='glass'] [data-dsh-layout-sidebar-col]::before { background: var(--dsh-glass-sidebar); }
html[data-dsh-layout-bg][data-dsh-layout-content='glass'] [data-dsh-layout-center-col]::before { background: var(--dsh-glass-content); }
html[data-dsh-layout-bg][data-dsh-layout-sidebar='glass']:not([data-dsh-layout-fluid]) [data-dsh-layout-sidebar-col]::before {
  -webkit-backdrop-filter: blur(var(--dsh-glass-sidebar-blur)) saturate(var(--dsh-glass-sidebar-sat));
  backdrop-filter: blur(var(--dsh-glass-sidebar-blur)) saturate(var(--dsh-glass-sidebar-sat));
}
html[data-dsh-layout-bg][data-dsh-layout-content='glass']:not([data-dsh-layout-fluid]) [data-dsh-layout-center-col]::before {
  -webkit-backdrop-filter: blur(var(--dsh-glass-content-blur)) saturate(var(--dsh-glass-content-sat));
  backdrop-filter: blur(var(--dsh-glass-content-blur)) saturate(var(--dsh-glass-content-sat));
}

/* Accessibility and capability fallbacks: the material keeps its tint at full
   opacity and drops the blur entirely — readable everywhere, cheap always. */
@media (prefers-reduced-transparency: reduce) {
  html[data-dsh-layout-sidebar='glass'] [data-dsh-layout-sidebar-col]::before,
  html[data-dsh-layout-content='glass'] [data-dsh-layout-center-col]::before {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
  html[data-dsh-layout-sidebar='glass']:not([data-dsh-layout-bg]) [data-dsh-layout-sidebar-col] { background: var(--dsh-glass-sidebar-solid) !important; }
  html[data-dsh-layout-content='glass']:not([data-dsh-layout-bg]) [data-dsh-layout-chat-root] { background: var(--dsh-glass-content-solid) !important; }
  html[data-dsh-layout-bg][data-dsh-layout-sidebar='glass'] [data-dsh-layout-sidebar-col]::before { background: var(--dsh-glass-sidebar-solid) !important; }
  html[data-dsh-layout-bg][data-dsh-layout-content='glass'] [data-dsh-layout-center-col]::before { background: var(--dsh-glass-content-solid) !important; }
  html[data-dsh-layout-bubble='glass'] [data-dsh-layout-chat-column] [class*='_bubble'] {
    background: var(--dsh-layout-solid) !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
}
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  html[data-dsh-layout-sidebar='glass']:not([data-dsh-layout-bg]) [data-dsh-layout-sidebar-col] { background: var(--dsh-glass-sidebar-solid) !important; }
  html[data-dsh-layout-content='glass']:not([data-dsh-layout-bg]) [data-dsh-layout-chat-root] { background: var(--dsh-glass-content-solid) !important; }
  html[data-dsh-layout-bg][data-dsh-layout-sidebar='glass'] [data-dsh-layout-sidebar-col]::before { background: var(--dsh-glass-sidebar-solid) !important; }
  html[data-dsh-layout-bg][data-dsh-layout-content='glass'] [data-dsh-layout-center-col]::before { background: var(--dsh-glass-content-solid) !important; }
  html[data-dsh-layout-bubble='glass'] [data-dsh-layout-chat-column] [class*='_bubble'] {
    background: var(--dsh-layout-solid) !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }
}

/* ── Settings dialog hardening ───────────────────────────────────────────────
   DSH renders the settings dialog panel with overflow:hidden, which still
   makes it a programmatically scrollable box. When a toggle re-renders the
   page taller, the browser's focus scrolling (reveal the focused checkbox)
   scrolls that hidden panel itself and displaces the whole dialog content
   above the panel's top edge. overflow:clip is not a scroll container at
   all, so focus scrolling routes to the real scroller (.VOzbGW_options)
   and the panel can never be displaced. Visually clip === hidden. */
[role='dialog'] { overflow: clip !important; }
/* Settings dialog panel size. The overlay centers the panel, so only the
   box changes; DSH's own max-width (100vw − 48px) still caps the width and
   the height keeps its viewport guard via min(). */
html[data-dsh-layout-dialog] [role='dialog'] {
  width: var(--dsh-layout-dialog-width, 800px) !important;
  height: min(var(--dsh-layout-dialog-height, 800px), calc(100vh - 48px)) !important;
}

/* ── Composer width ─────────────────────────────────────────────────────────
   The composer follows the content reading measure: 'full' spans the whole
   column like the header (stretched across the measured scrollbar gutter by
   the rule below); native/custom keep the native card measure that already
   tracks --dsh-chat-content-width. Full width only applies once the
   workbench shell is active (non-hero), so the native centered hero card
   keeps its own max-width. The composer seat is sticky inside the
   conversation scroller, so it spans the client area minus a
   classic-scrollbar gutter while the header above spans the full column —
   stretching the seat by the measured gutter keeps both edges aligned. */
[data-dsh-layout-chat-root]:has([data-dsh-layout-workbench])[data-dsh-layout-composer-width='full'] { --dsh-composer-card-max-width: none; }
/* Skipped in 'above' mode: the seat pins to the conversation root there and
   stretches via left/right (a width calc would overflow the root). */
html:not([data-dsh-layout-scroll-range='above']) [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench])[data-dsh-layout-composer-width='full'] [data-composer-seat] {
  width: calc(100% + var(--dsh-layout-scroll-gutter, 0px));
}
/* The composer content pads 28px from both edges (the header keeps its own
   native 20/28 row). The glass strip behind stays full-bleed like the header
   background — only the card and dock content take these insets. They divide
   by the content scale because the scroller is zoomed while the header is
   not. */
[data-dsh-layout-chat-root]:has([data-dsh-layout-workbench])[data-dsh-layout-composer-width='full'] [data-dsh-layout-workbench] {
  padding-left: calc(var(--dsh-layout-pad-composer-start, 28px) / var(--dsh-layout-scale-factor, 1)) !important;
  padding-right: calc(var(--dsh-layout-pad-composer-end, 28px) / var(--dsh-layout-scale-factor, 1)) !important;
}
/* The message measure rides the same insets in full mode: the native
   conversation scroller pads its column 32px; the padding tokens put the
   messages and the composer card on the same line. Hash-suffix match scoped
   inside the marked chain; a rename degrades to the native 32px. */
html[data-dsh-layout-read-width='full'] [data-dsh-layout-chat-column][class*='_scroll'] {
  padding-left: calc(var(--dsh-layout-pad-content-start, 28px) / var(--dsh-layout-scale-factor, 1)) !important;
  padding-right: calc(var(--dsh-layout-pad-content-end, 28px) / var(--dsh-layout-scale-factor, 1)) !important;
}

/* ── Composer workbench ──────────────────────────────────────────────────────
   Marked while the footer is customized (full width). The box only owns
   layout (insets, rhythm) and, on the native page, the opaque base that
   continues the conversation color. The card is one OPAQUE working surface
   in every mode — glass over glass always reads as a color step, so the
   input never frosts, never blends: it sits embedded, defined by a hairline
   and a whisper of upward-only shadow. */
[data-dsh-layout-workbench] { position: relative !important; isolation: isolate; gap: 12px !important; padding: 12px 0 !important; }
/* The below-row stats keep 12px clear of the card; the workbench gap cannot
   reach them through the display:contents dock chain. */
.dsh-layout-root--dock { margin-top: 12px !important; }
[data-dsh-layout-composer-root], [data-dsh-layout-dock] { position: relative; z-index: 1; }
[data-dsh-layout-workbench] [data-dsh-layout-composer-root] { margin-bottom: 0; }
[data-dsh-layout-composer-root] { padding: 0 !important; }
/* The input floor (footer plate). solid: the seat is sticky inside the
   conversation scroller, so text always passes beneath it while scrolling —
   the opaque floor is the boundary. above: the composer is PULLED OUT of the
   scroll flow instead — the seat pins to the conversation root (absolute,
   escaping the static scroller) and the scroller's bottom margin tracks the
   seat's live height, so the log physically ends above the input while the
   plate stays fully transparent. native: DSH behavior, log scrolls under the
   whole window. */
html[data-dsh-layout-footer-plate='solid'] [data-dsh-layout-workbench] {
  background: var(--dsh-glass-content-solid, var(--dsh-layout-solid, #fff)) !important;
}
/* Scoped through the workbench mark: the hero posture (new-session centered
   card) keeps the native in-flow composer — yanking that seat to the bottom
   would drag the welcome card down with it. */
html[data-dsh-layout-scroll-range='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]) { position: relative; }
/* Conversation view (DSH marks the trace view with a composer-overlay
   attribute): the seat pins against the conversation root and the scroller
   physically ends above it via a bottom margin. */
html[data-dsh-layout-scroll-range='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]):not(:has([data-conversation-composer-overlay])) [data-composer-seat] {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  top: auto !important;
  z-index: 1;
}
html[data-dsh-layout-scroll-range='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]):not(:has([data-conversation-composer-overlay])) [data-conversation-scroll] {
  margin-bottom: var(--dsh-layout-seat-height, 0px);
}
/* Trace view: DSH pins the seat inside the (positioned) scroller itself —
   our absolute override would glue it to the margin-raised scroller bottom
   and float it mid-air. Keep DSH's positioning and reserve the canvas tail
   with padding so the trace ends above the input. */
html[data-dsh-layout-scroll-range='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]):has([data-conversation-composer-overlay]) [data-conversation-scroll] {
  padding-bottom: var(--dsh-layout-seat-height, 0px);
}
/* The input card: opaque in every mode — the content material's base color,
   falling back to the footer base, then the panel token. Separation comes
   from the hairline and the upward whisper, never from translucency. */
[data-dsh-layout-workbench] [data-dsh-layout-composer-card] {
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 62%, transparent) !important;
  border-radius: var(--dsh-layout-radius) !important;
  background: var(--dsh-glass-content-solid, var(--dsh-layout-solid, #fff)) !important;
  box-shadow:
    0 -1px 2px light-dark(rgb(0 0 0 / 1.5%), rgb(0 0 0 / 18%)),
    0 -6px 18px light-dark(rgb(0 0 0 / 2.5%), rgb(0 0 0 / 32%)) !important;
  padding-top: 0 !important;
  gap: 10px !important;
}
[data-dsh-layout-composer-text], [data-dsh-layout-composer-backdrop], [data-dsh-layout-composer-card] [data-input-mirror] { padding-top: 12px !important; padding-left: calc(var(--dsh-layout-inner-inset) + 2px) !important; }
/* Full-width composer breathes taller: the textarea holds a configurable
   number of lines (default 3) instead of the single native row. */
[data-dsh-layout-chat-root][data-dsh-layout-composer-width='full'] [data-dsh-layout-composer-text],
[data-dsh-layout-chat-root][data-dsh-layout-composer-width='full'] [data-dsh-layout-composer-card] [data-input-mirror] {
  min-height: calc(var(--dsh-layout-input-rows, 3) * 24px);
}
[data-dsh-layout-composer-card] textarea { padding-top: 12px !important; }
[data-dsh-layout-composer-actions] { padding: 2px var(--dsh-layout-inner-inset) 6px !important; }
/* Toolbar chips inside the card speak the card's own family: one subtle
   translucent fill mixed from the shared token (theme-adaptive), the card's
   hairline, and the token radius — no button paints its own opaque white or
   black against the card. The primary send button ([class*='_primary']) is
   the one exception and keeps its brand fill. */
[data-dsh-layout-workbench] [data-dsh-layout-composer-actions] button:not([class*='_primary']),
[data-dsh-layout-add-button] {
  background: color-mix(in srgb, var(--dsh-layout-subtle) 55%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 52%, transparent) !important;
  border-radius: var(--dsh-layout-radius) !important;
  box-shadow: none !important;
  transition: background-color .14s ease, border-color .14s ease !important;
}
[data-dsh-layout-workbench] [data-dsh-layout-composer-actions] button:not([class*='_primary']):hover,
[data-dsh-layout-add-button]:hover {
  background: color-mix(in srgb, var(--dsh-layout-subtle) 100%, transparent) !important;
}

/* ── Input-dock overlay (todo / queue / approvals) ──────────────────────────
   Reference geometry: the composer card. Every dock surface is the same
   opaque panel as the input card: content base color, hairline, token
   radius, upward whisper — never stacked or frosted strips. */
[data-dsh-layout-dock] { display: contents !important; }
[data-dsh-layout-dock]:has(> *) { display: block !important; }
[data-dsh-layout-workbench] [data-queue-dock],
[data-dsh-layout-dock] [data-queue-dock] {
  width: 100% !important;
  max-width: var(--dsh-composer-card-max-width) !important;
  margin-inline: auto !important;
  margin-block: 0 !important;
  padding: 6px 8px !important;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 62%, transparent) !important;
  border-radius: var(--dsh-layout-radius) !important;
  background: var(--dsh-glass-content-solid, var(--dsh-layout-solid, #fff)) !important;
  box-shadow:
    0 -1px 2px light-dark(rgb(0 0 0 / 1.5%), rgb(0 0 0 / 18%)),
    0 -6px 18px light-dark(rgb(0 0 0 / 2.5%), rgb(0 0 0 / 32%)) !important;
}
[data-dsh-layout-dock-item]:not([data-queue-dock]) {
  width: 100% !important;
  max-width: var(--dsh-composer-card-max-width) !important;
  margin: 0 auto !important;
  padding: 0 var(--dsh-layout-inner-inset) !important;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 62%, transparent) !important;
  border-radius: var(--dsh-layout-radius) !important;
  background: var(--dsh-glass-content-solid, var(--dsh-layout-solid, #fff)) !important;
  box-shadow:
    0 -1px 2px light-dark(rgb(0 0 0 / 1.5%), rgb(0 0 0 / 18%)),
    0 -6px 18px light-dark(rgb(0 0 0 / 2.5%), rgb(0 0 0 / 32%)) !important;
}
[data-dsh-layout-dock-item]:not([data-queue-dock]) + [data-dsh-layout-dock-item]:not([data-queue-dock]) { margin: 6px auto 0 !important; }
[data-dsh-layout-dock-item]:not([data-queue-dock]) > * { width: 100% !important; max-width: none !important; margin-inline: 0 !important; }
[data-dsh-layout-dock-item]:not([data-queue-dock]) > section,
[data-dsh-layout-dock-item]:not([data-queue-dock]) > div { background: transparent !important; border: 0 !important; box-shadow: none !important; }
[data-dsh-layout-workbench] [data-queue-dock] [class*='_panel'] {
  border-radius: var(--dsh-layout-radius) !important;
  background: transparent !important;
  box-shadow: none !important;
}
[data-dsh-layout-workbench] [data-queue-dock] [class*='_panel']:after { content: none !important; border: 0 !important; }
[data-dsh-layout-workbench] [data-queue-dock] button[class*='_header'] { padding: 4px var(--dsh-layout-inner-inset) !important; }
[data-dsh-layout-workbench] [data-queue-dock] ul[class*='_list'] { margin: 0 !important; padding: 2px 0 !important; scrollbar-width: none !important; }
[data-dsh-layout-workbench] [data-queue-dock] ul[class*='_list']::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
[data-dsh-layout-workbench] [data-queue-dock] li[class*='_row'] {
  height: auto !important;
  min-height: 40px;
  border-radius: var(--dsh-layout-radius) !important;
  padding: 6px var(--dsh-layout-inner-inset) 6px calc(var(--dsh-layout-inner-inset) + 4px) !important;
  box-shadow: none !important;
}
[data-dsh-layout-workbench] [data-queue-dock] li[class*='_row'] + li[class*='_row'] { box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsh-layout-line) 30%, transparent) !important; }
[data-dsh-layout-workbench] [data-queue-dock] button[class*='_action'] { border-radius: var(--dsh-layout-radius) !important; }
[data-dsh-layout-workbench] [data-queue-dock] button[class*='_action']:not(:disabled):hover { background: color-mix(in srgb, var(--dsh-layout-subtle) 80%, transparent) !important; color: var(--dsw-alias-label-primary) !important; }
[data-dsh-layout-workbench] [data-queue-dock] span[class*='_preview'] { padding-right: var(--dsh-layout-inner-inset) !important; }
[data-dsh-layout-workbench] [data-approval-key] { width: 100% !important; max-width: var(--dsh-composer-card-max-width) !important; margin: 0 auto !important; }
[data-dsh-layout-workbench] [data-approval-key] > div { background: var(--dsh-glass-content-solid, var(--dsh-layout-solid, #fff)) !important; border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 62%, transparent) !important; border-radius: var(--dsh-layout-radius) !important; box-shadow: 0 -1px 2px light-dark(rgb(0 0 0 / 1.5%), rgb(0 0 0 / 18%)), 0 -6px 18px light-dark(rgb(0 0 0 / 2.5%), rgb(0 0 0 / 32%)) !important; }
[data-dsh-layout-workbench] [data-approval-key] [data-approval-scroll] { padding: 6px 2px !important; }

/* ── Statistics entry points (L3 popover stays opaque) ───────────────────── */
.dsh-layout-root { position: relative; display: inline-flex; flex: none; color: var(--dsw-alias-label-secondary); }
.dsh-layout-root--dock { width: auto; max-width: none; min-width: 0; padding-top: 0; overflow: visible; }
.dsh-layout-root--dock.dsh-layout-root--inline { align-self: stretch; justify-content: flex-start; width: 100%; max-width: var(--dsh-composer-card-max-width); margin: 0 auto; overflow: hidden; }
.dsh-layout-trigger { height: 24px; max-width: 260px; display: inline-flex; align-items: center; gap: 5px; padding: 0; border: 0; background: transparent; box-shadow: none; color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-xs-13); font-variant-numeric: tabular-nums; cursor: pointer; transition: color .14s; }
.dsh-layout-trigger:hover, .dsh-layout-trigger[aria-expanded='true'] { color: var(--dsw-alias-label-primary); }
.dsh-layout-trigger--icon { width: 26px; height: 26px; padding: 0; justify-content: center; border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 52%, transparent); border-radius: var(--dsh-layout-radius); background: color-mix(in srgb, var(--dsh-layout-subtle) 88%, transparent); }
.dsh-layout-trigger--icon:hover, .dsh-layout-trigger--icon[aria-expanded='true'] { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 24%, var(--dsh-layout-line)); background: color-mix(in srgb, var(--dsh-layout-subtle) 100%, transparent); }
.dsh-layout-trigger--icon:active { transform: translateY(1px); }
.dsh-layout-trigger:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
.dsh-layout-trigger__label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dsh-layout-inline-summary { min-width: 0; display: flex; align-items: center; height: 24px; box-sizing: border-box; padding-inline: 0; overflow: hidden; color: var(--dsw-alias-label-tertiary); font: var(--dsw-font-xs-13); font-size: 11px; line-height: 18px; font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }
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

/* ── Settings page ────────────────────────────────────────────────────────── */
.dsh-layout-settings { display: grid; gap: 16px; max-width: 880px; color: var(--dsw-alias-label-primary); }
.dsh-layout-settings * { box-sizing: border-box; }
.dsh-layout-settings__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 4px 2px 6px; }
.dsh-layout-settings h2 { margin: 0 0 6px; font-size: 19px; letter-spacing: .01em; line-height: 26px; }
.dsh-layout-settings h3 { margin: 0; font-size: 14px; line-height: 20px; }
.dsh-layout-settings p { margin: 5px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 19px; }
/* Tab bar: one raised rail, equal-width segments, the active pill lifts. */
/* Content-sized segments on a fitted rail — no stretched empty tabs. */
.dsh-layout-tabs { display: inline-flex; justify-self: start; gap: 2px; padding: 3px; border-radius: 10px; background: var(--dsw-alias-interactive-bg-hover); }
.dsh-layout-tabs button { flex: none; min-height: 32px; padding: 4px 16px; border: 0; border-radius: 7px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 13px; font-weight: 550; white-space: nowrap; cursor: pointer; transition: color .14s ease, background-color .14s ease, box-shadow .14s ease; }
.dsh-layout-tabs button:hover { color: var(--dsw-alias-label-primary); }
.dsh-layout-tabs button[aria-selected='true'] { background: var(--dsw-specific-input-major); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 4px rgb(0 0 0 / 9%); }
/* Two-rail field rows: icon + label on the left, controls in one aligned
   column on the right — every control starts at the same x, nothing drifts. */
.dsh-layout-settings__field { display: grid; grid-template-columns: 168px minmax(0, 1fr); gap: 6px 20px; align-items: center; padding: 11px 0; border-bottom: 1px solid color-mix(in srgb, var(--dsh-layout-line) 30%, transparent); }
/* Light group headers segment a dense card (the content tab) into scannable
   bands; a hairline trails the label to the right edge. */
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
.dsh-layout-settings__control > .dsh-layout-segmented, .dsh-layout-settings__control > .dsh-layout-tiers, .dsh-layout-settings__control > .dsh-layout-chips { margin-top: 0; }
.dsh-layout-settings__card { padding: 16px 18px; border: 1px solid color-mix(in srgb, var(--dsh-layout-line) 55%, transparent); border-radius: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 84%, transparent); box-shadow: 0 1px 2px rgb(0 0 0 / 2%); }
.dsh-layout-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--dsh-layout-line) 40%, transparent); }
.dsh-layout-section-heading .dsh-layout-settings__label { align-items: flex-start; }
.dsh-layout-section-heading .dsh-layout-settings__icon { margin-top: 1px; color: var(--dsw-alias-label-secondary); }
.dsh-layout-section-heading h3 { margin: 0; font-size: 14px; line-height: 20px; }
.dsh-layout-section-heading p { margin: 2px 0 0; }
.dsh-layout-settings__peek { flex: none; min-height: 32px; padding: 5px 14px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; white-space: nowrap; cursor: pointer; user-select: none; }
.dsh-layout-settings__peek[aria-pressed='true'] { border-color: #3678ea; color: #3678ea; }
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
/* Material tiers: three equal chips, title and description each on ONE line. */
.dsh-layout-tiers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.dsh-layout-tiers button { min-height: 54px; padding: 9px 11px; border: 1px solid var(--dsh-alias-border-l2, var(--dsw-alias-border-l2)); border-radius: 9px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); text-align: left; font: inherit; cursor: pointer; transition: border-color .14s ease, box-shadow .14s ease; }
.dsh-layout-tiers button[aria-pressed='true'] { border-color: #3678ea; box-shadow: inset 0 0 0 1px #3678ea; }
.dsh-layout-tiers strong { display: block; overflow: hidden; font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }
.dsh-layout-tiers span { display: block; overflow: hidden; margin-top: 2px; color: var(--dsw-alias-label-tertiary); font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
.dsh-layout-range { display: flex; align-items: center; gap: 10px; }
.dsh-layout-range input[type='range'] { flex: 1; min-height: 24px; margin: 0; accent-color: #3678ea; }
.dsh-layout-range output { min-width: 52px; color: var(--dsw-alias-label-secondary); font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.dsh-layout-colors { display: flex; align-items: center; gap: 12px; }
/* Search + dirty-state chrome. */
.dsh-layout-search { width: 100%; min-height: 34px; padding: 6px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; }
.dsh-layout-search::placeholder { color: var(--dsw-alias-label-tertiary); }
.dsh-layout-search:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 1px; }
.dsh-layout-dirty { flex: none; margin-top: 4px; padding: 3px 10px; border-radius: 999px; background: color-mix(in srgb, #3678ea 12%, transparent); color: #3678ea; font-size: 11px; font-weight: 600; white-space: nowrap; }
.dsh-layout-field-status { flex: none; padding: 1px 6px; border-radius: 999px; background: color-mix(in srgb, #3678ea 10%, transparent); color: #3678ea; font-size: 10px; font-weight: 600; white-space: nowrap; }
.dsh-layout-field-reset { flex: none; width: 20px; height: 20px; padding: 0; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 1; cursor: pointer; }
.dsh-layout-field-reset:hover { border-color: #3678ea; color: #3678ea; }

/* Built-in preset cards: like the material tiers — one line for the name,
   one for the hint, never wrapped. */
.dsh-layout-presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.dsh-layout-presets button { min-height: 54px; padding: 9px 11px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); text-align: left; font: inherit; cursor: pointer; transition: border-color .14s ease; }
.dsh-layout-presets button:hover { border-color: color-mix(in srgb, #3678ea 45%, var(--dsw-alias-border-l2)); }
.dsh-layout-presets strong { display: block; overflow: hidden; font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }
.dsh-layout-presets span { display: block; overflow: hidden; margin-top: 2px; color: var(--dsw-alias-label-tertiary); font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
/* Custom page-padding editor: one compact row per area, preset placeholders. */
.dsh-layout-pads { display: grid; gap: 6px; }
.dsh-layout-pads__row { display: flex; align-items: center; gap: 12px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.dsh-layout-pads__row > span { flex: none; width: 44px; }
.dsh-layout-pads__row label { display: inline-flex; align-items: center; gap: 6px; }
.dsh-layout-pads__row input { width: 64px; min-height: 28px; padding: 3px 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-variant-numeric: tabular-nums; }
.dsh-layout-pads__hint { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 11px; }
.dsh-layout-colors input[type='color'] { width: 42px; height: 32px; padding: 2px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: transparent; }
.dsh-layout-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.dsh-layout-chips label { display: inline-flex; align-items: center; gap: 5px; min-height: 28px; padding: 3px 11px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 12px; white-space: nowrap; cursor: pointer; }
.dsh-layout-chips label:has(input:checked) { border-color: #3678ea; color: var(--dsw-alias-label-primary); }
.dsh-layout-chips input { accent-color: #3678ea; }
.dsh-layout-settings input[type='url'], .dsh-layout-settings input[type='text'] { width: 100%; min-height: 32px; padding: 5px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; }
.dsh-layout-profile { display: flex; gap: 8px; }
.dsh-layout-profile select { flex: 1; min-height: 32px; padding: 4px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; }
/* Button clusters rendered as bare <div> inside the control column. */
.dsh-layout-settings__control > div:not([class]) { display: flex; flex-wrap: wrap; gap: 8px; }
.dsh-layout-settings__files button, .dsh-layout-settings footer button, .dsh-layout-profile button, .dsh-layout-file-button { min-height: 32px; padding: 5px 14px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; white-space: nowrap; cursor: pointer; transition: border-color .14s ease, background-color .14s ease; }
.dsh-layout-settings__files button:hover, .dsh-layout-settings footer button:hover, .dsh-layout-profile button:hover, .dsh-layout-file-button:hover { border-color: color-mix(in srgb, #3678ea 45%, var(--dsw-alias-border-l2)); }
.dsh-layout-profile label:has(.dsh-layout-file-button) { display: inline-flex; }
.dsh-layout-file-button { display: inline-flex; align-items: center; user-select: none; }
.dsh-layout-settings footer { display: flex; justify-content: flex-end; }
.dsh-layout-settings footer button { min-height: 34px; padding: 6px 14px; }
@media (prefers-reduced-motion: reduce) { .dsh-layout-panel { animation: none; } .dsh-layout-trigger { transition: none; } }

/* ── Full-page editor ─────────────────────────────────────────────────────────
   A left-anchored settings workspace, not a centered modal stretched over a
   large empty canvas. The top bar and content rail share one edge. */
.dsh-layout-fullpage { --dsh-layout-fullpage-edge: 32px; position: fixed; inset: 0; z-index: 1100; display: flex; flex-direction: column; background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-label-primary); }
.dsh-layout-fullpage__bar { display: flex; align-items: center; gap: 10px; flex: none; min-height: 56px; padding: 10px var(--dsh-layout-fullpage-edge); border-bottom: 1px solid color-mix(in srgb, var(--dsh-layout-line) 50%, transparent); background: var(--dsw-alias-bg-base, #fff); }
.dsh-layout-fullpage__bar h2 { margin: 0; font-size: 16px; font-weight: 650; }
.dsh-layout-fullpage__bar button { display: inline-flex; align-items: center; gap: 5px; min-height: 32px; padding: 4px 6px 4px 0; border: 0; border-radius: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; white-space: nowrap; cursor: pointer; }
.dsh-layout-fullpage__bar button:hover { color: var(--dsw-alias-label-primary); }
.dsh-layout-fullpage__scroll { flex: 1; overflow-y: auto; padding: 24px var(--dsh-layout-fullpage-edge) 56px; }
.dsh-layout-fullpage__scroll > .dsh-layout-settings { width: min(100%, 1040px); margin-inline: 0; }
.dsh-layout-fullpage__open { min-height: 34px; padding: 6px 16px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; white-space: nowrap; cursor: pointer; }
@media (max-width: 767px) {
  .dsh-layout-fullpage { --dsh-layout-fullpage-edge: 16px; }
  .dsh-layout-fullpage__scroll { padding: 14px var(--dsh-layout-fullpage-edge) 40px; }
  .dsh-layout-settings__field { grid-template-columns: 1fr; gap: 6px; }
  .dsh-layout-settings__label { align-items: center; }
  .dsh-layout-tabs { display: flex; overflow-x: auto; max-width: 100%; }
  .dsh-layout-tabs button { padding: 4px 12px; }

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
    padding-inline: 16px !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
  }
  /* DSH's options block ships with padding: 0 24px 24px; normalize the
     mobile horizontal edge to the same 16px as the top nav and fullpage. */
  [role='dialog'][class*='_panel'] > [class*='_content'] > [class*='_options'] { padding-inline: 16px !important; }

}

/* ── Narrow viewport (< 768px) ────────────────────────────────────────────────
   Phones: the desktop 28px insets eat too much width, and the header row
   crowds (the subagent pill overlaps the session-log button). The narrow
   inset replaces every plugin inset override; header wrap lets the crowded
   row flow to a second line instead of overlapping. */
/* ── Sidebar width / column alignment / quality / safe area ─────────────────── */
/* Sidebar semantic tokens. Native values are absent, so DSH owns the
   untouched state. Explicit values affect only the marked stable adapters. */
html[data-dsh-layout-sidebar-pad-x] [data-dsh-layout-sidebar-root] { padding-inline: var(--dsh-layout-sidebar-pad-x) !important; }
html[data-dsh-layout-sidebar-pad-y] [data-dsh-layout-sidebar-root] { padding-block: var(--dsh-layout-sidebar-pad-y) !important; }
html[data-dsh-layout-sidebar-scrollbar='hidden'] [data-dsh-layout-sidebar-list] { scrollbar-width: none !important; -ms-overflow-style: none !important; }
html[data-dsh-layout-sidebar-scrollbar='hidden'] [data-dsh-layout-sidebar-list]::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
html[data-dsh-layout-sidebar-row-height] [data-dsh-layout-sidebar-list] [role='treeitem'] { min-height: var(--dsh-layout-sidebar-row-height) !important; height: var(--dsh-layout-sidebar-row-height) !important; }
html[data-dsh-layout-sidebar-row-gap] [data-dsh-layout-sidebar-list] [role='treeitem'] + [role='treeitem'] { margin-block-start: var(--dsh-layout-sidebar-row-gap) !important; }

/* The frame's grid is rewritten inline by React; an author-important rule
   still wins. The details track rides our live-tracked var so panels keep
   working. Collapsed sidebars (native drawer/collapse states) stay native. */
html[data-dsh-layout-sidebar-width] [data-dsh-layout-frame]:not([data-sidebar-collapsed]) {
  grid-template-columns: var(--dsh-layout-sidebar-width) minmax(0, 1fr) var(--dsh-layout-details, 0px) !important;
}
/* Message column alignment inside a full-width content region: DSH centers
   the measured column; 'start' pins it to the reading edge. */
html[data-dsh-layout-read-width='full'][data-dsh-layout-align='start'] [data-dsh-layout-chat-column][class*='_column'] {
  margin-inline: 0 !important;
}
/* Performance tiers: balanced caps blurs in the resolver; performance drops
   every remaining backdrop blur so only flat translucent fills render. */
html[data-dsh-layout-quality='performance'] * {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}
/* Notched phones: the composer clears the home-indicator zone. */
@media (max-width: 768px) {
  [data-dsh-layout-workbench] { padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important; }
}

/* ── Page padding tokens ──────────────────────────────────────────────────────
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
  padding-inline-start: calc(var(--dsh-layout-pad-header-start, 20px) / var(--dsh-layout-scale-factor, 1)) !important;
  padding-inline-end: calc(var(--dsh-layout-pad-header-end, 28px) / var(--dsh-layout-scale-factor, 1)) !important;
}
@media (max-width: 767px) {
  html[data-dsh-layout-narrow-wrap] [data-dsh-layout-chrome-header] > *:first-child {
    flex-wrap: wrap;
  }
  html[data-dsh-layout-narrow-wrap] [data-dsh-layout-composer-actions] {
    flex-wrap: wrap;
    row-gap: 6px;
  }
}

/* ── Background canvas (L0) ───────────────────────────────────────────────── */
.dsh-layout-background { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; contain: strict; background: #f4f6f9; }
.dsh-layout-background[hidden] { display: none; }
.dsh-layout-background__layer { position: absolute; inset: -5%; background-position: center; background-repeat: no-repeat; transition: background 180ms ease; }
.dsh-layout-background__video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
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
