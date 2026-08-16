import { describe, expect, it } from 'vitest'
import type { McpTestResponse } from '../src/contracts.ts'
import { clearCachedTest, loadCachedTest, saveCachedTest } from '../src/client/tool-cache.ts'

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>()
  get length(): number { return this.map.size }
  clear(): void { this.map.clear() }
  getItem(key: string): string | null { return this.map.get(key) ?? null }
  key(index: number): string | null { return [...this.map.keys()][index] ?? null }
  removeItem(key: string): void { this.map.delete(key) }
  setItem(key: string, value: string): void { this.map.set(key, value) }
}

class QuotaStorage extends MemoryStorage {
  override setItem(key: string, value: string): void {
    if (value.length > 100) throw new DOMException('quota', 'QuotaExceededError')
    super.setItem(key, value)
  }
}

const okResult: McpTestResponse = {
  ok: true,
  durationMs: 1234,
  serverName: 'zai-mcp-server',
  serverVersion: '0.1.2',
  tools: [
    { name: 'ui_to_artifact', description: 'Convert UI screenshots', inputSchema: { type: 'object', properties: { a: { type: 'string' } } } },
    { name: 'extract_text', description: 'OCR', inputSchema: { type: 'object' } },
  ],
}

describe('tool cache', () => {
  it('round-trips a successful probe with schemas', () => {
    const storage = new MemoryStorage()
    const saved = saveCachedTest(storage, 'srv', okResult)
    expect(saved?.ok).toBe(true)
    expect(saved?.tools.map(tool => tool.name)).toEqual(['ui_to_artifact', 'extract_text'])
    const loaded = loadCachedTest(storage, 'srv')
    expect(loaded?.serverVersion).toBe('0.1.2')
    expect(loaded?.tools[0]?.inputSchema).toEqual({ type: 'object', properties: { a: { type: 'string' } } })
    expect(loaded?.testedAt).toBeGreaterThan(0)
  })

  it('caches failures without tools so auto-probe does not loop', () => {
    const storage = new MemoryStorage()
    const saved = saveCachedTest(storage, 'srv', { ok: false, durationMs: 5, error: 'boom' })
    expect(saved?.ok).toBe(false)
    expect(saved?.tools).toEqual([])
    expect(loadCachedTest(storage, 'srv')?.error).toBe('boom')
  })

  it('clear removes the entry', () => {
    const storage = new MemoryStorage()
    saveCachedTest(storage, 'srv', okResult)
    clearCachedTest(storage, 'srv')
    expect(loadCachedTest(storage, 'srv')).toBeUndefined()
  })

  it('degrades gracefully under quota pressure', () => {
    const storage = new QuotaStorage()
    const small: McpTestResponse = { ...okResult, tools: [{ name: 't', description: 'd', inputSchema: { type: 'object' } }] }
    const saved = saveCachedTest(storage, 'srv', small)
    // either a reduced payload fit or nothing was stored — never a throw
    if (saved !== undefined) {
      expect(loadCachedTest(storage, 'srv')?.ok).toBe(true)
    } else {
      expect(storage.getItem('dsh-mcp-manager:test:srv')).toBeNull()
    }
  })

  it('ignores corrupted entries', () => {
    const storage = new MemoryStorage()
    storage.setItem('dsh-mcp-manager:test:srv', '{not json')
    expect(loadCachedTest(storage, 'srv')).toBeUndefined()
  })

  it('caps the stored tool list', () => {
    const storage = new MemoryStorage()
    const many: McpTestResponse = {
      ...okResult,
      tools: Array.from({ length: 300 }, (_, i) => ({ name: `t${i}`, description: 'd', inputSchema: { type: 'object' } })),
    }
    const saved = saveCachedTest(storage, 'srv', many)
    expect(saved?.tools.length).toBeLessThanOrEqual(200)
  })
})
