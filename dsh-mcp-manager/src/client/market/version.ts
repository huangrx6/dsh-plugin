/**
 * Version alignment between a market item and the locally installed server.
 *
 * The market manifest carries an optional `version` string per item; the
 * installed side only knows a version when a connection probe succeeded at
 * least once (the cached McpTestResponse.serverVersion). When either side
 * is missing we deliberately show nothing — a missing version must not
 * render a false "updatable" badge.
 *
 * Comparison is normalized string inequality: market sources are free-form
 * ("1.2.0", "v2", "2024.10"), so semver ordering would be wrong more often
 * than right. Any confirmed difference simply means "reinstall to refresh".
 */

/** Strip decorative bits: surrounding whitespace and a leading v/V. */
export function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, '').trim()
}

/**
 * True when both versions are known and differ after normalization.
 * Empty strings (after normalize) count as unknown.
 */
export function versionsDiffer(
  marketVersion: string | undefined,
  installedVersion: string | undefined,
): boolean {
  if (marketVersion === undefined || installedVersion === undefined) return false
  const market = normalizeVersion(marketVersion)
  const installed = normalizeVersion(installedVersion)
  if (market === '' || installed === '') return false
  return market !== installed
}
