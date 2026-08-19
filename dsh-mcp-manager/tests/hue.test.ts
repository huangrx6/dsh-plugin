import { describe, expect, it } from 'vitest'
import { hueStyle, nameHue } from '../src/client/hue.ts'

describe('nameHue', () => {
  it('maps names to stable hues in range', () => {
    expect(nameHue('')).toBeGreaterThanOrEqual(0)
    expect(nameHue('')).toBeLessThan(360)
    for (const name of ['filesystem', 'github', 'postgres', 'brave-search']) {
      const hue = nameHue(name)
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
      expect(nameHue(name)).toBe(hue)
    }
    // distinct names should not all collapse onto one hue
    const hues = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(nameHue))
    expect(hues.size).toBeGreaterThan(1)
    expect(hueStyle('github')).toEqual({ '--dshmcp-hue': String(nameHue('github')) })
  })
})
