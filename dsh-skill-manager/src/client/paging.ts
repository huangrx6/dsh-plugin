/**
 * Progressive list paging. Long catalogs (market rows / cards, installed
 * rows / cards) never render in full — the first LIST_PAGE entries mount,
 * then an IntersectionObserver sentinel near the viewport bottom (with a
 * "load more" button fallback) grows the window one page at a time. The
 * lists stay in normal page flow (no max-height container): the page
 * itself scrolls, so the sentinel watches the viewport (root: null).
 */
export const LIST_PAGE = 60;

/**
 * Take the first `count` entries of `list` — the visible page window.
 * Counts that are not a finite positive number clamp to an empty window,
 * so a corrupted counter can never fall back to rendering the whole list.
 * Pure: never mutates the source, always returns a fresh array.
 */
export function slicePage<T>(list: readonly T[], count: number): T[] {
  if (!Number.isFinite(count) || count <= 0) return [];
  return list.slice(0, Math.floor(count));
}
