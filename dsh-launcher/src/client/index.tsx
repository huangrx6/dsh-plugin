/**
 * dsh-launcher client entry. The plugin mounts three things:
 *
 *   1. The launcher styles (a single <style> element in the head).
 *   2. The sidebar trigger button parked next to the platform's settings
 *      trigger (DOM injection via watchdog).
 *   3. The launcher panel and the workspace overlay, both rendered as
 *      detached React roots in <body> via React portals and toggled by
 *      DOM events from the sidebar.
 *
 * No marketplaces are wired here — those live in the dsh-* plugins that
 * own the data and register to the launcher's workspace section slot.
 */
import { createRoot, type Root } from "react-dom/client";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import "@deepseek-ai/dsh-client-locale/client";
import { installStyles } from "./styles.ts";
import { enUS, LAUNCHER_NS, zhCN, type LauncherLocaleKey } from "./locales.ts";
import { installSidebarTrigger } from "./sidebar-button.tsx";
import { LauncherPanel } from "./LauncherPanel.tsx";
import {
 WorkspaceOverlay,
 type SlotRegistryLike,
} from "./WorkspaceOverlay.tsx";

declare module "@deepseek-ai/dsh-client-ui-slots" {
 interface LocaleNamespaceMap {
  "dsh-launcher": LauncherLocaleKey;
 }
 interface SlotMap {
  /** Workspace sections contributed by other plugins. Each entry renders
        inside the launcher's left-menu / right-content layout. */
  "dsh-launcher.workspace.section": {
   kind: "list";
   scope: "root";
   owner: object;
  };
 }
}

export const inject = ["slots", "locale"] as const;

export function apply(ctx: ClientContext): void {
 ctx.effect(() => installStyles(document), "dsh-launcher: styles");
 ctx.effect(
  () => ctx.locale.register(LAUNCHER_NS, { zh: zhCN, en: enUS }),
  "dsh-launcher: dictionaries",
 );
 ctx.effect(
  () => installSidebarTrigger(document),
  "dsh-launcher: sidebar trigger",
 );

 // The slot registry is the spine of the workspace: other plugins register
 // to `dsh-launcher.workspace.section` and the overlay reads the entries
 // live. We hand the workspace a narrow view of the registry so the
 // overlay never sees the wider Service API.
 const slots = ctx.slots as unknown as SlotRegistryLike;

 // Detached React roots; both are hidden by default and their visibility
 // is driven by document events (panel) or workspace events (overlay).
 const panelHost = document.createElement("div");
 panelHost.id = "dsh-launcher-panel-root";
 panelHost.style.display = "contents";
 document.body.append(panelHost);
 const panelRoot: Root = createRoot(panelHost);
 panelRoot.render(<LauncherPanel document={document} />);

 const overlayHost = document.createElement("div");
 overlayHost.id = "dsh-launcher-overlay-root";
 overlayHost.style.display = "contents";
 document.body.append(overlayHost);
 const overlayRoot: Root = createRoot(overlayHost);
 overlayRoot.render(<WorkspaceOverlay document={document} slots={slots} />);

 ctx.effect(
  () => () => {
   panelRoot.unmount();
   overlayRoot.unmount();
   panelHost.remove();
   overlayHost.remove();
  },
  "dsh-launcher: panel + overlay unmount",
 );
}

export {
 WorkspaceOverlay,
 DEFAULT_SECTIONS,
 WORKSPACE_SECTION_SLOT,
} from "./WorkspaceOverlay.tsx";
export type {
 WorkspaceSection,
 SlotRegistryLike,
 SlotEntryView,
} from "./WorkspaceOverlay.tsx";
export { LauncherEvents, emit, on } from "./events.ts";
export type { LauncherEventName } from "./events.ts";
export { LAUNCHER_NS, enUS, zhCN } from "./locales.ts";
export type { LauncherLocaleKey } from "./locales.ts";
export { useLauncherLocale } from "./use-locale.ts";
export type { LauncherTranslate } from "./use-locale.ts";
