import { describe, expect, it } from 'vitest'
import { createBridgeHandler, DEFAULT_BRIDGE_CONFIG, type SettingsLike } from '../src/settings-bridge.ts'

/** Fake settings service：describe/get/write 的最小内存实现。 */
function fakeSettings(sections: Record<string, unknown>): SettingsLike & { calls: string[] } {
  const revisions = new Map<string, number>(Object.keys(sections).map(ns => [ns, 1]))
  return {
    calls: [],
    get(ns: string) { return sections[ns] },
    async write(ns, input, _mode, expected) {
      this.calls.push(`write:${ns}:${JSON.stringify(input)}@${String(expected)}`)
      const rev = revisions.get(ns) ?? 0
      if (expected !== undefined && expected !== rev) throw new Error('revision mismatch')
      sections[ns] = { ...(sections[ns] as object), ...input }
      revisions.set(ns, rev + 1)
    },
    describe() {
      return Object.keys(sections).map(ns => ({ ns, revision: revisions.get(ns) }))
    },
  } as SettingsLike & { calls: string[] }
}

describe('settings bridge handler', () => {
  it('lists only whitelisted namespaces', async () => {
    const s = fakeSettings({ 'ui-theme': { preference: 'dark' }, 'credentials-x': { key: 'sk-1' } })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('list', {})
    if (!result.ok) throw new Error('list should succeed')
    const view = result.value as { namespaces: Record<string, { value: { preference?: string } }> }
    expect(Object.keys(view.namespaces)).toEqual(['ui-theme'])
    expect(view.namespaces['ui-theme']?.value.preference).toBe('dark')
  })

  it('writes a whitelisted namespace with the revision protocol', async () => {
    const s = fakeSettings({ 'ui-theme': { preference: 'dark' } })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
    const result = await handle('set', { ns: 'ui-theme', fields: { preference: 'light' }, revision: 1 })
    expect(result.ok).toBe(true)
    expect(s.calls).toEqual(['write:ui-theme:{"preference":"light"}@1'])
    expect(s.get('ui-theme')).toEqual({ preference: 'light' })
  })

  it('rejects non-whitelisted namespaces', async () => {
    const s = fakeSettings({ 'credentials-x': { key: 'sk' } })
    const handle = createBridgeHandler(s, DEFAULT_BRIDGE_CONFIG)
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
    if (!result.ok) expect(result.error.message).toContain('revision mismatch')
  })

  it('rejects unknown operations and malformed payloads', async () => {
    const handle = createBridgeHandler(fakeSettings({}), DEFAULT_BRIDGE_CONFIG)
    expect((await handle('nonsense', {})).ok).toBe(false)
    expect((await handle('set', { ns: 'ui-theme' })).ok).toBe(false)
    expect((await handle('set', { ns: '', fields: {} })).ok).toBe(false)
  })

  it('custom whitelist narrows the bridge further', async () => {
    const s = fakeSettings({ 'ui-theme': {}, 'ui-onboarding': {} })
    const handle = createBridgeHandler(s, { enabled: true, namespaces: ['ui-theme'] })
    const result = await handle('set', { ns: 'ui-onboarding', fields: {} })
    expect(result.ok).toBe(false)
  })
})
