import type { DomSync } from "./dom-sync.ts";

const PANEL_SELECTOR = '[role="dialog"][class*="_panel"]';
const TOPBAR_CLASS = "dsh-layout-settings-topbar";
const TABS_CLASS = "dsh-layout-settings-tabs";
const CLOSE_CLASS = "dsh-layout-settings-close";
const CONTENT_CLASS = "dsh-layout-settings-content";

/**
 * On phones, restructure DSH's settings panel into a clean topbar layout: a
 * 52px row holding the section nav (flex:1, horizontal scroll) plus the
 * native close button (fixed 52px), with the scrollable content below.
 *
 * Idempotent — the panel is destroyed on close, so no teardown is needed;
 * the class names simply degrade back to DSH-native when the desktop layout
 * (or a future DSH version) ignores them.
 */
export class SettingsTopbarRuntime {
  private unregister: (() => void) | undefined;

  constructor(
    private readonly doc: Document,
    private readonly sync: DomSync,
  ) {}

  install(): () => void {
    this.unregister = this.sync.register({
      onFull: () => {
        this.restructure();
      },
      onStructural: (roots) => {
        for (const root of roots) {
          if (
            root.matches(PANEL_SELECTOR) ||
            root.querySelector(PANEL_SELECTOR) !== null
          ) {
            this.restructure();
            return;
          }
        }
      },
    });
    this.restructure();
    return () => {
      this.dispose();
    };
  }

  dispose(): void {
    this.unregister?.();
    this.unregister = undefined;
  }

  private restructure(): void {
    const view = this.doc.defaultView;
    if (view === null || view.matchMedia("(max-width: 767px)").matches !== true)
      return;
    const panel = this.doc.querySelector<HTMLElement>(PANEL_SELECTOR);
    if (
      panel === null ||
      panel.querySelector(`:scope > .${TOPBAR_CLASS}`) !== null
    )
      return;
    const nav = panel.querySelector<HTMLElement>(":scope > nav");
    const content = panel.querySelector<HTMLElement>(
      ':scope > [class*="_content"]',
    );
    const close = panel.querySelector<HTMLElement>('[class*="_close"]');
    if (nav === null || content === null || close === null) return;

    nav.classList.add(TABS_CLASS);
    close.classList.add(CLOSE_CLASS);
    content.classList.add(CONTENT_CLASS);

    const topbar = this.doc.createElement("div");
    topbar.className = TOPBAR_CLASS;
    topbar.append(nav, close);
    panel.prepend(topbar);

    // The header that used to hold the close button is now empty — collapse it.
    const header = content.querySelector<HTMLElement>(
      ':scope > [class*="_header"]',
    );
    if (header !== null) header.style.display = "none";
  }
}
