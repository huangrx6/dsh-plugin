/**
 * Workspace entry. The launcher ships its workspace chrome as a separate
 * ModuleLoader bundle so other plugins can pull in the same styles,
 * section conventions, and the overlay root without depending on the full
 * launcher client bundle. dsh-skill-manager / dsh-mcp-manager can do
 *
 *   import { launchSkillMarketSection } from 'dsh-launcher/client/workspace'
 *   // inside their SlotMap contribution
 *   ctx.slots.inject('dsh-launcher.workspace.section', () => …)
 *
 * The workspace sub-bundle re-exports the same `WorkspaceOverlay` and
 * section helpers as the main client bundle, plus the marketplace slot
 * contract other plugins register against.
 */
export {
 WorkspaceOverlay,
 DEFAULT_SECTIONS,
 WORKSPACE_SECTION_SLOT,
} from "./WorkspaceOverlay.tsx";
export type {
 WorkspaceSection,
 SlotRegistryLike,
 SlotEntryView,
} from "./WorkspaceOverlay.tsx";
export { LauncherEvents, emit, on } from "./events.ts";
export type { LauncherEventName } from "./events.ts";
export { LAUNCHER_NS, enUS, zhCN } from "./locales.ts";
export type { LauncherLocaleKey } from "./locales.ts";
export { useLauncherLocale } from "./use-locale.ts";
export type { LauncherTranslate } from "./use-locale.ts";
