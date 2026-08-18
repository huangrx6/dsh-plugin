/**
 * Skill marketplace entry. The launcher workspace reads our
 * `SkillMarketSection` from this module's slot registration so a launcher
 * install without dsh-skill-manager falls back to the launcher's
 * placeholder; this file re-exports the component + the slot key the
 * plugin contributes to.
 *
 * The market UI source lives inside this plugin (vendored — see the
 * vendored copy under `market/`). The slot key is a stable string
 * declared locally so the plugin stays independent of dsh-launcher.
 */

/** Slot key the launcher workspace reads for workspace sections. Stable
    string; declared in both dsh-launcher (slot owner) and each
    contributing plugin (slot registrant) so the contract has no compile-
    time dependency on the other side. */
export const WORKSPACE_SECTION_SLOT = "dsh-launcher.workspace.section"

export { SkillMarketSection } from "./SkillMarketSection.tsx"
export type { SkillMarketSectionProps } from "./SkillMarketSection.tsx"