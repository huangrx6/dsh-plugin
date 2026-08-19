/**
 * Launcher host — the single shell.overlay entry the platform renders for
 * us. Everything visual lives here:
 *
 *   - The floating launcher FAB (visible on every viewport; the only
 *     guaranteed entry point, since the side-rail button is best-effort)
 *   - The launcher panel (personal workspace / system settings)
 *   - The full-screen workspace canvas
 *
 * Why a slot entry instead of our own React root: the platform's
 * ModuleLoader only resolves `react` and whitelisted `@deepseek-ai/*`
 * packages for client bundles — `react-dom/client` (createRoot, portals)
 * is NOT in the module table, so any bundle requiring it dies silently
 * in the browser console. Registering through `shell.overlay` lets the
 * platform itself render our component tree with its own React.
 */
import { useCallback, useEffect, useState } from "react";
import type { PropsRenderSlots } from "@deepseek-ai/dsh-client-ui-slots";
import { LauncherPanelView } from "./LauncherPanel.tsx";
import { WorkspaceView, type SlotRegistryLike } from "./WorkspaceOverlay.tsx";
import { on, LauncherEvents } from "./events.ts";
import { findNativeSettingsTrigger } from "./dom-watcher.ts";
import { IconGrid } from "./icons.tsx";
import type { LauncherLocaleKey } from "./locales.ts";

export interface LauncherHostProps {
  /** Framework-injected translator (locale: 'dsh-launcher' on register). */
  readonly t: (
    key: LauncherLocaleKey,
    params?: Record<string, unknown>,
  ) => string;
  /** Narrow view over the slot registry, handed in via register's inject
      factory — the workspace menu reads live section entries from it. */
  readonly slotsView: SlotRegistryLike;
  /** Framework renderSlot narrowed to the children we declared on the
      overlay entry ('dsh-launcher.workspace.section'). Supplied by the
      slot machinery itself (PropsRenderSlots is part of the composed
      props); typed here with the framework's own shape so the register
      site type-checks. `| undefined` keeps it assignable when tests
      mount the host without the slot machinery. */
  readonly renderSlot?:
    | PropsRenderSlots<"dsh-launcher.workspace.section">["renderSlot"]
    | undefined;
}

export function LauncherHost({
  t,
  slotsView,
  renderSlot,
}: LauncherHostProps): JSX.Element {
  const [panelOpen, setPanelOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  useEffect(() => {
    return on(document, LauncherEvents.PanelOpen, () => {
      setPanelOpen(true);
    });
  }, []);

  useEffect(() => {
    return on(document, LauncherEvents.PanelClose, () => {
      setPanelOpen(false);
    });
  }, []);

  useEffect(() => {
    return on(document, LauncherEvents.WorkspaceOpen, () => {
      setWorkspaceOpen(true);
      setPanelOpen(false);
    });
  }, []);

  useEffect(() => {
    return on(document, LauncherEvents.WorkspaceClose, () => {
      setWorkspaceOpen(false);
    });
  }, []);

  // Escape is handled INSIDE each view (panel / workspace) so the close
  // runs through the view's exit animation instead of unmounting
  // instantly. The *Close DOM events above stay as programmatic
  // escape hatches — instant by design.

  const openPanel = useCallback(() => {
    setPanelOpen(true);
  }, []);

  const openWorkspace = useCallback(() => {
    setWorkspaceOpen(true);
    setPanelOpen(false);
  }, []);

  const openSystemSettings = useCallback(() => {
    setPanelOpen(false);
    // Click the platform's own settings trigger — we never shadow the
    // settings.trigger slot, so the native button (and its modal) stay
    // fully functional; we just drive it.
    const native = findNativeSettingsTrigger(document);
    if (native !== undefined) {
      native.click();
      return;
    }
    console.warn(
      "[dsh-launcher] native settings trigger not found — cannot open system settings",
    );
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const closeWorkspace = useCallback(() => {
    setWorkspaceOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        className="dsh-launcher-fab"
        onClick={openPanel}
        aria-label={t("launcher")}
        title={t("launcherHint")}
      >
        <IconGrid size={22} />
      </button>
      {panelOpen ? (
        <LauncherPanelView
          t={t}
          onPersonal={openWorkspace}
          onSystem={openSystemSettings}
          onClose={closePanel}
        />
      ) : null}
      {workspaceOpen ? (
        <WorkspaceView
          t={t}
          document={document}
          slotsView={slotsView}
          renderSlot={renderSlot}
          onClose={closeWorkspace}
        />
      ) : null}
    </>
  );
}
