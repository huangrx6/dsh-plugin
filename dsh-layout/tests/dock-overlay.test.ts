import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "../src/client/styles.ts"), "utf8");

/** Extracts one full CSS rule (selector + block) for exact-shape locks. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`(?<=^|})\\s*${escaped.replace(/\s+/g, "\\s+")}\\s*\\{[^}]*\\}`, "m"))?.[0] ?? "";
}

describe("one setting, one concern — stylesheet regression locks", () => {
  it("one material owns the page: two sheets, solid fallbacks, no fluid switch", () => {
    expect(rule("html[data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col]::before,\nhtml[data-dsh-layout-material='on'] [data-dsh-layout-center-col]::before")).not.toBe("");
    expect(rule("html[data-dsh-layout-material='on'] [data-dsh-layout-sidebar-col]::before,\nhtml[data-dsh-layout-material='on'] [data-dsh-layout-center-col]::before")).toContain("backdrop-filter: blur(var(--dsh-layout-mat-blur, 16px))");
    expect(css).toContain("@media (prefers-reduced-transparency: reduce)");
    expect(css).toContain("@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))");
    expect(css).not.toContain("data-dsh-layout-fluid");
    // #root is lifted so the negative-z sheets never fall behind the canvas.
    expect(css).toContain("html[data-dsh-layout-material='on'] #root { position: relative; z-index: 1; }");
  });

  it("full width is geometry only — the composer keeps its native surfaces", () => {
    const workbench = rule("[data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero]))[data-dsh-layout-composer-width='full'] [data-dsh-layout-workbench]:not([data-dsh-layout-hero])");
    expect(workbench).toContain("padding-left: var(--dsh-layout-pad-composer-start, 28px)");
    expect(workbench).toContain("padding-right: var(--dsh-layout-pad-composer-end, 28px)");
    expect(workbench).not.toMatch(/border|background|box-shadow|border-radius/);
    // No card/chip/dock restyle rides on width, material, or anything else.
    // (The radius whitelist's :where() list may name native surfaces.)
    expect(css).not.toContain("data-dsh-layout-visual");
    expect(css).not.toMatch(/\[data-dsh-layout-composer-card\]\s*\{[^}]*border/);
    expect(css).not.toMatch(/\[data-queue-dock\][^{]*\{[^}]*background/);
    expect(css).not.toMatch(/_bubble'\][^{]*border-radius/);
  });

  it("full-width composer spans the scrollbar gutter to match the header edge", () => {
    expect(css).toContain(
      "html:not([data-dsh-layout-scroll-end='above']) [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero]))[data-dsh-layout-composer-width='full'] [data-composer-seat]",
    );
    expect(css).toContain("width: calc(100% + var(--dsh-layout-scroll-gutter, 0px))");
    expect(css).toContain("--dsh-composer-card-max-width: none");
  });

  it("keeps the hero card on the native measure", () => {
    expect(css).toContain(
      "html[data-dsh-layout-read-width='full'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])) { --dsh-chat-content-width: none; }",
    );
  });

  it("收笔 pins the seat and bounds the scroller — nothing else changes", () => {
    const seat = rule("html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])):not(:has([data-conversation-composer-overlay])) [data-composer-seat]");
    expect(seat).toContain("position: absolute !important");
    expect(seat).not.toMatch(/border|background|box-shadow|border-radius|padding/);
    // The pinned seat spans the root INCLUDING the classic-scrollbar gutter;
    // native reading width re-anchors its right edge so the centered card
    // keeps the column's axis (full width stays flush with the header).
    expect(css).toContain("html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])):not(:has([data-conversation-composer-overlay])):not([data-dsh-layout-composer-width='full']) [data-composer-seat]");
    expect(css).toContain("right: var(--dsh-layout-scroll-gutter, 0px) !important;");
    expect(css).toContain("margin-bottom: var(--dsh-layout-seat-height, 0px);");
    expect(css).toContain("padding-bottom: var(--dsh-layout-seat-height, 0px);");
    // The floating scroll-to-bottom button keeps its native on-screen spot:
    // DSH anchors its sticky slot at composer-height + 16px from the
    // scrollport bottom, so the bounded scroller re-anchors it to 16px.
    expect(css).toContain("html[data-dsh-layout-scroll-end='above'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]:not([data-dsh-layout-hero])):not(:has([data-conversation-composer-overlay])) [data-conversation-scroll] [class*='_toBottomSlot']");
    expect(css).toContain("bottom: 16px !important;");
    expect(css).not.toMatch(/_scrollBottom|_jumpToBottom/);
  });

  it("input rows only set the textarea min-height", () => {
    const rows = rule("html[data-dsh-layout-input-rows] [data-dsh-layout-composer-text],\nhtml[data-dsh-layout-input-rows] [data-dsh-layout-composer-card] [data-input-mirror]");
    expect(rows).toContain("min-height: calc(var(--dsh-layout-input-rows, 3) * 24px)");
    expect(rows).not.toMatch(/border|background|box-shadow|border-radius|padding/);
  });

  it("hides scrollbars only behind the explicit setting and in scoped surfaces", () => {
    expect(css).not.toMatch(/scrollbar-width:\s*none(?!.*!important)/);
    const scoped = css.match(/html\[data-dsh-layout-scrollbar='hidden'\][^{]*\{/g) ?? [];
    for (const selector of scoped) {
      expect(selector).toMatch(/\[data-conversation-scroll\]|\[data-dsh-layout-scroll-root\]|\[data-dsh-layout-sidebar-list\]/);
    }
  });

  it("keeps the mobile composer two-row fix on the adapter marks", () => {
    expect(css).toMatch(/\[data-dsh-layout-composer-actions\]\s*\{[^}]*grid-template-rows:\s*auto auto/s);
    expect(css).toContain("[data-dsh-layout-composer-tools]");
    expect(css).toContain("[data-dsh-layout-composer-trailing]");
  });

  it("ships no rules for deleted settings", () => {
    for (const gone of [
      "data-dsh-layout-density", "data-dsh-layout-scale", "data-dsh-layout-quality",
      "data-dsh-layout-sidebar-width", "data-dsh-layout-align",
      "data-dsh-layout-footer-plate", "dsh-layout-search",
      "dsh-layout-presets", "dsh-layout-profile",
      "dsh-layout-settings__peek",
    ]) {
      expect(css).not.toContain(gone);
    }
  });


  it("phones: the context-usage panel keeps its anchored size; the hero keeps native geometry", () => {
    // The context meter panel is role=dialog + _panel (no nav, and no runtime
    // topbar) — the settings fullscreen collapse stays scoped to the settings
    // dialog. The phone topbar runtime moves the nav out of direct childhood,
    // so both markers must be accepted.
    expect(css).toContain("[role='dialog'][class*='_panel']:has(> nav, > .dsh-layout-settings-topbar) {");
    expect(css).not.toMatch(/\[role='dialog'\]\[class\*='_panel'\]\s*\{[^}]*100vw/);
    // A marked hero (phone grid re-layout) must not receive 收笔/全宽 geometry:
    // pinning its seat drags the welcome card to the bottom.
    expect(css).toContain(":has([data-dsh-layout-workbench]:not([data-dsh-layout-hero]))");
    expect(css).not.toContain(":has([data-dsh-layout-workbench])");
  });

  it("global blocks stay self-contained: background canvas, radius whitelist, dialog size, padding tokens", () => {
    expect(css).toContain("html[data-dsh-layout-bg] #root { position: relative; z-index: 1; }");
    expect(css).toContain("html[data-dsh-layout-radius]");
    expect(css).toContain("html[data-dsh-layout-dialog] [role='dialog']");
    expect(css).toContain("--dsh-layout-pad-header-start: 0px;");
    expect(css).toContain("--dsh-layout-pad-content-start: 8px;");
    expect(css).toContain("html[data-dsh-layout-read-width='full'] [data-dsh-layout-chrome-header]");
  });
});
