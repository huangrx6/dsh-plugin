/**
 * 远程访问面板样式（Frosted Modern）。
 *
 * 全部选择器沿用 `ra-` 前缀（组件类名契约，勿改）。令牌读取走 DSH 的
 * `--dsw-alias-*` 阶梯以适配明暗主题，圆角经 dsh-layout 的
 * `--dsh-layout-radius-user[-lg]` 桥接；dsh-layout 磨砂材质开启时，
 * 文件末尾的材质联动段把卡片/托盘切到半透明玻璃。
 */
export function installStyles(doc: Document): () => void {
  const CSS = `
/* ─── Shell ─── */
.ra-panel { display: flex; flex-direction: column; gap: 12px; padding: 16px 0; max-width: 560px; }
.ra-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ra-title { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 0.01em; color: var(--dsw-alias-label-primary, #f4f4f5); }
.ra-subtitle { margin: 0; color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 12px; line-height: 1.55; }

/* ─── Status card: switch state + access address on one glass tile ─── */
.ra-fields {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; margin: 2px 0; padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 14px);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.ra-field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ra-field-wide { grid-column: 1 / -1; }
.ra-field dt { font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.ra-field dd { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--dsw-alias-label-primary, #f4f4f5); overflow-wrap: anywhere; }
.ra-url { font-family: var(--mono, monospace); font-size: 12px; }

/* Status chip: hairline pill + state dot（on 态带微光） */
.ra-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px;
  border-radius: 999px; font-size: 11.5px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8);
}
.ra-chip::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-label-tertiary, #8a8a8e); }
.ra-chip-on {
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 32%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 10%, transparent);
  color: var(--dsw-alias-state-success-primary, #4caf50);
}
.ra-chip-on::before { background: var(--dsw-alias-state-success-primary, #4caf50); box-shadow: 0 0 8px color-mix(in srgb, var(--dsw-alias-state-success-primary, #4caf50) 70%, transparent); }
.ra-warn { color: var(--dsw-alias-state-business-primary, #ffb74d); }

/* ─── Buttons: primary gets the bright gradient, secondary stays hairline ─── */
.ra-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.ra-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 6px 14px; border-radius: var(--dsh-layout-radius-user, 8px);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 14%, transparent);
  background: transparent; color: var(--dsw-alias-label-primary, #f4f4f5);
  font: inherit; font-size: 12.5px; font-weight: 500; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 150ms var(--ds-ease-in-out, ease), border-color 150ms var(--ds-ease-in-out, ease), transform 150ms var(--ds-ease-in-out, ease), box-shadow 150ms var(--ds-ease-in-out, ease);
}
.ra-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 26%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}
.ra-btn:active:not(:disabled) { transform: scale(0.98); box-shadow: none; }
.ra-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ra-btn:focus-visible { outline: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent); outline-offset: 2px; }
.ra-btn-primary {
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 32%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 18%, transparent));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 22%, transparent);
  font-weight: 600;
}
.ra-btn-primary:hover:not(:disabled) {
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 34%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 22%, transparent));
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 42%, transparent);
}
.ra-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: var(--dsh-layout-radius-user, 8px);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);
  color: var(--dsw-alias-label-secondary, #b3b3b8); cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 140ms var(--ds-ease-in-out, ease), border-color 140ms var(--ds-ease-in-out, ease), color 140ms var(--ds-ease-in-out, ease), transform 140ms var(--ds-ease-in-out, ease), box-shadow 140ms var(--ds-ease-in-out, ease);
}
.ra-icon-btn:hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);
  color: var(--dsw-alias-label-primary, #f4f4f5);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}
.ra-icon-btn:active { transform: scale(0.96); box-shadow: none; }
.ra-icon-btn:focus-visible { outline: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 40%, transparent); outline-offset: 2px; }

/* ─── Loading / error ─── */
.ra-hint { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-secondary, #b3b3b8); font-size: 12px; line-height: 1.55; margin: 0; }
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

/* ─── QR tray: bordered glass tray cradling the white code plate ─── */
.ra-qr {
  margin: 2px 0; display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 14px);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 7%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent);
}
.ra-qr-title { font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #8a8a8e); }
.ra-qr-svg svg {
  display: block; padding: 8px; background: #fff;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user, 8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

/* ─── Diagnostics: warning-tinted glass card ─── */
.ra-issues {
  padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 26%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 14px);
  background: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 8%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 3%, transparent));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-state-business-primary, #ffb74d) 10%, transparent);
}
.ra-issues-title { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 12.5px; font-weight: 600; color: var(--dsw-alias-state-business-primary, #ffb74d); }
.ra-issues ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
.ra-issue-message { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--dsw-alias-label-primary, #f4f4f5); }
.ra-issue-hint { margin: 2px 0 0; font-size: 12px; line-height: 1.55; color: var(--dsw-alias-label-secondary, #b3b3b8); }

/* ─── Footnotes ─── */
.ra-notes { border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); padding-top: 10px; display: flex; flex-direction: column; gap: 4px; }
.ra-notes p { margin: 0; font-size: 11px; line-height: 1.55; color: var(--dsw-alias-label-tertiary, #8a8a8e); }

/* ─── dsh-layout material bridge: frosted glass when the material is on ───
   Inner surfaces take translucent tints only (no nested backdrop-filter —
   the launcher canvas already owns the blur layer). Cards sit at 34%,
   the QR tray (a heavier plate) at 46%. */
html[data-dsh-layout-material='on'] .ra-fields,
html[data-dsh-layout-material='on'] .ra-issues {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 34%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 45%, transparent);
}
html[data-dsh-layout-material='on'] .ra-qr {
  background: color-mix(in srgb, var(--dsh-layout-glass-base, #16161a) 46%, transparent);
  border-color: color-mix(in srgb, var(--dsh-layout-line, #3d414b) 55%, transparent);
}

/* ─── Motion safety: lifts and presses drop out under reduced motion ─── */
@media (prefers-reduced-motion: reduce) {
  .ra-btn, .ra-icon-btn { transition: none; }
  .ra-btn:hover:not(:disabled), .ra-btn-primary:hover:not(:disabled), .ra-icon-btn:hover { transform: none; box-shadow: none; }
  .ra-btn:active:not(:disabled), .ra-icon-btn:active { transform: none; }
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
