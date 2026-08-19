/**
 * Wire contract for the launcher workspace section metadata RPC.
 *
 * The host reads a JSON config at `$DSH_HOME/launcher-sections.json`
 * (falling back to built-in defaults) and exposes it to the client via
 * the `dsh-launcher-sections` RPC channel. The client uses the metadata
 * to drive the workspace menu ordering, grouping, and labels — replacing
 * the previous hardcoded DEFAULT_SECTIONS array.
 */
export const LAUNCHER_SECTIONS_CHANNEL = '/dsh-launcher-sections'

/** Localized text for one language. */
export interface LocalizedText {
  readonly name: string
  readonly desc: string
}

/** One entry in the launcher-sections config file. */
export interface SectionMetadataEntry {
  readonly menuGroup: string
  readonly menuPriority: number
  readonly zh: LocalizedText
  readonly en: LocalizedText
}

/** Metadata returned by the RPC — includes the resolved section id. */
export interface SectionMetadata extends SectionMetadataEntry {
  readonly id: string
}
