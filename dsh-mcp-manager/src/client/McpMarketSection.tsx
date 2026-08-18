/**
 * MCP marketplace section. Self-contained UI for the dsh-mcp-manager
 * plugin (vendored from dsh-launcher's market module — the platform's
 * ModuleLoader forbids cross-plugin value imports, so the source-of-truth
 * lives here).
 *
 * The launcher workspace reads us through the
 * `dsh-launcher.workspace.section` slot key; mounting happens via the
 * slot registration in client/index.ts. Each marketplace item's `payload`
 * carries a McpServerConfig (the same shape the existing McpEditor
 * consumes). Install serializes the config back via the existing `save`
 * endpoint; remove uses the existing `delete` endpoint.
 */
import { useCallback, useEffect, useState } from "react"
import { MarketShelf } from "./market/MarketShelf.tsx"
import type { MarketItem, MarketSource } from "./market/types.ts"
import type { McpManagerApi } from "./api.ts"
import type { McpServerConfig, McpServerView } from "../contracts.ts"
import type { McpManagerLocaleKey } from "./locales.ts"

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

  const handleInstall = useCallback(async (item: MarketItem, _source: MarketSource) => {
    const payload = item.payload ?? {}
    const config = parsePayloadConfig(payload, item.id)
    if (config === null) {
      throw new Error(`${t("tab")}: missing config`)
    }
    await api.save({ config })
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
    setVersion((value) => value + 1)
  }, [api, servers, t])

  return (
    <MarketShelf
      storage={window.localStorage}
      defaultSources={[]}
      kinds={["mcp"]}
      translate={launcherT}
      onInstall={handleInstall}
      onRemove={handleRemove}
      isInstalled={isInstalled}
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