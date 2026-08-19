/**
 * MCP workspace section (mounted by the dsh-launcher workspace through the
 * `dsh-launcher.workspace.section` slot, id 'mcp').
 *
 * Dual-mode container: a segmented control switches between
 *   - 已安装 (Installed): the McpManagerSection server catalog (list ⇄
 *     card views, per-row 详情/编辑 dialogs, enable switch, delete)
 *   - 市场 (Market): the upgraded MarketShelf (sources, list / card
 *     views, install / update / remove)
 * The choice persists in localStorage and survives reloads. Both modes
 * share the same McpManagerApi; installs from the market are plain `save`
 * calls that overwrite the server config (which is also what "update"
 * does), and a successful install / update / remove clears the cached
 * connection probe so the version badge and tool cache re-resolve.
 */
import { useCallback, useEffect, useState } from "react"
import { MarketShelf, type MarketplaceLocaleKey } from "./market/MarketShelf.tsx"
import type { MarketItem, MarketSource } from "./market/types.ts"
import { versionsDiffer } from "./market/version.ts"
import type { McpManagerApi } from "./api.ts"
import type { McpServerConfig, McpServerView, McpTransport } from "../contracts.ts"
import type { McpManagerLocaleKey } from "./locales.ts"
import { McpManagerSection } from "./McpManagerSection.tsx"
import { ModalShell } from "./ModalShell.tsx"
import {
  loadSectionMode,
  saveSectionMode,
  type SectionMode,
} from "./preferences.ts"
import { clearCachedTest, loadCachedTest } from "./tool-cache.ts"

export interface McpMarketSectionProps {
  readonly api: McpManagerApi
  readonly launcherT: (key: string, params?: Record<string, unknown>) => string
  readonly t: (key: McpManagerLocaleKey) => string
}

export function McpMarketSection({
  api,
  launcherT,
  t,
}: McpMarketSectionProps): JSX.Element {
  const [mode, setMode] = useState<SectionMode>(() =>
    loadSectionMode(window.localStorage),
  )

  const pickMode = useCallback((next: SectionMode) => {
    setMode(next)
    saveSectionMode(window.localStorage, next)
  }, [])

  return (
    <div className="dshmcp-section">
      <div className="dshmcp-seg dshmcp-modeSeg" role="group" aria-label={t("marketTab")}>
        <button
          type="button"
          aria-pressed={mode === "installed"}
          onClick={() => { pickMode("installed") }}
        >
          {t("modeInstalled")}
        </button>
        <button
          type="button"
          aria-pressed={mode === "market"}
          onClick={() => { pickMode("market") }}
        >
          {t("modeMarket")}
        </button>
      </div>
      {mode === "installed"
        ? <McpManagerSection t={t} api={api} />
        : <MarketPane api={api} launcherT={launcherT} t={t} />}
    </div>
  )
}

interface MarketPaneProps {
  readonly api: McpManagerApi
  readonly launcherT: (key: string, params?: Record<string, unknown>) => string
  readonly t: (key: McpManagerLocaleKey) => string
}

/**
 * The market item's installed server name: manifest / .mcp.json payloads
 * carry `serverName` (the mcpServers key); items without it fall back to
 * the item id. Used for installed-detection and probe-cache lookups so
 * items discovered from GitHub (id "mcp-<key>", server "<key>") match.
 */
function itemServerName(item: MarketItem): string {
  const fromPayload = item.payload?.["serverName"]
  return typeof fromPayload === "string" && fromPayload !== "" ? fromPayload : item.id
}

/** The 市场 half: market shelf wired to the real server list. */
function MarketPane({ api, launcherT, t }: MarketPaneProps): JSX.Element {
  const [servers, setServers] = useState<readonly McpServerView[]>([])
  const [version, setVersion] = useState(0)
  const [detail, setDetail] = useState<
    { readonly item: MarketItem; readonly source: MarketSource } | undefined
  >(undefined)

  const reload = useCallback(() => {
    void api.list().then((response) => {
      setServers(response.servers)
    }).catch(() => undefined)
  }, [api])

  useEffect(() => {
    reload()
  }, [reload, version])

  const isInstalled = useCallback((item: MarketItem) => {
    const name = itemServerName(item)
    return servers.some((server) => server.serverName === name)
  }, [servers])

  /** Installed version from the freshest cached probe, when we have one. */
  const installedVersion = useCallback((item: MarketItem) => {
    return loadCachedTest(window.localStorage, itemServerName(item))?.serverVersion
  }, [])

  const handleInstall = useCallback(async (item: MarketItem, _source: MarketSource) => {
    const payload = item.payload ?? {}
    const config = parsePayloadConfig(payload, item.id)
    if (config === null) {
      throw new Error(`${t("tab")}: missing config`)
    }
    await api.save({ config })
    // drop the stale probe (tools + serverVersion) so the update badge
    // clears and the installed pane re-probes the fresh config
    clearCachedTest(window.localStorage, config.serverName)
    setVersion((value) => value + 1)
  }, [api, t])

  const handleRemove = useCallback(async (item: MarketItem, _source: MarketSource) => {
    const name = itemServerName(item)
    const server = servers.find((candidate) => candidate.serverName === name)
    if (server === undefined) {
      throw new Error(`MCP not found: ${name}`)
    }
    if (!server.removable) {
      throw new Error(t("notRemovable"))
    }
    await api.deleteServer(server.entryId)
    clearCachedTest(window.localStorage, server.serverName)
    setVersion((value) => value + 1)
  }, [api, servers, t])

  return (
    <>
      <MarketShelf
        storage={window.localStorage}
        defaultSources={[]}
        kinds={["mcp"]}
        translate={launcherT}
        t={t}
        onItemOpen={(item, source) => { setDetail({ item, source }) }}
        onInstall={handleInstall}
        onRemove={handleRemove}
        isInstalled={isInstalled}
        installedVersion={installedVersion}
      />
      {detail === undefined ? null : (
        <MarketItemDetailModal
          key={`${detail.source.id}:${detail.item.id}`}
          t={t}
          launcherT={launcherT}
          item={detail.item}
          source={detail.source}
          installed={isInstalled(detail.item)}
          updatable={versionsDiffer(
            detail.item.version,
            installedVersion(detail.item),
          )}
          toolCount={installedToolCount(servers, detail.item)}
          onInstall={handleInstall}
          onClose={() => { setDetail(undefined) }}
        />
      )}
    </>
  );
}

/**
 * Known tool count for an installed market item: the live registration
 * first, then the freshest cached probe. Undefined when the item is not
 * installed or nothing has been observed yet.
 */
function installedToolCount(
  servers: readonly McpServerView[],
  item: MarketItem,
): number | undefined {
  const name = itemServerName(item)
  const server = servers.find((candidate) => candidate.serverName === name)
  if (server === undefined) return undefined
  if (server.tools.length > 0) return server.tools.length
  const cached = loadCachedTest(window.localStorage, name)
  if (cached === undefined) return undefined
  return cached.toolCount ?? cached.tools.length
}

/** Render an env / headers value; !!js expressions stay opaque but visible. */
function kvValueOf(value: string | { readonly __jsExpr: string }): string {
  return typeof value === "string" ? value : `!!js ${value.__jsExpr}`
}

interface MarketItemDetailModalProps {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly launcherT: (key: MarketplaceLocaleKey, params?: Record<string, unknown>) => string
  readonly item: MarketItem
  readonly source: MarketSource
  readonly installed: boolean
  readonly updatable: boolean
  readonly toolCount: number | undefined
  readonly onInstall: (item: MarketItem, source: MarketSource) => Promise<void>
  readonly onClose: () => void
}

/**
 * Read-only 详情 dialog for one market item, sharing the installed pane's
 * modal shell and field-list recipe: the full description plus source /
 * version / author / tags in 基本信息, and the parsed 安装配置 — stdio
 * command / args / env key-value rows, or the URL and headers for
 * url-style transports — with the known tool count once installed. The
 * foot repeats the row / card action as the primary button (安装 / 更新).
 */
function MarketItemDetailModal({ t, launcherT, item, source, installed, updatable, toolCount, onInstall, onClose }: MarketItemDetailModalProps): JSX.Element {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const config = parsePayloadConfig(item.payload ?? {}, item.id)
  const envEntries = config !== null && config.transport === "stdio" && config.env !== undefined ? Object.entries(config.env) : []
  const headerEntries = config !== null && config.transport === "streamable-http" && config.headers !== undefined ? Object.entries(config.headers) : []

  const handleInstallClick = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    setError(undefined)
    try {
      await onInstall(item, source)
      onClose()
    } catch (installError) {
      setError(installError instanceof Error ? installError.message : String(installError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell
      open
      t={t}
      size="lg"
      title={item.name}
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="dshmcp-button" onClick={onClose}>{t("drawerClose")}</button>
          <button
            type="button"
            className="dshmcp-button dshmcp-buttonPrimary"
            disabled={busy || (installed && !updatable)}
            onClick={() => { void handleInstallClick() }}
          >
            {!installed
              ? (busy ? launcherT("marketInstalling") : launcherT("marketInstall"))
              : updatable
                ? (busy ? t("marketUpdating") : t("marketUpdate"))
                : launcherT("marketInstalled")}
          </button>
        </>
      )}
    >
      {error === undefined ? null : <p className="dshmcp-callout dshmcp-calloutError" role="alert">{error}</p>}
      <div className="dshmcp-block">
        <div className="dshmcp-blockHead">
          <span className="dshmcp-label">{t("basicInfo")}</span>
        </div>
        <dl className="dshmcp-fields">
          <div><dt>{t("drawerDescription")}</dt><dd>{item.description}</dd></div>
          <div><dt>{t("marketDetailSource")}</dt><dd>{source.name}</dd></div>
          {item.version === undefined ? null : <div><dt>{t("detailVersion")}</dt><dd className="dshmcp-path">v{item.version}</dd></div>}
          {item.author === undefined ? null : <div><dt>{t("marketDetailAuthor")}</dt><dd>{item.author}</dd></div>}
          {item.tags === undefined || item.tags.length === 0 ? null : (
            <div>
              <dt>{t("marketDetailTags")}</dt>
              <dd>
                <span className="dshmcp-mkt-tags">
                  {item.tags.map(tag => <span key={tag} className="dshmcp-tag">{tag}</span>)}
                </span>
              </dd>
            </div>
          )}
          {installed && toolCount !== undefined ? (
            <div>
              <dt>{t("toolsHeading")}</dt>
              <dd>{toolCount === 1 ? t("toolsCountOne") : t("toolsCountMany").replace("{n}", String(toolCount))}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <div className="dshmcp-block">
        <div className="dshmcp-blockHead">
          <span className="dshmcp-label">{t("marketDetailInstallConfig")}</span>
        </div>
        {config === null ? (
          <p className="dshmcp-status">{t("marketDetailNoConfig")}</p>
        ) : (
          <dl className="dshmcp-fields">
            <div><dt>{t("fieldTransport")}</dt><dd>{config.transport === "streamable-http" ? t("transportHttp") : t("transportStdio")}</dd></div>
            {config.transport === "stdio" ? (
              <>
                <div><dt>{t("detailCommand")}</dt><dd className="dshmcp-path">{config.command ?? "—"}</dd></div>
                {config.args !== undefined && config.args.length > 0 ? <div><dt>{t("detailArgs")}</dt><dd className="dshmcp-path">{config.args.join(" ")}</dd></div> : null}
                {envEntries.length > 0 ? (
                  <>
                    <div><dt>{t("detailEnv")}</dt><dd>{t("detailEnvCount").replace("{n}", String(envEntries.length))}</dd></div>
                    {envEntries.map(([key, value]) => (
                      <div key={key}><dt className="dshmcp-path">{key}</dt><dd className="dshmcp-path">{kvValueOf(value)}</dd></div>
                    ))}
                  </>
                ) : null}
              </>
            ) : (
              <>
                <div><dt>{t("detailUrl")}</dt><dd className="dshmcp-path">{config.url ?? "—"}</dd></div>
                {headerEntries.length > 0 ? (
                  <>
                    <div><dt>{t("detailHeaders")}</dt><dd>{t("detailEnvCount").replace("{n}", String(headerEntries.length))}</dd></div>
                    {headerEntries.map(([key, value]) => (
                      <div key={key}><dt className="dshmcp-path">{key}</dt><dd className="dshmcp-path">{kvValueOf(value)}</dd></div>
                    ))}
                  </>
                ) : null}
              </>
            )}
          </dl>
        )}
      </div>
    </ModalShell>
  )
}

/**
 * The manifest item payload holds a McpServerConfig as a JSON object so
 * the launcher doesn't need to know the typing. We validate the shape
 * here: the caller passes either a fully-formed config, or partial
 * fields that we fill with sensible defaults. URL-based transports from
 * .mcp.json documents ("sse" / "http" / "url") map onto the plugin's
 * streamable-http transport.
 */
function parsePayloadConfig(
  payload: Record<string, unknown>,
  fallbackId: string,
): McpServerConfig | null {
  const serverName = typeof payload["serverName"] === "string" ? payload["serverName"] : fallbackId
  const rawTransport = payload["transport"]
  const transport: McpTransport =
    rawTransport === "streamable-http" || rawTransport === "sse" || rawTransport === "http" || rawTransport === "url"
      ? "streamable-http"
      : "stdio"
  if (transport === "stdio") {
    const command = typeof payload["command"] === "string" ? payload["command"] : null
    if (command === null) return null
    const args = Array.isArray(payload["args"])
      ? payload["args"].filter((value): value is string => typeof value === "string")
      : []
    const env = cleanStringRecord(payload["env"])
    const config: McpServerConfig = {
      serverName,
      transport,
      command,
      args,
      ...(env === undefined ? {} : { env }),
    }
    return config
  }
  const url = typeof payload["url"] === "string" ? payload["url"] : null
  if (url === null) return null
  const headers = cleanStringRecord(payload["headers"])
  const config: McpServerConfig = {
    serverName,
    transport,
    url,
    ...(headers === undefined ? {} : { headers }),
  }
  return config
}

/** Keep only string→string pairs from an env / headers payload block. */
function cleanStringRecord(
  value: unknown,
): Readonly<Record<string, string>> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined
  const out: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") out[key] = entry
  }
  return Object.keys(out).length === 0 ? undefined : out
}
