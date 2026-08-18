import { describe, expect, it } from 'vitest'
import { createArchiveManagerHandler, type ArchiveManagerDeps } from '../src/index.ts'
import { RestoreError, type WorkspaceDomainStateLike, type WorkspaceRegistryLike } from '../src/restore.ts'

interface WorkspaceRegistryStub extends WorkspaceRegistryLike {
  state: WorkspaceDomainStateLike
  saved: number
}

function fakeRegistry(initial: WorkspaceDomainStateLike, knownIds: readonly string[] = ['sess-live']): WorkspaceRegistryStub {
  const stub: WorkspaceRegistryStub = {
    state: initial,
    saved: 0,
    requireState() { return this.state },
    async enqueueOperation<T>(op: () => Promise<T>) { return op() },
    async setState(s) { this.state = s; this.saved++; return void 0 },
    async sessionKnown(id) { return knownIds.includes(id) },
  }
  return stub
}

const liveSession = {
  header: { id: 'live-1' },
  events: [
    { type: 'user/message', data: { role: 'user', content: [{ type: 'text', text: 'hi there' }] } },
    { type: 'assistant/message', data: { message: { role: 'assistant', content: [{ type: 'text', text: 'hello back' }] } } },
  ],
}

const fakeSessions = {
  get(id: string) { return id === 'live-1' ? liveSession : undefined },
}

const archivedHistory = {
  events: [
    { type: 'user/message', data: { role: 'user', content: [{ type: 'text', text: 'archived turn 1' }] } },
    { type: 'assistant/message', data: { message: { role: 'assistant', content: [{ type: 'text', text: 'archived turn 2' }] } } },
  ],
}

function fakePersistence(throwOnInspect = false): {
  inspect: ArchiveManagerDeps['sessionPersistence']['inspect']
  list: ArchiveManagerDeps['sessionPersistence']['list']
} {
  return {
    async inspect(id: string) {
      if (throwOnInspect) throw new Error('boom')
      if (id !== 'arch-1') throw new Error(`unexpected inspect ${id}`)
      return { meta: { id, cwd: '/tmp', title: 'Archived Session' }, events: archivedHistory.events }
    },
    async list() { return [] },
  }
}

const baseState: WorkspaceDomainStateLike = { initialized: true, workspaceIds: ['ws'], archivedSessionIds: ['arch-1'] }

describe('createArchiveManagerHandler — restore', () => {
  it('restores an archived session and returns the remaining ids', async () => {
    const reg = fakeRegistry(baseState, ['arch-1'])
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: reg,
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(),
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('restore', { sessionId: 'arch-1' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.restoredSessionId).toBe('arch-1')
      expect(result.value.remainingArchivedIds).toEqual([])
      expect(reg.saved).toBe(1)
    }
  })

  it('returns session-not-found when storage does not know the session', async () => {
    const reg = fakeRegistry(baseState, []) // nothing known
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: reg,
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(),
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('restore', { sessionId: 'ghost' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('session-not-found')
  })

  it('returns bad-request when session is known but not archived', async () => {
    const reg = fakeRegistry({ ...baseState, archivedSessionIds: [] }, ['live-1'])
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: reg,
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(),
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('restore', { sessionId: 'live-1' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('bad-request')
  })

  it('rejects payloads without sessionId', async () => {
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: fakeRegistry(baseState),
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(),
    }
    const handler = createArchiveManagerHandler(deps)
    expect((await handler('restore', {})).ok).toBe(false)
    expect((await handler('restore', { sessionId: '' })).ok).toBe(false)
  })
})

describe('createArchiveManagerHandler — export-md', () => {
  it('renders live session events from memory without touching persistence', async () => {
    let persistCalls = 0
    const persistence = {
      async inspect() { persistCalls++; return { meta: { id: '', cwd: undefined as string | undefined }, events: [] } },
      async list() { return [] },
    }
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: fakeRegistry(baseState),
      sessions: fakeSessions,
      sessionPersistence: persistence,
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('export-md', { sessionId: 'live-1' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.messageCount).toBe(2)
      expect(result.value.markdown).toContain('hi there')
      expect(result.value.markdown).toContain('hello back')
    }
    expect(persistCalls).toBe(0)
  })

  it('renders archived session events from persistence', async () => {
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: fakeRegistry(baseState),
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(),
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('export-md', { sessionId: 'arch-1' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.messageCount).toBe(2)
      expect(result.value.markdown).toContain('archived turn 1')
      expect(result.value.markdown).toContain('# Archived Session')
    }
  })

  it('returns session-not-found when inspect fails or cwd is missing', async () => {
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: fakeRegistry(baseState),
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(true),
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('export-md', { sessionId: 'arch-1' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('session-not-found')
  })

  it('rejects unknown operations', async () => {
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: fakeRegistry(baseState),
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(),
    }
    const handler = createArchiveManagerHandler(deps)
    expect((await handler('wat', { sessionId: 'x' })).ok).toBe(false)
  })
})

describe('createArchiveManagerHandler — list', () => {
  it('returns an empty list when no sessions are archived', async () => {
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: fakeRegistry({ ...baseState, archivedSessionIds: [] }),
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(),
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('list', { sessionId: 'unused' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.items).toEqual([])
  })

  it('returns one summary per archived id, sorted by recency', async () => {
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: fakeRegistry({ ...baseState, archivedSessionIds: ['arch-1', 'arch-2'] }),
      sessions: fakeSessions,
      sessionPersistence: {
        async inspect(id: string) {
          if (id === 'arch-1') return { meta: { id, cwd: '/tmp', title: 'First', updatedAt: '2026-01-01T00:00:00Z' }, events: archivedHistory.events }
          return { meta: { id, cwd: '/tmp', title: 'Second', updatedAt: '2026-03-01T00:00:00Z' }, events: [] }
        },
        async list() { return [] },
      },
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('list', { sessionId: 'unused' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.items.map(i => i.title)).toEqual(['Second', 'First'])
      expect(result.value.items[0]?.messageCount).toBe(0)
      expect(result.value.items[1]?.messageCount).toBe(2)
    }
  })
})

describe('createArchiveManagerHandler — info', () => {
  it('returns events + metadata for an archived session', async () => {
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: fakeRegistry(baseState),
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(),
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('info', { sessionId: 'arch-1' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.title).toBe('Archived Session')
      expect(result.value.events.length).toBe(2)
    }
  })

  it('returns session-not-found when inspect throws', async () => {
    const deps: ArchiveManagerDeps = {
      workspaceRegistry: fakeRegistry(baseState),
      sessions: fakeSessions,
      sessionPersistence: fakePersistence(true),
    }
    const handler = createArchiveManagerHandler(deps)
    const result = await handler('info', { sessionId: 'arch-1' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('session-not-found')
  })
})

// Touch RestoreError path indirectly via the live-but-not-archived case above.