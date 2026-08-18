/**
 * Marketplace shared module. Other plugins (dsh-skill-manager, dsh-mcp-manager)
 * use this bundle to install a marketplace shell into the launcher workspace
 * without depending on the launcher's full client bundle. The market module
 * exposes:
 *
 *   - `MarketShelf` — a React component that renders the source chips,
 *     search input, refresh control, and the card grid.
 *   - `createMarketClient` — wires a `ClientContext`-style locale binding
 *     into the shelf so cards auto-translate.
 *   - `MarketCard` — the per-item card primitive; consumers pass through
 *     the action handlers (install, remove, etc.) so the data layer stays
 *     in the owning plugin.
 *   - `MarketSource` / `MarketItem` — the wiring types.
 *   - `loadMarketSources` / `saveMarketSources` — localStorage-backed
 *     source CRUD with built-in fallback.
 *   - `fetchManifest` — a fetcher that turns a manifest URL into a list
 *     of items, with HTTP caching and error reporting.
 *   - `installMarketShelf` — the convenience hookup other plugins use
 *     to drop a market section into the workspace.
 */
export type {
 MarketSource,
 MarketItem,
 MarketSourceState,
 ManifestEnvelope,
} from "./market/types.ts";
export { DEFAULT_MARKET_SOURCES, parseManifest } from "./market/types.ts";
export {
 loadMarketSources,
 saveMarketSources,
 addMarketSource,
 removeMarketSource,
 reorderMarketSources,
} from "./market/data-source-store.ts";
export { fetchManifest, fetchAllManifests } from "./market/manifest.ts";
export { MarketShelf, MarketCard } from "./market/MarketShelf.tsx";
export type {
 MarketShelfProps,
 MarketCardProps,
} from "./market/MarketShelf.tsx";
export { installMarketShelf } from "./market/install.ts";
export type { MarketInstallOptions } from "./market/install.ts";
