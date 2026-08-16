import { describe, expect, it } from 'vitest'
import { deleteMedia, isLocalMedia, loadMedia, saveMedia } from '../src/client/media.ts'

describe('local background media', () => {
  it('recognizes marker URLs and passes remote ones through', () => {
    expect(isLocalMedia('idb:m123abc')).toBe(true)
    expect(isLocalMedia('https://example.com/a.jpg')).toBe(false)
    expect(isLocalMedia('')).toBe(false)
  })

  it('resolves undefined for remote or missing blobs', async () => {
    expect(await loadMedia('https://example.com/a.jpg')).toBeUndefined()
    expect(await loadMedia('idb:missing-key')).toBeUndefined()
    await expect(deleteMedia('https://example.com/a.jpg')).resolves.toBeUndefined()
  })

  it('round-trips a blob through the marker scheme when storage exists', async () => {
    if (typeof indexedDB === 'undefined') return
    const marker = await saveMedia(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }))
    expect(isLocalMedia(marker)).toBe(true)
    const blob = await loadMedia(marker)
    expect(blob).toBeInstanceOf(Blob)
    await deleteMedia(marker)
    expect(await loadMedia(marker)).toBeUndefined()
  })
})
