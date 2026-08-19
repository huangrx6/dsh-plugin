/**
 * Marketplace shelf. Self-contained UI for the dsh-skill-manager plugin
 * (vendored from dsh-launcher's market module — the platform's ModuleLoader
 * forbids cross-plugin value imports, so the source-of-truth lives here).
 *
 * Owns:
 *   - The source chips row (with "All / built-in / user-added" + an "Add
 *     source" affordance)
 *   - The search/refresh toolbar
 *   - The card grid
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
  /** Cards rendered with this label set. Callers pass a translator. */
  readonly translate: (
    key: MarketplaceLocaleKey,
    params?: Record<string, unknown>,
  ) => string;
  /** Optional card click handler (open detail). */
  readonly onItemOpen?: (item: MarketItem, source: MarketSource) => void;
  /** Install handler. Returns a promise that resolves once the install finishes. */
  readonly onInstall: (item: MarketItem, source: MarketSource) => Promise<void>;
  /** Optional remove handler. When omitted, the "Remove" button is hidden. */
  readonly onRemove?: (item: MarketItem, source: MarketSource) => Promise<void>;
  /** Predicate: is the item already installed? Drives the action button. */
  readonly isInstalled: (item: MarketItem) => boolean;
}

export type MarketplaceLocaleKey =
  | "marketSources"
  | "marketAddSource"
  | "marketAddName"
  | "marketAddUrl"
  | "marketAdd"
  | "marketCancel"
  | "marketRefresh"
  | "marketRefreshing"
  | "marketSearch"
  | "marketEmpty"
  | "marketEmptySearch"
  | "marketAll"
  | "marketStatusOnline"
  | "marketStatusOffline"
  | "marketStatusInvalid"
  | "marketInstalled"
  | "marketInstall"
  | "marketInstalling"
  | "marketRemove"
  | "marketRemoving"
  | "marketFailed"
  | "marketSourceUp"
  | "marketSourceDown"
  | "marketSourceInvalid";

/**
 * Pick a card tile icon by item kind. The launcher's "default" tile is
 * the sparkle (general/unknown); consumers can override by passing a
 * different `kind` in the manifest.
 */
function TileIcon({ kind }: { readonly kind: MarketItemKind }): JSX.Element {
  switch (kind) {
    case "skill":
      return <IconSkills size={18} />;
    case "mcp":
      return <IconMcp size={18} />;
    case "archive":
      return <IconArchive size={18} />;
    case "layout":
      return <IconLayout size={18} />;
    case "remote":
      return <IconRemote size={18} />;
    default:
      return <IconSparkle size={18} />;
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
    <div>
      <SourceChipRow
        sources={sources}
        snapshots={snapshots}
        activeSourceId={activeSourceId}
        onPick={(id) => {
          setActiveSourceId(id);
        }}
        onAdd={() => {
          setShowAddForm(true);
        }}
        onRemove={handleRemove}
        translate={translate}
      />
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
      <Toolbar
        refreshing={refreshing}
        query={query}
        onQueryChange={setQuery}
        onRefresh={() => {
          void refresh();
        }}
        translate={translate}
      />
      {error === undefined ? null : (
        <div className="dshm-mkt-error">
          {translate("marketFailed")}: {error}
        </div>
      )}
      {activeItems.length === 0 ? (
        <div className="dshm-mkt-empty">
          {query.trim() === ""
            ? translate("marketEmpty")
            : translate("marketEmptySearch")}
        </div>
      ) : (
        <ul className="dshm-mkt-grid">
          {activeItems.map((item) => {
            const source = snapshots.find((snapshot) =>
              (snapshot.items ?? []).includes(item),
            )?.source;
            if (source === undefined) return null;
            const key = `${source.id}:${item.id}`;
            const installed = isInstalled(item);
            const busy = busyId === key;
            return (
              <li key={key} className="dshm-mkt-card">
                <MarketCard
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

interface SourceChipRowProps {
  readonly sources: readonly MarketSource[];
  readonly snapshots: readonly SourceSnapshot[];
  readonly activeSourceId: string | "all";
  readonly onPick: (id: string | "all") => void;
  readonly onAdd: () => void;
  readonly onRemove: (id: string) => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

function SourceChipRow({
  sources,
  snapshots,
  activeSourceId,
  onPick,
  onAdd,
  onRemove,
  translate,
}: SourceChipRowProps): JSX.Element {
  return (
    <div className="dshm-mkt-sources">
      <span className="dshm-mkt-sources-label">
        {translate("marketSources")}
      </span>
      <button
        type="button"
        className={`dshm-mkt-source-chip${activeSourceId === "all" ? " is-active" : ""}`}
        onClick={() => {
          onPick("all");
        }}
      >
        {translate("marketAll")}
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
            className={`dshm-mkt-source-chip${activeSourceId === source.id ? " is-active" : ""}${stateClass}`}
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
            <span className="dshm-mkt-source-dot" />
            <span>{source.name}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="dshm-mkt-source-add"
        onClick={onAdd}
      >
        <IconPlus size={12} />
        <span>{translate("marketAddSource")}</span>
      </button>
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
    <div className="dshm-mkt-addrow">
      <input
        type="text"
        placeholder={translate("marketAddName")}
        value={name}
        onChange={(event) => {
          onNameChange(event.currentTarget.value);
        }}
      />
      <input
        type="url"
        placeholder={translate("marketAddUrl")}
        value={url}
        onChange={(event) => {
          onUrlChange(event.currentTarget.value);
        }}
      />
      <button
        type="button"
        className="dshm-mkt-toolbar-btn"
        onClick={onSubmit}
        disabled={name.trim() === "" || url.trim() === ""}
      >
        {translate("marketAdd")}
      </button>
      <button
        type="button"
        className="dshm-mkt-toolbar-btn"
        onClick={onCancel}
      >
        {translate("marketCancel")}
      </button>
    </div>
  );
}

interface ToolbarProps {
  readonly refreshing: boolean;
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly onRefresh: () => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

function Toolbar({
  refreshing,
  query,
  onQueryChange,
  onRefresh,
  translate,
}: ToolbarProps): JSX.Element {
  return (
    <div className="dshm-mkt-toolbar">
      <label className="dshm-mkt-search">
        <IconSearch size={14} />
        <input
          type="search"
          placeholder={translate("marketSearch")}
          value={query}
          onChange={(event) => {
            onQueryChange(event.currentTarget.value);
          }}
        />
      </label>
      <button
        type="button"
        className={`dshm-mkt-toolbar-btn${refreshing ? " is-spin" : ""}`}
        onClick={onRefresh}
        disabled={refreshing}
      >
        <IconRefresh size={14} />
        <span>
          {refreshing
            ? translate("marketRefreshing")
            : translate("marketRefresh")}
        </span>
      </button>
    </div>
  );
}

export interface MarketCardProps {
  readonly item: MarketItem;
  readonly source: MarketSource;
  readonly installed: boolean;
  readonly busy: boolean;
  readonly removeEnabled: boolean;
  readonly translate: (key: MarketplaceLocaleKey) => string;
  readonly onInstall: () => void;
  readonly onRemove: () => void;
}

export function MarketCard({
  item,
  source,
  installed,
  busy,
  removeEnabled,
  translate,
  onInstall,
  onRemove,
}: MarketCardProps): JSX.Element {
  return (
    <article>
      <div className="dshm-mkt-card-head">
        <span className="dshm-mkt-card-tile">
          <TileIcon kind={item.kind} />
        </span>
        <div className="dshm-mkt-card-titleline">
          <h3 className="dshm-mkt-card-title">{item.name}</h3>
          <div className="dshm-mkt-card-meta">
            {item.author === undefined ? null : <>by {item.author}</>}
            {item.version === undefined ? null : <> · v{item.version}</>}
          </div>
        </div>
      </div>
      <p className="dshm-mkt-card-desc">{item.description}</p>
      {item.tags !== undefined && item.tags.length > 0 ? (
        <div className="dshm-mkt-card-tags">
          {item.tags.map((tag) => (
            <span key={tag} className="dshm-mkt-tag">
              {tag}
            </span>
          ))}
          <span className="dshm-mkt-tag dshm-mkt-tag-source">
            {source.name}
          </span>
        </div>
      ) : (
        <div className="dshm-mkt-card-tags">
          <span className="dshm-mkt-tag dshm-mkt-tag-source">
            {source.name}
          </span>
        </div>
      )}
      <div className="dshm-mkt-card-foot">
        {installed ? (
          <span className="dshm-mkt-card-installed">
            <span aria-hidden={true}>✓</span>
            <span>{translate("marketInstalled")}</span>
          </span>
        ) : null}
        {installed ? (
          removeEnabled ? (
            <button
              type="button"
              className="dshm-mkt-card-action is-danger"
              onClick={onRemove}
              disabled={busy}
            >
              <span>
                {busy
                  ? translate("marketInstalling")
                  : translate("marketRemove")}
              </span>
            </button>
          ) : null
        ) : (
          <button
            type="button"
            className="dshm-mkt-card-action is-primary"
            onClick={onInstall}
            disabled={busy}
          >
            <span>
              {busy
                ? translate("marketInstalling")
                : translate("marketInstall")}
            </span>
          </button>
        )}
      </div>
    </article>
  );
}
