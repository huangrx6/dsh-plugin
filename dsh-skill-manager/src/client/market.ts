/**
 * Skill marketplace entry. The launcher workspace imports the
 * `SkillMarketSection` component from this module so a launcher install
 * without dsh-skill-manager falls back to the launcher's placeholder; here
 * we re-export the component and the slot key the plugin contributes to.
 *
 * The plugin's client apply also registers the section to the slot; this
 * file is the import surface for the section regardless of whether the
 * slot registration is active.
 */
export { SkillMarketSection } from "./SkillMarketSection.tsx";
export type { SkillMarketSectionProps } from "./SkillMarketSection.tsx";
export { WORKSPACE_SECTION_SLOT } from "dsh-launcher/client/workspace";
