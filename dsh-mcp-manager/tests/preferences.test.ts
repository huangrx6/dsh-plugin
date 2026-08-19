import { describe, expect, it } from 'vitest'
import {
  loadMarketView,
  loadSectionMode,
  saveMarketView,
  saveSectionMode,
} from '../src/client/preferences.ts'

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>()
  get length(): number { return this.map.size }
  clear(): void { this.map.clear() }
  getItem(key: string): string | null { return this.map.get(key) ?? null }
  key(index: number): string | null { return [...this.map.keys()][index] ?? null }
  removeItem(key: string): void { this.map.delete(key) }
  setItem(key: string, value: string): void { this.map.set(key, value) }
}

class ThrowingStorage extends MemoryStorage {
  override getItem(): string | null { throw new Error('quarantined') }
  override setItem(): void { throw new Error('quota') }
}

describe('section / market view preferences', () => {
  it('defaults to the installed pane and the compact list', () => {
    const storage = new MemoryStorage()
    expect(loadSectionMode(storage)).toBe('installed')
    expect(loadMarketView(storage)).toBe('list')
  })

  it('round-trips the market mode and card view', () => {
    const storage = new MemoryStorage()
    saveSectionMode(storage, 'market')
    saveMarketView(storage, 'card')
    expect(loadSectionMode(storage)).toBe('market')
    expect(loadMarketView(storage)).toBe('card')
  })

  it('falls back to defaults on junk values', () => {
    const storage = new MemoryStorage()
    storage.setItem('dsh-mcp-manager:section-mode', 'nonsense')
    storage.setItem('dsh-mcp-manager:market-view', 'grid')
    expect(loadSectionMode(storage)).toBe('installed')
    expect(loadMarketView(storage)).toBe('list')
  })

  it('tolerates a storage that throws', () => {
    const storage = new ThrowingStorage()
    expect(loadSectionMode(storage)).toBe('installed')
    expect(loadMarketView(storage)).toBe('list')
    expect(() => saveSectionMode(storage, 'market')).not.toThrow()
    expect(() => saveMarketView(storage, 'card')).not.toThrow()
  })
})
