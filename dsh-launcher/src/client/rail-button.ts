/**
 * Best-effort side-rail button — plain DOM injection, no React.
 *
 * When the platform's side rail and its native settings trigger are
 * found, the launcher button REPLACES the native trigger: it takes over
 * the trigger's exact DOM slot (inserted as its preceding sibling in the
 * same parent), and the original is hidden by the `data-dsh-launcher-
 * replaced` stylesheet rule in styles.ts. Hiding — never removing — the
 * React-owned node keeps the platform's reconciliation intact, and the
 * launcher panel's "system settings" item can still drive the native
 * modal via trigger.click() (display:none elements stay clickable in
 * script). Clicking only emits a DOM event; every visual lives in the
 * shell.overlay entry (LauncherHost). If the rail or the native trigger
 * can't be located, this silently does nothing — the FAB inside the
 * overlay entry is the guaranteed entry point.
 *
 * A MutationObserver reconciles after platform re-renders (wide/narrow
 * toggle, settings modal open/close): the replacement flag is re-applied
 * every pass because a re-render recreates the trigger without it, and
 * the button is re-anchored if the rail moved it. All nodes are built
 * with DOM APIs (createElementNS for the SVG) — no innerHTML anywhere.
 */
import {
 findNativeSettingsTrigger,
 findSidebarColumn,
 watchDocument,
} from "./dom-watcher.ts";
import { emit, LauncherEvents } from "./events.ts";

const RAIL_BTN_ID = "dsh-launcher-rail-button";
/** Marks the native trigger we replaced; the hiding rule in styles.ts
    keys on this + the body attribute, so teardown only removes them. */
const REPLACED_FLAG = "data-dsh-launcher-replaced";
/** Set on <body> while the rail button owns the footer slot. Hides the
    replaced native trigger (desktop) and the FAB (see styles.ts). */
const RAIL_FLAG = "data-dsh-launcher-rail";
const SVG_NS = "http://www.w3.org/2000/svg";

export function installRailButton(target: Document): () => void {
 const watcher = watchDocument(target, () => {
  reconcile(target);
 });
 reconcile(target);

 return () => {
  watcher.dispose();
  target.getElementById(RAIL_BTN_ID)?.remove();
  target.body.removeAttribute(RAIL_FLAG);
  // Restore any trigger we replaced. Removing RAIL_FLAG alone already
  // disables the hiding rule; stripping the flags too keeps the DOM
  // clean for the next install.
  target
   .querySelectorAll(`[${REPLACED_FLAG}]`)
   .forEach((node) => node.removeAttribute(REPLACED_FLAG));
 };
}

function reconcile(target: Document): void {
 const sidebar = findSidebarColumn(target);
 if (sidebar === null) return;
 const nativeTrigger = findNativeSettingsTrigger(target);
 // A detached trigger (mid re-render) has no slot to take over; the
 // watcher fires again once it re-attaches.
 if (nativeTrigger === undefined || nativeTrigger.parentElement === null)
  return;

 // Replacement, not coexistence: flag the native trigger so the rule in
 // styles.ts hides it while we hold the footer slot. Idempotent and
 // re-applied every pass — platform re-renders recreate the node bare.
 nativeTrigger.setAttribute(REPLACED_FLAG, "");

 const existing = target.getElementById(RAIL_BTN_ID);
 if (existing === null) {
  nativeTrigger.parentElement.insertBefore(buildWrap(target), nativeTrigger);
 } else if (existing.parentElement !== nativeTrigger.parentElement) {
  // Mounted, but the rail re-rendered around it (wide/narrow toggle
  // remounts the footer) — re-anchor so we still sit in the trigger's
  // slot instead of a detached wrapper.
  nativeTrigger.parentElement.insertBefore(existing, nativeTrigger);
 }

 target.body.setAttribute(RAIL_FLAG, "");
}

function buildWrap(target: Document): HTMLDivElement {
 const wrap = target.createElement("div");
 wrap.id = RAIL_BTN_ID;
 wrap.className = "dsh-launcher-rail";

 const button = target.createElement("button");
 button.type = "button";
 button.className = "dsh-launcher-trigger";
 // Plain DOM injection has no locale seat — hardcode the trigger label
 // (both zh/en UIs ship Chinese rail labels for this surface anyway).
 button.setAttribute("aria-label", "功能");
 button.title = "功能";
 button.append(buildIconSpan(target), buildLabelSpan(target));
 button.addEventListener("click", () => {
  emit(target, LauncherEvents.PanelOpen);
 });
 wrap.append(button);
 return wrap;
}

function buildIconSpan(target: Document): HTMLSpanElement {
 const span = target.createElement("span");
 span.className = "dsh-launcher-trigger-icon";
 span.append(buildGlyph(target));
 return span;
}

function buildLabelSpan(target: Document): HTMLSpanElement {
 const span = target.createElement("span");
 span.className = "dsh-launcher-trigger-label";
 span.textContent = "功能";
 return span;
}

/** The 16×16 features glyph (four rounded squares — same shape as the
    React-side IconGrid), built via createElementNS so no innerHTML is
    involved anywhere in the injection path. */
function buildGlyph(target: Document): SVGSVGElement {
 const svg = target.createElementNS(SVG_NS, "svg");
 svg.setAttribute("viewBox", "0 0 16 16");
 svg.setAttribute("fill", "none");
 svg.setAttribute("aria-hidden", "true");

 for (const [x, y] of [
  [2.5, 2.5],
  [9, 2.5],
  [2.5, 9],
  [9, 9],
 ] as const) {
  const square = target.createElementNS(SVG_NS, "rect");
  square.setAttribute("x", String(x));
  square.setAttribute("y", String(y));
  square.setAttribute("width", "4.5");
  square.setAttribute("height", "4.5");
  square.setAttribute("rx", "1.2");
  square.setAttribute("stroke", "currentColor");
  square.setAttribute("stroke-width", "1.3");
  square.setAttribute("stroke-linejoin", "round");
  svg.append(square);
 }

 return svg;
}
