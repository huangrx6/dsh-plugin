/**
 * Marketplace type contract. The marketplace is split across two layers:
 *
 *   - The source layer (which manifests to query, in what order, named how).
 *     Sources are persisted in localStorage; the launcher ships a default
 *     list so the UI has something to render on first run.
 *   - The item layer (which packages / skills / MCPs the source returned).
 *     Items are pure data; the owning plugin decides what to do with them
 *     (install, remove, probe, etc.) via the shelf's `onInstall` / `onRemove`
 *     hooks.
 *
 * The "source" is the only piece of state the launcher market module owns
 * directly. The fetching, caching, and rendering live in their own modules
 * so a future plugin can implement a custom source strategy without
 * re-typing the contract.
 */

/** A marketplace source: a remote JSON manifest with a name and order. */
export interface MarketSource {
  /** Stable id (UUID-ish). Generated when the source is added. */
  readonly id: string;
  /** Display name (e.g. "DSH 官方市场"). */
  readonly name: string;
  /** Manifest URL. The fetcher expects a JSON envelope. */
  readonly url: string;
  /** Built-in sources cannot be removed, only hidden. */
  readonly builtIn: boolean;
  /** Sort key: ascending. The first source is the default selection. */
  readonly order: number;
  /** Optional categorization (e.g. "official", "community"). */
  readonly tag?: string;
}

/** Item kind: the marketplace card renders slightly different chrome per kind. */
export type MarketItemKind =
  | "skill"
  | "mcp"
  | "archive"
  | "layout"
  | "remote"
  | "general";

/**
 * One item on a marketplace manifest. The launcher only requires the
 * `id` / `name` / `description` core; kind-specific fields (e.g. `installUrl`
 * for skills, `config` for MCPs) are owned by the consuming plugin and
 * passed through verbatim.
 */
export interface MarketItem {
  /** Source-defined id. The owning plugin maps this to its install path. */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** Display description (one-liner). */
  readonly description: string;
  /** Optional inline tag list (display only). */
  readonly tags?: readonly string[];
  /** Optional author attribution. */
  readonly author?: string;
  /** Optional version string. */
  readonly version?: string;
  /** Optional icon URL (24×24 PNG / SVG). */
  readonly icon?: string;
  /** Which kind of item this is — the shelf passes it back to the install hook. */
  readonly kind: MarketItemKind;
  /**
   * Source-defined payload. The launcher treats this as opaque and passes
   * it through to install/remove callbacks. A skill marketplace stores the
   * install URL here; an MCP marketplace stores the config JSON here.
   */
  readonly payload?: Record<string, unknown>;
}

/** The envelope a manifest endpoint must return. */
export interface ManifestEnvelope {
  /** Source display name (override the local one if present). */
  readonly name?: string;
  /** Source description (shown in tooltips). */
  readonly description?: string;
  /** Schema version for forward compat. */
  readonly version?: number;
  /** The items. */
  readonly items: readonly MarketItem[];
}

/** Runtime fetch state for one source. */
export type MarketSourceState =
  | "idle"
  | "loading"
  | "ok"
  | "offline"
  | "invalid";

/**
 * The built-in starter sources. The package ships these in the bundle so
 * the marketplace has content on first run; users can add or remove
 * sources on top of them via the source chip "Add" affordance.
 *
 * The list is intentionally conservative — a single offline-friendly
 * starter that the package owner can swap out by editing this file and
 * bumping the package version.
 */
export const DEFAULT_MARKET_SOURCES: readonly MarketSource[] = [];

/** The built-in "DSH 内置" feed was retired per user request — the market
    ships empty and users add their own sources. loadMarketSources drops
    stored copies of retired built-ins so they disappear on upgrade. */

/**
 * Parse and validate a manifest response. Defensive: the manifest is user-
 * controlled JSON, so we tolerate missing optional fields and refuse anything
 * that doesn't look like a marketplace document.
 */
export function parseManifest(input: unknown): ManifestEnvelope {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("清单格式无效：根不是对象");
  }
  const record = input as Record<string, unknown>;
  const rawItems = record["items"];
  if (!Array.isArray(rawItems)) {
    throw new Error("清单格式无效：items 不是数组");
  }
  const items: MarketItem[] = [];
  for (const raw of rawItems) {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const id = item["id"];
    const name = item["name"];
    const description = item["description"];
    if (typeof id !== "string" || id === "") continue;
    if (typeof name !== "string" || name === "") continue;
    if (typeof description !== "string") continue;
    const kind =
      item["kind"] === "skill" ||
      item["kind"] === "mcp" ||
      item["kind"] === "archive" ||
      item["kind"] === "layout" ||
      item["kind"] === "general"
        ? item["kind"]
        : "general";
    const tagsValue = item["tags"];
    const tags = Array.isArray(tagsValue)
      ? tagsValue.filter((tag): tag is string => typeof tag === "string")
      : undefined;
    const payload = item["payload"];
    const cleanedPayload =
      payload !== undefined &&
      payload !== null &&
      typeof payload === "object" &&
      !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : undefined;
    const author =
      typeof item["author"] === "string" ? item["author"] : undefined;
    const version =
      typeof item["version"] === "string" ? item["version"] : undefined;
    const icon = typeof item["icon"] === "string" ? item["icon"] : undefined;
    items.push({
      id,
      name,
      description,
      kind,
      ...(tags !== undefined ? { tags } : {}),
      ...(author !== undefined ? { author } : {}),
      ...(version !== undefined ? { version } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(cleanedPayload !== undefined ? { payload: cleanedPayload } : {}),
    });
  }
  const name = typeof record["name"] === "string" ? record["name"] : undefined;
  const description =
    typeof record["description"] === "string"
      ? record["description"]
      : undefined;
  const version =
    typeof record["version"] === "number" ? record["version"] : undefined;
  return {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(version !== undefined ? { version } : {}),
    items,
  };
}
