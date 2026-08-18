import { describe, expect, it } from 'vitest'
import { SettingsConflictError } from '@deepseek-ai/dsh-settings'
import { createBridgeHandler, DEFAULT_BRIDGE_CONFIG, type SettingsLike } from '../src/settings-bridge.ts'

/**
 * Fake settings service：describe/get/write/update/replace/mutate 的最小内存实现。
 * update/replace/mutate 与官方 revision 协议同构（冲突抛 SettingsConflictError 名）。
 */
function fakeSettings(sections: Record<string, unknown>): SettingsLike & { calls: string[] } {
  const revisions = new Map<string, number>(Object.keys(sections).map(ns => [ns, 1]))
  const guard = async (ns: string, expected: number | undefined, apply: () => void) => {
    const rev = revisions.get(ns) ?? 0
    if (expected !== undefined && expected !== rev) throw new SettingsConflictError(ns as ConstructorParameters<typeof SettingsConflictError>[0], expected, rev)
    apply()
    revisions.set(ns, rev + 1)
  }
  const base = {
    writable: true,
    documentPath: '/tmp/fake-settings.json',
    calls: [] as string[],
    get(ns: string) { return sections[ns] },
    async write(ns: string, input: Record<string, unknown>, _mode: 'merge', expected: number | undefined) {
      base.calls.push(`write:${ns}:${JSON.stringify(input)}@${String(expected)}`)
      await guard(ns, expected, () => { sections[ns] = { ...(sections[ns] as object), ...input } })
    },
    async update(ns: string, patch: unknown, expected: number | undefined) {
      base.calls.push(`update:${ns}:${JSON.stringify(patch)}@${String(expected)}`)
      await guard(ns, expected, () => { sections[ns] = { ...(sections[ns] as object), ...(patch as object) } })
    },
    async replace(_ns: string, _section: unknown, _expected: number | undefined) {
      throw new Error('fixture: replace not wired')
    },
    async mutate(ns: string, ops: readonly unknown[], expected: number | undefined) {
      base.calls.push(`mutate:${ns}:${JSON.stringify(ops)}@${String(expected)}`)
      const section = { ...(sections[ns] as Record<string, unknown>) }
      for (const op of ops as { op: string; path: string[]; value?: unknown }[]) {
        if (op.op === 'set' && op.path.length === 1) section[op.path[0]!] = op.value
        else if (op.op === 'unset' && op.path.length === 1) delete section[op.path[0]!]
      }
      await guard(ns, expected, () => { sections[ns] = section })
    },
    describe() {
      return Object.keys(sections).map(ns => ({
        ns,
        schema: { type: 'object' },
        value: sections[ns],
        applies: 'live',
        secrets: [],
        revision: revisions.get(ns),
      }))
    },
  }
  return base as SettingsLike & { calls: string[] }
}

describe('settings bridge handler（官方面透传）', () => {
  it('describe mirrors the apiproxy view (writable/hasDocument/namespaceView)', async () => {
    const s = fakeSettings({ 'ui-theme': { preference: 'dark' } })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('describe', { payload: {} })
    if (!result.ok) throw new Error('describe should succeed')
    const view = result.value as { writable: boolean; hasDocument: boolean; namespaces: { ns: string; schema: unknown; applies: unknown; secrets: unknown[]; revision: number | undefined }[] }
    expect(view.writable).toBe(true)
    expect(view.hasDocument).toBe(true)
    expect(view.namespaces.map(n => n.ns)).toEqual(['ui-theme'])
    expect(view.namespaces[0]?.revision).toBe(1)
    expect(view.namespaces[0]?.secrets).toEqual([])
  })

  it('mutate passes ops through and returns the new namespace view', async () => {
    const s = fakeSettings({ 'ui-theme': { preference: 'dark' } })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('mutate', { payload: { ns: 'ui-theme', ops: [{ op: 'set', path: ['preference'], value: 'light' }], expectedRevision: 1 } })
    expect(result.ok).toBe(true)
    expect(s.calls).toEqual(['mutate:ui-theme:[{"op":"set","path":["preference"],"value":"light"}]@1'])
    expect(s.get('ui-theme')).toEqual({ preference: 'light' })
    if (result.ok) expect((result.value as { revision: number }).revision).toBe(2)
  })

  it('mutate conflicts map to settings-conflict with expected/actual', async () => {
    const s = fakeSettings({ 'ui-theme': { preference: 'dark' } })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('mutate', { payload: { ns: 'ui-theme', ops: [{ op: 'set', path: ['preference'], value: 'x' }], expectedRevision: 99 } })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('settings-conflict')
      expect(result.error.details).toMatchObject({ ns: 'ui-theme', expected: 99, actual: 1 })
    }
  })

  it('non-conflict write failures map to settings-rejected', async () => {
    const s = fakeSettings({ 'ui-theme': {} })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('replace', { payload: { ns: 'ui-theme', section: { preference: 'x' } } })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('settings-rejected')
  })

  it('default config exposes every namespace (full plane)', async () => {
    const s = fakeSettings({ 'ui-theme': {}, 'agent-loop': {}, 'llm-deepseek': {} })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('describe', { payload: {} })
    if (!result.ok) throw new Error('describe should succeed')
    expect((result.value as { namespaces: { ns: string }[] }).namespaces).toHaveLength(3)
  })

  it('narrowed whitelist filters describe and rejects writes', async () => {
    const s = fakeSettings({ 'ui-theme': {}, 'agent-loop': {} })
    const handle = createBridgeHandler(s, { enabled: true, namespaces: ['ui-theme'] })
    const desc = await handle('describe', { payload: {} })
    if (!desc.ok) throw new Error('describe should succeed')
    expect((desc.value as { namespaces: { ns: string }[] }).namespaces.map(n => n.ns)).toEqual(['ui-theme'])
    expect((await handle('mutate', { payload: { ns: 'agent-loop', ops: [] } })).ok).toBe(false)
  })
})

describe('settings bridge handler（旧窄桥 list/set，兼容保留）', () => {
  it('lists namespaces', async () => {
    const s = fakeSettings({ 'ui-theme': { preference: 'dark' } })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('list', {})
    if (!result.ok) throw new Error('list should succeed')
    const view = result.value as { namespaces: Record<string, { value: { preference?: string } }> }
    expect(view.namespaces['ui-theme']?.value.preference).toBe('dark')
  })

  it('writes with the revision protocol', async () => {
    const s = fakeSettings({ 'ui-theme': { preference: 'dark' } })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('set', { ns: 'ui-theme', fields: { preference: 'light' }, revision: 1 })
    expect(result.ok).toBe(true)
    expect(s.calls).toEqual(['write:ui-theme:{"preference":"light"}@1'])
    expect(s.get('ui-theme')).toEqual({ preference: 'light' })
  })

  it('rejects non-whitelisted namespaces', async () => {
    const s = fakeSettings({ 'credentials-x': { key: 'sk' } })
    const handle = createBridgeHandler(s, { enabled: true, namespaces: ['ui-theme'] })
    const result = await handle('set', { ns: 'credentials-x', fields: { key: 'leak' } })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.message).toContain('白名单')
  })

  it('disabled bridge answers with a clear error', async () => {
    const s = fakeSettings({ 'ui-theme': {} })
    const handle = createBridgeHandler(s, { enabled: false, namespaces: DEFAULT_BRIDGE_CONFIG.namespaces })
    const result = await handle('list', {})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.message).toContain('关闭')
  })

  it('surfaces write conflicts (revision mismatch)', async () => {
    const s = fakeSettings({ 'ui-theme': { preference: 'dark' } })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('set', { ns: 'ui-theme', fields: { preference: 'x' }, revision: 99 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.message).toContain('changed since')
  })

  it('rejects unknown operations and malformed payloads', async () => {
    const handle = createBridgeHandler(fakeSettings({}), DEFAULT_BRIDGE_CONFIG)
    expect((await handle('nonsense', {})).ok).toBe(false)
    expect((await handle('set', { ns: 'ui-theme' })).ok).toBe(false)
    expect((await handle('set', { ns: '', fields: {} })).ok).toBe(false)
    expect((await handle('mutate', { payload: { ops: [] } })).ok).toBe(false)
  })
})
