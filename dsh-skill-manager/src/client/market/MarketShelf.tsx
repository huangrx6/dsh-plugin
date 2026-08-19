/**
 * Marketplace shelf. Self-contained UI for the dsh-skill-manager plugin
 * (vendored from dsh-launcher's market module — the platform's ModuleLoader
 * forbids cross-plugin value imports, so the source-of-truth lives here).
 *
 * Layout ("Quiet Structure", Raycast-store-like):
 *   - one toolbar row: segmented source control (equal pills, 6px status
 *     dots) + 34px search + 28px icon-only refresh
 *   - add-source: compact inline row toggled by the trailing "+" segment
 *   - items: a single grouped container of compact rows (32px icon base,
 *     13px name + 11px source meta, single-line 12px description, install
 *     button / installed badge on the right) separated by 1px hairlines
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

/** State class carried by a source segment's status dot. */
function segmentStateClass(snapshot: SourceSnapshot | undefined): string {
  if (snapshot?.state === "offline") return " is-down";
  if (snapshot?.state === "invalid") return " is-invalid";
  if (snapshot?.state === "ok") return " is-up";
  return "";
}

/** State tooltip for a source segment. */
function segmentTitle(
  snapshot: SourceSnapshot | undefined,
  translate: (key: MarketplaceLocaleKey) => string,
): string {
  if (snapshot?.state === "offline") return translate("marketSourceDown");
  if (snapshot?.state === "invalid") return translate("marketSourceInvalid");
  return translate("marketSourceUp");
}

/**
 * Pick a row tile icon by item kind. The launcher's "default" tile is
 * the sparkle (general/unknown); consumers can override by passing a
 * different `kind` in the manifest.
 */
function TileIcon({ kind }: { readonly kind: MarketItemKind }): JSX.Element {
  switch (kind) {
    case "skill":
      return <IconSkills size={15} />;
    case "mcp":
      return <IconMcp size={15} />;
    case "archive":
      return <IconArchive size={15} />;
    case "layout":
      return <IconLayout size={15} />;
    case "remote":
      return <IconRemote size={15} />;
    default:
      return <IconSparkle size={15} />;
  }
}

/** Compose the 11px meta line under a row name: source · author · version. */
function rowMeta(
  item: MarketItem,
  source: MarketSource,
): string {
  const parts: string[] = [source.name];
  if (item.author !== undefined) parts.push(item.author);
  if (item.version !== undefined) parts.push(`v${item.version}`);
  return parts.join(" · ");
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
    <div className="dshm-mkt">
      <div className="dshm-mkt-toolbar">
        <SourceSegmented
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
        <label className="dshm-mkt-search">
          <IconSearch size={13} />
          <input
            type="search"
            placeholder={translate("marketSearch")}
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
          />
        </label>
        <button
          type="button"
          className={`dshm-mkt-iconBtn${refreshing ? " is-spin" : ""}`}
          onClick={() => {
            void refresh();
          }}
          disabled={refreshing}
          title={
            refreshing
              ? translate("marketRefreshing")
              : translate("marketRefresh")
          }
          aria-label={translate("marketRefresh")}
        >
          <IconRefresh size={14} />
        </button>
      </div>
      {showAddForm ? (
        <AddSourceRow
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
        <div className="dshm-mkt-error" role="alert">
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
        <ul className="dshm-mkt-list">
          {activeItems.map((item) => {
            const source = snapshots.find((snapshot) =>
              (snapshot.items ?? []).includes(item),
            )?.source;
            if (source === undefined) return null;
            const key = `${source.id}:${item.id}`;
            const installed = isInstalled(item);
            const busy = busyId === key;
            return (
              <MarketRow
                key={key}
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
  readonly onAdd: () => void;
  readonly onRemove: (id: string) => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

/** Equal-width segmented control: All | each source (status dot) | "+". */
function SourceSegmented({
  sources,
  snapshots,
  activeSourceId,
  onPick,
  onAdd,
  onRemove,
  translate,
}: SourceSegmentedProps): JSX.Element {
  return (
    <div
      className="dshm-mkt-seg"
      role="group"
      aria-label={translate("marketSources")}
    >
      <button
        type="button"
        className={`dshm-mkt-segBtn${activeSourceId === "all" ? " is-active" : ""}`}
        aria-pressed={activeSourceId === "all"}
        onClick={() => {
          onPick("all");
        }}
      >
        <span className="dshm-mkt-segLabel">{translate("marketAll")}</span>
      </button>
      {sources.map((source) => {
        const snapshot = snapshots.find(
          (entry) => entry.source.id === source.id,
        );
        return (
          <button
            key={source.id}
            type="button"
            className={`dshm-mkt-segBtn${segmentStateClass(snapshot)}${activeSourceId === source.id ? " is-active" : ""}`}
            aria-pressed={activeSourceId === source.id}
            onClick={() => {
              onPick(source.id);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              if (!source.builtIn) onRemove(source.id);
            }}
            title={segmentTitle(snapshot, translate)}
          >
            <span className="dshm-mkt-segDot" aria-hidden={true} />
            <span className="dshm-mkt-segLabel">{source.name}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="dshm-mkt-segBtn dshm-mkt-segAdd"
        onClick={onAdd}
        title={translate("marketAddSource")}
        aria-label={translate("marketAddSource")}
      >
        <IconPlus size={12} />
      </button>
    </div>
  );
}

interface AddSourceRowProps {
  readonly name: string;
  readonly url: string;
  readonly onNameChange: (value: string) => void;
  readonly onUrlChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

/** Compact inline add-source form (28px inputs, 26px buttons). */
function AddSourceRow({
  name,
  url,
  onNameChange,
  onUrlChange,
  onSubmit,
  onCancel,
  translate,
}: AddSourceRowProps): JSX.Element {
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
        className="dshm-mkt-btn is-primary"
        onClick={onSubmit}
        disabled={name.trim() === "" || url.trim() === ""}
      >
        {translate("marketAdd")}
      </button>
      <button type="button" className="dshm-mkt-btn" onClick={onCancel}>
        {translate("marketCancel")}
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
  readonly onInstall: () => void;
  readonly onRemove: () => void;
  readonly onOpen?: () => void;
}

/** One compact row inside the grouped list container. */
export function MarketRow({
  item,
  source,
  installed,
  busy,
  removeEnabled,
  translate,
  onInstall,
  onRemove,
  onOpen,
}: MarketRowProps): JSX.Element {
  const identity = (
    <>
      <span className="dshm-mkt-rowTile" aria-hidden={true}>
        <TileIcon kind={item.kind} />
      </span>
      <span className="dshm-mkt-rowId">
        <span className="dshm-mkt-rowName">{item.name}</span>
        <span className="dshm-mkt-rowMeta">{rowMeta(item, source)}</span>
      </span>
      <span className="dshm-mkt-rowDesc">{item.description}</span>
    </>
  );
  return (
    <li
      className={`dshm-mkt-row${installed ? " is-installed" : ""}`}
      data-kind={item.kind}
    >
      {onOpen === undefined ? (
        <div className="dshm-mkt-rowMain">{identity}</div>
      ) : (
        <button type="button" className="dshm-mkt-rowMain" onClick={onOpen}>
          {identity}
        </button>
      )}
      <div className="dshm-mkt-rowSide">
        {installed ? (
          <span className="dshm-mkt-badge">
            <span className="dshm-mkt-badgeDot" aria-hidden={true} />
            {translate("marketInstalled")}
          </span>
        ) : (
          <button
            type="button"
            className="dshm-mkt-btn is-primary"
            onClick={onInstall}
            disabled={busy}
          >
            {busy
              ? translate("marketInstalling")
              : translate("marketInstall")}
          </button>
        )}
        {installed && removeEnabled ? (
          <button
            type="button"
            className="dshm-mkt-btn is-danger"
            onClick={onRemove}
            disabled={busy}
            title={translate("marketRemove")}
          >
            {busy ? translate("marketRemoving") : translate("marketRemove")}
          </button>
        ) : null}
      </div>
    </li>
  );
}
