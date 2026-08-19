/** Locale strings for the subscription usage monitor. */
export const USAGE_NS = 'dsh-usage'

export type UsageLocaleKey =
  | 'section'
  | 'sectionHint'
  | 'refresh'
  | 'refreshing'
  | 'addEntry'
  | 'editEntry'
  | 'entryLabel'
  | 'entryProvider'
  | 'entryProviderGlm'
  | 'entryProviderMinimax'
  | 'entryProviderOpencode'
  | 'entryKey'
  | 'entryEndpoint'
  | 'entryRegion'
  | 'entryRegionBigmodel'
  | 'entryRegionZai'
  | 'entryManualPercent'
  | 'save'
  | 'cancel'
  | 'delete'
  | 'removeConfirm'
  | 'loading'
  | 'updatedAt'
  | 'queryFailed'
  | 'manual'
  | 'level'
  | 'providerGlm'
  | 'providerMinimax'
  | 'providerOpencode'

export const zhCN: Record<UsageLocaleKey, string> = {
  section: '订阅用量',
  sectionHint: '实时查看 GLM / MiniMax / opencode 等订阅的额度剩余；key 只存本机，不出现在浏览器。',
  refresh: '刷新',
  refreshing: '刷新中…',
  addEntry: '新增订阅',
  editEntry: '编辑订阅',
  entryLabel: '名称',
  entryProvider: '提供方',
  entryProviderGlm: 'GLM（智谱）',
  entryProviderMinimax: 'MiniMax',
  entryProviderOpencode: 'Opencode',
  entryKey: 'API Token / Key（可用 env:变量名 引用）',
  entryEndpoint: '用量查询端点',
  entryRegion: '地区',
  entryRegionBigmodel: '国内（bigmodel）',
  entryRegionZai: '国际（z.ai）',
  entryManualPercent: '手动剩余百分比 (0-100)',
  save: '保存',
  cancel: '取消',
  delete: '删除',
  removeConfirm: '确定删除该订阅？',
  loading: '加载中…',
  updatedAt: '更新于',
  queryFailed: '查询失败',
  manual: '手动',
  level: '档位',
  providerGlm: 'GLM',
  providerMinimax: 'MiniMax',
  providerOpencode: 'Opencode',
}

export const enUS: Record<UsageLocaleKey, string> = {
  section: 'Subscription usage',
  sectionHint: 'Live quota for GLM / MiniMax / opencode subscriptions. Keys stay local, never in the browser.',
  refresh: 'Refresh',
  refreshing: 'Refreshing…',
  addEntry: 'Add',
  editEntry: 'Edit',
  entryLabel: 'Name',
  entryProvider: 'Provider',
  entryProviderGlm: 'GLM (Zhipu)',
  entryProviderMinimax: 'MiniMax',
  entryProviderOpencode: 'Opencode',
  entryKey: 'API token / key (or env:VAR to use a local env var)',
  entryEndpoint: 'Usage endpoint',
  entryRegion: 'Region',
  entryRegionBigmodel: 'China (bigmodel)',
  entryRegionZai: 'International (z.ai)',
  entryManualPercent: 'Manual remaining % (0-100)',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  removeConfirm: 'Delete this subscription?',
  loading: 'Loading…',
  updatedAt: 'Updated',
  queryFailed: 'Query failed',
  manual: 'manual',
  level: 'Plan',
  providerGlm: 'GLM',
  providerMinimax: 'MiniMax',
  providerOpencode: 'Opencode',
}
