export function installStyles(doc: Document): () => void {
  const CSS = `
.ra-panel { display: flex; flex-direction: column; gap: 12px; padding: 16px 0; max-width: 560px; }
.ra-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ra-title { margin: 0; font-size: 15px; font-weight: 600; }
.ra-subtitle { margin: 0; color: var(--text-secondary, #888); font-size: 12.5px; line-height: 1.5; }
.ra-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 4px 0; }
.ra-field { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ra-field-wide { grid-column: 1 / -1; }
.ra-field dt { font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-tertiary, #999); }
.ra-field dd { margin: 0; font-size: 13px; overflow-wrap: anywhere; }
.ra-url { font-family: var(--mono, monospace); }
.ra-chip { display: inline-flex; align-items: center; padding: 1px 8px; border-radius: 999px; font-size: 12px; border: 1px solid var(--border, #333); color: var(--text-secondary, #888); }
.ra-chip-on { border-color: #2f9e6e; color: #2f9e6e; }
.ra-warn { color: #c98a2b; }
.ra-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.ra-btn { padding: 5px 14px; border-radius: 8px; border: 1px solid var(--border, #333); background: transparent; color: inherit; font-size: 12.5px; cursor: pointer; }
.ra-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ra-btn-primary { background: #3b6ef5; border-color: #3b6ef5; color: #fff; }
.ra-btn-primary:hover:not(:disabled) { background: #3459c9; }
.ra-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 7px; border: 1px solid var(--border, #333); background: transparent; color: inherit; cursor: pointer; }
.ra-hint { display: flex; align-items: center; gap: 8px; color: var(--text-secondary, #888); font-size: 13px; margin: 0; }
.ra-spin { display: inline-flex; animation: ra-rotate 1s linear infinite; }
@keyframes ra-rotate { to { transform: rotate(360deg); } }
.ra-error { margin: 0; color: #d2665d; font-size: 12.5px; overflow-wrap: anywhere; }
.ra-qr { margin: 4px 0; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.ra-qr-title { font-size: 12px; color: var(--text-secondary, #888); }
.ra-qr-svg svg { display: block; border-radius: 8px; background: #fff; padding: 6px; }
.ra-issues { border: 1px solid var(--border, #333); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.ra-issues-title { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 12.5px; color: #c98a2b; }
.ra-issues ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
.ra-issue-message { margin: 0; font-size: 12.5px; }
.ra-issue-hint { margin: 2px 0 0; font-size: 12px; color: var(--text-secondary, #888); }
.ra-notes { border-top: 1px solid var(--border, #333); padding-top: 10px; display: flex; flex-direction: column; gap: 4px; }
.ra-notes p { margin: 0; font-size: 11.5px; line-height: 1.5; color: var(--text-tertiary, #999); }
`
  const style = doc.createElement('style')
  style.dataset.plugin = 'dsh-remote-access'
  style.textContent = CSS
  doc.head.append(style)
  return () => {
    style.remove()
  }
}
