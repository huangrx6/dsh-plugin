/**
 * Tiny DOM event bus for the launcher's three render sites (the sidebar
 * trigger button, the launcher panel, the workspace overlay). They live as
 * separate React roots mounted into three different places via React portals,
 * so a shared module event is the lightest way to coordinate them without
 * pulling in a state container.
 *
 * The bus keys are stable strings; consumers subscribe with `on(name, fn)`,
 * publish with `emit(name, detail)`. Subscribers receive `CustomEvent`s so
 * the standard `event.preventDefault()` / `event.stopPropagation()` work.
 */
export const LauncherEvents = {
 PanelOpen: "dsh-launcher:panel-open",
 PanelClose: "dsh-launcher:panel-close",
 WorkspaceOpen: "dsh-launcher:workspace-open",
 WorkspaceClose: "dsh-launcher:workspace-close",
 WorkspaceNavigate: "dsh-launcher:workspace-navigate",
 SystemSettingsOpen: "dsh-launcher:system-settings-open",
} as const;

export type LauncherEventName =
 (typeof LauncherEvents)[keyof typeof LauncherEvents];

export function emit(
 target: Document,
 name: LauncherEventName,
 detail?: unknown,
): void {
 target.dispatchEvent(new CustomEvent(name, { detail, bubbles: false }));
}

export function on(
 target: Document,
 name: LauncherEventName,
 handler: (event: CustomEvent) => void,
): () => void {
 const listener = (event: Event): void => {
  if (!(event instanceof CustomEvent)) return;
  handler(event);
 };
 target.addEventListener(name, listener);
 return () => {
  target.removeEventListener(name, listener);
 };
}
