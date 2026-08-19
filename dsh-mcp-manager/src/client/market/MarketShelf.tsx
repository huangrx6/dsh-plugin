/**
 * Marketplace shelf. Self-contained UI for the dsh-mcp-manager plugin
 * (vendored from dsh-launcher's market module — the platform's ModuleLoader
 * forbids cross-plugin value imports, so the source-of-truth lives here).
 *
 * "Quiet Structure" layout (Raycast-store / macOS-Settings shape):
 *   - one toolbar row: segmented source picker (equal-width capsules),
 *     a search field, a refresh icon button, a list/card view toggle, an
 *     add-source icon button with a compact inline form and a manage
 *     sources icon button that opens a grouped panel (rename / re-point /
 *     delete — visible UI, right-click delete on chips stays as a shortcut)
 *   - items render either as compact rows in one grouped container
 *     (hairline separated, quiet background-only hover) or as a textured
 *     card grid — per-item hue icon plinth, gradient surface with a light
 *     ambient shadow; hover lifts the border and shadow only, no motion
 *
 * Does NOT own the install / remove button behavior — those bubbled up
 * as `onInstall` / `onRemove` callbacks so the consumer plugin owns the
 * wire call. Update = install again (the consumer's save overwrites the
 * config); the shelf only decides *whether* to offer it, by comparing the
 * market item's version against the installed version reported through
 * `installedVersion`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  normalizeSourceUrl,
  type DiscoverStrings,
} from "./discover.ts";
import type { MarketItem, MarketItemKind, MarketSource } from "./types.ts";
import { loadMarketView, saveMarketView, type MarketView } from "../preferences.ts";
import { versionsDiffer } from "./version.ts";
import { hueStyle } from "../hue.ts";

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
  /**
   * Labels for the shelf's own affordances (source management, view
   * toggle, update badge). Resolved through the dsh-mcp-manager
   * dictionary — the launcher dictionary deliberately stays untouched.
   */
  readonly t: (key: MarketUiLocaleKey) => string;
  /** Optional row click handler (open detail). */
  readonly onItemOpen?: (item: MarketItem, source: MarketSource) => void;
  /** Install handler. Returns a promise that resolves once the install finishes. */
  readonly onInstall: (item: MarketItem, source: MarketSource) => Promise<void>;
  /** Optional remove handler. When omitted, the "Remove" button is hidden. */
  readonly onRemove?: (item: MarketItem, source: MarketSource) => Promise<void>;
  /** Predicate: is the item already installed? Drives the action button. */
  readonly isInstalled: (item: MarketItem) => boolean;
  /**
   * Installed version for an item, when known (probed server info).
   * Together with the item's market `version` this drives the
   * "updatable" badge + Update action; unknown versions never compare.
   */
  readonly installedVersion?: (item: MarketItem) => string | undefined;
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
 * Keys resolved through the owning plugin's dictionary (the manage panel,
 * the view toggle and the update badge are dsh-mcp-manager features, so
 * their copy lives in this plugin's locales.ts).
 */
export type MarketUiLocaleKey =
  | "marketManageSources"
  | "marketEditSource"
  | "marketDeleteSource"
  | "marketDeleteSourceConfirm"
  | "marketSourceBuiltinTag"
  | "marketSourceBuiltinHint"
  | "marketSourceSave"
  | "marketSourceCancel"
  | "marketViewList"
  | "marketViewCard"
  | "marketUpdatable"
  | "marketUpdate"
  | "marketUpdating"
  | "marketUpdateHint"
  | "detailButton"
  | "addSourceHint"
  | "discoverItemDesc"
  | "discoverNoConfig"
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
function discoverStrings(t: (key: MarketUiLocaleKey) => string): DiscoverStrings {
  return {
    fallbackDescription: (label) => fill(t("discoverItemDesc"), { repo: label }),
    noConfig: (label) => fill(t("discoverNoConfig"), { repo: label }),
    repoNotFound: (label) => fill(t("discoverRepoNotFound"), { repo: label }),
    unauthorized: (status) => fill(t("discoverUnauthorized"), { status: String(status) }),
    rateLimited: () => t("discoverRateLimited"),
    invalidJson: () => t("discoverInvalidJson"),
    invalidManifest: () => t("discoverInvalid"),
    invalidUrl: () => t("discoverInvalidUrl"),
  };
}

/**
 * Pick a row tile icon by item kind. The launcher's "default" tile is
 * the sparkle (general/unknown); consumers can override by passing a
 * different `kind` in the manifest.
 */
function TileIcon({ kind, size = 16 }: { readonly kind: MarketItemKind; readonly size?: number }): JSX.Element {
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

/** Per-item install state resolved once, shared by the row and card views. */
interface ItemState {
  readonly installed: boolean;
  readonly updatable: boolean;
  readonly updateHint: string | undefined;
}

function resolveItemState(
  item: MarketItem,
  isInstalled: (item: MarketItem) => boolean,
  installedVersion: ((item: MarketItem) => string | undefined) | undefined,
  t: (key: MarketUiLocaleKey) => string,
): ItemState {
  const installed = isInstalled(item);
  if (!installed) return { installed: false, updatable: false, updateHint: undefined };
  const local =
    installedVersion === undefined ? undefined : installedVersion(item);
  const updatable = versionsDiffer(item.version, local);
  const updateHint =
    updatable && item.version !== undefined && local !== undefined
      ? t("marketUpdateHint")
          .replace("{market}", item.version)
          .replace("{installed}", local)
      : undefined;
  return { installed: true, updatable, updateHint };
}

export function MarketShelf({
  storage,
  defaultSources,
  fetcher,
  kinds,
  translate,
  t,
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
  const [view, setView] = useState<MarketView>(() => loadMarketView(storage));
  const [manageOpen, setManageOpen] = useState(false);
  const [editSource, setEditSource] = useState<
    { readonly id: string; readonly name: string; readonly url: string } | undefined
  >(undefined);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(undefined);
    try {
      const next = await fetchAllManifests(sources, fetcher, discoverStrings(t));
      setSnapshots(next);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : String(fetchError),
      );
    } finally {
      setRefreshing(false);
    }
  }, [sources, fetcher, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pickView = useCallback(
    (next: MarketView) => {
      setView(next);
      saveMarketView(storage, next);
    },
    [storage],
  );

  const handleAdd = useCallback(() => {
    if (draftName.trim() === "" || draftUrl.trim() === "") return;
    const next = addMarketSourceImpl(storage, sources, {
      name: draftName.trim(),
      url: normalizeSourceUrl(draftUrl),
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

  const handleRemoveWithConfirm = useCallback(
    (id: string) => {
      if (typeof window !== "undefined" && typeof window.confirm === "function") {
        if (!window.confirm(t("marketDeleteSourceConfirm"))) return;
      }
      handleRemove(id);
    },
    [handleRemove, t],
  );

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

  const renderItem = (item: MarketItem) => {
    const source = snapshots.find((snapshot) =>
      (snapshot.items ?? []).includes(item),
    )?.source;
    if (source === undefined) return null;
    const key = `${source.id}:${item.id}`;
    const state = resolveItemState(item, isInstalled, installedVersion, t);
    const busy = busyId === key;
    return { key, item, source, state, busy };
  };

  const rowsData = activeItems
    .map((item) => renderItem(item))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

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
        <div
          className="dshmcp-mkt-viewseg"
          role="group"
          aria-label={t("marketViewList")}
        >
          <button
            type="button"
            aria-pressed={view === "list"}
            title={t("marketViewList")}
            aria-label={t("marketViewList")}
            onClick={() => {
              pickView("list");
            }}
          >
            <IconList size={14} />
          </button>
          <button
            type="button"
            aria-pressed={view === "card"}
            title={t("marketViewCard")}
            aria-label={t("marketViewCard")}
            onClick={() => {
              pickView("card");
            }}
          >
            <IconGrid size={14} />
          </button>
        </div>
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
        <button
          type="button"
          className={`dshmcp-mkt-iconbtn${manageOpen ? " is-active" : ""}`}
          onClick={() => {
            setManageOpen((open) => !open);
            setEditSource(undefined);
          }}
          aria-expanded={manageOpen}
          aria-pressed={manageOpen}
          title={t("marketManageSources")}
          aria-label={t("marketManageSources")}
        >
          <IconSliders size={14} />
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
          t={t}
        />
      ) : null}
      {manageOpen ? (
        <SourceManagePanel
          sources={sources}
          snapshots={snapshots}
          editSource={editSource}
          onEditChange={setEditSource}
          onSaveEdit={handleSaveEdit}
          onRemove={handleRemoveWithConfirm}
          translate={translate}
          t={t}
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
      ) : view === "card" ? (
        <ul className="dshmcp-mkt-cards">
          {rowsData.map((entry) => (
            <MarketCard
              key={entry.key}
              item={entry.item}
              source={entry.source}
              installed={entry.state.installed}
              updatable={entry.state.updatable}
              updateHint={entry.state.updateHint}
              busy={entry.busy}
              removeEnabled={onRemove !== undefined}
              translate={translate}
              t={t}
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
          ))}
        </ul>
      ) : (
        <ul className="dshmcp-mkt-list">
          {rowsData.map((entry) => (
            <li key={entry.key} className="dshmcp-mkt-row">
              <MarketRow
                item={entry.item}
                source={entry.source}
                installed={entry.state.installed}
                updatable={entry.state.updatable}
                updateHint={entry.state.updateHint}
                busy={entry.busy}
                removeEnabled={onRemove !== undefined}
                translate={translate}
                t={t}
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
            </li>
          ))}
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
                : snapshot?.state === "offline" || snapshot?.state === "invalid"
                  ? snapshot.error === undefined
                    ? snapshot.state === "offline"
                      ? translate("marketSourceDown")
                      : translate("marketSourceInvalid")
                    : `${snapshot.state === "offline" ? translate("marketSourceDown") : translate("marketSourceInvalid")} — ${snapshot.error}`
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
  readonly onRemove: (id: string) => void;
  readonly translate: (key: MarketplaceLocaleKey) => string;
  readonly t: (key: MarketUiLocaleKey) => string;
}

/**
 * Visible source management: one grouped container of rows, each with the
 * source name + manifest URL, health dot, and — for user-added sources —
 * inline edit (rename / re-point) and delete. Built-in sources render
 * display-only with a tag; the chip right-click shortcut stays but is no
 * longer the only entry point.
 */
function SourceManagePanel({
  sources,
  snapshots,
  editSource,
  onEditChange,
  onSaveEdit,
  onRemove,
  translate,
  t,
}: SourceManagePanelProps): JSX.Element {
  return (
    <div className="dshmcp-mkt-manage" role="group" aria-label={t("marketManageSources")}>
      <span className="dshmcp-mkt-manageLabel">{t("marketManageSources")}</span>
      <ul className="dshmcp-mkt-srcList">
        {sources.map((source) => {
          const snapshot = snapshots.find(
            (entry) => entry.source.id === source.id,
          );
          let dotClass = "";
          if (snapshot?.state === "offline") dotClass = " is-down";
          if (snapshot?.state === "invalid") dotClass = " is-invalid";
          if (editSource !== undefined && editSource.id === source.id) {
            return (
              <li key={source.id} className="dshmcp-mkt-srcRow">
                <div className="dshmcp-mkt-srcEdit">
                  <input
                    type="text"
                    value={editSource.name}
                    placeholder={translate("marketSourceName")}
                    aria-label={translate("marketSourceName")}
                    onChange={(event) => {
                      onEditChange({ ...editSource, name: event.currentTarget.value });
                    }}
                  />
                  <input
                    type="url"
                    value={editSource.url}
                    placeholder={translate("marketSourceUrl")}
                    aria-label={translate("marketSourceUrl")}
                    onChange={(event) => {
                      onEditChange({ ...editSource, url: event.currentTarget.value });
                    }}
                  />
                  <button
                    type="button"
                    className="dshmcp-mkt-addbtn"
                    onClick={onSaveEdit}
                    disabled={
                      editSource.name.trim() === "" || editSource.url.trim() === ""
                    }
                  >
                    {t("marketSourceSave")}
                  </button>
                  <button
                    type="button"
                    className="dshmcp-mkt-addbtn is-quiet"
                    onClick={() => {
                      onEditChange(undefined);
                    }}
                  >
                    {t("marketSourceCancel")}
                  </button>
                </div>
              </li>
            );
          }
          return (
            <li key={source.id} className="dshmcp-mkt-srcRow">
              <span className={`dshmcp-mkt-srcDot${dotClass}`} aria-hidden="true" />
              <span className="dshmcp-mkt-srcMain">
                <span className="dshmcp-mkt-srcNameLine">
                  <span className="dshmcp-mkt-srcName">{source.name}</span>
                  {source.builtIn ? (
                    <span className="dshmcp-tag" title={t("marketSourceBuiltinHint")}>
                      {t("marketSourceBuiltinTag")}
                    </span>
                  ) : null}
                </span>
                <span className="dshmcp-mkt-srcUrl" title={source.url}>
                  {source.url}
                </span>
                {snapshot !== undefined &&
                snapshot.state !== "ok" &&
                snapshot.error !== undefined ? (
                  <span className="dshmcp-mkt-srcErr" role="note">
                    {snapshot.error}
                  </span>
                ) : null}
              </span>
              <span className="dshmcp-mkt-srcActions">
                <button
                  type="button"
                  className="dshmcp-mkt-srcBtn"
                  onClick={() => {
                    onEditChange({
                      id: source.id,
                      name: source.name,
                      url: source.url,
                    });
                  }}
                  title={t("marketEditSource")}
                  aria-label={`${t("marketEditSource")}: ${source.name}`}
                >
                  <IconPencil size={13} />
                </button>
                <button
                  type="button"
                  className="dshmcp-mkt-srcBtn is-danger"
                  onClick={() => {
                    onRemove(source.id);
                  }}
                  disabled={source.builtIn}
                  title={
                    source.builtIn
                      ? t("marketSourceBuiltinHint")
                      : `${t("marketDeleteSource")}: ${source.name}`
                  }
                  aria-label={`${t("marketDeleteSource")}: ${source.name}`}
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
  readonly t: (key: MarketUiLocaleKey) => string;
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
  t,
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
        type="text"
        inputMode="url"
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
      <span className="dshmcp-mkt-addhint">{t("addSourceHint")}</span>
    </div>
  );
}

/** Action cluster shared by the row and card views (badge + primary + remove). */
function ItemActions({
  installed,
  updatable,
  updateHint,
  busy,
  removeEnabled,
  translate,
  t,
  onInstall,
  onRemove,
}: {
  readonly installed: boolean;
  readonly updatable: boolean;
  readonly updateHint: string | undefined;
  readonly busy: boolean;
  readonly removeEnabled: boolean;
  readonly translate: (key: MarketplaceLocaleKey) => string;
  readonly t: (key: MarketUiLocaleKey) => string;
  readonly onInstall: () => void;
  readonly onRemove: () => void;
}): JSX.Element {
  if (!installed) {
    return (
      <>
        <button
          type="button"
          className="dshmcp-mkt-install"
          onClick={onInstall}
          disabled={busy}
        >
          {busy ? translate("marketInstalling") : translate("marketInstall")}
        </button>
        <span className="dshmcp-mkt-footSpacer" />
      </>
    );
  }
  if (updatable) {
    return (
      <>
        <span className="dshmcp-mkt-updatable" title={updateHint}>
          <span className="dshmcp-mkt-installedDot" aria-hidden="true" />
          {t("marketUpdatable")}
        </span>
        <button
          type="button"
          className="dshmcp-mkt-install"
          onClick={onInstall}
          disabled={busy}
          title={updateHint}
        >
          {busy ? t("marketUpdating") : t("marketUpdate")}
        </button>
        <span className="dshmcp-mkt-footSpacer" />
        {removeEnabled ? (
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
      </>
    );
  }
  return (
    <>
      <span className="dshmcp-mkt-installed">
        <span className="dshmcp-mkt-installedDot" aria-hidden="true" />
        {translate("marketInstalled")}
      </span>
      <span className="dshmcp-mkt-footSpacer" />
      {removeEnabled ? (
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
    </>
  );
}

export interface MarketRowProps {
  readonly item: MarketItem;
  readonly source: MarketSource;
  readonly installed: boolean;
  /** Installed and the market version differs → show the update path. */
  readonly updatable: boolean;
  readonly updateHint: string | undefined;
  readonly busy: boolean;
  readonly removeEnabled: boolean;
  readonly translate: (key: MarketplaceLocaleKey) => string;
  readonly t: (key: MarketUiLocaleKey) => string;
  readonly onOpen?: () => void;
  readonly onInstall: () => void;
  readonly onRemove: () => void;
}

/**
 * One compact list row: 32px tile / name + source meta / single-line
 * description (flex) / install action. Hairline-separated,
 * background-only hover.
 */
export function MarketRow({
  item,
  source,
  installed,
  updatable,
  updateHint,
  busy,
  removeEnabled,
  translate,
  t,
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
        {onOpen === undefined ? null : (
          <button
            type="button"
            className="dshmcp-mkt-detail"
            onClick={onOpen}
            title={t("detailButton")}
          >
            {t("detailButton")}
          </button>
        )}
        <ItemActions
          installed={installed}
          updatable={updatable}
          updateHint={updateHint}
          busy={busy}
          removeEnabled={removeEnabled}
          translate={translate}
          t={t}
          onInstall={onInstall}
          onRemove={onRemove}
        />
      </span>
    </div>
  );
}

export interface MarketCardProps {
  readonly item: MarketItem;
  readonly source: MarketSource;
  readonly installed: boolean;
  readonly updatable: boolean;
  readonly updateHint: string | undefined;
  readonly busy: boolean;
  readonly removeEnabled: boolean;
  readonly translate: (key: MarketplaceLocaleKey) => string;
  readonly t: (key: MarketUiLocaleKey) => string;
  readonly onOpen?: () => void;
  readonly onInstall: () => void;
  readonly onRemove: () => void;
}

/**
 * One market card: 40px icon plinth + name + version badge, source meta,
 * two-line clamped description, tag chips, and a hairline-separated foot
 * with the action cluster. Quiet Structure — hover only brightens 4%.
 */
export function MarketCard({
  item,
  source,
  installed,
  updatable,
  updateHint,
  busy,
  removeEnabled,
  translate,
  t,
  onOpen,
  onInstall,
  onRemove,
}: MarketCardProps): JSX.Element {
  const meta = [
    source.name,
    ...(item.author === undefined ? [] : [item.author]),
  ].join(" · ");
  const nameLine = (
    <span className="dshmcp-mkt-cardNameLine">
      {onOpen === undefined ? (
        <span className="dshmcp-mkt-cardName">{item.name}</span>
      ) : (
        <button
          type="button"
          className="dshmcp-mkt-cardName dshmcp-mkt-cardNameBtn"
          onClick={onOpen}
          title={item.name}
        >
          {item.name}
        </button>
      )}
      {item.version === undefined ? null : (
        <span className="dshmcp-mkt-ver" title={updateHint}>
          v{item.version}
        </span>
      )}
    </span>
  );
  return (
    <li className="dshmcp-mkt-cardWrap">
      <div
        className={`dshmcp-mkt-card${installed && !updatable ? " is-installed" : ""}`}
        data-item-id={item.id}
      >
        <div className="dshmcp-mkt-cardHead">
          <span
            className="dshmcp-mkt-cardTile"
            style={hueStyle(item.name)}
            aria-hidden="true"
          >
            <TileIcon kind={item.kind} size={20} />
          </span>
          <span className="dshmcp-mkt-cardId">
            {nameLine}
            <span className="dshmcp-mkt-cardMeta">{meta}</span>
          </span>
        </div>
        <p className="dshmcp-mkt-cardDesc" title={item.description}>
          {item.description}
        </p>
        {item.tags === undefined || item.tags.length === 0 ? null : (
          <div className="dshmcp-mkt-tags">
            {item.tags.map((tag) => (
              <span key={tag} className="dshmcp-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="dshmcp-mkt-cardFoot">
          {onOpen === undefined ? null : (
            <button
              type="button"
              className="dshmcp-mkt-detail"
              onClick={onOpen}
              title={t("detailButton")}
            >
              {t("detailButton")}
            </button>
          )}
          <ItemActions
            installed={installed}
            updatable={updatable}
            updateHint={updateHint}
            busy={busy}
            removeEnabled={removeEnabled}
            translate={translate}
            t={t}
            onInstall={onInstall}
            onRemove={onRemove}
          />
        </div>
      </div>
    </li>
  );
}
