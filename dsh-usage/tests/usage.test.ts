import { describe, expect, it } from 'vitest'
import { DSH_USAGE_CHANNEL } from '../src/contracts.ts'

describe('usage contract', () => {
  it('exposes the RPC channel name', () => {
    expect(DSH_USAGE_CHANNEL).toBe('dsh-usage')
  })
})
