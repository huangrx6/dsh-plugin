/**
 * Marketplace section installer. The launcher ships the marketplace UI
 * primitives; the dsh-* plugins compose them into their own workspace
 * section. `installMarketShelf` is the convenience hook other plugins
 * use to drop a market section into the workspace and handle the
 * install/remove calls.
 *
 * Usage (inside, e.g., dsh-skill-manager's client apply):
 *
 *   ctx.slots.inject('dsh-launcher.workspace.section', () => ctx.slots.register({
 *     name: 'dsh-launcher.workspace.section',
 *     id: 'skills-market',
 *     order: 50,
 *     label: () => t('marketTab'),
 *     locale: SKILL_MANAGER_NS,
 *     inject: () => ({
 *       render: () => <SkillMarketShelfInner />,
 *       icon: <IconSkills />,
 *     }),
 *   }, SlotEntry))
 *
 * The skill/mcp plugin defines the inner React component using
 * `MarketShelf` directly; this module just wires the locale / sources
 * defaults they share.
 */
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import { LAUNCHER_NS, enUS, zhCN } from "../locales.ts";
import { DEFAULT_MARKET_SOURCES } from "./types.ts";
import { loadMarketSources } from "./data-source-store.ts";

export interface MarketInstallOptions {
 /** Plugin id (used for source storage isolation if multiple plugins install). */
 readonly pluginId: string;
 /** Storage slot. Defaults to `window.localStorage`. */
 readonly storage?: Storage;
 /** Default source list — merged with the built-in launcher defaults. */
 readonly defaultSources?: readonly import("./types.ts").MarketSource[];
}

export function installMarketShelf(
 ctx: ClientContext,
 options: MarketInstallOptions,
): () => void {
 const storage = options.storage ?? globalThis.localStorage;
 if (storage === undefined) {
  return () => {};
 }
 // Touch the launcher dictionaries so the marketplace chrome has a
 // fallback translator even if the launcher plugin is not installed.
 ctx.locale.register(LAUNCHER_NS, { zh: zhCN, en: enUS });
 const cached = loadMarketSources(storage);
 if (cached.length === 0 && options.defaultSources !== undefined) {
  for (const candidate of options.defaultSources) {
   if (
    !DEFAULT_MARKET_SOURCES.some((existing) => existing.id === candidate.id)
   ) {
    storage.setItem(
     "dsh-launcher.market.sources.v1",
     JSON.stringify([...DEFAULT_MARKET_SOURCES, ...options.defaultSources]),
    );
    break;
   }
  }
 }
 return () => {
  // The slot is owned by the caller; nothing to clean up here.
 };
}
