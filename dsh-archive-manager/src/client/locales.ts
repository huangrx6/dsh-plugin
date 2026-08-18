/**
 * Locale strings for the archive manager section.
 *
 * Mirrored from dsh-remote-access / dsh-skill-manager so the section feels
 * native in both languages.
 */
export const ARCHIVE_MANAGER_NS = 'dsh-archive-manager'

export type ArchiveManagerLocaleKey =
  | 'tab'
  | 'tabDesc'
  | 'empty'
  | 'loadFailed'
  | 'restore'
  | 'restoreConfirm'
  | 'restoreSuccess'
  | 'restoreFailed'
  | 'exportZip'
  | 'exportMd'
  | 'exportFailed'
  | 'noSelection'
  | 'selectPrompt'
  | 'messageCount'
  | 'sessionId'
  | 'messages'
  | 'deleteHint'

export const zhCN: Record<ArchiveManagerLocaleKey, string> = {
  tab: '归档管理',
  tabDesc: '查看已归档（隐藏）的会话、阅读消息记录、恢复会话或导出为压缩包/Markdown。',
  empty: '当前工作区没有已归档的会话。',
  loadFailed: '加载归档列表失败：',
  restore: '恢复',
  restoreConfirm: '确认要把此会话恢复到工作区列表？',
  restoreSuccess: '会话已恢复。',
  restoreFailed: '恢复失败：',
  exportZip: '导出 ZIP',
  exportMd: '导出 Markdown',
  exportFailed: '导出失败：',
  noSelection: '请从左侧选择一个已归档的会话以查看详情。',
  selectPrompt: '点击左侧条目查看会话内容',
  messageCount: '条消息',
  sessionId: '会话 ID',
  messages: '消息记录',
  deleteHint: '提示：彻底删除请到 Mac 的 ~/.dsh/sessions/<id>/ 目录手动清理（dsh 没有公开的删除 API）。',
}

export const enUS: Record<ArchiveManagerLocaleKey, string> = {
  tab: 'Archive manager',
  tabDesc: 'List hidden (archived) sessions, read their messages, restore them to the workspace, or export as a zip / Markdown file.',
  empty: 'No archived sessions in this workspace.',
  loadFailed: 'Failed to load archive list:',
  restore: 'Restore',
  restoreConfirm: 'Restore this session to the workspace list?',
  restoreSuccess: 'Session restored.',
  restoreFailed: 'Restore failed:',
  exportZip: 'Export zip',
  exportMd: 'Export Markdown',
  exportFailed: 'Export failed:',
  noSelection: 'Pick an archived session on the left to see its messages.',
  selectPrompt: 'Click a row on the left to view messages',
  messageCount: 'messages',
  sessionId: 'Session ID',
  messages: 'Messages',
  deleteHint: 'Note: hard delete requires deleting ~/.dsh/sessions/<id>/ manually on the Mac — dsh does not expose a delete API.',
}