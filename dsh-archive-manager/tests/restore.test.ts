import { describe, expect, it } from 'vitest'
import { restoreArchivedSession, RestoreError, type WorkspaceRegistryLike, type WorkspaceDomainStateLike } from '../src/restore.ts'

/** Minimal fake of WorkspaceRegistry — just enough to exercise the logic. */
function fakeRegistry(initial: WorkspaceDomainStateLike, knownIds: readonly string[] = []): WorkspaceRegistryLike & { savedStates: WorkspaceDomainStateLike[] } {
  const savedStates: WorkspaceDomainStateLike[] = []
  return {
    savedStates,
    requireState() { return initial },
    async enqueueOperation<T>(op: () => Promise<T>): Promise<T> { return op() },
    async setState(state) { savedStates.push(state); return void 0 },
    async sessionKnown(id) { return knownIds.includes(id) },
  }
}

describe('restoreArchivedSession', () => {
  const archived = ['sess-1', 'sess-2', 'sess-3']
  const baseState: WorkspaceDomainStateLike = {
    initialized: true,
    workspaceIds: ['ws-a'],
    archivedSessionIds: archived,
  }

  it('removes the sessionId from archivedSessionIds and persists the new state', async () => {
    const reg = fakeRegistry(baseState, ['sess-1', 'sess-2'])
    const result = await restoreArchivedSession(reg, 'sess-2')
    expect(result.restoredSessionId).toBe('sess-2')
    expect(result.remainingArchivedIds).toEqual(['sess-1', 'sess-3'])
    expect(reg.savedStates).toHaveLength(1)
    expect(reg.savedStates[0]?.archivedSessionIds).toEqual(['sess-1', 'sess-3'])
  })

  it('does not mutate the input state array', async () => {
    const reg = fakeRegistry(baseState, ['sess-1'])
    const before = baseState.archivedSessionIds.slice()
    await restoreArchivedSession(reg, 'sess-1')
    expect(baseState.archivedSessionIds).toEqual(before)
  })

  it('throws session-not-found when storage does not know the session', async () => {
    const reg = fakeRegistry(baseState, [])
    await expect(restoreArchivedSession(reg, 'sess-ghost')).rejects.toBeInstanceOf(RestoreError)
    await expect(restoreArchivedSession(reg, 'sess-ghost')).rejects.toMatchObject({ code: 'session-not-found' })
    expect(reg.savedStates).toHaveLength(0)
  })

  it('throws not-archived when the session is live (id not in archived list)', async () => {
    const reg = fakeRegistry(baseState, ['sess-live'])
    await expect(restoreArchivedSession(reg, 'sess-live')).rejects.toBeInstanceOf(RestoreError)
    await expect(restoreArchivedSession(reg, 'sess-live')).rejects.toMatchObject({ code: 'not-archived' })
    expect(reg.savedStates).toHaveLength(0)
  })

  it('handles restoring the last archived session (list becomes empty)', async () => {
    const single: WorkspaceDomainStateLike = { ...baseState, archivedSessionIds: ['sess-only'] }
    const reg = fakeRegistry(single, ['sess-only'])
    const result = await restoreArchivedSession(reg, 'sess-only')
    expect(result.remainingArchivedIds).toEqual([])
    expect(reg.savedStates[0]?.archivedSessionIds).toEqual([])
  })
})