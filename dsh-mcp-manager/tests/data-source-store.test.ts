import { describe, expect, it } from 'vitest'
import {
  addMarketSource,
  loadMarketSources,
  removeMarketSource,
  reorderMarketSources,
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

/** Storage whose reads blow up (quarantined webview / privacy mode). */
class QuarantinedStorage extends MemoryStorage {
  getItem(): string | null { throw new Error('storage quarantined') }
}

/** Storage whose writes blow up (quota exhausted). */
class FullStorage extends MemoryStorage {
  setItem(): void { throw new Error('quota exceeded') }
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

  it('round-trips: a fresh load (new shelf instance) reads adds back, and stays consistent after remove', () => {
    const storage = new MemoryStorage()
    // "instance 1": a shelf that loaded before anything was stored
    const withAdded = addMarketSource(storage, loadMarketSources(storage), {
      name: 'A',
      url: 'https://a.example.com/m.json',
    })
    expect(withAdded).toHaveLength(1)

    // "instance 2": a brand-new mount reading the same storage back
    const reloaded = loadMarketSources(storage)
    expect(reloaded).toHaveLength(1)
    expect(reloaded[0]).toMatchObject({
      name: 'A',
      url: 'https://a.example.com/m.json',
      builtIn: false,
    })

    // removing from the reloaded list, a third load stays in sync
    const id = reloaded[0]?.id
    expect(id).toBeDefined()
    if (id === undefined) return
    const afterRemove = removeMarketSource(storage, reloaded, id)
    expect(afterRemove).toHaveLength(0)
    expect(loadMarketSources(storage)).toEqual(afterRemove)
  })

  it('never clobbers persisted sources when invoked with a stale or empty list', () => {
    const storage = new MemoryStorage()
    const seeded = addMarketSource(storage, loadMarketSources(storage), {
      name: 'A',
      url: 'https://a.example.com/m.json',
    })
    addMarketSource(storage, seeded, { name: 'B', url: 'https://b.example.com/m.json' })
    expect(loadMarketSources(storage)).toHaveLength(2)

    // a second shelf instance still holding its pre-add (empty) state fires
    // a remove / edit / reorder — the write must not wipe what the first
    // instance already saved (read-modify-write, never blind overwrite)
    removeMarketSource(storage, [], 'no-such-id')
    expect(loadMarketSources(storage)).toHaveLength(2)
    updateMarketSource(storage, [], 'no-such-id', {
      name: 'X',
      url: 'https://x.example.com/m.json',
    })
    expect(loadMarketSources(storage)).toHaveLength(2)
    reorderMarketSources(storage, [], [])
    expect(loadMarketSources(storage)).toHaveLength(2)
  })

  it('degrades to an empty list when storage reads throw (no exception into render)', () => {
    const storage = new QuarantinedStorage()
    expect(() => loadMarketSources(storage)).not.toThrow()
    expect(loadMarketSources(storage)).toEqual([])
  })

  it('keeps the in-memory result intact when a write fails (quota)', () => {
    const storage = new FullStorage()
    expect(() =>
      addMarketSource(storage, loadMarketSources(storage), {
        name: 'A',
        url: 'https://a.example.com/m.json',
      }),
    ).not.toThrow()
    const next = addMarketSource(storage, loadMarketSources(storage), {
      name: 'A',
      url: 'https://a.example.com/m.json',
    })
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ name: 'A', url: 'https://a.example.com/m.json' })
  })
})
