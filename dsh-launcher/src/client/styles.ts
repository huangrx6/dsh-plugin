/**
 * Launcher styles. All launcher-owned selectors live under the
 * `dsh-launcher-` prefix; market card / shelf selectors live under
 * `dsh-launcher-mkt-`. The dsh-* market slots (skill / mcp) reach into this
 * file via a stable class contract; any rename here is a breaking change for
 * the marketplace cards.
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
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: var(--dsh-layout-radius-user, 8px);
  transition: background 120ms var(--ds-ease-in-out, ease);
  margin: 2px 0;
}
.dsh-launcher-trigger:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06));
}
.dsh-launcher-trigger:active {
  background: var(--dsw-alias-interactive-bg-active, rgba(255, 255, 255, 0.1));
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
.dsh-launcher-trigger.collapsed .dsh-launcher-trigger-label { display: none; }

/* ─── Launcher panel (floating launcher) ─── */
.dsh-launcher-panel-mask {
  --dsh-launcher-ease: cubic-bezier(0.22, 1, 0.36, 1);
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #000) 18%, transparent);
  backdrop-filter: blur(6px);
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
  width: min(420px, 92vw);
  background: var(--dsw-alias-bg-layer-1, #1c1c1f);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 16px);
  box-shadow: var(--dsw-shadow-lv2, 0 20px 60px rgba(0, 0, 0, 0.45));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: dsh-launcher-slide-up 260ms var(--dsh-launcher-ease, ease);
}
.dsh-launcher-panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
}
.dsh-launcher-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  margin: 0;
}
.dsh-launcher-panel-hint {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  margin-left: auto;
}
.dsh-launcher-panel-body { padding: 6px 8px; }
.dsh-launcher-panel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 12px;
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
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: var(--dsh-layout-radius-user, 10px);
  background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.04));
  color: var(--dsw-alias-label-primary, #f4f4f5);
  flex: 0 0 36px;
}
.dsh-launcher-panel-item-icon svg { width: 18px; height: 18px; }
.dsh-launcher-panel-item-body { flex: 1; min-width: 0; }
.dsh-launcher-panel-item-title { font-size: 13px; font-weight: 600; }
.dsh-launcher-panel-item-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin-top: 2px; }
.dsh-launcher-panel-item-chev { color: var(--dsw-alias-label-tertiary, #8a8a8e); flex: 0 0 20px; }
.dsh-launcher-panel-item-chev svg { width: 14px; height: 14px; }
.dsh-launcher-panel-foot {
  padding: 10px 14px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  display: flex;
  justify-content: flex-end;
}
.dsh-launcher-panel-close {
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
  grid-template-rows: 56px 1fr;
  grid-template-areas:
    "topbar topbar"
    "menu   content";
  color: var(--dsw-alias-label-primary, #f4f4f5);
  animation: dsh-launcher-canvas-in 340ms var(--dsh-launcher-ease, ease);
}
.dsh-launcher-canvas.is-closing {
  animation: dsh-launcher-canvas-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
  pointer-events: none;
}
.dsh-launcher-canvas-topbar {
  grid-area: topbar;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  background: var(--dsw-alias-bg-layer-1, #16161a);
  animation: dsh-launcher-topbar-in 380ms var(--dsh-launcher-ease, ease) 50ms backwards;
}
.dsh-launcher-canvas-title { font-size: 14px; font-weight: 600; }
.dsh-launcher-canvas-hint { font-size: 12px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin-left: 12px; }
.dsh-launcher-canvas-spacer { flex: 1; }
.dsh-launcher-canvas-close {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06));
  border: 0;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  padding: 6px 14px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}
.dsh-launcher-canvas-close:hover { background: var(--dsw-alias-interactive-bg-active, rgba(255, 255, 255, 0.1)); }
.dsh-launcher-canvas-close svg { width: 14px; height: 14px; }

.dsh-launcher-canvas-menu {
  grid-area: menu;
  background: var(--dsw-alias-bg-layer-1, #16161a);
  border-right: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  padding: 12px 8px;
  overflow-y: auto;
  animation: dsh-launcher-menu-in 380ms var(--dsh-launcher-ease, ease) 80ms backwards;
}
.dsh-launcher-canvas-menu-label {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  padding: 10px 12px 8px;
  animation: dsh-launcher-item-in 320ms var(--dsh-launcher-ease, ease) 120ms backwards;
}
.dsh-launcher-canvas-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font: inherit;
  font-size: 13px;
  text-align: left;
  border-radius: var(--dsh-layout-radius-user, 10px);
  cursor: pointer;
  margin: 2px 0;
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
.dsh-launcher-canvas-menu-item.is-active { background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.08)); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-launcher-canvas-menu-item-icon { display: inline-flex; width: 18px; height: 18px; align-items: center; justify-content: center; flex: 0 0 18px; }
.dsh-launcher-canvas-menu-item-icon svg { width: 16px; height: 16px; }
.dsh-launcher-canvas-menu-item-label { flex: 1; }

.dsh-launcher-canvas-content {
  grid-area: content;
  overflow-y: auto;
  padding: 24px 28px 64px;
  -webkit-overflow-scrolling: touch;
  animation: dsh-launcher-content-in 460ms var(--dsh-launcher-ease, ease) 110ms backwards;
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

/* ─── Content area polish: section header + body wrap ─── */
.dsh-launcher-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
}
.dsh-launcher-section-header-tile {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.06));
  color: var(--dsw-alias-label-primary, #f4f4f5);
  flex: 0 0 44px;
}
.dsh-launcher-section-header-tile svg { width: 22px; height: 22px; }
.dsh-launcher-section-header-body { flex: 1; min-width: 0; }
.dsh-launcher-section-header-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.dsh-launcher-section-header-subtitle {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  margin-top: 4px;
  line-height: 1.5;
}

@keyframes dsh-launcher-canvas-in { from { opacity: 0; transform: scale(1.02) } to { opacity: 1; transform: scale(1) } }
@keyframes dsh-launcher-canvas-out { to { opacity: 0; transform: scale(0.985) } }
@keyframes dsh-launcher-topbar-in { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }
@keyframes dsh-launcher-menu-in { from { opacity: 0; transform: translateX(-12px) } to { opacity: 1; transform: translateX(0) } }
@keyframes dsh-launcher-item-in { from { opacity: 0; transform: translateX(-8px) } to { opacity: 1; transform: translateX(0) } }
@keyframes dsh-launcher-tab-item-in { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
@keyframes dsh-launcher-content-in { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }

/* ─── Marketplace shared — also imported by dsh-skill-manager / dsh-mcp-manager ─── */
.dsh-launcher-mkt-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
  align-items: center;
}
.dsh-launcher-mkt-sources-label {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  margin-right: 4px;
}
.dsh-launcher-mkt-source-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b3b3b8);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background 120ms var(--ds-ease-in-out, ease), color 120ms var(--ds-ease-in-out, ease);
}
.dsh-launcher-mkt-source-chip:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); color: var(--dsw-alias-label-primary, #f4f4f5); }
.dsh-launcher-mkt-source-chip.is-active { background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.1)); color: var(--dsw-alias-label-primary, #f4f4f5); border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); }
.dsh-launcher-mkt-source-chip .dsh-launcher-mkt-source-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary, #4caf50);
}
.dsh-launcher-mkt-source-chip.is-down .dsh-launcher-mkt-source-dot { background: var(--dsw-alias-state-error-primary, #ef5350); }
.dsh-launcher-mkt-source-chip.is-invalid .dsh-launcher-mkt-source-dot { background: var(--dsw-alias-state-business-primary, #ffb74d); }
.dsh-launcher-mkt-source-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px dashed color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent);
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dsh-launcher-mkt-source-add:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 30%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }

.dsh-launcher-mkt-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.dsh-launcher-mkt-search {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 10px);
  background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.04));
  color: var(--dsw-alias-label-primary, #f4f4f5);
}
.dsh-launcher-mkt-search input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 13px;
  min-width: 0;
}
.dsh-launcher-mkt-search input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dsh-launcher-mkt-search svg { width: 14px; height: 14px; flex: 0 0 14px; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dsh-launcher-mkt-toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 10px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dsh-launcher-mkt-toolbar-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.dsh-launcher-mkt-toolbar-btn svg { width: 14px; height: 14px; }
.dsh-launcher-mkt-toolbar-btn.is-spin svg { animation: dsh-launcher-spin 1.2s linear infinite; }

.dsh-launcher-mkt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.dsh-launcher-mkt-card {
  display: flex;
  flex-direction: column;
  background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.04));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 14px);
  padding: 16px;
  transition: border-color 120ms var(--ds-ease-in-out, ease), transform 120ms var(--ds-ease-in-out, ease);
  position: relative;
  overflow: hidden;
}
.dsh-launcher-mkt-card:hover { border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); transform: translateY(-1px); }
.dsh-launcher-mkt-card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
.dsh-launcher-mkt-card-tile {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: var(--dsh-layout-radius-user, 10px);
  background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.06));
  color: var(--dsw-alias-label-primary, #f4f4f5);
  flex: 0 0 36px;
}
.dsh-launcher-mkt-card-tile svg { width: 18px; height: 18px; }
.dsh-launcher-mkt-card-titleline { flex: 1; min-width: 0; }
.dsh-launcher-mkt-card-title { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); margin: 0; }
.dsh-launcher-mkt-card-meta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e); margin-top: 2px; }
.dsh-launcher-mkt-card-desc { font-size: 12px; color: var(--dsw-alias-label-secondary, #b3b3b8); line-height: 1.5; margin: 0 0 12px; min-height: 36px; }
.dsh-launcher-mkt-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
.dsh-launcher-mkt-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.06));
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.dsh-launcher-mkt-tag-source { color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.dsh-launcher-mkt-card-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.dsh-launcher-mkt-card-installed {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 14%, transparent);
  color: var(--dsw-alias-state-success-primary, #4caf50);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.dsh-launcher-mkt-card-action {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 16%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.dsh-launcher-mkt-card-action:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.dsh-launcher-mkt-card-action.is-primary {
  background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.18));
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 32%, transparent);
}
.dsh-launcher-mkt-card-action.is-danger { color: var(--dsw-alias-state-error-primary, #ef5350); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 32%, transparent); }
.dsh-launcher-mkt-card-action.is-danger:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 12%, transparent); }
.dsh-launcher-mkt-card-action:disabled { opacity: 0.55; cursor: not-allowed; }
.dsh-launcher-mkt-card-action.is-spin svg { animation: dsh-launcher-spin 1.2s linear infinite; }

.dsh-launcher-mkt-empty {
  text-align: center;
  padding: 48px 0;
  color: var(--dsw-alias-label-tertiary, #8a8a8e);
}
.dsh-launcher-mkt-error {
  color: var(--dsw-alias-state-error-primary, #ef5350);
  font-size: 12px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  margin-bottom: 12px;
}

/* ─── Add-source form: wraps to clean rows on mobile ─── */
.dsh-launcher-mkt-addrow {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.dsh-launcher-mkt-addrow input {
  flex: 1 1 220px;
  min-width: 0;
  padding: 8px 12px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.04));
  color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit;
  font-size: 13px;
  outline: 0;
}
.dsh-launcher-mkt-addrow input::placeholder { color: var(--dsw-alias-label-tertiary, #8a8a8e); }

@keyframes dsh-launcher-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

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
html[data-dsh-layout-material='on'] .dsh-launcher-canvas-topbar {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 62%, transparent);
  border-bottom-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dsh-launcher-canvas-menu {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
  border-right-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}
html[data-dsh-layout-material='on'] .dsh-launcher-mkt-card,
html[data-dsh-layout-material='on'] .dsh-launcher-mkt-search {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .dsh-launcher-mkt-card-tile,
html[data-dsh-layout-material='on'] .dsh-launcher-panel-item-icon {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 52%, transparent);
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
  .dsh-launcher-canvas-topbar,
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
    grid-template-columns: 1fr;
    grid-template-rows: 56px auto 1fr;
    grid-template-areas:
      "topbar"
      "tabbar"
      "content";
  }
  .dsh-launcher-canvas-topbar {
    padding: 0 12px;
  }
  .dsh-launcher-canvas-title { font-size: 13px; }
  .dsh-launcher-canvas-hint { display: none; }
  .dsh-launcher-canvas-close { padding: 6px 10px; }
  .dsh-launcher-canvas-close span { display: none; }

  .dsh-launcher-canvas-menu {
    grid-area: tabbar;
    border-right: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
    padding: 8px 8px;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    gap: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .dsh-launcher-canvas-menu::-webkit-scrollbar { display: none; }
  .dsh-launcher-canvas-menu-label { display: none; }
  .dsh-launcher-canvas-menu-item {
    flex: 0 0 auto;
    width: auto;
    padding: 8px 14px;
    margin: 0;
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
    padding: 16px 14px 80px;
  }
  .dsh-launcher-section-header {
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 12px;
  }
  .dsh-launcher-section-header-tile { width: 36px; height: 36px; flex: 0 0 36px; }
  .dsh-launcher-section-header-tile svg { width: 18px; height: 18px; }
  .dsh-launcher-section-header-title { font-size: 17px; }
  .dsh-launcher-section-header-subtitle { font-size: 11px; }

  .dsh-launcher-mkt-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .dsh-launcher-mkt-card { padding: 14px; border-radius: var(--dsh-layout-radius-user-lg, 12px); }
  .dsh-launcher-mkt-card-tile { width: 32px; height: 32px; flex: 0 0 32px; }
  .dsh-launcher-mkt-card-tile svg { width: 16px; height: 16px; }
  .dsh-launcher-mkt-card-title { font-size: 13px; }
  .dsh-launcher-mkt-card-desc { font-size: 11px; min-height: 0; }

  .dsh-launcher-mkt-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .dsh-launcher-mkt-search { min-width: 0; }
  .dsh-launcher-mkt-toolbar-btn { width: 100%; justify-content: center; }

  .dsh-launcher-mkt-sources { gap: 4px; }
  .dsh-launcher-mkt-source-chip { padding: 5px 10px; font-size: 11px; }
  .dsh-launcher-mkt-source-add { padding: 5px 10px; font-size: 11px; }

  .dsh-launcher-mkt-addrow { flex-direction: column; }
  .dsh-launcher-mkt-addrow input { flex: 1 1 auto; }

  .dsh-launcher-panel-mask {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
  }
  .dsh-launcher-panel {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    border: 0;
    animation: dsh-launcher-panel-mobile-in 240ms var(--ds-ease-in-out, ease);
  }
  .dsh-launcher-panel-head {
    padding: 14px 16px 10px;
  }
  .dsh-launcher-panel-hint { display: none; }
  .dsh-launcher-panel-item { padding: 14px 12px; }
  .dsh-launcher-panel-item-icon { width: 40px; height: 40px; flex: 0 0 40px; }
  .dsh-launcher-panel-item-icon svg { width: 20px; height: 20px; }
  .dsh-launcher-panel-item-title { font-size: 14px; }
  .dsh-launcher-panel-item-hint { font-size: 12px; }
}

/* ─── Tiny phone (≤ 480px) ─── */
@media (max-width: 480px) {
  .dsh-launcher-canvas-content { padding: 12px 10px 80px; }
  .dsh-launcher-mkt-grid { gap: 10px; }
  .dsh-launcher-mkt-card { padding: 12px; }
  .dsh-launcher-mkt-card-foot { flex-wrap: wrap; }
  .dsh-launcher-mkt-card-action { margin-left: 0; flex: 1 1 100%; justify-content: center; }
  .dsh-launcher-section-header-title { font-size: 15px; }
  .dsh-launcher-fab { bottom: 16px; left: 16px; width: 48px; height: 48px; }
}

/* ─── Floating launcher button (FAB) ───
   The guaranteed entry point: visible on every viewport by default.
   On desktop, when the best-effort side-rail button mounted successfully
   (rail-button.ts marks <body data-dsh-launcher-rail>), the FAB yields
   its slot so there aren't two floating entries for the same panel. On
   phones the rail lives in an off-canvas drawer, so the FAB always shows. */
.dsh-launcher-fab-host {
  display: contents;
}
.dsh-launcher-rail {
  width: 100%;
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
@media (min-width: 768px) {
  body[data-dsh-launcher-rail] .dsh-launcher-fab { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .dsh-launcher-fab { transition: none; }
  .dsh-launcher-fab:hover { transform: none; }
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
