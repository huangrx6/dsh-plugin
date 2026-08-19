/**
 * Market view preference: whether the shelf renders its compact row list
 * or the card grid. A tiny localStorage record so the choice survives
 * page reloads; unreadable / unknown values fall back to the row list.
 */

export type MarketViewMode = "list" | "cards";

const STORAGE_KEY = "dsh-skill-manager.market.view.v1";

export function marketViewStorageKey(): string {
  return STORAGE_KEY;
}

export function loadMarketView(storage: Storage): MarketViewMode {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === "cards" ? "cards" : "list";
  } catch {
    return "list";
  }
}

export function saveMarketView(
  storage: Storage,
  mode: MarketViewMode,
): void {
  try {
    storage.setItem(STORAGE_KEY, mode);
  } catch {
    // Private-mode storage quotas: the preference simply stays session-only.
  }
}
