/**
 * Small view preferences persisted in localStorage (storage injectable so
 * tests never touch the real DOM):
 *
 *   - section mode: which of the two workspace sub-views ("已安装" master
 *     detail vs "市场" shelf) the MCP section opens on
 *   - market view: whether the shelf renders compact rows or the card grid
 *
 * Readers tolerate a missing / quarantined storage and any junk value by
 * falling back to the default; writers swallow quota errors silently —
 * a preference that fails to persist must never break rendering.
 */

export type SectionMode = 'installed' | 'market'
export type MarketView = 'list' | 'card'

const SECTION_MODE_KEY = 'dsh-mcp-manager:section-mode'
const MARKET_VIEW_KEY = 'dsh-mcp-manager:market-view'

export function loadSectionMode(storage: Storage): SectionMode {
  try {
    return storage.getItem(SECTION_MODE_KEY) === 'market' ? 'market' : 'installed'
  } catch {
    return 'installed'
  }
}

export function saveSectionMode(storage: Storage, mode: SectionMode): void {
  try {
    storage.setItem(SECTION_MODE_KEY, mode)
  } catch {
    // ignore: preference persistence is best-effort
  }
}

export function loadMarketView(storage: Storage): MarketView {
  try {
    return storage.getItem(MARKET_VIEW_KEY) === 'card' ? 'card' : 'list'
  } catch {
    return 'list'
  }
}

export function saveMarketView(storage: Storage, view: MarketView): void {
  try {
    storage.setItem(MARKET_VIEW_KEY, view)
  } catch {
    // ignore: preference persistence is best-effort
  }
}
