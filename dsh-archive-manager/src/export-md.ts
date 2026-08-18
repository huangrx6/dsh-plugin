/**
 * Host-side: render a session's history as a Markdown transcript.
 *
 * The shape we receive from `/api/sessions.history` is
 * `{ events: Array<{ event: { type, seq, time, data }, view? }> }`. We do
 * NOT depend on `view` (it is a tool-only presentation layer that the
 * markdown transcript doesn't require). We pass through every surface
 * event of interest: user messages, assistant messages, tool calls and
 * their results, plus turn boundaries as horizontal rules.
 *
 * The output is intentionally simple Markdown that pastes cleanly into a
 * notes app or diffs in git — no HTML, no fenced code unless the source
 * text was clearly a code block (we preserve verbatim text and let the
 * reader's renderer handle formatting).
 */

export interface HistoryMessageLike {
  readonly role?: 'user' | 'assistant' | 'system' | 'tool'
  readonly source?: { readonly kind?: string }
  readonly content?: readonly ContentPartLike[]
  readonly name?: string
}

export interface ContentPartLike {
  readonly type: string
  readonly text?: string
  readonly image?: unknown
  readonly path?: unknown
  readonly result?: { readonly content: unknown }
  readonly toolName?: string
}

export interface HistoryEventLike {
  readonly type: string
  readonly seq?: number
  readonly time?: number | string
  readonly data?: unknown
}

export interface HistoryEntryLike {
  readonly event: HistoryEventLike
}

export interface HistoryResponseLike {
  readonly events: readonly HistoryEntryLike[]
}

/** Date format: ISO YYYY-MM-DD HH:MM:SS (local). Cheap & paste-friendly. */
function formatTime(value: number | string | undefined): string {
  if (value === undefined) return ''
  const t = typeof value === 'number' ? value : Date.parse(value)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function asMessage(data: unknown): HistoryMessageLike | undefined {
  if (data === null || typeof data !== 'object') return undefined
  const d = data as Record<string, unknown>
  if (d.message !== undefined && typeof d.message === 'object') return d.message as HistoryMessageLike
  return d as HistoryMessageLike
}

function textOf(message: HistoryMessageLike): string {
  const parts = message.content ?? []
  return parts
    .filter(p => p.type === 'text' && typeof p.text === 'string')
    .map(p => p.text ?? '')
    .join('\n')
    .trimEnd()
}

function normalizeEntry(entry: HistoryEventLike | { event: HistoryEventLike }): HistoryEventLike {
  return 'event' in entry ? entry.event : entry
}

/** Render one history event as a Markdown block. Returns '' if nothing to show. */
function renderEvent(entry: HistoryEventLike | { event: HistoryEventLike }): string {
  const e = normalizeEntry(entry)
  switch (e.type) {
    case 'turn/start':
      return '\n---\n'
    case 'user/message': {
      const msg = asMessage(e.data)
      const text = msg ? textOf(msg) : ''
      if (text === '') return ''
      return `\n## 👤 User\n\n${text}\n`
    }
    case 'assistant/message': {
      const msg = asMessage(e.data)
      const text = msg ? textOf(msg) : ''
      if (text === '') return ''
      return `\n## 🤖 Assistant\n\n${text}\n`
    }
    case 'tool/call': {
      const data = e.data as { name?: string; arguments?: string } | undefined
      if (data?.name === undefined) return ''
      const args = data.arguments ?? ''
      return `\n<details><summary>🔧 ${data.name}</summary>\n\n\`\`\`json\n${args}\n\`\`\`\n\n</details>\n`
    }
    case 'tool/result': {
      const data = e.data as { message?: { content?: readonly ContentPartLike[] } } | undefined
      const result = data?.message?.content?.[0]
      const text = result && result.type === 'text' && typeof result.text === 'string' ? result.text : ''
      if (text === '') return ''
      return `\n> **Tool result:** ${text}\n`
    }
    default:
      return ''
  }
}

export interface RenderedMarkdown {
  readonly markdown: string
  readonly messageCount: number
}

/**
 * Render a `sessions.history`-shaped response as Markdown.
 *
 * Counts only user/assistant messages in `messageCount` (tool events are
 * not "messages" in the human-transcript sense).
 */
export function renderHistoryToMarkdown(
  history: HistoryResponseLike,
  header?: { readonly sessionId: string; readonly title?: string },
): RenderedMarkdown {
  const lines: string[] = []
  if (header !== undefined) {
    lines.push(`# ${header.title ?? header.sessionId}`)
    lines.push('')
    lines.push(`Session: \`${header.sessionId}\``)
    const firstTime = formatTime(normalizeEntry(history.events[0] as unknown as HistoryEventLike | { event: HistoryEventLike })?.time)
    if (firstTime !== '') lines.push(`Started: ${firstTime}`)
    lines.push('')
    lines.push('---')
  }
  let messageCount = 0
  for (const entry of history.events) {
    const ev = normalizeEntry(entry)
    if (ev.type === 'user/message' || ev.type === 'assistant/message') messageCount++
    const block = renderEvent(entry)
    if (block !== '') lines.push(block)
  }
  return {
    markdown: lines.join('').replace(/\n{3,}/gu, '\n\n').trimEnd() + '\n',
    messageCount,
  }
}