/**
 * Skill marketplace section. Self-contained UI for the dsh-skill-manager
 * plugin (vendored from dsh-launcher's market module — the platform's
 * ModuleLoader forbids cross-plugin value imports, so the source-of-truth
 * lives here).
 *
 * The launcher workspace reads us through the
 * `dsh-launcher.workspace.section` slot key; mounting happens via the
 * slot registration in client/index.ts. We only own the wiring between
 * the shelf's install/remove callbacks and the plugin's own RPC client.
 */
import { useCallback, useEffect, useState } from "react"
import { MarketShelf } from "./market/MarketShelf.tsx"
import type { MarketItem, MarketSource } from "./market/types.ts"
import type { SkillManagerApi } from "./api.ts"
import type { SkillListItem } from "../contracts.ts"
import type { SkillManagerLocaleKey } from "./locales.ts"

export interface SkillMarketSectionProps {
  readonly api: SkillManagerApi
  /** Localized translator for the marketplace chrome. Provided by the
      launcher-bound locale binding established in this plugin's apply. */
  readonly launcherT: (key: string, params?: Record<string, unknown>) => string
  /** Plugin-local translator for plugin-specific copy. */
  readonly t: (key: SkillManagerLocaleKey) => string
}

export function SkillMarketSection({
  api,
  launcherT,
  t,
}: SkillMarketSectionProps): JSX.Element {
  const [skills, setSkills] = useState<readonly SkillListItem[]>([])
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => {
    void api.list().then(setSkills).catch(() => undefined)
  }, [api])

  useEffect(() => {
    reload()
  }, [reload, version])

  const isInstalled = useCallback((item: MarketItem) => {
    return skills.some((skill) => skill.name === item.id)
  }, [skills])

  const handleInstall = useCallback(async (item: MarketItem, _source: MarketSource) => {
    const payload = item.payload ?? {}
    const url = typeof payload["url"] === "string" ? payload["url"] : null
    if (url === null) {
      throw new Error(t("importTitle") + ": missing url")
    }
    const destination = payload["destination"] === "user-agents" ? "user-agents" : "user-dsh"
    await api.importSkill({ kind: "url", url }, destination)
    setVersion((value) => value + 1)
  }, [api, t])

  const handleRemove = useCallback(async (item: MarketItem, _source: MarketSource) => {
    const payload = item.payload ?? {}
    const path = typeof payload["path"] === "string" ? payload["path"] : null
    if (path === null) {
      throw new Error("remove: missing path")
    }
    await api.deleteSkill(path)
    setVersion((value) => value + 1)
  }, [api])

  return (
    <MarketShelf
      storage={window.localStorage}
      defaultSources={[]}
      kinds={["skill"]}
      translate={launcherT}
      onInstall={handleInstall}
      onRemove={handleRemove}
      isInstalled={isInstalled}
    />
  )
}