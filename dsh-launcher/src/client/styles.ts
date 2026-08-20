/**
 * Launcher styles — the workspace shell only (panel, FAB, canvas,
 * rail trigger). Marketplace card / shelf styles do NOT live here: each
 * manager plugin (dsh-skill-manager, dsh-mcp-manager) ships its own
 * copy under its own prefix.
 *
 * Two breakpoint fences handle phone vs desktop:
 *   - H5 (≤ 767px): the workspace collapses its left rail into a horizontal
 *     tab bar at the top, the launcher panel goes full-width, the market
 *     grid goes single column, the toolbar stacks vertically.
 *   - tiny phone (≤ 480px): pads shrink, the launcher panel drops the
 *     title row, the source chips wrap tighter.
 *
 * SlotMap-rendered entries (the launcher panel, the workspace overlay) own
 * no chrome — the launcher styles paint all of their surfaces. Token reads
 * stay on DSH's `--dsw-alias-*` ladder so light/dark themes adapt.
 */
export const LAUNCHER_STYLES = `
.dsh-launcher-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: var(--dsh-layout-radius-user, 8px);
  margin: 2px 0;
  transition: background 120ms var(--ds-ease-in-out, ease);
}
/* Expanded rail: hover/press get the native rail treatment. */
.dsh-launcher-trigger:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06));
}
.dsh-launcher-trigger:active {
  background: var(--dsw-alias-interactive-bg-active, rgba(255, 255, 255, 0.1));
}
/* Collapsed (icon-only) rail: the icon buttons above carry no hover
   fill, so neither do we. */
.dsh-launcher-rail.is-collapsed .dsh-launcher-trigger:hover,
.dsh-launcher-rail.is-collapsed .dsh-launcher-trigger:active {
  background: transparent;
}
.dsh-launcher-trigger-icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  flex: 0 0 18px;
}
.dsh-launcher-trigger-icon svg { width: 100%; height: 100%; }
.dsh-launcher-trigger-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* Collapsed rail (icon-only, set by rail-button.ts when the sidebar
   column narrows): match the native rail buttons above — a centered
   square with the same 20px glyph, no label, no side padding (the
   narrow rail carries its own). */
.dsh-launcher-rail.is-collapsed { padding: 0; }
.dsh-launcher-rail.is-collapsed .dsh-launcher-trigger {
  justify-content: center;
  padding: 8px 0;
  gap: 0;
}
.dsh-launcher-rail.is-collapsed .dsh-launcher-trigger-label { display: none; }
.dsh-launcher-rail.is-collapsed .dsh-launcher-trigger-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
}

/* ─── Launcher panel (floating launcher) ─── */
.dsh-launcher-panel-mask {
  --dsh-launcher-ease: cubic-bezier(0.22, 1, 0.36, 1);
  position: fixed;
  inset: 0;
  /* No scrim on purpose: the mask is a transparent click-catcher
     (click-outside closes). Dimming/blurring the whole page behind a
     small popover read as abrupt. */
  background: transparent;
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 80px 24px 24px 88px;
  animation: dsh-launcher-fade-in 180ms var(--dsh-launcher-ease, ease);
}
/* Exit choreography (is-closing is set by LauncherPanel before the
   unmount): mask fades while the panel settles down, then the view
   unmounts on the panel's animationend. */
.dsh-launcher-panel-mask.is-closing {
  animation: dsh-launcher-fade-out 160ms var(--dsh-launcher-ease, ease) forwards;
  pointer-events: none;
}
.dsh-launcher-panel-mask.is-closing .dsh-launcher-panel {
  animation: dsh-launcher-panel-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
}
.dsh-launcher-panel {
  width: min(320px, 92vw);
  background: var(--dsw-alias-bg-layer-1, #1c1c1f);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 16px);
  box-shadow: var(--dsw-shadow-lv2, 0 20px 60px rgba(0, 0, 0, 0.45));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: dsh-launcher-slide-up 260ms var(--dsh-launcher-ease, ease);
}
.dsh-launcher-panel-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 16px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
}
.dsh-launcher-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  margin: 0;
}
.dsh-launcher-panel-hint {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  margin-left: 0;
}
.dsh-launcher-panel-body { padding: 6px; }
.dsh-launcher-panel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  text-align: left;
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  cursor: pointer;
  transition: background 120ms var(--ds-ease-in-out, ease);
}
.dsh-launcher-panel-item:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.dsh-launcher-panel-item-icon {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: var(--dsh-layout-radius-user, 10px);
  background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.04));
  color: var(--dsw-alias-label-primary, #f4f4f5);
  flex: 0 0 30px;
}
.dsh-launcher-panel-item-icon svg { width: 18px; height: 18px; }
/* Title over hint, and the stack's total height matches the 30px icon
   beside it (tight line-heights) so the row stays compact. */
.dsh-launcher-panel-item-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.dsh-launcher-panel-item-title { font-size: 13px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dsh-launcher-panel-item-hint { font-size: 11px; line-height: 1.2; color: var(--dsw-alias-label-tertiary, #8a8a8e); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dsh-launcher-panel-item-chev { color: var(--dsw-alias-label-tertiary, #8a8a8e); flex: 0 0 20px; }
.dsh-launcher-panel-item-chev svg { width: 14px; height: 14px; }
.dsh-launcher-panel-foot {
  padding: 10px 14px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  display: flex;
  justify-content: flex-end;
}
.dsh-launcher-panel-close {
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: var(--dsh-layout-radius-user, 8px);
}
.dsh-launcher-panel-close:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); color: var(--dsw-alias-label-primary, #f4f4f5); }

@keyframes dsh-launcher-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes dsh-launcher-fade-out { to { opacity: 0 } }
@keyframes dsh-launcher-slide-up { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
@keyframes dsh-launcher-panel-out { to { opacity: 0; transform: translateY(10px) } }

/* ─── Workspace overlay: desktop (default) ───
   Two-column grid: topbar / menu / content.

   Entrance choreography: the canvas settles from a hair above 1:1 while
   its chrome arrives in staggered layers (topbar drops in, menu slides
   from the rail, items cascade, content rises). All layers share one
   easeOutQuint-ish curve (--dsh-launcher-ease) — same family, slightly
   offset delays, is what reads as "silky" rather than "animated".
   Exit: is-closing (set by WorkspaceOverlay before unmount) reverses
   into a fast settle-down; children freeze at their final state while
   the root fades. */
.dsh-launcher-canvas {
  --dsh-launcher-ease: cubic-bezier(0.22, 1, 0.36, 1);
  position: fixed;
  inset: 0;
  background: var(--dsw-alias-bg-module-platform, #0f0f12);
  z-index: 9998;
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 1fr;
  grid-template-areas:
    "menu content";
  color: var(--dsw-alias-label-primary, #f4f4f5);
  animation: dsh-launcher-canvas-in 340ms var(--dsh-launcher-ease, ease);
}
.dsh-launcher-canvas.is-closing {
  animation: dsh-launcher-canvas-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
  pointer-events: none;
}

/* Top-right corner close: absolute over the grid (both panes), a quiet
   round X that's always reachable on every viewport. */
.dsh-launcher-canvas-x {
  position: absolute;
  z-index: 20;
  top: 12px;
  right: 14px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1, #16161a);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  cursor: pointer;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
  animation: dsh-launcher-topbar-in 260ms var(--dsh-launcher-ease, ease) 60ms backwards;
}
.dsh-launcher-canvas-x:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06));
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.dsh-launcher-canvas-x:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent);
  outline-offset: 1px;
}
.dsh-launcher-canvas-menu {
  grid-area: menu;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--dsw-alias-bg-layer-1, #16161a);
  border-right: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  animation: dsh-launcher-menu-in 380ms var(--dsh-launcher-ease, ease) 80ms backwards;
}
/* Identity + nav groups scroll; the exit action below stays pinned. */
.dsh-launcher-menu-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 8px;
}
/* H5-only collapsed menu toggle — the sidebar handles navigation on
   desktop, so the toggle never renders there. */
.dsh-launcher-menu-toggle { display: none; }
/* Exit lives at the rail's bottom, full-bleed with a hairline above —
   the sidebar's secondary action, like the reference layout. */
.dsh-launcher-canvas-menu-label {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  padding: 10px 12px 8px;
  animation: dsh-launcher-item-in 320ms var(--dsh-launcher-ease, ease) 120ms backwards;
}
.dsh-launcher-menu-group { padding-top: 6px; }
.dsh-launcher-menu-group .dsh-launcher-canvas-menu-label { padding: 6px 10px 4px; }
/* Identity block: the workspace's "user area" — icon tile, name and a
   quiet hint, hairline-separated from the nav groups below. */
.dsh-launcher-menu-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
  animation: dsh-launcher-item-in 320ms var(--dsh-launcher-ease, ease) 60ms backwards;
}
.dsh-launcher-menu-identity-icon {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: var(--dsh-layout-radius-user, 10px);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 11%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  flex: 0 0 30px;
}
.dsh-launcher-menu-identity-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.dsh-launcher-menu-identity-name { font-size: 13px; font-weight: 600; line-height: 1.2; }
.dsh-launcher-menu-identity-hint { font-size: 11px; line-height: 1.2; color: var(--dsw-alias-label-tertiary, #8a8a8e); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dsh-launcher-canvas-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 10px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font: inherit;
  font-size: 13px;
  text-align: left;
  border-radius: var(--dsh-layout-radius-user, 10px);
  cursor: pointer;
  margin: 1px 0;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
  animation: dsh-launcher-item-in 340ms var(--dsh-launcher-ease, ease) backwards;
}
/* The cascade: each menu entry starts a touch later than the one above
   it (the label is child 1, items follow). Extra children past #8 share
   the last delay — plugin contributions still enter, just together. */
.dsh-launcher-canvas-menu-item:nth-child(2) { animation-delay: 140ms; }
.dsh-launcher-canvas-menu-item:nth-child(3) { animation-delay: 170ms; }
.dsh-launcher-canvas-menu-item:nth-child(4) { animation-delay: 200ms; }
.dsh-launcher-canvas-menu-item:nth-child(5) { animation-delay: 230ms; }
.dsh-launcher-canvas-menu-item:nth-child(6) { animation-delay: 260ms; }
.dsh-launcher-canvas-menu-item:nth-child(n + 7) { animation-delay: 290ms; }
.dsh-launcher-canvas-menu-item:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-launcher-canvas-menu-item.is-active { position: relative; background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.08)); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-launcher-canvas-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 55%, transparent);
}
.dsh-launcher-canvas-menu-item-icon { display: inline-flex; width: 18px; height: 18px; align-items: center; justify-content: center; flex: 0 0 18px; }
.dsh-launcher-canvas-menu-item-icon svg { width: 16px; height: 16px; }
.dsh-launcher-canvas-menu-item-label { flex: 1; }

.dsh-launcher-canvas-content {
  grid-area: content;
  min-width: 0;
  overflow-y: auto;
  padding: 28px 32px 80px;
  -webkit-overflow-scrolling: touch;
  animation: dsh-launcher-content-in 460ms var(--dsh-launcher-ease, ease) 110ms backwards;
}
/* Wide screens: cap the reading width so grouped content stays
   composed instead of stretching edge to edge. */
.dsh-launcher-canvas-content > * {
  max-width: 960px;
}
.dsh-launcher-canvas-content-h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 6px;
}
.dsh-launcher-canvas-content-hint {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  margin: 0 0 20px;
}
.dsh-launcher-canvas-content-empty {
  margin: 64px auto;
  max-width: 360px;
  text-align: center;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dsh-launcher-canvas-content-empty-title { font-size: 14px; margin-bottom: 8px; color: var(--dsw-alias-label-secondary, #b3b3b8); }

/* ─── Content area: slim title row + capped reading width ─── */
.dsh-launcher-section-header {
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
}
.dsh-launcher-section-header-body { min-width: 0; }
.dsh-launcher-section-header-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.01em;
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.dsh-launcher-section-header-subtitle {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  margin: 4px 0 0;
  line-height: 1.5;
}

@keyframes dsh-launcher-canvas-in { from { opacity: 0; transform: scale(1.02) } to { opacity: 1; transform: scale(1) } }
@keyframes dsh-launcher-canvas-out { to { opacity: 0; transform: scale(0.985) } }
@keyframes dsh-launcher-topbar-in { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
@keyframes dsh-launcher-menu-in { from { opacity: 0; transform: translateX(-12px) } to { opacity: 1; transform: translateX(0) } }
@keyframes dsh-launcher-item-in { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: translateX(0) } }
@keyframes dsh-launcher-tab-item-in { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
@keyframes dsh-launcher-content-in { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }


/* ─── dsh-layout material + radius bridge ───
   The dsh-layout plugin publishes its frosted-material state on <html>:
   data-dsh-layout-material='on' plus --dsh-layout-mat (translucent tint),
   -mat-solid, -mat-blur, -mat-sat, and the user corner radii as
   --dsh-layout-radius-user[-lg] (the radius vars are already bridged
   inline above with launcher fallbacks, so they apply whether or not
   the material is on). When the material is on, every launcher surface
   follows it; when dsh-layout isn't installed nothing below matches and
   the launcher keeps its own solid look.

   One blur layer per surface root (canvas, panel, FAB) — inner surfaces
   (topbar, menu, cards) take translucent tints only. Nested
   backdrop-filters would double-blur the same backdrop and cost another
   compositing pass for no visual gain. */
html[data-dsh-layout-material='on'] .dsh-launcher-canvas {
  background: var(--dsh-layout-mat, var(--dsh-layout-glass-base, #0f0f12));
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}
html[data-dsh-layout-material='on'] .dsh-launcher-canvas-menu {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
  border-right-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dsh-launcher-panel {
  background: var(--dsh-layout-mat, var(--dsh-layout-glass-base, #1c1c1f));
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}
html[data-dsh-layout-material='on'] .dsh-launcher-fab {
  background: var(--dsh-layout-mat, var(--dsh-layout-glass-base, #16161a));
  -webkit-backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
  backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px)) saturate(var(--dsh-layout-mat-sat, 112%));
}
/* Accessibility + capability fallbacks mirror dsh-layout's own: keep the
   tint at full opacity, drop the blur entirely. */
@media (prefers-reduced-transparency: reduce) {
  html[data-dsh-layout-material='on'] .dsh-launcher-canvas,
  html[data-dsh-layout-material='on'] .dsh-launcher-panel,
  html[data-dsh-layout-material='on'] .dsh-launcher-fab {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    background: var(--dsh-layout-mat-solid, var(--dsh-layout-glass-base)) !important;
  }
}
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  html[data-dsh-layout-material='on'] .dsh-launcher-canvas,
  html[data-dsh-layout-material='on'] .dsh-launcher-panel,
  html[data-dsh-layout-material='on'] .dsh-launcher-fab {
    background: var(--dsh-layout-mat-solid, var(--dsh-layout-glass-base)) !important;
  }
}

/* ─── Motion safety ───
   The views skip the animationend wait under reduced motion (they
   unmount immediately), and every entrance/exit animation drops out
   here so nothing is left mid-flight. */
@media (prefers-reduced-motion: reduce) {
  .dsh-launcher-canvas,
  .dsh-launcher-canvas.is-closing,
  .dsh-launcher-canvas-x,
  .dsh-launcher-canvas-menu,
  .dsh-launcher-canvas-menu-label,
  .dsh-launcher-canvas-menu-item,
  .dsh-launcher-canvas-content,
  .dsh-launcher-panel-mask,
  .dsh-launcher-panel-mask.is-closing,
  .dsh-launcher-panel,
  .dsh-launcher-panel-mask.is-closing .dsh-launcher-panel {
    animation: none !important;
  }
}

/* ─── H5 adaptation (≤ 767px) ───
   Phone layout: the side rail collapses into a horizontal tab bar at the
   top, the content area goes full-width, the launcher panel covers
   the screen, the launcher trigger button becomes a fixed floating
   action button docked at the bottom-left. */
@media (max-width: 767px) {
  .dsh-launcher-canvas {
    overflow-x: hidden;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      "tabbar"
      "content";
  }
  /* The identity block and group headers collapse away on phones —
     the horizontal tab bar replaces the whole nav chrome. */
  .dsh-launcher-menu-identity { display: none; }
  /* On phones the corner X floats bottom-right — the top edge belongs to
     the equal-width tab row, so a top-right close would fight it. */
  .dsh-launcher-canvas-x {
    top: auto;
    bottom: 18px;
    right: 16px;
    width: 40px;
    height: 40px;
    box-shadow: var(--dsw-shadow-lv2, 0 8px 24px rgba(0, 0, 0, 0.3));
  }
  .dsh-launcher-canvas-close { padding: 6px 10px; }
  .dsh-launcher-canvas-close span { display: none; }

  .dsh-launcher-canvas-menu {
    grid-area: tabbar;
    flex-direction: row;
    align-items: center;
    border-right: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
    padding-bottom: 0;
    position: relative;
    /* The collapsed toggle replaces the always-on tab grid — the menu
       drops down over the content instead of eating viewport height. */
    padding-bottom: 0;
  }
  /* Collapsed one-line toggle: active section name + chevron. */
  .dsh-launcher-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-height: 40px;
    margin: 8px 12px;
    padding: 6px 12px;
    border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
    border-radius: calc(var(--dsh-layout-radius-user, 10px) - 2px);
    background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
    color: var(--dsw-alias-label-primary, #f4f4f5);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  .dsh-launcher-menu-toggle-inner {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .dsh-launcher-menu-toggle-icon { display: inline-flex; flex: none; }
  .dsh-launcher-menu-toggle-icon svg { width: 16px; height: 16px; }
  .dsh-launcher-menu-toggle-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
  .dsh-launcher-menu-toggle svg.is-open { transform: rotate(180deg); }
  .dsh-launcher-menu-toggle > svg { transition: transform 160ms var(--ds-ease-in-out, ease); flex: none; }
  /* The tab grid folds away and drops down OVER the content when opened —
     it no longer occupies a permanent grid row at the top. */
  .dsh-launcher-menu-scroll {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 10px 12px 14px;
    background: var(--dsw-alias-bg-layer-1, #1c1c1f);
    border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
    border-radius: 0 0 var(--dsh-layout-radius-user-lg, 12px) var(--dsh-layout-radius-user-lg, 12px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
    max-height: min(56vh, 420px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    /* collapsed */
    opacity: 0;
    transform: translateY(-6px);
    pointer-events: none;
    visibility: hidden;
    transition: opacity 180ms var(--ds-ease-in-out, ease),
                transform 180ms var(--ds-ease-in-out, ease),
                visibility 180ms;
  }
  .dsh-launcher-menu-scroll[data-open='true'] {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
    visibility: visible;
  }
  .dsh-launcher-menu-scroll::-webkit-scrollbar { display: none; }
  .dsh-launcher-canvas-menu-label { display: none; }
  .dsh-launcher-canvas-menu-item {
    min-width: 0;
    justify-content: center;
    margin: 6px 0;
    padding: 9px 8px;
    border-radius: 999px;
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
    color: var(--dsw-alias-label-secondary, #b3b3b8);
    white-space: nowrap;
  }
  .dsh-launcher-canvas-menu-item.is-active {
    background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.18));
    color: var(--dsw-alias-label-primary, #f4f4f5);
    border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  }
  .dsh-launcher-canvas-menu-item-icon { width: 16px; height: 16px; flex: 0 0 16px; }
  .dsh-launcher-canvas-menu-item-icon svg { width: 14px; height: 14px; }
  /* On the horizontal tab bar the desktop left-slide reads wrong — tabs
     drop in from the top edge instead; delays keep the cascade. */
  .dsh-launcher-canvas-menu-item,
  .dsh-launcher-canvas-menu-label { animation-name: dsh-launcher-tab-item-in; }

  .dsh-launcher-canvas-content {
    padding: 20px 16px 80px;
  }
  .dsh-launcher-section-header { margin-bottom: 16px; padding-bottom: 12px; }
  .dsh-launcher-section-header-title { font-size: 15px; }
  .dsh-launcher-section-header-subtitle { font-size: 11px; }

  .dsh-launcher-panel-mask {
    padding: 20px;
    align-items: center;
    justify-content: center;
  }
  /* Compact centered card on phones too — not full-screen */
  .dsh-launcher-panel {
    width: min(360px, 92vw);
    height: auto;
    max-height: min(520px, 82vh);
    animation: dsh-launcher-panel-mobile-in 240ms var(--ds-ease-in-out, ease);
  }
  .dsh-launcher-panel-head {
    padding: 14px 16px 10px;
  }
  .dsh-launcher-panel-hint { display: none; }
  .dsh-launcher-panel-item { padding: 14px 12px; }
  .dsh-launcher-panel-item-icon { width: 34px; height: 34px; flex: 0 0 34px; }
  .dsh-launcher-panel-item-icon svg { width: 20px; height: 20px; }
  .dsh-launcher-panel-item-title { font-size: 14px; }
  .dsh-launcher-panel-item-hint { font-size: 12px; }
}

/* ─── Tiny phone (≤ 480px) ─── */
@media (max-width: 480px) {
  .dsh-launcher-canvas-content { padding: 12px 10px 80px; }
  .dsh-launcher-section-header-title { font-size: 15px; }
  .dsh-launcher-fab { bottom: 16px; left: 16px; width: 48px; height: 48px; }
}

/* ─── Floating launcher button (FAB) ───
   Fallback entry only: visible whenever the side-rail button could NOT
   mount (rail-button.ts marks <body data-dsh-launcher-rail> on success,
   which hides the FAB on every viewport — phones included, where the
   entry is the drawer sidebar's footer button instead of a floater). */
.dsh-launcher-fab-host {
  display: contents;
}
.dsh-launcher-rail {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0 8px;
  margin: 2px 0;
}
/* The launcher button REPLACES the native rail settings trigger
   (rail-button.ts flags it with data-dsh-launcher-replaced). Hidden via
   stylesheet — same pattern as dsh-layout's stats suppressor — so the
   React-owned node is never mutated inline and teardown is just
   removing the body attribute. The panel's "system settings" item still
   drives the native modal via trigger.click() on the hidden node. */
body[data-dsh-launcher-rail] [data-dsh-launcher-replaced] {
  display: none !important;
}
.dsh-launcher-fab {
  position: fixed;
  bottom: 24px;
  left: 24px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
  background: var(--dsw-alias-bg-layer-1, #16161a);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  box-shadow: var(--dsw-shadow-lv2, 0 12px 32px rgba(0, 0, 0, 0.35));
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 9997;
  transition: transform 140ms var(--ds-ease-in-out, ease), background 140ms var(--ds-ease-in-out, ease);
  padding: 0;
  -webkit-tap-highlight-color: transparent;
  font: inherit;
  pointer-events: auto;
}
.dsh-launcher-fab:hover { transform: translateY(-1px); background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.06)); }
.dsh-launcher-fab:active { transform: scale(0.96); }
.dsh-launcher-fab svg { width: 22px; height: 22px; }
.dsh-launcher-fab:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent);
  outline-offset: 2px;
}
body[data-dsh-launcher-rail] .dsh-launcher-fab { display: none; }
@media (prefers-reduced-motion: reduce) {
  .dsh-launcher-fab { transition: none; }
  .dsh-launcher-fab:hover { transform: none; }
  .dsh-launcher-menu-scroll,
  .dsh-launcher-menu-toggle > svg { transition: none; }
}

@keyframes dsh-launcher-panel-mobile-in {
  from { opacity: 0; transform: translateY(12px) }
  to { opacity: 1; transform: translateY(0) }
}
`;

let installed = false;

export function installStyles(target: Document): () => void {
  if (installed) return () => {};
  installed = true;
  const style = target.createElement("style");
  style.className = "dsh-launcher-styles";
  style.textContent = LAUNCHER_STYLES;
  target.head.append(style);
  return () => {
    installed = false;
    style.remove();
  };
}
