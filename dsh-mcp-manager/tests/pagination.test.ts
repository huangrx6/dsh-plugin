import { describe, expect, it } from 'vitest'
import { PAGE_SIZE, slicePage } from '../src/client/pagination.ts'

describe('slicePage (first-N slice for progressive lists)', () => {
  it('returns the first count entries', () => {
    expect(slicePage([1, 2, 3, 4, 5], 2)).toEqual([1, 2])
    expect(slicePage(['a', 'b', 'c'], 1)).toEqual(['a'])
  })

  it('returns the list itself (same reference) when it already fits', () => {
    const list = [1, 2, 3] as const
    expect(slicePage(list, 3)).toBe(list)
    expect(slicePage(list, 100)).toBe(list)
  })

  it('clamps zero and negative counts to an empty page', () => {
    expect(slicePage([1, 2, 3], 0)).toEqual([])
    expect(slicePage([1, 2, 3], -5)).toEqual([])
  })

  it('handles empty lists', () => {
    expect(slicePage([], PAGE_SIZE)).toEqual([])
  })

  it('non-integer counts never leak a partial entry', () => {
    expect(slicePage([1, 2, 3], 1.9)).toEqual([1])
  })

  it('first batch is PAGE_SIZE entries of a huge list', () => {
    const big = Array.from({ length: 500 }, (_, i) => i)
    expect(slicePage(big, PAGE_SIZE)).toHaveLength(60)
    expect(slicePage(big, PAGE_SIZE + PAGE_SIZE)).toHaveLength(120)
    // grows in whole pages until the list fits, then returns the list itself
    expect(slicePage(big, 500)).toBe(big)
  })

  it('PAGE_SIZE stays the agreed first-batch size', () => {
    expect(PAGE_SIZE).toBe(60)
  })
})
