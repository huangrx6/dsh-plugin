export function installStyles(doc: Document): () => void {
  const CSS = `
.dsh-tp-root { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.dsh-tp-title { margin: 0; font-size: 16px; font-weight: 600; }
.dsh-tp-intro { margin: 0; color: var(--dsw-alias-label-tertiary, #999); font-size: 12.5px; }
.dsh-tp-empty { color: var(--dsw-alias-label-tertiary, #999); font-size: 13px; }
/* 横向滚动 tab 条：tab 文本永不换行，容器横滚（PC 与手机一致）。 */
/* 横向滚动 tab 条：外层给一个分组边框 + 圆角，让 tab 区域边界清晰。
   底色用最浅的交互层，边框用当前主题的弱分隔线（变量优先，无则回退），
   与设置页其他卡片的视觉语言一致。 */
.dsh-tp-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 6px;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-border-strong, #888) 28%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #fff) 45%, transparent);
}
.dsh-tp-tabs::-webkit-scrollbar { height: 3px; }
.dsh-tp-tabs::-webkit-scrollbar-thumb { border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-label-tertiary) 35%, transparent); }
.dsh-tp-tab { flex: none; white-space: nowrap; padding: 6px 14px; border-radius: 999px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary, #888); font-size: 13px; cursor: pointer; }
.dsh-tp-tab:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); }
.dsh-tp-tab--active { background: color-mix(in srgb, var(--dsw-alias-interactive-bg-selected, rgba(59,110,245,.16)) 100%, transparent); color: var(--dsw-alias-label-primary, inherit); border-color: color-mix(in srgb, #3b6ef5 55%, transparent); }
.dsh-tp-panel { min-width: 0; }
.dsh-tp-panel--hidden { display: none; }
`
  const style = doc.createElement('style')
  style.dataset.plugin = 'dsh-third-party'
  style.textContent = CSS
  doc.head.append(style)
  return () => {
    style.remove()
  }
}
