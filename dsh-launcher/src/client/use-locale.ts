/**
 * Locale binding hook. The launcher registers its own namespace in the
 * platform's LocaleFace at boot, then asks for the bound translator. The
 * locale service is internal to the runtime — we read it through the
 * injected client context's `locale` service and the React side talks to
 * the same translator via `useSyncExternalStore`. The result is a tiny
 * "locale-bound" useCallback that re-renders on locale change.
 *
 * The runtime exposes the locale service as `ctx.locale`; we don't have
 * a direct reference here so the hook takes the translator explicitly from
 * the Workspace or LauncherPanel owner. The fallback is a noop translator
 * for environments where the locale service hasn't loaded yet.
 */
import { useCallback, useSyncExternalStore } from "react";
import type { LauncherLocaleKey } from "./locales.ts";

export type LauncherTranslate = (
 key: LauncherLocaleKey,
 params?: Record<string, unknown>,
) => string;

/** Null-safe default that just returns the key — useful in tests / SSR. */
const fallbackTranslate: LauncherTranslate = (key) => key;

/**
 * The hook is fed by the workspace/panel component, which holds the locale
 * binding for its registered namespace. The translate closure is the only
 * thing that swaps on locale change.
 */
export function useLauncherLocale(
 translate: LauncherTranslate = fallbackTranslate,
): LauncherTranslate {
 const subscribe = useCallback((handler: () => void) => {
  // Locale changes propagate via the LocaleFace's revision observable;
  // we don't have a JS handle here, so we just return no-op. The owner
  // component re-renders when the locale service emits.
  handler();
  return () => {};
 }, []);
 const getSnapshot = useCallback(() => translate, [translate]);
 const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
 return value;
}
