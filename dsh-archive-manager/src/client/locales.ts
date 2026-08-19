/**
 * Locale strings for the archive manager section.
 */
export const ARCHIVE_MANAGER_NS = 'dsh-archive-manager'

export type ArchiveManagerLocaleKey =
  | 'tab'
  | 'tabDesc'
  | 'listHeader'
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
  | 'loading'
  | 'messageCount'
  | 'sessionId'
  | 'deleteHint'
  | 'searchPlaceholder'
  | 'noResults'
  | 'sessionInfo'
  | 'timelineLabel'
  | 'updatedAtLabel'
  | 'sizeLabel'
  | 'messagesLabel'
  | 'eventCount'
  | 'delete'
  | 'deleteNote'
  | 'copyPath'
  | 'pathCopied'
  | 'eventsEmpty'
  | 'role.user'
  | 'role.assistant'
  | 'role.toolCall'
  | 'role.toolResult'

export const zhCN: Record<ArchiveManagerLocaleKey, string> = {
  tab: '归档管理',
  tabDesc: '查看已归档（隐藏）的会话、阅读消息记录、恢复会话或导出为压缩包 / Markdown。',
  listHeader: '归档',
  empty: '当前工作区没有已归档的会话。',
  loadFailed: '加载归档列表失败：',
  restore: '恢复',
  restoreConfirm: '确认要把此会话恢复到工作区列表？',
  restoreSuccess: '会话已恢复。',
  restoreFailed: '恢复失败：',
  exportZip: '导出 ZIP',
  exportMd: '导出 Markdown',
  exportFailed: '导出失败：',
  noSelection: '从左侧选一个归档会话以查看详情。',
  selectPrompt: '也可在侧栏的工作区里右键会话选 Archive session 添加',
  loading: '加载消息记录…',
  messageCount: '条消息',
  sessionId: '会话 ID',
  deleteHint: '彻底删除：到 Mac 的 ~/.dsh/sessions/<id>/ 目录手动清理。dsh 未公开删除 API。',
  searchPlaceholder: '搜索归档会话…',
  noResults: '没有匹配的归档会话。',
  sessionInfo: '会话摘要',
  timelineLabel: '时间线',
  updatedAtLabel: '更新时间',
  sizeLabel: '记录大小',
  messagesLabel: '消息数',
  eventCount: '条事件',
  delete: '删除',
  deleteNote: 'dsh 未公开删除 API：在 Mac 上手动清理该会话目录。',
  copyPath: '复制路径',
  pathCopied: '路径已复制。',
  eventsEmpty: '该会话没有可展示的消息记录。',
  'role.user': '你',
  'role.assistant': '助手',
  'role.toolCall': '工具调用',
  'role.toolResult': '工具结果',
}

export const enUS: Record<ArchiveManagerLocaleKey, string> = {
  tab: 'Archive manager',
  tabDesc: 'List hidden (archived) sessions, read their messages, restore them to the workspace, or export as a zip / Markdown file.',
  listHeader: 'Archived',
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
  selectPrompt: 'Tip: right-click a session in the workspace sidebar and pick Archive session to add it here.',
  loading: 'Loading messages…',
  messageCount: 'messages',
  sessionId: 'Session ID',
  deleteHint: 'Hard delete: remove ~/.dsh/sessions/<id>/ on the Mac manually. dsh does not expose a delete API.',
  searchPlaceholder: 'Search archived sessions…',
  noResults: 'No matching archived sessions.',
  sessionInfo: 'Session summary',
  timelineLabel: 'Timeline',
  updatedAtLabel: 'Updated',
  sizeLabel: 'Payload size',
  messagesLabel: 'Messages',
  eventCount: 'events',
  delete: 'Delete',
  deleteNote: 'dsh exposes no delete API: remove the session directory on the Mac manually.',
  copyPath: 'Copy path',
  pathCopied: 'Path copied.',
  eventsEmpty: 'No displayable message events in this session.',
  'role.user': 'You',
  'role.assistant': 'Assistant',
  'role.toolCall': 'Tool call',
  'role.toolResult': 'Tool result',
}
