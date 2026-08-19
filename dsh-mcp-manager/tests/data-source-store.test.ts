import { describe, expect, it } from 'vitest'
import {
  addMarketSource,
  loadMarketSources,
  removeMarketSource,
  updateMarketSource,
} from '../src/client/market/data-source-store.ts'
import { storageKey } from '../src/client/market/data-source-store.ts'
import { DEFAULT_MARKET_SOURCES } from '../src/client/market/types.ts'

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>()
  get length(): number { return this.map.size }
  clear(): void { this.map.clear() }
  getItem(key: string): string | null { return this.map.get(key) ?? null }
  key(index: number): string | null { return [...this.map.keys()][index] ?? null }
  removeItem(key: string): void { this.map.delete(key) }
  setItem(key: string, value: string): void { this.map.set(key, value) }
}

describe('market data source store', () => {
  it('ships no built-in sources anymore (the DSH 内置 feed was retired)', () => {
    const storage = new MemoryStorage()
    const sources = loadMarketSources(storage)
    expect(sources).toHaveLength(DEFAULT_MARKET_SOURCES.length)
    expect(DEFAULT_MARKET_SOURCES).toHaveLength(0)
    expect(sources).toHaveLength(0)
  })

  it('drops stored copies of retired built-in sources on load', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      storageKey(),
      JSON.stringify([
        { id: 'dsh-launcher-builtin', name: 'DSH 内置', url: 'https://example.com/builtin.json', builtIn: true, order: 0 },
        { id: 'custom-1', name: '社区市场', url: 'https://example.com/market.json', builtIn: false, order: 1 },
      ]),
    )
    const sources = loadMarketSources(storage)
    expect(sources.some((source) => source.id === 'dsh-launcher-builtin')).toBe(false)
    expect(sources.some((source) => source.id === 'custom-1')).toBe(true)
  })

  it('adds a custom source and persists it', () => {
    const storage = new MemoryStorage()
    const initial = loadMarketSources(storage)
    const next = addMarketSource(storage, initial, {
      name: '社区市场',
      url: 'https://example.com/market.json',
    })
    const added = next.find((source) => source.name === '社区市场')
    expect(added?.builtIn).toBe(false)
    expect(added?.order).toBeGreaterThan(initial[initial.length - 1]?.order ?? -1)

    const reloaded = loadMarketSources(storage)
    expect(reloaded.some((source) => source.url === 'https://example.com/market.json')).toBe(true)
  })

  it('updates name and url of a custom source while keeping id and order', () => {
    const storage = new MemoryStorage()
    const seeded = loadMarketSources(storage)
    const withSource = addMarketSource(storage, seeded, {
      name: '旧名',
      url: 'https://old.example.com/manifest.json',
    })
    const target = withSource.find((source) => source.name === '旧名')
    expect(target).toBeDefined()
    if (target === undefined) return

    const next = updateMarketSource(storage, withSource, target.id, {
      name: '新名',
      url: 'https://new.example.com/manifest.json',
    })
    expect(next.find((source) => source.id === target.id)).toMatchObject({
      id: target.id,
      name: '新名',
      url: 'https://new.example.com/manifest.json',
      order: target.order,
    })
    // persisted: a fresh load sees the update
    expect(
      loadMarketSources(storage).some((source) => source.url === 'https://new.example.com/manifest.json'),
    ).toBe(true)
  })

  it('removes a custom source but never one flagged built-in', () => {
    const storage = new MemoryStorage()
    const withSource = addMarketSource(storage, loadMarketSources(storage), {
      name: '临时',
      url: 'https://tmp.example.com/market.json',
    })
    const custom = withSource.find((source) => source.name === '临时')
    expect(custom).toBeDefined()
    if (custom === undefined) return

    const afterCustom = removeMarketSource(storage, withSource, custom.id)
    expect(afterCustom.some((source) => source.id === custom.id)).toBe(false)

    // The built-in guard still holds for any future built-in entry.
    const syntheticBuiltIn = { id: 'future-builtin', name: '内置', url: 'https://example.com/b.json', builtIn: true, order: 0 }
    const afterBuiltIn = removeMarketSource(storage, [syntheticBuiltIn], syntheticBuiltIn.id)
    expect(afterBuiltIn.some((source) => source.id === syntheticBuiltIn.id && source.builtIn)).toBe(true)
  })
})
