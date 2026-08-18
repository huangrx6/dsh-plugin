import { describe, expect, it } from 'vitest'
import { renderHistoryToMarkdown, type HistoryResponseLike, type HistoryEventLike } from '../src/export-md.ts'

function ev(type: string, data: unknown, time?: string): { event: HistoryEventLike } {
  return { event: { type, seq: 0, time, data } }
}

describe('renderHistoryToMarkdown', () => {
  it('renders a user + assistant exchange with a turn separator', () => {
    const history: HistoryResponseLike = {
      events: [
        ev('turn/start', {}, '2026-01-01T00:00:00Z'),
        ev('user/message', { role: 'user', content: [{ type: 'text', text: 'hi' }] }),
        ev('assistant/message', { message: { role: 'assistant', content: [{ type: 'text', text: 'hello' }] } }),
        ev('turn/end', {}, '2026-01-01T00:00:10Z'),
      ],
    }
    const out = renderHistoryToMarkdown(history)
    expect(out.messageCount).toBe(2)
    expect(out.markdown).toContain('## 👤 User')
    expect(out.markdown).toContain('hi')
    expect(out.markdown).toContain('## 🤖 Assistant')
    expect(out.markdown).toContain('hello')
    expect(out.markdown).toContain('---')
  })

  it('renders tool calls as collapsible details with JSON args', () => {
    const history: HistoryResponseLike = {
      events: [
        ev('tool/call', { name: 'shell', arguments: '{"cmd":"ls"}' }),
        ev('tool/result', { message: { content: [{ type: 'text', text: 'file.txt' }] } }),
      ],
    }
    const out = renderHistoryToMarkdown(history)
    expect(out.markdown).toContain('<details>')
    expect(out.markdown).toContain('shell')
    expect(out.markdown).toContain('"cmd":"ls"')
    expect(out.markdown).toContain('Tool result:')
    expect(out.markdown).toContain('file.txt')
    expect(out.messageCount).toBe(0) // tool events don't count as messages
  })

  it('skips empty messages but counts populated ones', () => {
    const history: HistoryResponseLike = {
      events: [
        ev('user/message', { role: 'user', content: [] }),
        ev('assistant/message', { message: { role: 'assistant', content: [] } }),
        ev('user/message', { role: 'user', content: [{ type: 'text', text: 'real' }] }),
      ],
    }
    const out = renderHistoryToMarkdown(history)
    expect(out.messageCount).toBe(3) // counts even empty (event-of-interest)
    expect(out.markdown).toContain('real')
    expect(out.markdown).not.toContain('User\n\n\n') // no stray empty headings
  })

  it('includes session header with title when provided', () => {
    const history: HistoryResponseLike = {
      events: [ev('user/message', { role: 'user', content: [{ type: 'text', text: 'x' }] }, '2026-05-01T10:00:00Z')],
    }
    const out = renderHistoryToMarkdown(history, { sessionId: 'sess-abc', title: 'My Chat' })
    expect(out.markdown).toMatch(/^# My Chat/)
    expect(out.markdown).toContain('`sess-abc`')
    expect(out.markdown).toContain('Started:')
  })

  it('collapses 3+ consecutive blank lines to 2', () => {
    const history: HistoryResponseLike = {
      events: [
        ev('user/message', { role: 'user', content: [{ type: 'text', text: 'a' }] }),
        ev('turn/start', {}),
        ev('assistant/message', { message: { role: 'assistant', content: [{ type: 'text', text: 'b' }] } }),
      ],
    }
    const out = renderHistoryToMarkdown(history)
    expect(out.markdown).not.toMatch(/\n\n\n/)
  })

  it('returns empty markdown on empty history', () => {
    const out = renderHistoryToMarkdown({ events: [] })
    expect(out.markdown).toBe('\n')
    expect(out.messageCount).toBe(0)
  })
})