# DSH Layout

`dsh-layout` is the single owner for layout, materials, background and composer choices in the DeepSeek Harness Web UI. Every setting defaults to the untouched native DSH interface; each one applies immediately and independently, and turning it off restores native exactly.

## Design

- **Four-layer material architecture (macOS-style).** A fixed L0 background canvas (color / image / looping video), L1 frosted surfaces (sidebar, header, content column, footer strip — the only layers allowed to `backdrop-filter`), L2 translucent fills (composer card, dock strips), and opaque L3 popovers (stats panel). Avoids glass-on-glass per Apple HIG and keeps blur cost to at most four full-height layers.
- **Parameters, not presets.** Each frosted area exposes tier quick-picks (清透 / 标准 / 厚实) plus sliders for opacity (40–100%), blur (0–48px) and saturation (100–200%), with a theme-adaptive tint (`light-dark`) or a custom color. No built-in style presets that overwrite manual tuning.
- **Settings push, stylesheet stays static.** The store renders every visual choice onto `<html>` as data switches plus CSS custom properties (`--dsh-glass-<area>`, radius, reading width, density, scale); removing a setting removes its variables, and the stylesheet degrades to native on its own.
- **Escape hatches.** A fluid mode drops every blur for low-end GPUs and remote desktops; `prefers-reduced-transparency` and browsers without `backdrop-filter` fall back to the solid tint; a hold-to-compare button previews the native interface without persisting anything.
- Uses the official `conversation.input.right` and `conversation.composer.dock` slots; keeps the native textarea, permissions, model selector, attachments and send behavior untouched; suppresses the native stats line only while a plugin stats mode is active.
- Locates integration points through stable DSH landmarks (`data-slot` anchors, `data-conversation-scroll`, `data-composer-card`, …) plus reversible plugin-owned markers — never generated CSS-module class names.
- Widths ride the native custom properties (`--dsh-chat-content-width`, `--dsh-composer-card-max-width`), so the reading width slider, the full-width footer and the dock strips always agree. Message density overrides the native column gap through the scroller-child ancestor of a turn slot.
- Statistics: native / in-composer icon / in-composer brief readout / full row below the composer, with per-metric visibility.
- Profile persistence: the canonical live configuration is written by the host to `~/.dsh/dsh-layout.json` (v2 schema; the old preset-era shape is migrated once on load), so browser storage resets do not remove it. Named snapshots (方案) and JSON import/export live in the settings page.

Settings are available under **Settings → 页面布局**, organized as 全局（圆角 / 背景 / 流畅模式）→ 侧边栏 → 内容区头部 → 对话内容区（材质 / 阅读宽度 / 消息间距 / 内容缩放 / 滚动条）→ 底部输入区（材质 / 宽度 / 统计信息）→ 配置与方案.

## Development

```bash
pnpm install
pnpm run check
```

Link the package into a DSH profile:

```bash
pnpm --dir /path/to/dsh-profile install
```
