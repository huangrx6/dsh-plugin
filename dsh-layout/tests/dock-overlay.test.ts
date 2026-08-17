import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "../src/client/styles.ts"), "utf8");

describe("dock overlay regression locks", () => {
  it("gates material blurs behind the fluid switch and ships solid fallbacks", () => {
    // L1 materials are the only layers allowed to blur; 'fluid' removes them all,
    // and reduced transparency / missing support fall back to the solid tint.
    expect(css).toContain(":not([data-dsh-layout-fluid])");
    expect(css).toContain("@media (prefers-reduced-transparency: reduce)");
    expect(css).toContain("@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))");
    expect(css.match(/backdrop-filter: blur\(var\(--dsh-glass/g)?.length).toBeGreaterThan(0);
  });

  it("rides the native width variables instead of pixel rules", () => {
    expect(css).toContain("[data-dsh-layout-chat-root]:has([data-dsh-layout-workbench])[data-dsh-layout-composer-width='full']");
    expect(css).toContain("--dsh-composer-card-max-width: none");
    expect(css).toContain("html[data-dsh-layout-read-width='custom'] [data-dsh-layout-chat-root] { --dsh-chat-content-width: var(--dsh-layout-read-width); }");
    expect(css).toContain("html[data-dsh-layout-density] [data-dsh-layout-chat-column] { gap: var(--dsh-layout-density) !important; }");
  });

  it("full-width composer spans the scrollbar gutter to match the header edge", () => {
    // The sticky seat fills the scroller's client area only; the measured
    // classic-scrollbar gutter (0 with overlay scrollbars) must be added back
    // or the card stops short of the header's right edge.
    expect(css).toContain(
      "[data-dsh-layout-composer-width='full'] [data-composer-seat]",
    );
    expect(css).toContain(
      "width: calc(100% + var(--dsh-layout-scroll-gutter, 0px))",
    );
  });

  it("consumes the padding tokens on every full-width inset surface", () => {
    // One token pipeline feeds header, message column, trace canvas, and the
    // composer: desktop full presets (20/28, 28/28, 28/28), a mobile preset
    // (0/8, 8/8, 8/8), and explicit user values as inline vars. Native width
    // mode defines no tokens at all — zero intrusion.
    const workbench =
      css.match(
        /\[data-dsh-layout-composer-width='full'\] \[data-dsh-layout-workbench\] \{[^}]*\}/,
      )?.[0] ?? "";
    expect(workbench).toContain("var(--dsh-layout-pad-composer-start, 28px)");
    expect(workbench).toContain("var(--dsh-layout-pad-composer-end, 28px)");
    const scroll =
      css.match(
        /html\[data-dsh-layout-read-width='full'\] \[data-dsh-layout-chat-column\]\[class\*='_scroll'\] \{[^}]*\}/,
      )?.[0] ?? "";
    expect(scroll).toContain("var(--dsh-layout-pad-content-start, 28px)");
    const header =
      css.match(
        /html\[data-dsh-layout-read-width='full'\] \[data-dsh-layout-chrome-header\] \{[^}]*\}/,
      )?.[0] ?? "";
    expect(header).toContain("padding-inline-start: calc(var(--dsh-layout-pad-header-start, 20px)");
    expect(css).toContain("--dsh-layout-pad-header-start: 0px;");
    expect(css).toContain("--dsh-layout-pad-content-start: 8px;");
    expect(css).toContain("--dsh-layout-pad-composer-start: 8px;");
  });

  it("keeps the hero card on the native measure", () => {
    // 'none' would poison the hero card's calc(none + 32px) and collapse
    // the welcome card to content width — the full measure is scoped to the
    // marked (non-hero) workbench.
    expect(css).toContain(
      "html[data-dsh-layout-read-width='full'] [data-dsh-layout-chat-root]:has([data-dsh-layout-workbench]) { --dsh-chat-content-width: none; }",
    );
  });

  it("the input card is one opaque panel in every mode — no frost, no bands", () => {
    // Glass over glass always reads as a color step ("差一档"), so the card
    // never frosts and never blends: one opaque working surface, defined by
    // a hairline and a whisper of upward-only shadow.
    expect(css).not.toMatch(/composer-card\]::before/);
    expect(css).not.toMatch(/\[data-dsh-layout-workbench\]::(before|after)/);
    const card =
      css.match(
        /\[data-dsh-layout-workbench\] \[data-dsh-layout-composer-card\] \{[^}]*\}/,
      )?.[0] ?? "";
    expect(card).toContain(
      "background: var(--dsh-glass-content-solid, var(--dsh-layout-solid, #fff)) !important",
    );
    expect(card).toContain("0 -1px 2px");
    expect(card).toContain("0 -6px 18px");
    expect(card).toMatch(/border: 1px solid/);
    expect(css).not.toMatch(
      /\[data-dsh-layout-workbench\][^{]*\{[^}]*border-top/,
    );
  });

  it("keeps 12px between the card and the below-row stats", () => {
    expect(css).toContain(".dsh-layout-root--dock { margin-top: 12px !important; }");
  });

  it("hardens the settings dialog against focus-driven panel scrolling", () => {
    // overflow:hidden still is a scroll container; when a toggle re-renders
    // the page taller, focus scrolling displaces the whole dialog content
    // above the panel. clip is not scrollable, so the real scroller handles it.
    expect(css).toContain("[role='dialog'] { overflow: clip !important; }");
  });

  it("keeps an empty input dock boxless so it does not consume workbench gap", () => {
    expect(css).toContain(
      "[data-dsh-layout-dock] { display: contents !important; }",
    );
    expect(css).toContain(
      "[data-dsh-layout-dock]:has(> *) { display: block !important; }",
    );
  });

  it("queue dock renders as a single-surface card aligned with the composer", () => {
    const queueDock =
      css.match(
        /^\[data-dsh-layout-workbench\] \[data-queue-dock\],[^{]*\{[^}]*\}/m,
      )?.[0] ?? "";
    expect(queueDock).toContain(
      "max-width: var(--dsh-composer-card-max-width) !important",
    );
    expect(queueDock).toContain("margin-inline: auto !important");
    expect(queueDock).toContain("border-radius: var(--dsh-layout-radius) !important");
    // One opaque panel like the input card: hairline, token radius, upward
    // whisper — never a frosted or stacked strip.
    expect(queueDock).toContain(
      "background: var(--dsh-glass-content-solid, var(--dsh-layout-solid, #fff)) !important",
    );
    expect(queueDock).toMatch(/border: 1px solid/);
    expect(queueDock).toContain("0 -6px 18px");
  });

  it("frameless surfaces, 30% row separators only", () => {
    expect(css).toContain("content: none !important");
    expect(css).toContain("var(--dsh-layout-line) 30%, transparent");
  });

  it("queue list scrollbar is hidden", () => {
    const list =
      css.match(/\[data-queue-dock\] ul\[class\*='_list'\] \{[^}]*\}/)?.[0] ??
      "";
    expect(list).toContain("scrollbar-width: none");
  });

  it("row geometry: auto height, inner-inset padding, token radius", () => {
    const row = css.match(/li\[class\*='_row'\] \{[^}]*\}/)?.[0] ?? "";
    expect(row).toContain("height: auto !important");
    expect(row).toContain("var(--dsh-layout-inner-inset)");
    expect(row).toContain("var(--dsh-layout-radius)");
  });

  it("action buttons carry hover feedback", () => {
    expect(css).toMatch(/button\[class\*='_action'\]:not\(:disabled\):hover/);
  });

  it("toolbar chips share the card's family — no opaque whites or blacks", () => {
    // Every composer button except the primary send keeps one subtle
    // translucent fill mixed from the shared token, so nothing paints its
    // own solid white/black against the card in either theme.
    const chip =
      css.match(
        /\[data-dsh-layout-workbench\] \[data-dsh-layout-composer-actions\] button:not\(\[class\*='_primary'\]\),[^{]*\{[^}]*\}/,
      )?.[0] ?? "";
    expect(chip).toContain(
      "background: color-mix(in srgb, var(--dsh-layout-subtle) 55%, transparent) !important",
    );
    expect(chip).toContain("border-radius: var(--dsh-layout-radius) !important");
  });

  it("paints L1 materials on pseudo layers with a background, tints otherwise", () => {
    // With a page background, the material must live on a ::before layer:
    // a real ancestor with backdrop-filter becomes the containing block for
    // fixed-position descendants, and DSH renders its settings dialog inside
    // the sidebar column. Native background mode may only tint the host.
    const materialRules = css.match(/html\[data-dsh-layout-(sidebar|content)='glass'\][^{]*\{[^}]*\}/g) ?? [];
    for (const rule of materialRules) {
      if (rule.includes("::before") || rule.includes(":not([data-dsh-layout-bg])")) continue;
      expect(rule).not.toContain("backdrop-filter");
      // A stacking context on a column would cap the dialog's z-index:1000
      // below the composer stack's native z-index:1 — the input box would
      // paint over open dialogs.
      expect(rule).not.toContain("z-index");
      expect(rule).not.toContain("isolation");
    }
    expect(css.match(/html\[data-dsh-layout-bg\]\[data-dsh-layout-(sidebar|content)='glass'\][^{]*-col\]::before/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("keeps the header on the single content sheet — no second material layer", () => {
    // The content material spans header + conversation. A header ::before
    // would stack a second tint behind the header and the top strip would
    // no longer match the conversation area.
    expect(css).not.toMatch(/chrome-header[^{]*::before/);
    expect(css).not.toMatch(/chrome-header[^{]*\{[^}]*--dsh-glass-header/);
  });

  it("splits material paint modes on the page background", () => {
    // Native background: one OPAQUE base variable feeds the conversation and
    // the input area alike — translucency over a flat page only invites
    // #fff-vs-#fafafa mismatches. No filter and no clearing — nothing may
    // trap DSH's in-sidebar fixed dialogs or wipe the native backings the
    // translucent dialog panel sits on.
    expect(css).toContain("html[data-dsh-layout-sidebar='glass']:not([data-dsh-layout-bg]) [data-dsh-layout-sidebar-col] { background: var(--dsh-glass-sidebar-solid) !important; }");
    expect(css).toContain("html[data-dsh-layout-content='glass']:not([data-dsh-layout-bg]) [data-dsh-layout-chat-root] { background: var(--dsh-glass-content-solid) !important; }");
    // With a background: the full material on a z-index:-1 pseudo only
    // (two sheets: sidebar + the center column that spans header+conversation).
    expect(css).toContain("html[data-dsh-layout-bg] #root { position: relative; z-index: 1; }");
    expect(css.match(/html\[data-dsh-layout-bg\]\[data-dsh-layout-(sidebar|content)='glass'\][^{]*::before/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(css).toContain("mask-image: var(--dsh-layout-ring-mask) !important");
    expect(css).toContain("[data-composer-card]:has(textarea[readonly])::after");
  });

  it("bounds the scroll region or paints an opaque floor — per plate mode", () => {
    // solid: opaque floor under the sticky seat (text passes beneath it).
    const floor =
      css.match(
        /html\[data-dsh-layout-footer-plate='solid'\] \[data-dsh-layout-workbench\] \{[^}]*\}/,
      )?.[0] ?? "";
    expect(floor).toContain(
      "background: var(--dsh-glass-content-solid, var(--dsh-layout-solid, #fff)) !important",
    );
    // above: the seat is pulled out of the scroll flow (absolute against the
    // conversation root) and the scroller's bottom margin tracks its live
    // height — the log physically ends above the input, plate stays clear.
    const seat =
      css.match(
        /html\[data-dsh-layout-scroll-range='above'\] \[data-dsh-layout-chat-root\]:has\(\[data-dsh-layout-workbench\]\):not\(:has\(\[data-conversation-composer-overlay\]\)\) \[data-composer-seat\] \{[^}]*\}/,
      )?.[0] ?? "";
    expect(seat).toContain("position: absolute !important");
    expect(seat).toContain("bottom: 0 !important");
    const scroller =
      css.match(
        /html\[data-dsh-layout-scroll-range='above'\] \[data-dsh-layout-chat-root\]:has\(\[data-dsh-layout-workbench\]\):not\(:has\(\[data-conversation-composer-overlay\]\)\) \[data-conversation-scroll\] \{[^}]*\}/,
      )?.[0] ?? "";
    expect(scroller).toContain("margin-bottom: var(--dsh-layout-seat-height, 0px)");
    // Trace view keeps DSH's own seat positioning and reserves the canvas
    // tail with padding instead (a margin would float the seat mid-air).
    const trace =
      css.match(
        /html\[data-dsh-layout-scroll-range='above'\] \[data-dsh-layout-chat-root\]:has\(\[data-dsh-layout-workbench\]\):has\(\[data-conversation-composer-overlay\]\) \[data-conversation-scroll\] \{[^}]*\}/,
      )?.[0] ?? "";
    expect(trace).toContain("padding-bottom: var(--dsh-layout-seat-height, 0px)");
    // The sticky-mode width stretch must not apply to the absolute seat.
    expect(css).toMatch(
      /html:not\(\[data-dsh-layout-scroll-range='above'\]\).*\[data-composer-seat\]/,
    );
    // Hero posture keeps the native in-flow composer — the yank is scoped
    // to the marked (non-hero) workbench via :has().
    expect(seat).toContain(":has");
  });

  it("gives the full-width textarea a configurable line count", () => {
    const rows =
      css.match(
        /\[data-dsh-layout-composer-width='full'\] \[data-dsh-layout-composer-text\],[^{]*\{[^}]*\}/,
      )?.[0] ?? "";
    expect(rows).toContain("min-height: calc(var(--dsh-layout-input-rows, 3) * 24px)");
  });

  it("sizes the settings dialog behind two guarded sliders", () => {
    // Width keeps DSH's 100vw−48 cap via its own max-width; the height rides
    // min() so it can never exceed the viewport guard.
    const rule =
      css.match(/html\[data-dsh-layout-dialog\] \[role='dialog'\] \{[^}]*\}/)?.[0] ?? "";
    expect(rule).toContain("width: var(--dsh-layout-dialog-width, 800px) !important");
    expect(rule).toContain("height: min(var(--dsh-layout-dialog-height, 800px), calc(100vh - 48px)) !important");
  });

  it("frosts message bubbles on request — no blue, one hairline", () => {
    const bubble =
      css.match(
        /html\[data-dsh-layout-bubble='glass'\] \[data-dsh-layout-chat-column\] \[class\*='_bubble'\] \{[^}]*\}/,
      )?.[0] ?? "";
    expect(bubble).toContain(
      "background: color-mix(in srgb, var(--dsh-layout-glass-base) 55%, transparent) !important",
    );
    expect(bubble).toMatch(/border: 1px solid/);
    // The blur only exists with a page background and rides the content
    // material's own parameters.
    expect(css).toContain(
      "blur(var(--dsh-glass-content-blur, 16px)) saturate(var(--dsh-glass-content-sat, 120%))",
    );
  });

  it("sidebar layout tokens target stable adapters, not hashed classes", () => {
    expect(css).toContain("[data-dsh-layout-sidebar-root]");
    expect(css).toContain("[data-dsh-layout-sidebar-list]");
    expect(css).toContain("[data-dsh-layout-sidebar-pad-x]");
    expect(css).toContain("[data-dsh-layout-sidebar-row-height]");
    expect(css).toContain("[data-dsh-layout-sidebar-list] [role='treeitem']");
    expect(css).toContain("data-dsh-layout-sidebar-scrollbar='hidden'");
  });

  it("keeps native sidebar geometry when no overrides are present", () => {
    // No sidebar token is emitted in the native state; DSH owns its 280px
    // track, 12px root padding, and native row rhythm.
    expect(css).toContain("[data-dsh-layout-sidebar-width]");
    expect(css).toContain("[data-dsh-layout-sidebar-pad-x]");
  });

  it("hides the conversation scrollbar only behind the explicit setting", () => {
    const block = css.match(/html\[data-dsh-layout-scrollbar='hidden'\][^{]*\{[^}]*\}/)?.[0] ?? "";
    expect(block).toContain("scrollbar-width: none !important");
  });
});
