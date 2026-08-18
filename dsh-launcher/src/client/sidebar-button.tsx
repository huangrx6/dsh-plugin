/**
 * Sidebar trigger injection + H5 floating button.
 *
 * Desktop: the launcher button is parked inside the side rail, so it
 * sits alongside the native settings trigger. The native button stays
 * intact and the launcher panel's "System settings" entry simply clicks
 * it — we don't shadow the platform's `settings.trigger` slot.
 *
 * H5 (≤ 767px): the side rail is hidden by default (dsh-layout's off-canvas
 * drawer), so a button baked inside it is invisible. We additionally mount
 * a fixed-position FAB anchored to the bottom-left; CSS hides it on
 * desktop and shows it on phones. The FAB and the rail button live in
 * the same React tree so the locale + onClick closures are identical.
 */
import { createRoot, type Root } from "react-dom/client";
import { LauncherTrigger } from "./LauncherPanel.tsx";
import {
  findNativeSettingsTrigger,
  findSidebarColumn,
  watchDocument,
} from "./dom-watcher.ts";
import { emit, LauncherEvents } from "./events.ts";

const RAIL_ANCHOR_ID = "dsh-launcher-sidebar-anchor";
const FAB_HOST_ID = "dsh-launcher-fab-host";

export function installSidebarTrigger(target: Document): () => void {
  const watcher = watchDocument(target, () => {
    reconcileRail();
  });
  reconcileRail();
  mountFab(target);

  return () => {
    watcher.dispose();
    tearDownRail(target);
    tearDownFab(target);
  };

  function reconcileRail(): void {
    const sidebar = findSidebarColumn(target);
    if (sidebar === null) return;
    const nativeTrigger = findNativeSettingsTrigger(target);
    if (nativeTrigger === undefined) return;

    let anchor = target.getElementById(RAIL_ANCHOR_ID);
    if (anchor === null) {
      anchor = target.createElement("div");
      anchor.id = RAIL_ANCHOR_ID;
      anchor.style.display = "block";
      anchor.style.padding = "0 8px";
      anchor.style.margin = "2px 0";
      anchor.style.width = "100%";
      // The native trigger is the deepest button in the footer; sit our
      // anchor just above it so the launcher button reads as a sibling.
      sidebar.insertBefore(
        anchor,
        nativeTrigger.parentElement?.contains(nativeTrigger) === true
          ? nativeTrigger.parentElement
          : nativeTrigger,
      );
    }
    const typed = anchor as HTMLElement & { __dshLauncherRoot?: Root };
    if (typed.__dshLauncherRoot === undefined) {
      const root = createRoot(anchor);
      typed.__dshLauncherRoot = root;
      root.render(
        <LauncherTrigger
          wide={!isCollapsed(sidebar)}
          onClick={() => emit(target, LauncherEvents.PanelOpen)}
        />,
      );
    }
  }
}

function mountFab(target: Document): void {
  let host = target.getElementById(FAB_HOST_ID);
  if (host === null) {
    host = target.createElement("div");
    host.id = FAB_HOST_ID;
    host.className = "dsh-launcher-fab-host";
    target.body.append(host);
  }
  const typed = host as HTMLElement & { __dshLauncherRoot?: Root };
  if (typed.__dshLauncherRoot === undefined) {
    const root = createRoot(host);
    typed.__dshLauncherRoot = root;
    root.render(
      <button
        type="button"
        className="dsh-launcher-fab"
        onClick={() => emit(target, LauncherEvents.PanelOpen)}
        aria-label="个人插件"
        title="个人插件"
      >
        <LauncherGlyph />
      </button>,
    );
  }
}

function LauncherGlyph(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5l5 2.5v5L8 11.5 3 9V4l5-2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8 11.5v3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M5.5 13.5h5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function tearDownRail(target: Document): void {
  const anchor = target.getElementById(RAIL_ANCHOR_ID);
  if (anchor !== null) {
    const root = (anchor as HTMLElement & { __dshLauncherRoot?: Root })
      .__dshLauncherRoot;
    root?.unmount();
    anchor.remove();
  }
}

function tearDownFab(target: Document): void {
  const host = target.getElementById(FAB_HOST_ID);
  if (host !== null) {
    const root = (host as HTMLElement & { __dshLauncherRoot?: Root })
      .__dshLauncherRoot;
    root?.unmount();
    host.remove();
  }
}

function isCollapsed(sidebar: HTMLElement): boolean {
  const frame = sidebar.parentElement;
  if (frame === null) return false;
  return (
    frame.hasAttribute("data-sidebar-collapsed") ||
    sidebar.classList.toString().match(/collapsed|rail|narrow/i) !== null
  );
}
