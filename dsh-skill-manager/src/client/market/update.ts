/**
 * Market update detection. Pure comparison shared by the shelf's rows and
 * cards: an update is available only when BOTH sides carry a version and
 * the strings differ. A missing side (older skill without frontmatter
 * `version`, or a manifest entry without one) means "unknown" — the item
 * keeps its plain installed state instead of nagging with a false badge.
 */

/** True when the market item differs from the installed copy. */
export function isUpdateAvailable(
  marketVersion: string | undefined,
  installedVersion: string | undefined,
): boolean {
  if (marketVersion === undefined) return false;
  if (installedVersion === undefined) return false;
  return marketVersion.trim() !== installedVersion.trim();
}
