export const LAYOUT_NS = 'layout'

export const zhCN = {
  section: '页面布局',
  stats: '会话统计',
  noStats: '暂无已结算的统计信息',
  turns: '轮次',
  turnUnit: '轮',
  steps: '步骤',
  stepUnit: '步',
  llm: '模型耗时',
  llmShort: 'LLM',
  tools: '工具耗时',
  toolsShort: '工具调用',
  ttft: '首 token 平均',
  speed: '生成速度',
  cache: '缓存命中',
  tokens: 'Token 用量',
  input: '输入',
  output: '输出',
  busyQueue: '排队',
  busySteer: '插话',
} as const

export const enUS: Record<keyof typeof zhCN, string> = {
  section: 'Page layout',
  stats: 'Session statistics',
  noStats: 'No settled statistics yet',
  turns: 'Turns',
  turnUnit: 'turns',
  steps: 'Steps',
  stepUnit: 'steps',
  llm: 'Model time',
  llmShort: 'LLM',
  tools: 'Tool time',
  toolsShort: 'Tools',
  ttft: 'Average TTFT',
  speed: 'Generation speed',
  cache: 'Cache hit',
  tokens: 'Token usage',
  input: 'Input',
  output: 'Output',
  busyQueue: 'Queue',
  busySteer: 'Steer',
}

export type LayoutLocaleKey = keyof typeof zhCN
