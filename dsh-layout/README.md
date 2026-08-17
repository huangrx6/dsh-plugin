# DSH Layout

`dsh-layout` owns the page material and a handful of conversation-level layout choices in the DeepSeek Harness Web UI. Every setting defaults to the untouched native DSH interface, and each setting changes only its own concern — turning it off restores native exactly.

## Design

- **One setting, one concern.** 全宽 and 收笔 are geometry-only (width / scroll extent — the composer keeps every native surface); 材质 is the only thing that paints; 气泡 / 轨迹 / 统计 each scope to their own surfaces. Nothing bundles unrelated styles.
- **One material for the whole page.** A single frosted sheet family covers the sidebar and content columns, painted on `::before` layers (no host ever carries a `backdrop-filter`, which would break DSH's in-sidebar dialogs). Grade cards (宣纸 / 蝉翼 / 烟岚 / 琉璃) are named presets over the three numbers — opacity, blur, saturation — and the sliders remain the source of truth. `prefers-reduced-transparency` and browsers without `backdrop-filter` fall back to the solid tint.
- **Settings push, stylesheet stays static.** The store renders every choice onto `<html>` as data switches plus CSS custom properties; removing a setting removes its variables, and the stylesheet degrades to native on its own.
- **收笔 (对话止于输入区上方).** The composer seat pins to the conversation root and the scroller's bottom margin tracks its live height, so the log physically ends above the input. The scroll-to-bottom button keeps its native on-screen spot (its sticky slot re-anchors to the native 16px gap).
- Uses the official `conversation.input.right` and `conversation.composer.dock` slots; keeps the native textarea, permissions, model selector, attachments and send behavior untouched; suppresses the native stats line only while a plugin stats mode is active.
- Locates integration points through stable DSH landmarks (`data-slot` anchors, `data-conversation-scroll`, `data-composer-card`, …) plus reversible plugin-owned markers — never generated CSS-module class names.
- Widths ride the native custom properties (`--dsh-chat-content-width`, `--dsh-composer-card-max-width`), so the reading width and the composer card always agree.
- Statistics: native / in-composer icon / in-composer brief readout / full row below the composer, with per-metric visibility.
- Persistence: the canonical live configuration is written by the host to `~/.dsh/dsh-layout.json` (v3 schema; unknown older shapes collapse to defaults), so browser storage resets do not remove it.
- One MutationObserver (DomSync) batches every DOM pass into a single rAF flush, with a watchdog timeout so passes never stall in hidden webviews (frozen rAF).

Settings are available under **Settings → 页面布局**, organized as 全局（滚动条）→ 材质（磨砂 / 档位 / 不透明度 / 模糊 / 饱和度）→ 对话（阅读宽度 / 输入框行数 / 收笔 / 气泡 / 轨迹页 / 统计信息）.

## Development

```bash
pnpm install
pnpm run check
```

Link the package into a DSH profile:

```bash
pnpm --dir /path/to/dsh-profile install
```
