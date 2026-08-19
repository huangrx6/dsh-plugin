/**
 * Locale strings for the archive manager section.
 */
export const ARCHIVE_MANAGER_NS = 'dsh-archive-manager'

export type ArchiveManagerLocaleKey =
  | 'tab'
  | 'tabDesc'
  | 'listHeader'
  | 'empty'
  | 'emptyTitle'
  | 'loadFailed'
  | 'restore'
  | 'restoreConfirm'
  | 'restoreSuccess'
  | 'restoreFailed'
  | 'exportZip'
  | 'exportMd'
  | 'exportMdDone'
  | 'exportFailed'
  | 'exportAllZip'
  | 'exportAllRunning'
  | 'exportAllDone'
  | 'exportAllFailed'
  | 'noSelection'
  | 'selectPrompt'
  | 'loading'
  | 'messageCount'
  | 'sessionId'
  | 'searchPlaceholder'
  | 'noResults'
  | 'groupToday'
  | 'groupYesterday'
  | 'groupEarlier'
  | 'relNow'
  | 'relMin'
  | 'relHour'
  | 'relDay'
  | 'delete'
  | 'deleteNote'
  | 'copyPath'
  | 'pathCopied'
  | 'eventsEmpty'
  | 'showMore'
  | 'role.user'
  | 'role.assistant'
  | 'role.toolCall'
  | 'role.toolResult'

export const zhCN: Record<ArchiveManagerLocaleKey, string> = {
  tab: '归档管理',
  tabDesc: '查看已归档（隐藏）的会话、阅读消息记录、恢复会话或导出为压缩包 / Markdown。',
  listHeader: '归档',
  empty: '当前工作区没有已归档的会话。',
  emptyTitle: '暂无归档会话',
  loadFailed: '加载归档列表失败：',
  restore: '恢复',
  restoreConfirm: '确认要把此会话恢复到工作区列表？',
  restoreSuccess: '会话已恢复。',
  restoreFailed: '恢复失败：',
  exportZip: '导出 ZIP',
  exportMd: '导出 Markdown',
  exportMdDone: 'Markdown 已导出。',
  exportFailed: '导出失败：',
  exportAllZip: '导出全部 ZIP',
  exportAllRunning: '导出中…',
  exportAllDone: '个归档已导出。',
  exportAllFailed: '部分归档导出失败：',
  noSelection: '从左侧选择一个归档会话',
  selectPrompt: '在侧栏的工作区里右键会话选 Archive session，会话就会出现在这里。',
  loading: '加载消息记录…',
  messageCount: '条消息',
  sessionId: '会话 ID',
  searchPlaceholder: '搜索归档会话…',
  noResults: '没有匹配的归档会话。',
  groupToday: '今天',
  groupYesterday: '昨天',
  groupEarlier: '更早',
  relNow: '刚刚',
  relMin: '{n} 分钟前',
  relHour: '{n} 小时前',
  relDay: '{n} 天前',
  delete: '删除',
  deleteNote: 'dsh 未公开删除 API：在 Mac 上手动清理该会话目录。',
  copyPath: '复制路径',
  pathCopied: '路径已复制。',
  eventsEmpty: '该会话没有可展示的消息记录。',
  showMore: '加载更多',
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
  emptyTitle: 'No archived sessions',
  loadFailed: 'Failed to load archive list:',
  restore: 'Restore',
  restoreConfirm: 'Restore this session to the workspace list?',
  restoreSuccess: 'Session restored.',
  restoreFailed: 'Restore failed:',
  exportZip: 'Export zip',
  exportMd: 'Export Markdown',
  exportMdDone: 'Markdown exported.',
  exportFailed: 'Export failed:',
  exportAllZip: 'Export all zip',
  exportAllRunning: 'Exporting…',
  exportAllDone: 'archives exported.',
  exportAllFailed: 'Some exports failed:',
  noSelection: 'Select a session on the left',
  selectPrompt: 'Right-click a session in the workspace sidebar and pick Archive session to add it here.',
  loading: 'Loading messages…',
  messageCount: 'messages',
  sessionId: 'Session ID',
  searchPlaceholder: 'Search archived sessions…',
  noResults: 'No matching archived sessions.',
  groupToday: 'Today',
  groupYesterday: 'Yesterday',
  groupEarlier: 'Earlier',
  relNow: 'just now',
  relMin: '{n}m ago',
  relHour: '{n}h ago',
  relDay: '{n}d ago',
  delete: 'Delete',
  deleteNote: 'dsh exposes no delete API: remove the session directory on the Mac manually.',
  copyPath: 'Copy path',
  pathCopied: 'Path copied.',
  eventsEmpty: 'No displayable message events in this session.',
  showMore: 'Load more',
  'role.user': 'You',
  'role.assistant': 'Assistant',
  'role.toolCall': 'Tool call',
  'role.toolResult': 'Tool result',
}
