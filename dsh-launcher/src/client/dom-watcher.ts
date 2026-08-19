/**
 * DOM watcher: a small, debounced MutationObserver. The launcher needs to
 * react to the side rail appearing (after app boot) and to its settings
 * trigger being unmounted/remounted (after a wide/narrow toggle). dsh-layout
 * has its own internal `DomSync` but it isn't exported; this replacement is
 * deliberately lean — schedules one full recheck per microtask, where the
 * callers re-query the DOM and idempotently reconcile.
 */

export interface Watcher {
 readonly dispose: () => void;
}

export function watchDocument(target: Document, onChange: () => void): Watcher {
 let scheduled = false;

 const fire = (): void => {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
   scheduled = false;
   onChange();
  });
 };

 const observer = new MutationObserver(fire);
 observer.observe(target.body, { childList: true, subtree: true });
 // First paint of the observer is the current state; nothing to do here.
 return {
  dispose: () => {
   observer.disconnect();
  },
 };
}

/**
 * Locate the native side rail settings trigger button. The platform doesn't
 * expose a stable id for it, but the sidebar is the first column of the
 * AppFrame and the trigger is the button the platform renders into the
 * `settings.trigger` slot. We pick the deepest <button> in the sidebar's
 * footer area; if no footer is present we fall back to the last button in
 * the sidebar. The selector stays loose on purpose — the platform may
 * upgrade the layout without breaking this anchor.
 */
export function findNativeSettingsTrigger(
 target: Document,
): HTMLButtonElement | undefined {
 // Try the sidebar first (marked column, else frame fallback). The
 // platform footer is appended to the sidebar in the wide layout and
 // mounted as a sticky bottom slot in the narrow layout. Either way, an
 // aria-label/hearing-empty <button> with the gear glyph lives there.
 const sidebar = findSidebarColumn(target);
 let buttons: HTMLButtonElement[] = [];
 if (sidebar !== null) {
  buttons = Array.from(
   sidebar.querySelectorAll<HTMLButtonElement>("button"),
  ).filter(isNotOwnRailButton);
 }
 let hit = pickSettingsButton(buttons);
 // Mobile layouts can host the drawer / trigger outside the sidebar
 // column the frame heuristics resolve — fall back to a document-wide
 // scan so the launcher's "system settings" entry still finds a native
 // trigger (and the replacement can still hide it).
 if (hit === undefined) {
  hit = pickSettingsButton(
   Array.from(target.querySelectorAll<HTMLButtonElement>("button")).filter(
    isNotOwnRailButton,
   ),
  );
 }
 return hit;
}

/** Our injected rail button must never become the "settings trigger" —
    the replacement logic would then target itself. */
function isNotOwnRailButton(button: HTMLButtonElement): boolean {
 return button.closest(".dsh-launcher-rail") === null;
}

/** Prefer the bottom-most button that looks like a settings trigger
    (multi-language "设置" / "Settings" hits, or the only icon-only button
    in the footer area); fall back to the last button as a safety net. */
function pickSettingsButton(
 buttons: readonly HTMLButtonElement[],
): HTMLButtonElement | undefined {
 if (buttons.length === 0) return undefined;
 for (let index = buttons.length - 1; index >= 0; index -= 1) {
  const button = buttons[index];
  if (button === undefined) continue;
  const label = (
   button.getAttribute("aria-label") ??
   button.textContent ??
   ""
  ).trim();
  if (/设置|Settings|設定|Setting|Preferences|環境設定|Cài đặt/i.test(label))
   return button;
 }
 return buttons[buttons.length - 1];
}

/** Anchor: the sidebar column. dsh-layout marks it; the platform's bare
    AppFrame doesn't. We probe both. */
export function findSidebarColumn(target: Document): HTMLElement | null {
 const marked = target.querySelector<HTMLElement>(
  "[data-dsh-layout-sidebar-col]",
 );
 if (marked !== null) return marked;
 const root = target.querySelector<HTMLElement>('[data-slot="root"]');
 const frame = root?.firstElementChild;
 if (frame === undefined || frame === null) return null;
 // The sidebar is the first column; the conversation is the second.
 return frame.firstElementChild instanceof HTMLElement
  ? (frame.firstElementChild as HTMLElement)
  : null;
}

/** Anchor: the conversation column. Same fallback ladder. */
export function findConversationColumn(target: Document): HTMLElement | null {
 const marked = target.querySelector<HTMLElement>(
  "[data-dsh-layout-center-col]",
 );
 if (marked !== null) return marked;
 const root = target.querySelector<HTMLElement>('[data-slot="root"]');
 const frame = root?.firstElementChild;
 if (frame === undefined || frame === null) return null;
 const columns = frame.children;
 if (columns.length < 2) return null;
 return columns[1] instanceof HTMLElement ? (columns[1] as HTMLElement) : null;
}
