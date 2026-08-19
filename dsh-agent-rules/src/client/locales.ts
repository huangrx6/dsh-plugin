/** Locale strings for the agent rules section. */
export const AGENT_RULES_NS = 'dsh-agent-rules'

export type AgentRulesLocaleKey =
  | 'section'
  | 'sectionHint'
  | 'editorLabel'
  | 'editorPlaceholder'
  | 'save'
  | 'saving'
  | 'saved'
  | 'saveFailed'
  | 'loading'
  | 'loadFailed'
  | 'bytes'
  | 'budgetHint'
  | 'restoreTemplate'
  | 'reset'

export const zhCN: Record<AgentRulesLocaleKey, string> = {
  section: '全局指令',
  sectionHint: '编辑 ~/.dsh/AGENTS.md —— 会被注入到每个会话的持久基线，对其余所有会话生效。',
  editorLabel: '全局指令内容',
  editorPlaceholder: '# 全局 Agent 规则\n\n# 例如：当处于 Code Mode 时，一切 bash / 文件操作都必须通过 run_code 程序内的 tools SDK 调用。',
  save: '保存',
  saving: '保存中…',
  saved: '已保存',
  saveFailed: '保存失败',
  loading: '加载中…',
  loadFailed: '加载失败',
  bytes: '字节',
  budgetHint: '该文件的渲染受 dsh 的指令预算（maxBytes）限制，内容过长会被按预算截断，建议保持简短。',
  restoreTemplate: '载入示例',
  reset: '清空',
}

export const enUS: Record<AgentRulesLocaleKey, string> = {
  section: 'Agent rules',
  sectionHint: 'Edit ~/.dsh/AGENTS.md — it is injected as a persistent baseline into every session, so this applies globally.',
  editorLabel: 'Global rules content',
  editorPlaceholder: '# Global agent rules\n\n# e.g. When in Code Mode, all bash / file operations must go through the tools SDK inside a run_code program.',
  save: 'Save',
  saving: 'Saving…',
  saved: 'Saved',
  saveFailed: 'Save failed',
  loading: 'Loading…',
  loadFailed: 'Load failed',
  bytes: 'bytes',
  budgetHint: 'This file renders within dsh\u2019s instruction budget (maxBytes); keep it concise or it will be truncated.',
  restoreTemplate: 'Load template',
  reset: 'Clear',
}
