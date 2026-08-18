/**
 * Best-effort side-rail button — plain DOM injection, no React.
 *
 * When the platform's side rail and its native settings trigger are
 * found, a small launcher button is inserted just above the trigger so
 * it reads as a sibling. Clicking only emits a DOM event; every visual
 * lives in the shell.overlay entry (LauncherHost). If the rail or the
 * native trigger can't be located, this silently does nothing — the FAB
 * inside the overlay entry is the guaranteed entry point.
 *
 * A MutationObserver reconciles the button after platform re-renders
 * (wide/narrow toggle, settings modal open/close) so it survives without
 * pinning a specific spot in the rail. All nodes are built with DOM
 * APIs (createElementNS for the SVG) — no innerHTML anywhere.
 */
import {
  findNativeSettingsTrigger,
  findSidebarColumn,
  watchDocument,
} from "./dom-watcher.ts";
import { emit, LauncherEvents } from "./events.ts";

const RAIL_BTN_ID = "dsh-launcher-rail-button";
const SVG_NS = "http://www.w3.org/2000/svg";

export function installRailButton(target: Document): () => void {
  const watcher = watchDocument(target, () => {
    reconcile(target);
  });
  reconcile(target);

  return () => {
    watcher.dispose();
    target.getElementById(RAIL_BTN_ID)?.remove();
    target.body.removeAttribute("data-dsh-launcher-rail");
  };
}

function reconcile(target: Document): void {
  const sidebar = findSidebarColumn(target);
  if (sidebar === null) return;
  const nativeTrigger = findNativeSettingsTrigger(target);
  if (nativeTrigger === undefined) return;

  if (target.getElementById(RAIL_BTN_ID) !== null) return;

  const wrap = target.createElement("div");
  wrap.id = RAIL_BTN_ID;
  wrap.className = "dsh-launcher-rail";

  const button = target.createElement("button");
  button.type = "button";
  button.className = "dsh-launcher-trigger";
  button.setAttribute("aria-label", "个人插件");
  button.title = "个人插件";
  button.append(buildIconSpan(target), buildLabelSpan(target));
  button.addEventListener("click", () => {
    emit(target, LauncherEvents.PanelOpen);
  });
  wrap.append(button);

  // Sit just above the native settings trigger (or its wrapper) so the
  // two buttons read as siblings in the rail footer.
  const reference =
    nativeTrigger.parentElement?.contains(nativeTrigger) === true
      ? nativeTrigger.parentElement
      : nativeTrigger;
  sidebar.insertBefore(wrap, reference);

  // Mark the body so the FAB can yield its desktop slot to this button
  // (see styles.ts: the FAB is the guaranteed entry on phones and the
  // fallback on desktop — when the rail button IS mounted, desktop
  // hides the FAB to avoid two floating entries for the same panel).
  target.body.setAttribute("data-dsh-launcher-rail", "");
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
  span.textContent = "个人插件";
  return span;
}

/** The 16×16 launcher glyph (cube + stand), built via createElementNS so
    no innerHTML is involved anywhere in the injection path. */
function buildGlyph(target: Document): SVGSVGElement {
  const svg = target.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");

  const body = target.createElementNS(SVG_NS, "path");
  body.setAttribute("d", "M8 1.5l5 2.5v5L8 11.5 3 9V4l5-2.5Z");
  body.setAttribute("stroke", "currentColor");
  body.setAttribute("stroke-width", "1.3");
  body.setAttribute("stroke-linejoin", "round");
  svg.append(body);

  const stem = target.createElementNS(SVG_NS, "path");
  stem.setAttribute("d", "M8 11.5v3");
  stem.setAttribute("stroke", "currentColor");
  stem.setAttribute("stroke-width", "1.3");
  stem.setAttribute("stroke-linecap", "round");
  svg.append(stem);

  const base = target.createElementNS(SVG_NS, "path");
  base.setAttribute("d", "M5.5 13.5h5");
  base.setAttribute("stroke", "currentColor");
  base.setAttribute("stroke-width", "1.3");
  base.setAttribute("stroke-linecap", "round");
  svg.append(base);

  return svg;
}
