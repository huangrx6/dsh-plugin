/**
 * Marketplace shelf. Self-contained UI for the dsh-mcp-manager plugin
 * (vendored from dsh-launcher's market module — the platform's ModuleLoader
 * forbids cross-plugin value imports, so the source-of-truth lives here).
 *
 * "Quiet Structure" layout (Raycast-store / macOS-Settings shape):
 *   - one toolbar row: segmented source picker (equal-width capsules),
 *     a 34px search field, a 28px refresh icon button and a 28px
 *     add-source icon button that opens a compact inline form
 *   - one grouped container holding every item as a compact row
 *     (32px icon tile / name + source meta / single-line description /
 *     install action), separated by 1px hairlines — no cards, no grids,
 *     no hover lift, background-only feedback
 *
 * Does NOT own the install / remove button behavior — those bubbled up
 * as `onInstall` / `onRemove` callbacks so the consumer plugin owns the
 * wire call.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconArchive,
  IconLayout,
  IconMcp,
  IconPlus,
  IconRefresh,
  IconRemote,
  IconSearch,
  IconSkills,
  IconSparkle,
} from "./icons.tsx";
import {
  addMarketSource as addMarketSourceImpl,
  loadMarketSources,
  removeMarketSource as removeMarketSourceImpl,
} from "./data-source-store.ts";
import { fetchAllManifests, type SourceSnapshot } from "./manifest.ts";
import type { MarketItem, MarketItemKind, MarketSource } from "./types.ts";

export interface MarketShelfProps {
  /** localStorage slot. The launcher owns one; other plugins can pass their own. */
  readonly storage: Storage;
  /** Default source list (used when storage is empty). */
  readonly defaultSources: readonly MarketSource[];
  /** Per-source fetcher override (tests). */
  readonly fetcher?: typeof fetch;
  /** Restrict which kinds of items render. Undefined = all kinds. */
  readonly kinds?: readonly MarketItemKind[];
  /** Rows rendered with this label set. Callers pass a translator. */
  readonly translate: (
    key: MarketplaceLocaleKey,
    params?: Record<string, unknown>,
  ) => string;
  /** Optional row click handler (open detail). */
  readonly onItemOpen?: (item: MarketItem, source: MarketSource) => void;
  /** Install handler. Returns a promise that resolves once the install finishes. */
  readonly onInstall: (item: MarketItem, source: MarketSource) => Promise<void>;
  /** Optional remove handler. When omitted, the "Remove" button is hidden. */
  readonly onRemove?: (item: MarketItem, source: MarketSource) => Promise<void>;
  /** Predicate: is the item already installed? Drives the action button. */
  readonly isInstalled: (item: MarketItem) => boolean;
}

/**
 * Keys resolved through the launcher's locale seat. Kept in sync with the
 * dsh-launcher dictionary (the shelf is translated by whoever mounts it);
 * "close" rides the launcher's shared close label.
 */
export type MarketplaceLocaleKey =
  | "marketSources"
  | "marketAddSource"
  | "marketSourceName"
  | "marketSourceUrl"
  | "marketRefresh"
  | "marketRefreshing"
  | "marketSearch"
  | "marketEmpty"
  | "marketEmptySearch"
  | "marketViewAll"
  | "marketViewSource"
  | "marketInstalled"
  | "marketInstall"
  | "marketInstalling"
  | "marketRemove"
  | "marketRemoving"
  | "marketFailed"
  | "marketSourceUp"
  | "marketSourceDown"
  | "marketSourceInvalid"
  | "close";

/**
 * Pick a row tile icon by item kind. The launcher's "default" tile is
 * the sparkle (general/unknown); consumers can override by passing a
 * different `kind` in the manifest.
 */
function TileIcon({ kind }: { readonly kind: MarketItemKind }): JSX.Element {
  switch (kind) {
    case "skill":
      return <IconSkills size={16} />;
    case "mcp":
      return <IconMcp size={16} />;
    case "archive":
      return <IconArchive size={16} />;
    case "layout":
      return <IconLayout size={16} />;
    case "remote":
      return <IconRemote size={16} />;
    default:
      return <IconSparkle size={16} />;
  }
}

export function MarketShelf({
  storage,
  defaultSources,
  fetcher,
  kinds,
  translate,
  onItemOpen,
  onInstall,
  onRemove,
  isInstalled,
}: MarketShelfProps): JSX.Element {
  const [sources, setSources] = useState<MarketSource[]>(() => {
    try {
      return loadMarketSources(storage);
    } catch {
      return [...defaultSources];
    }
  });
  const [activeSourceId, setActiveSourceId] = useState<string | "all">(() => {
    try {
      const list = loadMarketSources(storage);
      return list[0]?.id ?? "all";
    } catch {
      return defaultSources[0]?.id ?? "all";
    }
  });
  const [snapshots, setSnapshots] = useState<SourceSnapshot[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [showAddForm, setShowAddForm] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftUrl, setDraftUrl] = useState("");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(undefined);
    try {
      const next = await fetchAllManifests(sources, fetcher);
      setSnapshots(next);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : String(fetchError),
      );
    } finally {
      setRefreshing(false);
    }
  }, [sources, fetcher]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleAdd = useCallback(() => {
    if (draftName.trim() === "" || draftUrl.trim() === "") return;
    const next = addMarketSourceImpl(storage, sources, {
      name: draftName.trim(),
      url: draftUrl.trim(),
    });
    setSources(next);
    setDraftName("");
    setDraftUrl("");
    setShowAddForm(false);
  }, [storage, sources, draftName, draftUrl]);

  const handleRemove = useCallback(
    (id: string) => {
      const next = removeMarketSourceImpl(storage, sources, id);
      setSources(next);
      if (activeSourceId === id) setActiveSourceId(next[0]?.id ?? "all");
    },
    [storage, sources, activeSourceId],
  );

  const activeItems = useMemo<readonly MarketItem[]>(() => {
    const filtered =
      activeSourceId === "all"
        ? snapshots.flatMap((snapshot) => snapshot.items ?? [])
        : (snapshots.find((snapshot) => snapshot.source.id === activeSourceId)
            ?.items ?? []);
    const kindFiltered =
      kinds === undefined
        ? filtered
        : filtered.filter((item) => kinds.includes(item.kind));
    const queryLower = query.trim().toLocaleLowerCase();
    if (queryLower === "") return kindFiltered;
    return kindFiltered.filter(
      (item) =>
        item.name.toLocaleLowerCase().includes(queryLower) ||
        item.description.toLocaleLowerCase().includes(queryLower),
    );
  }, [snapshots, activeSourceId, kinds, query]);

  const handleInstall = useCallback(
    async (item: MarketItem, source: MarketSource) => {
      if (busyId !== undefined) return;
      setBusyId(`${source.id}:${item.id}`);
      setError(undefined);
      try {
        await onInstall(item, source);
      } catch (installError) {
        setError(
          installError instanceof Error
            ? installError.message
            : String(installError),
        );
      } finally {
        setBusyId(undefined);
      }
    },
    [busyId, onInstall],
  );

  const handleRemoveClick = useCallback(
    async (item: MarketItem, source: MarketSource) => {
      if (onRemove === undefined) return;
      if (busyId !== undefined) return;
      setBusyId(`${source.id}:${item.id}`);
      setError(undefined);
      try {
        await onRemove(item, source);
      } catch (removeError) {
        setError(
          removeError instanceof Error
            ? removeError.message
            : String(removeError),
        );
      } finally {
        setBusyId(undefined);
      }
    },
    [busyId, onRemove],
  );

  return (
    <div className="dshmcp-mkt">
      <div className="dshmcp-mkt-bar">
        <SourceSegmented
          sources={sources}
          snapshots={snapshots}
          activeSourceId={activeSourceId}
          onPick={(id) => {
            setActiveSourceId(id);
          }}
          onRemove={handleRemove}
          translate={translate}
        />
        <label className="dshmcp-mkt-search">
          <IconSearch size={14} />
          <input
            type="search"
            placeholder={translate("marketSearch")}
            value={query}
            aria-label={translate("marketSearch")}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
          />
        </label>
        <button
          type="button"
          className={`dshmcp-mkt-iconbtn${refreshing ? " is-spin" : ""}`}
          onClick={() => {
            void refresh();
          }}
          disabled={refreshing}
          title={translate("marketRefresh")}
          aria-label={translate("marketRefresh")}
        >
          <IconRefresh size={14} />
        </button>
        <button
          type="button"
          className={`dshmcp-mkt-iconbtn${showAddForm ? " is-active" : ""}`}
          onClick={() => {
            setShowAddForm((open) => !open);
          }}
          aria-expanded={showAddForm}
          aria-pressed={showAddForm}
          title={translate("marketAddSource")}
          aria-label={translate("marketAddSource")}
        >
          <IconPlus size={14} />
        </button>
      </div>
      {showAddForm ? (
        <AddSourceForm
          name={draftName}
          url={draftUrl}
          onNameChange={setDraftName}
          onUrlChange={setDraftUrl}
          onSubmit={handleAdd}
          onCancel={() => {
            setShowAddForm(false);
            setDraftName("");
            setDraftUrl("");
          }}
          translate={translate}
        />
      ) : null}
      {error === undefined ? null : (
        <div className="dshmcp-mkt-error" role="alert">
          {translate("marketFailed")}: {error}
        </div>
      )}
      {activeItems.length === 0 ? (
        <div className="dshmcp-mkt-empty">
          {query.trim() === ""
            ? translate("marketEmpty")
            : translate("marketEmptySearch")}
        </div>
      ) : (
        <ul className="dshmcp-mkt-list">
          {activeItems.map((item) => {
            const source = snapshots.find((snapshot) =>
              (snapshot.items ?? []).includes(item),
            )?.source;
            if (source === undefined) return null;
            const key = `${source.id}:${item.id}`;
            const installed = isInstalled(item);
            const busy = busyId === key;
            return (
              <li key={key} className="dshmcp-mkt-row">
                <MarketRow
                  item={item}
                  source={source}
                  installed={installed}
                  busy={busy}
                  removeEnabled={onRemove !== undefined}
                  translate={translate}
                  {...(onItemOpen === undefined
                    ? {}
                    : {
                        onOpen: () => {
                          onItemOpen(item, source);
                        },
                      })}
                  onInstall={() => {
                    void handleInstall(item, source);
                  }}
                  onRemove={() => {
                    void handleRemoveClick(item, source);
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface SourceSegmentedProps {
  readonly sources: readonly MarketSource[];
  readonly snapshots: readonly SourceSnapshot[];
  readonly activeSourceId: string | "all";
  readonly onPick: (id: string | "all") => void;
  readonly onRemove: (id: string) => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

/** Equal-width capsule segments: "All" + one per source (dot = health). */
function SourceSegmented({
  sources,
  snapshots,
  activeSourceId,
  onPick,
  onRemove,
  translate,
}: SourceSegmentedProps): JSX.Element {
  return (
    <div
      className="dshmcp-mkt-seg"
      role="group"
      aria-label={translate("marketSources")}
    >
      <button
        type="button"
        className={`dshmcp-mkt-segItem${activeSourceId === "all" ? " is-active" : ""}`}
        aria-pressed={activeSourceId === "all"}
        title={translate("marketViewSource")}
        onClick={() => {
          onPick("all");
        }}
      >
        <span className="dshmcp-mkt-segName">{translate("marketViewAll")}</span>
      </button>
      {sources.map((source) => {
        const snapshot = snapshots.find(
          (entry) => entry.source.id === source.id,
        );
        let stateClass = "";
        if (snapshot?.state === "offline") stateClass = " is-down";
        if (snapshot?.state === "invalid") stateClass = " is-invalid";
        return (
          <button
            key={source.id}
            type="button"
            className={`dshmcp-mkt-segItem${activeSourceId === source.id ? " is-active" : ""}${stateClass}`}
            aria-pressed={activeSourceId === source.id}
            onClick={() => {
              onPick(source.id);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              if (!source.builtIn) onRemove(source.id);
            }}
            title={
              snapshot?.state === "ok"
                ? translate("marketSourceUp")
                : snapshot?.state === "offline"
                  ? translate("marketSourceDown")
                  : translate("marketSourceInvalid")
            }
          >
            <span className="dshmcp-mkt-segDot" />
            <span className="dshmcp-mkt-segName">{source.name}</span>
          </button>
        );
      })}
    </div>
  );
}

interface AddSourceFormProps {
  readonly name: string;
  readonly url: string;
  readonly onNameChange: (value: string) => void;
  readonly onUrlChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

/** Compact inline disclosure: two inputs + confirm/cancel, one row. */
function AddSourceForm({
  name,
  url,
  onNameChange,
  onUrlChange,
  onSubmit,
  onCancel,
  translate,
}: AddSourceFormProps): JSX.Element {
  return (
    <div className="dshmcp-mkt-addrow">
      <input
        type="text"
        placeholder={translate("marketSourceName")}
        aria-label={translate("marketSourceName")}
        value={name}
        onChange={(event) => {
          onNameChange(event.currentTarget.value);
        }}
      />
      <input
        type="url"
        placeholder={translate("marketSourceUrl")}
        aria-label={translate("marketSourceUrl")}
        value={url}
        onChange={(event) => {
          onUrlChange(event.currentTarget.value);
        }}
      />
      <button
        type="button"
        className="dshmcp-mkt-addbtn"
        onClick={onSubmit}
        disabled={name.trim() === "" || url.trim() === ""}
      >
        {translate("marketAddSource")}
      </button>
      <button type="button" className="dshmcp-mkt-addbtn is-quiet" onClick={onCancel}>
        {translate("close")}
      </button>
    </div>
  );
}

export interface MarketRowProps {
  readonly item: MarketItem;
  readonly source: MarketSource;
  readonly installed: boolean;
  readonly busy: boolean;
  readonly removeEnabled: boolean;
  readonly translate: (key: MarketplaceLocaleKey) => string;
  readonly onOpen?: () => void;
  readonly onInstall: () => void;
  readonly onRemove: () => void;
}

/**
 * One compact list row: 32px tile / name + source meta / single-line
 * description (flex) / install action. Replaces the old card grid —
 * hairline-separated, background-only hover.
 */
export function MarketRow({
  item,
  source,
  installed,
  busy,
  removeEnabled,
  translate,
  onOpen,
  onInstall,
  onRemove,
}: MarketRowProps): JSX.Element {
  const meta = [
    source.name,
    ...(item.author === undefined ? [] : [item.author]),
    ...(item.version === undefined ? [] : [`v${item.version}`]),
  ].join(" · ");
  return (
    <div className="dshmcp-mkt-rowInner">
      <span className="dshmcp-mkt-rowTile" aria-hidden="true">
        <TileIcon kind={item.kind} />
      </span>
      {onOpen === undefined ? (
        <span className="dshmcp-mkt-rowId">
          <span className="dshmcp-mkt-rowName">{item.name}</span>
          <span className="dshmcp-mkt-rowMeta">{meta}</span>
        </span>
      ) : (
        <button
          type="button"
          className="dshmcp-mkt-rowId dshmcp-mkt-rowIdBtn"
          onClick={onOpen}
          title={item.name}
        >
          <span className="dshmcp-mkt-rowName">{item.name}</span>
          <span className="dshmcp-mkt-rowMeta">{meta}</span>
        </button>
      )}
      <span className="dshmcp-mkt-rowDesc" title={item.description}>
        {item.description}
      </span>
      <span className="dshmcp-mkt-rowSide">
        {installed ? (
          <span className="dshmcp-mkt-installed">
            <span className="dshmcp-mkt-installedDot" aria-hidden="true" />
            {translate("marketInstalled")}
          </span>
        ) : (
          <button
            type="button"
            className="dshmcp-mkt-install"
            onClick={onInstall}
            disabled={busy}
          >
            {busy ? translate("marketInstalling") : translate("marketInstall")}
          </button>
        )}
        {installed && removeEnabled ? (
          <button
            type="button"
            className="dshmcp-mkt-remove"
            onClick={onRemove}
            disabled={busy}
            title={translate("marketRemove")}
          >
            {busy ? translate("marketRemoving") : translate("marketRemove")}
          </button>
        ) : null}
      </span>
    </div>
  );
}
