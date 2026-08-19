/**
 * Workspace section for the dsh-skill-manager plugin: one segmented
 * control, two modes.
 *
 *   - "Installed" — the full-width skill catalog from
 *     SkillManagerSection: toolbar + list⇄cards views (persisted under
 *     their own storage key), "详情" opens the file tree / preview /
 *     metadata in a modal, delete stays on rows for managed copies.
 *   - "Market" — the upgraded MarketShelf (multi-source toolbar with
 *     edit/delete per source, list⇄cards views, install / update /
 *     remove wired to this plugin's RPC client).
 *
 * The launcher workspace reads us through the
 * `dsh-launcher.workspace.section` slot key; mounting happens via the
 * slot registration in client/index.ts.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import { MarketShelf, type MarketplaceLocaleKey } from "./market/MarketShelf.tsx"
import type { MarketItem, MarketSource } from "./market/types.ts"
import type { SkillManagerApi } from "./api.ts"
import type { SkillListItem } from "../contracts.ts"
import { zhCN, type SkillManagerLocaleKey } from "./locales.ts"
import { isUpdateAvailable } from "./market/update.ts"
import { MarketItemDetailModal } from "./MarketItemDetailModal.tsx"
import { SkillManagerSection } from "./SkillManagerSection.tsx"

const MODE_STORAGE_KEY = "dsh-skill-manager.market.mode.v1"

export type SkillMarketMode = "installed" | "market"

function loadMode(storage: Storage): SkillMarketMode {
  try {
    return storage.getItem(MODE_STORAGE_KEY) === "market" ? "market" : "installed"
  } catch {
    return "installed"
  }
}

function saveMode(storage: Storage, mode: SkillMarketMode): void {
  try {
    storage.setItem(MODE_STORAGE_KEY, mode)
  } catch {
    // Storage unavailable (private mode): the choice stays session-only.
  }
}

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
  const [mode, setMode] = useState<SkillMarketMode>(() =>
    typeof window === "undefined" ? "installed" : loadMode(window.localStorage),
  )
  const [skills, setSkills] = useState<readonly SkillListItem[]>([])
  const [version, setVersion] = useState(0)
  const [detail, setDetail] = useState<
    { readonly item: MarketItem; readonly source: MarketSource } | undefined
  >(undefined)

  const reload = useCallback(() => {
    void api.list().then(setSkills).catch(() => undefined)
  }, [api])

  useEffect(() => {
    reload()
  }, [reload, version])

  const skillByName = useMemo(() => {
    const map = new Map<string, SkillListItem>()
    for (const skill of skills) {
      if (!map.has(skill.name)) map.set(skill.name, skill)
    }
    return map
  }, [skills])

  const isInstalled = useCallback((item: MarketItem) => {
    return skillByName.has(item.id)
  }, [skillByName])

  const installedVersion = useCallback(
    (item: MarketItem): string | undefined => skillByName.get(item.id)?.version,
    [skillByName],
  )

  const handleInstall = useCallback(async (item: MarketItem, _source: MarketSource) => {
    const payload = item.payload ?? {}
    const url = typeof payload["url"] === "string" ? payload["url"] : null
    if (url === null) {
      throw new Error(t("importTitle") + ": missing url")
    }
    // Update path: the skill already exists locally — reinstall over it,
    // keeping the layer it currently lives on.
    const installed = skillByName.get(item.id)
    if (installed !== undefined) {
      const destination = installed.source === "user-agents" ? "user-agents" : "user-dsh"
      await api.importSkill({ kind: "url", url }, destination, { overwrite: true })
    } else {
      const destination = payload["destination"] === "user-agents" ? "user-agents" : "user-dsh"
      await api.importSkill({ kind: "url", url }, destination)
    }
    setVersion((value) => value + 1)
  }, [api, t, skillByName])

  const handleRemove = useCallback(async (item: MarketItem, _source: MarketSource) => {
    const payload = item.payload ?? {}
    const path = typeof payload["path"] === "string" ? payload["path"] : null
    if (path === null) {
      // Fall back to the installed copy's own path (managed skills have one).
      const installed = skillByName.get(item.id)
      if (installed?.path === undefined) throw new Error("remove: missing path")
      await api.deleteSkill(installed.path)
      setVersion((value) => value + 1)
      return
    }
    await api.deleteSkill(path)
    setVersion((value) => value + 1)
  }, [api, skillByName])

  // row / card "详情" target: the market item detail modal re-resolves
  // its install state on every render so it tracks installs live
  const detailInstalled = detail === undefined ? false : isInstalled(detail.item)
  const detailUpdatable =
    detail === undefined
      ? false
      : detailInstalled && isUpdateAvailable(detail.item.version, installedVersion(detail.item))

  // Market chrome copy lives in this plugin's dictionary; the launcher's
  // seat stays as a fallback for keys we have not (yet) localized.
  const marketTranslate = useCallback(
    (key: MarketplaceLocaleKey, params?: Record<string, unknown>): string => {
      if (Object.prototype.hasOwnProperty.call(zhCN, key)) {
        return (t as unknown as (k: string, p?: Record<string, unknown>) => string)(key, params)
      }
      return launcherT(key, params)
    },
    [t, launcherT],
  )

  const pickMode = useCallback((next: SkillMarketMode) => {
    setMode(next)
    if (typeof window !== "undefined") saveMode(window.localStorage, next)
  }, [])

  return (
    <div className="dshm-tab dshm-ws">
      <div className="dshm-wsHead">
        <div className="dshm-seg" role="tablist" aria-label={t("marketTab")}>
          <button
            type="button"
            aria-pressed={mode === "installed"}
            role="tab"
            aria-selected={mode === "installed"}
            onClick={() => { pickMode("installed") }}
          >
            {t("installedTab")}
          </button>
          <button
            type="button"
            aria-pressed={mode === "market"}
            role="tab"
            aria-selected={mode === "market"}
            onClick={() => { pickMode("market") }}
          >
            {t("marketTab")}
          </button>
        </div>
      </div>
      {mode === "installed"
        ? <SkillManagerSection t={t} api={api} />
        : (
          <>
            <MarketShelf
              storage={window.localStorage}
              defaultSources={[]}
              kinds={["skill"]}
              translate={marketTranslate}
              onInstall={handleInstall}
              onRemove={handleRemove}
              isInstalled={isInstalled}
              installedVersion={installedVersion}
              onItemOpen={(item, source) => { setDetail({ item, source }) }}
            />
            {detail === undefined ? null : (
              <MarketItemDetailModal
                t={t}
                item={detail.item}
                source={detail.source}
                installed={detailInstalled}
                updatable={detailUpdatable}
                onInstall={handleInstall}
                onClose={() => { setDetail(undefined) }}
              />
            )}
          </>
        )}
    </div>
  )
}
