/**
 * Installed-catalog view preference: whether the "Installed" tab renders
 * its compact row list or the card grid. Same single-slot localStorage
 * record as the market's view preference, but under its own key so the
 * two tabs remember their layouts independently; unreadable / unknown
 * values fall back to the row list.
 */

export type InstalledViewMode = "list" | "cards";

const STORAGE_KEY = "dsh-skill-manager.installed.view.v1";

export function installedViewStorageKey(): string {
  return STORAGE_KEY;
}

export function loadInstalledView(storage: Storage): InstalledViewMode {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === "cards" ? "cards" : "list";
  } catch {
    return "list";
  }
}

export function saveInstalledView(
  storage: Storage,
  mode: InstalledViewMode,
): void {
  try {
    storage.setItem(STORAGE_KEY, mode);
  } catch {
    // Private-mode storage quotas: the preference stays session-only.
  }
}
