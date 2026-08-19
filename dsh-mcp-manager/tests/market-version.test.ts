import { describe, expect, it } from 'vitest'
import { normalizeVersion, versionsDiffer } from '../src/client/market/version.ts'

describe('market version alignment', () => {
  it('normalizes decoration: whitespace and a leading v', () => {
    expect(normalizeVersion('v1.2.0')).toBe('1.2.0')
    expect(normalizeVersion('  V2  ')).toBe('2')
    expect(normalizeVersion('1.2.0')).toBe('1.2.0')
  })

  it('never reports a difference when either side is unknown', () => {
    expect(versionsDiffer(undefined, '1.0.0')).toBe(false)
    expect(versionsDiffer('1.1.0', undefined)).toBe(false)
    expect(versionsDiffer(undefined, undefined)).toBe(false)
  })

  it('treats equivalent spellings as the same version', () => {
    expect(versionsDiffer('v1.2.0', '1.2.0')).toBe(false)
    expect(versionsDiffer(' 1.2.0 ', 'v1.2.0')).toBe(false)
  })

  it('flags real differences and ignores empty strings', () => {
    expect(versionsDiffer('1.2.0', '1.3.0')).toBe(true)
    expect(versionsDiffer('2', 'v2.1')).toBe(true)
    expect(versionsDiffer('v', '1.0.0')).toBe(false)
    expect(versionsDiffer('   ', '')).toBe(false)
  })
})
