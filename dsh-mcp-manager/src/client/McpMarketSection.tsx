/**
 * MCP workspace section (mounted by the dsh-launcher workspace through the
 * `dsh-launcher.workspace.section` slot, id 'mcp').
 *
 * Dual-mode container: a segmented control switches between
 *   - 已安装 (Installed): the existing McpManagerSection master–detail
 *     (server list + config / tools detail)
 *   - 市场 (Market): the upgraded MarketShelf (sources, list / card
 *     views, install / update / remove)
 * The choice persists in localStorage and survives reloads. Both modes
 * share the same McpManagerApi; installs from the market are plain `save`
 * calls that overwrite the server config (which is also what "update"
 * does), and a successful install / update / remove clears the cached
 * connection probe so the version badge and tool cache re-resolve.
 */
import { useCallback, useEffect, useState } from "react"
import { MarketShelf } from "./market/MarketShelf.tsx"
import type { MarketItem, MarketSource } from "./market/types.ts"
import type { McpManagerApi } from "./api.ts"
import type { McpServerConfig, McpServerView } from "../contracts.ts"
import type { McpManagerLocaleKey } from "./locales.ts"
import { McpManagerSection } from "./McpManagerSection.tsx"
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

/** The 市场 half: market shelf wired to the real server list. */
function MarketPane({ api, launcherT, t }: MarketPaneProps): JSX.Element {
  const [servers, setServers] = useState<readonly McpServerView[]>([])
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => {
    void api.list().then((response) => {
      setServers(response.servers)
    }).catch(() => undefined)
  }, [api])

  useEffect(() => {
    reload()
  }, [reload, version])

  const isInstalled = useCallback((item: MarketItem) => {
    return servers.some((server) => server.serverName === item.id)
  }, [servers])

  /** Installed version from the freshest cached probe, when we have one. */
  const installedVersion = useCallback((item: MarketItem) => {
    return loadCachedTest(window.localStorage, item.id)?.serverVersion
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
    const server = servers.find((candidate) => candidate.serverName === item.id)
    if (server === undefined) {
      throw new Error(`MCP not found: ${item.id}`)
    }
    if (!server.removable) {
      throw new Error(t("notRemovable"))
    }
    await api.deleteServer(server.entryId)
    clearCachedTest(window.localStorage, server.serverName)
    setVersion((value) => value + 1)
  }, [api, servers, t])

  return (
    <MarketShelf
      storage={window.localStorage}
      defaultSources={[]}
      kinds={["mcp"]}
      translate={launcherT}
      t={t}
      onInstall={handleInstall}
      onRemove={handleRemove}
      isInstalled={isInstalled}
      installedVersion={installedVersion}
    />
  )
}

/**
 * The manifest item payload holds a McpServerConfig as a JSON object so
 * the launcher doesn't need to know the typing. We validate the shape
 * here: the caller passes either a fully-formed config, or partial
 * fields that we fill with sensible defaults.
 */
function parsePayloadConfig(
  payload: Record<string, unknown>,
  fallbackId: string,
): McpServerConfig | null {
  const serverName = typeof payload["serverName"] === "string" ? payload["serverName"] : fallbackId
  const transport = payload["transport"] === "streamable-http" ? "streamable-http" : "stdio"
  if (transport === "stdio") {
    const command = typeof payload["command"] === "string" ? payload["command"] : null
    if (command === null) return null
    const args = Array.isArray(payload["args"])
      ? payload["args"].filter((value): value is string => typeof value === "string")
      : []
    const config: McpServerConfig = { serverName, transport, command, args }
    return config
  }
  const url = typeof payload["url"] === "string" ? payload["url"] : null
  if (url === null) return null
  const config: McpServerConfig = { serverName, transport, url }
  return config
}
