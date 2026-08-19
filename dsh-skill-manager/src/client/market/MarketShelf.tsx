/**
 * Marketplace shelf. Self-contained UI for the dsh-skill-manager plugin
 * (vendored from dsh-launcher's market module — the platform's ModuleLoader
 * forbids cross-plugin value imports, so the source-of-truth lives here).
 *
 * Layout ("Quiet Structure", Raycast-store-like):
 *   - one toolbar row: segmented source control (equal pills, 6px status
 *     dots, hover-revealed edit / delete actions on user sources) + 34px
 *     search + list⇄cards view toggle + 28px icon-only refresh
 *   - add / edit source: compact inline row (the "+" segment adds, the
 *     pencil on a chip edits name / URL in place)
 *   - items: either a grouped container of compact rows (32px icon base,
 *     13px name + 11px source meta, single-line description) or a card
 *     grid (40px icon base, version badge, two-line description, tags,
 *     bottom action bar) — the choice persists in localStorage
 *   - installed items whose market version differs from the installed one
 *     surface a business-colored "Update available" badge and an update
 *     action (the consumer's onInstall doubles as the update wire call)
 *
 * Does NOT own the install / remove button behavior — those bubbled up
 * as `onInstall` / `onRemove` callbacks so the consumer plugin owns the
 * wire call.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconArchive,
  IconClose,
  IconGrid,
  IconLayout,
  IconMcp,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconRemote,
  IconRows,
  IconSearch,
  IconSkills,
  IconSparkle,
} from "./icons.tsx";
import {
  addMarketSource as addMarketSourceImpl,
  loadMarketSources,
  removeMarketSource as removeMarketSourceImpl,
  updateMarketSource as updateMarketSourceImpl,
} from "./data-source-store.ts";
import { fetchAllManifests, type SourceSnapshot } from "./manifest.ts";
import type { MarketItem, MarketItemKind, MarketSource } from "./types.ts";
import { isUpdateAvailable } from "./update.ts";
import {
  loadMarketView,
  saveMarketView,
  type MarketViewMode,
} from "./view-preference.ts";

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
  /** Install handler — also serves the update action (reinstall). */
  readonly onInstall: (item: MarketItem, source: MarketSource) => Promise<void>;
  /** Optional remove handler. When omitted, the "Remove" button is hidden. */
  readonly onRemove?: (item: MarketItem, source: MarketSource) => Promise<void>;
  /** Predicate: is the item already installed? Drives the action button. */
  readonly isInstalled: (item: MarketItem) => boolean;
  /** Installed copy's version for one item, when known. Missing means
      "unknown" — the item renders as plainly installed, never stale. */
  readonly installedVersion?: (item: MarketItem) => string | undefined;
}

export type MarketplaceLocaleKey =
  | "marketSources"
  | "marketAddSource"
  | "marketAddName"
  | "marketAddUrl"
  | "marketAdd"
  | "marketCancel"
  | "marketEditSource"
  | "marketSave"
  | "marketDeleteSource"
  | "marketSourceBuiltIn"
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
  | "marketSourceInvalid"
  | "marketViewList"
  | "marketViewCards"
  | "marketUpdatable"
  | "marketUpdate"
  | "marketUpdating"
  | "marketNoSources"
  | "marketNoSourcesHint"
  | "marketAddFirstSource";

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
 * Pick a tile icon by item kind. The "default" tile is the sparkle
 * (general/unknown); consumers can override by passing a different
 * `kind` in the manifest.
 */
function TileIcon({ kind, size = 15 }: { readonly kind: MarketItemKind; readonly size?: number }): JSX.Element {
  switch (kind) {
    case "skill":
      return <IconSkills size={size} />;
    case "mcp":
      return <IconMcp size={size} />;
    case "archive":
      return <IconArchive size={size} />;
    case "layout":
      return <IconLayout size={size} />;
    case "remote":
      return <IconRemote size={size} />;
    default:
      return <IconSparkle size={size} />;
  }
}

/** Compose the 11px meta line: source · author · version. */
function itemMeta(item: MarketItem, source: MarketSource): string {
  const parts: string[] = [source.name];
  if (item.author !== undefined) parts.push(item.author);
  if (item.version !== undefined) parts.push(`v${item.version}`);
  return parts.join(" · ");
}

/** Card meta drops the version (the card shows it as a badge instead). */
function cardMeta(item: MarketItem, source: MarketSource): string {
  const parts: string[] = [source.name];
  if (item.author !== undefined) parts.push(item.author);
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
  installedVersion,
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
  const [editingSource, setEditingSource] = useState<MarketSource | undefined>(undefined);
  const [view, setView] = useState<MarketViewMode>(() => loadMarketView(storage));

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

  const handleEdit = useCallback(
    (source: MarketSource) => {
      if (draftName.trim() === "" || draftUrl.trim() === "") return;
      const next = updateMarketSourceImpl(storage, sources, source.id, {
        name: draftName.trim(),
        url: draftUrl.trim(),
      });
      setSources(next);
      setEditingSource(undefined);
      setDraftName("");
      setDraftUrl("");
    },
    [storage, sources, draftName, draftUrl],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const next = removeMarketSourceImpl(storage, sources, id);
      setSources(next);
      if (activeSourceId === id) setActiveSourceId(next[0]?.id ?? "all");
    },
    [storage, sources, activeSourceId],
  );

  const handleViewChange = useCallback(
    (next: MarketViewMode) => {
      setView(next);
      saveMarketView(storage, next);
    },
    [storage],
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

  const resolveUpdatable = useCallback(
    (item: MarketItem): boolean => {
      if (!isInstalled(item)) return false;
      if (installedVersion === undefined) return false;
      return isUpdateAvailable(item.version, installedVersion(item));
    },
    [isInstalled, installedVersion],
  );

  const renderItems = (): JSX.Element => {
    if (sources.length === 0) {
      return (
        <div className="dshm-mkt-blank">
          <span className="dshm-mkt-blankTile" aria-hidden={true}>
            <IconSparkle size={20} />
          </span>
          <p className="dshm-mkt-blankTitle">{translate("marketNoSources")}</p>
          <p className="dshm-mkt-blankHint">{translate("marketNoSourcesHint")}</p>
          <button
            type="button"
            className="dshm-mkt-btn is-primary"
            onClick={() => {
              setShowAddForm(true);
            }}
          >
            <IconPlus size={12} />
            {translate("marketAddFirstSource")}
          </button>
        </div>
      );
    }
    if (activeItems.length === 0) {
      return (
        <div className="dshm-mkt-empty">
          {query.trim() === ""
            ? translate("marketEmpty")
            : translate("marketEmptySearch")}
        </div>
      );
    }
    const shared = activeItems.map((item) => {
      const source = snapshots.find((snapshot) =>
        (snapshot.items ?? []).includes(item),
      )?.source;
      if (source === undefined) return null;
      const key = `${source.id}:${item.id}`;
      const installed = isInstalled(item);
      const updatable = resolveUpdatable(item);
      const busy = busyId === key;
      return { item, source, key, installed, updatable, busy };
    });
    if (view === "cards") {
      return (
        <ul className="dshm-mkt-cards">
          {shared.map((entry) =>
            entry === null ? null : (
              <MarketCard
                key={entry.key}
                item={entry.item}
                source={entry.source}
                installed={entry.installed}
                updatable={entry.updatable}
                busy={entry.busy}
                removeEnabled={onRemove !== undefined}
                translate={translate}
                onInstall={() => {
                  void handleInstall(entry.item, entry.source);
                }}
                onRemove={() => {
                  void handleRemoveClick(entry.item, entry.source);
                }}
              />
            ),
          )}
        </ul>
      );
    }
    return (
      <ul className="dshm-mkt-list">
        {shared.map((entry) =>
          entry === null ? null : (
            <MarketRow
              key={entry.key}
              item={entry.item}
              source={entry.source}
              installed={entry.installed}
              updatable={entry.updatable}
              busy={entry.busy}
              removeEnabled={onRemove !== undefined}
              translate={translate}
              {...(onItemOpen === undefined
                ? {}
                : {
                    onOpen: () => {
                      onItemOpen(entry.item, entry.source);
                    },
                  })}
              onInstall={() => {
                void handleInstall(entry.item, entry.source);
              }}
              onRemove={() => {
                void handleRemoveClick(entry.item, entry.source);
              }}
            />
          ),
        )}
      </ul>
    );
  };

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
            setEditingSource(undefined);
            setShowAddForm(true);
          }}
          onEdit={(source) => {
            setShowAddForm(false);
            setEditingSource(source);
            setDraftName(source.name);
            setDraftUrl(source.url);
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
        <div
          className="dshm-mkt-seg dshm-mkt-viewSeg"
          role="group"
          aria-label={translate("marketViewList") + " / " + translate("marketViewCards")}
        >
          <button
            type="button"
            className={`dshm-mkt-segBtn dshm-mkt-segIcon${view === "list" ? " is-active" : ""}`}
            aria-pressed={view === "list"}
            onClick={() => {
              handleViewChange("list");
            }}
            title={translate("marketViewList")}
            aria-label={translate("marketViewList")}
          >
            <IconRows size={14} />
          </button>
          <button
            type="button"
            className={`dshm-mkt-segBtn dshm-mkt-segIcon${view === "cards" ? " is-active" : ""}`}
            aria-pressed={view === "cards"}
            onClick={() => {
              handleViewChange("cards");
            }}
            title={translate("marketViewCards")}
            aria-label={translate("marketViewCards")}
          >
            <IconGrid size={14} />
          </button>
        </div>
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
        <SourceFormRow
          heading={translate("marketAddSource")}
          name={draftName}
          url={draftUrl}
          onNameChange={setDraftName}
          onUrlChange={setDraftUrl}
          submitLabel={translate("marketAdd")}
          onSubmit={handleAdd}
          onCancel={() => {
            setShowAddForm(false);
            setDraftName("");
            setDraftUrl("");
          }}
          translate={translate}
        />
      ) : null}
      {editingSource !== undefined ? (
        <SourceFormRow
          heading={translate("marketEditSource")}
          name={draftName}
          url={draftUrl}
          onNameChange={setDraftName}
          onUrlChange={setDraftUrl}
          submitLabel={translate("marketSave")}
          onSubmit={() => {
            handleEdit(editingSource);
          }}
          onCancel={() => {
            setEditingSource(undefined);
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
      {renderItems()}
    </div>
  );
}

interface SourceSegmentedProps {
  readonly sources: readonly MarketSource[];
  readonly snapshots: readonly SourceSnapshot[];
  readonly activeSourceId: string | "all";
  readonly onPick: (id: string | "all") => void;
  readonly onAdd: () => void;
  readonly onEdit: (source: MarketSource) => void;
  readonly onRemove: (id: string) => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

/**
 * Equal-width segmented control: All | each source (status dot, hover
 * edit / delete on user sources) | "+". Each source chip is a positioned
 * wrapper so the hover actions can live beside the pick button without
 * nesting buttons.
 */
function SourceSegmented({
  sources,
  snapshots,
  activeSourceId,
  onPick,
  onAdd,
  onEdit,
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
          <span key={source.id} className="dshm-mkt-chip">
            <button
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
              title={
                segmentTitle(snapshot, translate) +
                (source.builtIn ? ` · ${translate("marketSourceBuiltIn")}` : "")
              }
            >
              <span className="dshm-mkt-segDot" aria-hidden={true} />
              <span className="dshm-mkt-segLabel">{source.name}</span>
            </button>
            {source.builtIn ? null : (
              <span className="dshm-mkt-chipActs">
                <button
                  type="button"
                  className="dshm-mkt-chipAct"
                  onClick={() => {
                    onEdit(source);
                  }}
                  title={translate("marketEditSource")}
                  aria-label={`${translate("marketEditSource")}: ${source.name}`}
                >
                  <IconPencil size={11} />
                </button>
                <button
                  type="button"
                  className="dshm-mkt-chipAct is-danger"
                  onClick={() => {
                    onRemove(source.id);
                  }}
                  title={translate("marketDeleteSource")}
                  aria-label={`${translate("marketDeleteSource")}: ${source.name}`}
                >
                  <IconClose size={11} />
                </button>
              </span>
            )}
          </span>
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

interface SourceFormRowProps {
  readonly heading: string;
  readonly name: string;
  readonly url: string;
  readonly onNameChange: (value: string) => void;
  readonly onUrlChange: (value: string) => void;
  readonly submitLabel: string;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

/** Compact inline add / edit source form (28px inputs, 26px buttons). */
function SourceFormRow({
  heading,
  name,
  url,
  onNameChange,
  onUrlChange,
  submitLabel,
  onSubmit,
  onCancel,
  translate,
}: SourceFormRowProps): JSX.Element {
  return (
    <div className="dshm-mkt-addrow" role="group" aria-label={heading}>
      <span className="dshm-mkt-addrowLabel">{heading}</span>
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
        {submitLabel}
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
  /** Installed copy carries a different version than the manifest. */
  readonly updatable: boolean;
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
  updatable,
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
        <span className="dshm-mkt-rowMeta">{itemMeta(item, source)}</span>
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
        {installed && updatable ? (
          <span className="dshm-mkt-badge is-update">
            <span className="dshm-mkt-badgeDot" aria-hidden={true} />
            {translate("marketUpdatable")}
          </span>
        ) : null}
        {installed && !updatable ? (
          <span className="dshm-mkt-badge">
            <span className="dshm-mkt-badgeDot" aria-hidden={true} />
            {translate("marketInstalled")}
          </span>
        ) : null}
        {!installed ? (
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
        ) : null}
        {installed && updatable ? (
          <button
            type="button"
            className="dshm-mkt-btn is-update"
            onClick={onInstall}
            disabled={busy}
          >
            {busy ? translate("marketUpdating") : translate("marketUpdate")}
          </button>
        ) : null}
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

export interface MarketCardProps {
  readonly item: MarketItem;
  readonly source: MarketSource;
  readonly installed: boolean;
  readonly updatable: boolean;
  readonly busy: boolean;
  readonly removeEnabled: boolean;
  readonly translate: (key: MarketplaceLocaleKey) => string;
  readonly onInstall: () => void;
  readonly onRemove: () => void;
}

/** One card inside the grid view: 40px tile, meta, 2-line description,
 *  tags and a bottom action bar. Feedback stays background-only (4%
 *  hover lighten) per the Quiet Structure grammar. */
export function MarketCard({
  item,
  source,
  installed,
  updatable,
  busy,
  removeEnabled,
  translate,
  onInstall,
  onRemove,
}: MarketCardProps): JSX.Element {
  return (
    <li
      className={`dshm-mkt-card${installed ? " is-installed" : ""}`}
      data-kind={item.kind}
    >
      <div className="dshm-mkt-cardHead">
        <span className="dshm-mkt-cardTile" aria-hidden={true}>
          <TileIcon kind={item.kind} size={18} />
        </span>
        <span className="dshm-mkt-cardId">
          <span className="dshm-mkt-cardNameRow">
            <span className="dshm-mkt-cardName">{item.name}</span>
            {item.version !== undefined ? (
              <span className="dshm-mkt-cardVer">v{item.version}</span>
            ) : null}
          </span>
          <span className="dshm-mkt-cardMeta">{cardMeta(item, source)}</span>
        </span>
      </div>
      <p className="dshm-mkt-cardDesc">{item.description}</p>
      {item.tags !== undefined && item.tags.length > 0 ? (
        <div className="dshm-mkt-cardTags">
          {item.tags.map((tag) => (
            <span key={tag} className="dshm-mkt-cardTag">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="dshm-mkt-cardBar">
        {installed ? (
          <span className={`dshm-mkt-badge${updatable ? " is-update" : ""}`}>
            <span className="dshm-mkt-badgeDot" aria-hidden={true} />
            {updatable
              ? translate("marketUpdatable")
              : translate("marketInstalled")}
          </span>
        ) : (
          <span className="dshm-mkt-cardKind">
            <TileIcon kind={item.kind} size={11} />
            {item.kind}
          </span>
        )}
        <span className="dshm-mkt-cardActions">
          {!installed ? (
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
          ) : null}
          {installed && updatable ? (
            <button
              type="button"
              className="dshm-mkt-btn is-update"
              onClick={onInstall}
              disabled={busy}
            >
              {busy ? translate("marketUpdating") : translate("marketUpdate")}
            </button>
          ) : null}
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
        </span>
      </div>
    </li>
  );
}
