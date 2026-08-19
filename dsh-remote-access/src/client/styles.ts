/**
 * 远程访问面板样式（Quiet Structure —— macOS 设置页式分组行）。
 *
 * 全部选择器沿用 `ra-` 前缀（组件类名契约，勿改）。令牌读取走 DSH 的
 * `--dsw-alias-*` 阶梯以适配明暗主题，圆角经 dsh-layout 的
 * `--dsh-layout-radius-user[-lg]` 桥接；dsh-layout 磨砂材质开启时，
 * 文件末尾的材质联动段把分组切到半透明玻璃。
 *
 * 纪律：表面是平的 —— 分组 = 细边框 + 微底色，行 = 细分隔线；
 * hover 只提亮背景；动效只有 background/color 的 120ms 过渡，
 * 无 translateY / box-shadow / 渐变 / 发光。
 */
export function installStyles(doc: Document): () => void {
  const CSS = `
/* ─── Shell：两分组并排（弹性 + 320px），窄屏纵向 ─── */
.ra-panel { display: flex; flex-direction: column; gap: 14px; max-width: 740px; }
.ra-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 14px; align-items: start; }
@media (max-width: 767px) { .ra-grid { grid-template-columns: minmax(0, 1fr); } }

/* ─── Group container：macOS 设置分组（细边框 + 微底色，6px 内衬） ─── */
.ra-group {
  padding: 6px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
}
.ra-group-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 30px; padding: 4px 10px 2px 14px; }
.ra-section-label { font-size: 11px; font-weight: 500; letter-spacing: 0.05em; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ─── Rows：44px 行高、细分隔线（首行无）、hover 仅提亮 ─── */
.ra-row {
  display: flex; align-items: center; gap: 10px;
  min-height: 44px; padding: 8px 14px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  transition: background 120ms ease, color 120ms ease;
}
.ra-row + .ra-row { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.ra-row:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); }

/* 状态行：6px 圆点 + 名称（13px/600）+ 右侧启停 */
.ra-dot { flex: 0 0 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-label-tertiary, #8a8a8e); }
.ra-dot-success { background: var(--dsw-alias-state-success-primary, #4caf50); }
.ra-dot-business { background: var(--dsw-alias-state-business-primary, #ffb74d); }
.ra-dot-error { background: var(--dsw-alias-state-error-primary, #ef5350); }
.ra-row-title { flex: 1; min-width: 0; font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #f4f4f5); }

/* 地址行：等宽字体正文（12px secondary），超长省略（title 兜底全量） */
.ra-row-text { flex: 1; min-width: 0; font-size: 12px; color: var(--dsw-alias-label-secondary, #b3b3b8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ra-mono { font-family: var(--mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; }

/* meta 行：11px tertiary；picker 缺失用 business 色旁注 */
.ra-meta { flex: 1; min-width: 0; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-tertiary, #8a8a8e); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ra-meta-warn { flex: none; color: var(--dsw-alias-state-business-primary, #ffb74d); }

/* ─── Buttons：26px 高；主按钮 14% 底 + 24% 边框，次级 10% 边框 ─── */
.ra-btn {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  height: 26px; padding: 0 12px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.ra-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); }
.ra-btn:active:not(:disabled) { transform: scale(0.97); }
.ra-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ra-btn:focus-visible { outline: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent); outline-offset: 2px; }
.ra-btn-primary {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  font-weight: 600;
}
.ra-btn-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent); }

/* 刷新：26px 幽灵图标钮 */
.ra-icon-btn {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 26px; height: 26px; border: none; border-radius: var(--dsh-layout-radius-user, 8px);
  background: transparent; color: var(--dsw-alias-label-tertiary, #8a8a8e);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background 120ms ease, color 120ms ease;
}
.ra-icon-btn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); color: var(--dsw-alias-label-primary, #f4f4f5); }
.ra-icon-btn:active { transform: scale(0.97); }
.ra-icon-btn:focus-visible { outline: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent); outline-offset: 2px; }

/* ─── QR group：白色托盘 160px 居中 + 提示文字 ─── */
.ra-qr-body { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 14px 12px; }
.ra-qr-empty { margin: 0; padding: 6px 14px 14px; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.ra-qr-plate {
  box-sizing: border-box; width: 160px; height: 160px; padding: 12px;
  display: flex; align-items: center; justify-content: center;
  background: #fff; border-radius: var(--dsh-layout-radius-user, 8px);
}
.ra-qr-plate svg { display: block; width: 100%; height: 100%; }
.ra-qr-hint { margin: 0; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.ra-qr-collapse {
  border: none; background: transparent; padding: 2px 8px;
  border-radius: var(--dsh-layout-radius-user, 8px);
  font: inherit; font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8a8e);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: background 120ms ease, color 120ms ease;
}
.ra-qr-collapse:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent); color: var(--dsw-alias-label-secondary, #b3b3b8); }
.ra-qr-collapse:focus-visible { outline: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent); outline-offset: 2px; }

/* ─── Loading / error ─── */
.ra-hint { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary, #b3b3b8); }
.ra-spin { display: inline-flex; animation: ra-rotate 1s linear infinite; }
@keyframes ra-rotate { to { transform: rotate(360deg); } }
.ra-error {
  margin: 0; padding: 8px 12px;
  color: var(--dsw-alias-state-error-primary, #d2665d);
  font-size: 12px; line-height: 1.55;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef5350) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  overflow-wrap: anywhere;
}
.ra-issue-hint { margin: 0; font-size: 11px; line-height: 1.55; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ─── Diagnostics：business 边色的安静分组（无渐变无投影） ─── */
.ra-issues {
  padding: 6px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 22%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 4%, transparent);
}
.ra-issues-title { display: flex; align-items: center; gap: 6px; margin: 0; padding: 8px 14px 0; font-size: 12px; font-weight: 600; color: var(--dsw-alias-state-business-primary, #ffb74d); }
.ra-issues ul { margin: 0; padding: 6px 14px 10px; list-style: none; display: flex; flex-direction: column; gap: 8px; }
.ra-issue-message { margin: 0; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-primary, #f4f4f5); }

/* ─── Footnotes ─── */
.ra-notes { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent); padding-top: 10px; display: flex; flex-direction: column; gap: 4px; }
.ra-notes p { margin: 0; max-width: 560px; font-size: 11px; line-height: 1.6; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ─── dsh-layout material bridge: frosted glass when the material is on ───
   Inner surfaces take translucent tints only (no nested backdrop-filter —
   the launcher canvas already owns the blur layer). Groups sit at 34%;
   the QR group carries the heavier plate, so its line runs denser (55%). */
html[data-dsh-layout-material='on'] .ra-group,
html[data-dsh-layout-material='on'] .ra-issues {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .ra-group-qr {
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}

/* ─── Motion safety: 按压与过渡在 reduced-motion 下全部退场 ─── */
@media (prefers-reduced-motion: reduce) {
  .ra-row, .ra-btn, .ra-icon-btn, .ra-qr-collapse { transition: none; }
  .ra-btn:active:not(:disabled), .ra-icon-btn:active, .ra-qr-collapse:active { transform: none; }
  .ra-spin { animation: none; }
}
`
  const style = doc.createElement('style')
  style.dataset.plugin = 'dsh-remote-access'
  style.textContent = CSS
  doc.head.append(style)
  return () => {
    style.remove()
  }
}
