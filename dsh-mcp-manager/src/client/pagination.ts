/**
 * Progressive ("batched") list rendering, shared by every long list in the
 * plugin — the market rows / card grid and the installed rows / cards.
 *
 * Huge catalogs never mount thousands of DOM nodes at once: the first
 * PAGE_SIZE entries render immediately, then an IntersectionObserver
 * sentinel below the list grows the visible window by one page as the user
 * approaches the end (the page itself scrolls — no inner scroll container,
 * so the observer watches the viewport with a 300px margin). A "加载更多 ·
 * 已显示 X/Y" button rides the same sentinel row as a click fallback.
 *
 * The pure `slicePage` is deliberately framework-free (unit-tested in
 * isolation); `useProgressiveReveal` wires it to React state.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/** First-batch size for every progressively rendered list. */
export const PAGE_SIZE = 60;

/**
 * Pure "first N of a list" slice used by all four list views. Clamps
 * negative counts to an empty page and returns the input reference itself
 * when the whole list already fits, so stable lists keep their identity
 * and React can skip reconciling children.
 */
export function slicePage<T>(list: readonly T[], count: number): readonly T[] {
  if (count <= 0) return [];
  if (count >= list.length) return list;
  return list.slice(0, count);
}

/** What a progressively rendered list needs from {@link useProgressiveReveal}. */
export interface ProgressiveReveal {
  /** How many entries should render right now (starts at PAGE_SIZE). */
  readonly visibleCount: number;
  /** True while more entries are held back. */
  readonly hasMore: boolean;
  /** Attach to the sentinel row rendered below the list. */
  readonly sentinelRef: RefObject<HTMLDivElement>;
  /** Grow by one page (the 加载更多 button's click handler). */
  readonly showMore: () => void;
}

/**
 * Batched-reveal state for one list of `total` entries. `resetKey` carries
 * whatever should rewind the window to the first page — search query,
 * active source, view toggle. It must be a primitive (string / number)
 * built by the caller; an object recreated per render would reset on every
 * re-render. Switching panes unmounts the list, which resets naturally.
 */
export function useProgressiveReveal(
  total: number,
  resetKey: string | number,
): ProgressiveReveal {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [resetKey]);
  const hasMore = visibleCount < total;

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (node === null || !hasMore || typeof IntersectionObserver !== "function") {
      return;
    }
    // root: null (viewport) — the list itself is not a scroll container;
    // rootMargin grows the trigger zone just above the fold.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, visibleCount, total, sentinelRef]);

  const showMore = useCallback(() => {
    setVisibleCount((count) => count + PAGE_SIZE);
  }, []);

  return { visibleCount, hasMore, sentinelRef, showMore };
}
