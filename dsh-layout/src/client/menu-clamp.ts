/**
 * Phone-only flyout clamp.
 *
 * The stock header flyouts (subagent `.h8S2Va_menu`, background tasks
 * `.QsffPG_menu`, model picker, stats popover) anchor position:absolute
 * under their trigger with a fixed 336px-ish width. On a 390px viewport a
 * right-half trigger pushes the menu past the right edge; a left anchor
 * with our CSS right-align override pushes it past the left edge. Pure CSS
 * cannot satisfy both, so this runtime nudges any visible flyout back
 * inside the viewport with a translateX — the same trick floating-ui does.
 *
 * Runs only below 768px; a MutationObserver wakes on DOM changes (menus
 * mount/unmount on open/close), clamps, and sleeps. No timers while idle.
 */

const FLYOUT_SELECTOR = "[class*='_menu'], [class*='_popover'], [role='menu']";

/** Clamp one element horizontally into the viewport (8px margins). */
function clampElement(el: HTMLElement): void {
  const vw = window.innerWidth;
  const prev = el.style.getPropertyValue("--dsh-menu-clamp");
  if (prev !== "") el.style.transform = prev;
  const rect = el.getBoundingClientRect();
  const overflowRight = rect.right - (vw - 8);
  const overflowLeft = 8 - rect.left;
  let shift = 0;
  if (overflowRight > 0) shift = -overflowRight;
  else if (overflowLeft > 0 && rect.left + shift < 8) shift = overflowLeft;
  const base = el.style.transform === "none" ? "" : el.style.transform;
  el.style.setProperty("--dsh-menu-clamp", base);
  if (shift !== 0) {
    el.style.transform = shift !== 0
      ? `${base} translateX(${Math.round(shift)}px)`.trim()
      : base;
  }
}

/** True when any flyout is currently mounted and visible. */
function visibleFlyouts(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(FLYOUT_SELECTOR)).filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

export function installMenuClamp(doc: Document): () => void {
  const media = window.matchMedia("(max-width: 767px)");
  let observer: MutationObserver | undefined;
  let raf = 0;

  const sweep = (): void => {
    raf = 0;
    for (const el of visibleFlyouts()) clampElement(el);
  };

  const wake = (): void => {
    if (raf !== 0) return;
    raf = window.requestAnimationFrame(sweep);
  };

  const start = (): void => {
    if (observer !== undefined) return;
    observer = new MutationObserver(wake);
    observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    wake();
  };

  const stop = (): void => {
    observer?.disconnect();
    observer = undefined;
    if (raf !== 0) window.cancelAnimationFrame(raf);
    raf = 0;
  };

  const onMedia = (): void => {
    if (media.matches) start();
    else stop();
  };
  onMedia();
  media.addEventListener("change", onMedia);
  window.addEventListener("resize", wake, { passive: true });

  return () => {
    media.removeEventListener("change", onMedia);
    window.removeEventListener("resize", wake);
    stop();
  };
}
