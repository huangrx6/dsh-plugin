/**
 * Marketplace shelf. Self-contained UI for the dsh-skill-manager plugin
 * (vendored from dsh-launcher's market module — the platform's ModuleLoader
 * forbids cross-plugin value imports, so the source-of-truth lives here).
 *
 * Layout ("Quiet Structure", mirrored 1:1 from dsh-mcp-manager's shelf so
 * the two market pages read as one design):
 *   - one toolbar row: segmented source picker (equal capsules, 6px
 *     health dots), a 34px search field, a list⇄cards view toggle, a
 *     refresh icon button, an add-source icon button with a compact
 *     inline form and a manage-sources icon button that opens a grouped
 *     panel (rename / re-point / delete — delete goes through a
 *     self-drawn confirm dialog; there is no right-click shortcut)
 *   - items: either a grouped container of compact rows (32px icon base,
 *     13px name + 11px source meta, single-line description) or a card
 *     grid (40px+ hue-keyed gradient icon base, version badge, two-line
 *     description, tags, bottom action bar) — the choice persists in
 *     localStorage; rows stay quiet, cards carry the texture
 *   - installed items whose market version differs from the installed one
 *     surface a business-colored "Update available" badge and an update
 *     action (the consumer's onInstall doubles as the update wire call)
 *
 * Does NOT own the install / remove button behavior — those bubbled up
 * as `onInstall` / `onRemove` callbacks so the consumer plugin owns the
 * wire call.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArchive,
  IconGrid,
  IconLayout,
  IconList,
  IconMcp,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconRemote,
  IconSearch,
  IconSkills,
  IconSliders,
  IconSparkle,
  IconTrash,
} from "./icons.tsx";
import {
  addMarketSource as addMarketSourceImpl,
  loadMarketSources,
  removeMarketSource as removeMarketSourceImpl,
  updateMarketSource as updateMarketSourceImpl,
} from "./data-source-store.ts";
import { fetchAllManifests, type SourceSnapshot } from "./manifest.ts";
import { normalizeSourceUrl, type DiscoverStrings } from "./discover.ts";
import { hueStyle } from "./hue.ts";
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
  | "marketAddFirstSource"
  | "marketManageSources"
  | "marketDeleteSourceTitle"
  | "marketDeleteSourceHint"
  | "marketSourceBuiltinTag"
  | "marketSourceBuiltinHint"
  | "marketDetail"
  | "addSourceHint"
  | "discoverItemDesc"
  | "discoverNoSkills"
  | "discoverRepoNotFound"
  | "discoverUnauthorized"
  | "discoverRateLimited"
  | "discoverInvalidJson"
  | "discoverInvalid"
  | "discoverInvalidUrl";

/** Fill a "{placeholder}" template from the locale dictionary. */
function fill(template: string, params: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(params)) {
    out = out.replace(`{${key}}`, value);
  }
  return out;
}

/** Locale-aware discovery strings handed to the manifest fetcher. */
function discoverStrings(
  translate: (key: MarketplaceLocaleKey) => string,
): DiscoverStrings {
  return {
    fallbackDescription: (label) => fill(translate("discoverItemDesc"), { repo: label }),
    noSkills: (label) => fill(translate("discoverNoSkills"), { repo: label }),
    repoNotFound: (label) => fill(translate("discoverRepoNotFound"), { repo: label }),
    unauthorized: (status) =>
      fill(translate("discoverUnauthorized"), { status: String(status) }),
    rateLimited: () => translate("discoverRateLimited"),
    invalidJson: () => translate("discoverInvalidJson"),
    invalidManifest: () => translate("discoverInvalid"),
    invalidUrl: () => translate("discoverInvalidUrl"),
  };
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
  const [manageOpen, setManageOpen] = useState(false);
  const [editSource, setEditSource] = useState<
    { readonly id: string; readonly name: string; readonly url: string } | undefined
  >(undefined);
  const [view, setView] = useState<MarketViewMode>(() => loadMarketView(storage));
  /** Source id pending the delete-confirm dialog (undefined = closed). */
  const [removeConfirmId, setRemoveConfirmId] = useState<string | undefined>(
    undefined,
  );
  const removeConfirmRef = useRef<HTMLDivElement | null>(null);
  const removeConfirmSource = sources.find(
    (source) => source.id === removeConfirmId,
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(undefined);
    try {
      const next = await fetchAllManifests(sources, fetcher, discoverStrings(translate));
      setSnapshots(next);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : String(fetchError),
      );
    } finally {
      setRefreshing(false);
    }
  }, [sources, fetcher, translate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleAdd = useCallback(() => {
    if (draftName.trim() === "" || draftUrl.trim() === "") return;
    const next = addMarketSourceImpl(storage, sources, {
      name: draftName.trim(),
      // scheme-less pastes ("github.com/o/r") gain https:// so the
      // discovery ladder classifies them instead of rejecting
      url: normalizeSourceUrl(draftUrl),
    });
    setSources(next);
    setDraftName("");
    setDraftUrl("");
    setShowAddForm(false);
  }, [storage, sources, draftName, draftUrl]);

  const handleSaveEdit = useCallback(() => {
    if (editSource === undefined) return;
    if (editSource.name.trim() === "" || editSource.url.trim() === "") return;
    const next = updateMarketSourceImpl(storage, sources, editSource.id, {
      name: editSource.name.trim(),
      url: normalizeSourceUrl(editSource.url),
    });
    setSources(next);
    setEditSource(undefined);
  }, [storage, sources, editSource]);

  const handleRemove = useCallback(
    (id: string) => {
      const next = removeMarketSourceImpl(storage, sources, id);
      setSources(next);
      if (activeSourceId === id) setActiveSourceId(next[0]?.id ?? "all");
    },
    [storage, sources, activeSourceId],
  );

  // Delete confirm dialog: Esc and overlay clicks cancel; the dialog is
  // a plain modal-shell overlay (no window.confirm — that reads as a
  // browser popup and can't carry the "installed items stay" hint).
  useEffect(() => {
    if (removeConfirmId === undefined) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setRemoveConfirmId(undefined);
    };
    document.addEventListener("keydown", onKeyDown);
    removeConfirmRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [removeConfirmId]);

  const confirmRemove = useCallback(() => {
    if (removeConfirmId === undefined) return;
    handleRemove(removeConfirmId);
    setRemoveConfirmId(undefined);
  }, [removeConfirmId, handleRemove]);

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
          translate={translate}
        />
        <label className="dshm-mkt-search">
          <IconSearch size={14} />
          <input
            type="search"
            placeholder={translate("marketSearch")}
            aria-label={translate("marketSearch")}
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
            }}
          />
        </label>
        <div className="dshm-mkt-tools">
          <div
            className="dshm-mkt-viewseg"
            role="group"
            aria-label={translate("marketViewList") + " / " + translate("marketViewCards")}
          >
            <button
              type="button"
              aria-pressed={view === "list"}
              title={translate("marketViewList")}
              aria-label={translate("marketViewList")}
              onClick={() => {
                handleViewChange("list");
              }}
            >
              <IconList size={14} />
            </button>
            <button
              type="button"
              aria-pressed={view === "cards"}
              title={translate("marketViewCards")}
              aria-label={translate("marketViewCards")}
              onClick={() => {
                handleViewChange("cards");
              }}
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
          <button
            type="button"
            className={`dshm-mkt-iconBtn${showAddForm ? " is-active" : ""}`}
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
          <button
            type="button"
            className={`dshm-mkt-iconBtn${manageOpen ? " is-active" : ""}`}
            onClick={() => {
              setManageOpen((open) => !open);
              setEditSource(undefined);
            }}
            aria-expanded={manageOpen}
            aria-pressed={manageOpen}
            title={translate("marketManageSources")}
            aria-label={translate("marketManageSources")}
          >
            <IconSliders size={14} />
          </button>
        </div>
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
      {manageOpen ? (
        <SourceManagePanel
          sources={sources}
          snapshots={snapshots}
          editSource={editSource}
          onEditChange={setEditSource}
          onSaveEdit={handleSaveEdit}
          onRequestRemove={setRemoveConfirmId}
          translate={translate}
        />
      ) : null}
      {removeConfirmSource === undefined ? null : (
        <div
          className="dshm-modalOverlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setRemoveConfirmId(undefined);
          }}
        >
          <div
            className="dshm-modal is-compact dshm-mktConfirm"
            role="alertdialog"
            aria-modal="true"
            aria-label={translate("marketDeleteSourceTitle")}
            ref={removeConfirmRef}
            tabIndex={-1}
          >
            <div className="dshm-mktConfirmBody">
              <h4>{translate("marketDeleteSourceTitle")}</h4>
              <p>
                {fill(translate("marketDeleteSourceHint"), {
                  name: removeConfirmSource.name,
                })}
              </p>
            </div>
            <footer className="dshm-mktDetailFoot">
              <button
                type="button"
                className="dshm-button"
                onClick={() => {
                  setRemoveConfirmId(undefined);
                }}
              >
                {translate("marketCancel")}
              </button>
              <button
                type="button"
                className="dshm-button dshm-buttonDanger"
                onClick={confirmRemove}
              >
                {translate("marketDeleteSource")}
              </button>
            </footer>
          </div>
        </div>
      )}
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
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

/**
 * Equal-width segmented control: All | one capsule per source (6px health
 * dot + name). Pure picker — deletion only happens through the manage
 * panel's confirm dialog (the old right-click-to-delete shortcut on the
 * chips was removed: it deleted with no confirmation and users found the
 * gesture uncomfortable).
 */
function SourceSegmented({
  sources,
  snapshots,
  activeSourceId,
  onPick,
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
        let stateClass = "";
        if (snapshot?.state === "offline") stateClass = " is-down";
        if (snapshot?.state === "invalid") stateClass = " is-invalid";
        return (
          <button
            key={source.id}
            type="button"
            className={`dshm-mkt-segBtn${stateClass}${activeSourceId === source.id ? " is-active" : ""}`}
            aria-pressed={activeSourceId === source.id}
            onClick={() => {
              onPick(source.id);
            }}
            title={
              segmentTitle(snapshot, translate) +
              (source.builtIn ? ` · ${translate("marketSourceBuiltIn")}` : "")
            }
          >
            <span className="dshm-mkt-segDot" aria-hidden={true} />
            <span className="dshm-mkt-segLabel">{source.name}</span>
          </button>
        );
      })}
    </div>
  );
}

interface SourceManagePanelProps {
  readonly sources: readonly MarketSource[];
  readonly snapshots: readonly SourceSnapshot[];
  readonly editSource:
    | { readonly id: string; readonly name: string; readonly url: string }
    | undefined;
  readonly onEditChange: (
    value: { readonly id: string; readonly name: string; readonly url: string } | undefined,
  ) => void;
  readonly onSaveEdit: () => void;
  /** Opens the delete confirm dialog for this source id. */
  readonly onRequestRemove: (id: string) => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
}

/**
 * Visible source management (mirrors dsh-mcp-manager): one grouped
 * container of rows, each with the source name + manifest URL, health
 * dot, and — for user-added sources — inline edit (rename / re-point)
 * and delete. Deleting opens a self-drawn confirm dialog (the shelf's
 * modal shell); the chip right-click shortcut is gone.
 */
function SourceManagePanel({
  sources,
  snapshots,
  editSource,
  onEditChange,
  onSaveEdit,
  onRequestRemove,
  translate,
}: SourceManagePanelProps): JSX.Element {
  return (
    <div
      className="dshm-mkt-manage"
      role="group"
      aria-label={translate("marketManageSources")}
    >
      <span className="dshm-mkt-manageLabel">
        {translate("marketManageSources")}
      </span>
      <ul className="dshm-mkt-srcList">
        {sources.map((source) => {
          const snapshot = snapshots.find(
            (entry) => entry.source.id === source.id,
          );
          let dotClass = "";
          if (snapshot?.state === "offline") dotClass = " is-down";
          if (snapshot?.state === "invalid") dotClass = " is-invalid";
          if (editSource !== undefined && editSource.id === source.id) {
            return (
              <li key={source.id} className="dshm-mkt-srcRow">
                <div className="dshm-mkt-srcEdit">
                  <input
                    type="text"
                    value={editSource.name}
                    placeholder={translate("marketAddName")}
                    aria-label={translate("marketAddName")}
                    onChange={(event) => {
                      onEditChange({ ...editSource, name: event.currentTarget.value });
                    }}
                  />
                  <input
                    type="url"
                    value={editSource.url}
                    placeholder={translate("marketAddUrl")}
                    aria-label={translate("marketAddUrl")}
                    onChange={(event) => {
                      onEditChange({ ...editSource, url: event.currentTarget.value });
                    }}
                  />
                  <button
                    type="button"
                    className="dshm-mkt-addbtn"
                    onClick={onSaveEdit}
                    disabled={
                      editSource.name.trim() === "" || editSource.url.trim() === ""
                    }
                  >
                    {translate("marketSave")}
                  </button>
                  <button
                    type="button"
                    className="dshm-mkt-addbtn is-quiet"
                    onClick={() => {
                      onEditChange(undefined);
                    }}
                  >
                    {translate("marketCancel")}
                  </button>
                </div>
              </li>
            );
          }
          return (
            <li key={source.id} className="dshm-mkt-srcRow">
              <span className={`dshm-mkt-srcDot${dotClass}`} aria-hidden={true} />
              <span className="dshm-mkt-srcMain">
                <span className="dshm-mkt-srcNameLine">
                  <span className="dshm-mkt-srcName">{source.name}</span>
                  {source.builtIn ? (
                    <span
                      className="dshm-mkt-srcTag"
                      title={translate("marketSourceBuiltinHint")}
                    >
                      {translate("marketSourceBuiltinTag")}
                    </span>
                  ) : null}
                </span>
                <span className="dshm-mkt-srcUrl" title={source.url}>
                  {source.url}
                </span>
              </span>
              <span className="dshm-mkt-srcActions">
                <button
                  type="button"
                  className="dshm-mkt-srcBtn"
                  onClick={() => {
                    onEditChange({
                      id: source.id,
                      name: source.name,
                      url: source.url,
                    });
                  }}
                  title={translate("marketEditSource")}
                  aria-label={`${translate("marketEditSource")}: ${source.name}`}
                >
                  <IconPencil size={13} />
                </button>
                <button
                  type="button"
                  className="dshm-mkt-srcBtn is-danger"
                  onClick={() => {
                    onRequestRemove(source.id);
                  }}
                  disabled={source.builtIn}
                  title={
                    source.builtIn
                      ? translate("marketSourceBuiltinHint")
                      : `${translate("marketDeleteSource")}: ${source.name}`
                  }
                  aria-label={`${translate("marketDeleteSource")}: ${source.name}`}
                  aria-haspopup="dialog"
                >
                  <IconTrash size={13} />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
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

/**
 * Compact inline disclosure (mirrors dsh-mcp-manager): two 30px inputs +
 * 26px confirm / cancel buttons, one row on a proper grouped surface —
 * not a bare cluster squeezed against the toolbar.
 */
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
    <div className="dshm-mkt-addrow" role="group" aria-label={translate("marketAddSource")}>
      <input
        type="text"
        placeholder={translate("marketAddName")}
        aria-label={translate("marketAddName")}
        value={name}
        onChange={(event) => {
          onNameChange(event.currentTarget.value);
        }}
      />
      <input
        type="text"
        inputMode="url"
        placeholder={translate("marketAddUrl")}
        aria-label={translate("marketAddUrl")}
        value={url}
        onChange={(event) => {
          onUrlChange(event.currentTarget.value);
        }}
      />
      <button
        type="button"
        className="dshm-mkt-addbtn"
        onClick={onSubmit}
        disabled={name.trim() === "" || url.trim() === ""}
      >
        {translate("marketAdd")}
      </button>
      <button type="button" className="dshm-mkt-addbtn is-quiet" onClick={onCancel}>
        {translate("marketCancel")}
      </button>
      <span className="dshm-mkt-addhint">{translate("addSourceHint")}</span>
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
        {onOpen !== undefined ? (
          <button
            type="button"
            className="dshm-mkt-btn is-quiet"
            onClick={onOpen}
            title={translate("marketDetail")}
          >
            {translate("marketDetail")}
          </button>
        ) : null}
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
  /** Opens the item detail modal (market row / card "详情"). */
  readonly onOpen?: () => void;
  readonly onInstall: () => void;
  readonly onRemove: () => void;
}

/** One card inside the grid view: 46px hue-keyed gradient tile (the
 *  item's name hashed to one stable hue), meta, 2-line description,
 *  tags and a bottom action bar. Cards carry the market's only texture —
 *  a lit surface with a soft ambient shadow; hover brightens the border
 *  and deepens the shadow only (rows stay quiet). */
export function MarketCard({
  item,
  source,
  installed,
  updatable,
  busy,
  removeEnabled,
  translate,
  onOpen,
  onInstall,
  onRemove,
}: MarketCardProps): JSX.Element {
  return (
    <li
      className={`dshm-mkt-card${installed ? " is-installed" : ""}`}
      data-kind={item.kind}
      style={hueStyle(item.name)}
    >
      <div className="dshm-mkt-cardHead">
        <span className="dshm-mkt-cardTile" aria-hidden={true}>
          <TileIcon kind={item.kind} size={20} />
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
          {onOpen !== undefined ? (
            <button
              type="button"
              className="dshm-mkt-btn is-quiet"
              onClick={onOpen}
              title={translate("marketDetail")}
            >
              {translate("marketDetail")}
            </button>
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
        </span>
      </div>
    </li>
  );
}
