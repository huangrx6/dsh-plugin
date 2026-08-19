/**
 * dsh-archive-manager — host-side runtime.
 *
 * Registers a single trusted-host RPC channel exposing two operations:
 *  - `restore`        : unarchive one session (drops its id from the workspace's
 *                       `archivedSessionIds` list, persisting through the
 *                       official `enqueueOperation → setState` flow that also
 *                       broadcasts `host/archived-sessions-changed`)
 *  - `export-md`      : render the session's history events as a Markdown
 *                       transcript (user + assistant messages, tool calls
 *                       as collapsible details, tool results as quotes)
 *
 * History events are read straight from `ctx.sessionPersistence.inspect`
 * — the same primitive that the official `/api/sessions.history` uses
 * internally, no presenter needed for a transcript.
 *
 * The official `GET /api/session.export?sessionId=…` (zip of the jsonl log
 * plus referenced media) is exposed by the host unconditionally; the
 * client side talks to it directly via `fetch` and does not need a host
 * bridge entry.
 */
import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import type { ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection'
import { DSH_ARCHIVE_MANAGER_CHANNEL, type ArchiveManagerPayload, type ArchivedSummary } from './contracts.ts'
import { restoreArchivedSession, RestoreError, type WorkspaceRegistryLike, type WorkspaceDomainStateLike } from './restore.ts'
import { renderHistoryToMarkdown, type HistoryResponseLike, type HistoryEntryLike } from './export-md.ts'

// Note: `WorkspaceRegistryLike` and `WorkspaceDomainStateLike` are
// imported from ./restore.ts so the same types drive both files; this
// keeps the structural shape Cordis enforces around state mutations
// (enqueueOperation's typed setState parameter) compatible with the
// unarchive helper.

interface SessionsLike {
  get(id: string): { readonly header: { readonly id: string }; readonly events: readonly unknown[] } | undefined
}

interface SessionPersistenceLike {
  inspect(id: string, signal?: AbortSignal): Promise<{ meta: { id: string; cwd?: string; title?: string; createdAt?: string; updatedAt?: string }; events: readonly unknown[] }>
  list(signal?: AbortSignal): Promise<readonly { readonly id: string; readonly cwd?: string }[]>
}

function ok(value: unknown): RpcResult<unknown> { return { ok: true, value } }
function bad(message: string): RpcResult<unknown> {
  return { ok: false, error: { code: 'bad-request', message, details: { issues: [] } } }
}
type RpcErr = NonNullable<RpcResult<unknown> extends { ok: false; error: infer E } ? E : never>
function notFound(message: string): RpcResult<unknown> {
  // 'session-not-found' is the canonical wire code for missing sessions.
  const error = { code: 'session-not-found', message, details: {} } as RpcErr
  return { ok: false, error }
}
function internal(message: string): RpcResult<unknown> {
  return { ok: false, error: { code: 'internal', message, details: {} } }
}

export interface ArchiveManagerDeps {
  readonly workspaceRegistry: WorkspaceRegistryLike
  readonly sessions: SessionsLike
  readonly sessionPersistence: SessionPersistenceLike
}

/**
 * Build the dispatcher used by the host's `connection.rpc.handle` hook.
 * Pulled out for testability: tests inject a fake deps (no cordis needed).
 */
/**
 * Pure dispatcher: takes an op name and payload, returns the right result.
 * Tests call this directly with (opName, payload).
 */
export function createArchiveManagerHandler(deps: ArchiveManagerDeps) {
  return async (op: string, payload: unknown): Promise<RpcResult<unknown>> => {
    // The wire shape from the client is { op, payload: { sessionId, ... } }
    // and the host passes that whole envelope as `payload`. For unit-test
    // ergonomics we also accept the flat shape { sessionId }.
    const candidate = payload as { sessionId?: unknown; payload?: { sessionId?: unknown } } | null
    const sessionId = typeof candidate?.sessionId === 'string'
      ? candidate.sessionId
      : (typeof candidate?.payload?.sessionId === 'string' ? candidate.payload.sessionId : '')

    if (op === 'restore' || op === 'export-md' || op === 'info') {
      if (sessionId === '') return bad('sessionId 缺失或为空')
    }

    if (op === 'restore') {
      try {
        const outcome = await restoreArchivedSession(deps.workspaceRegistry, sessionId)
        return ok({
          restoredSessionId: outcome.restoredSessionId,
          remainingArchivedIds: outcome.remainingArchivedIds,
        })
      } catch (error) {
        if (error instanceof RestoreError) {
          if (error.code === 'session-not-found') return notFound(error.message)
          if (error.code === 'not-archived') return bad(error.message)
        }
        return internal(error instanceof Error ? error.message : String(error))
      }
    }

    if (op === 'export-md') {
      // Live (attached) session — its events live in memory.
      const live = deps.sessions.get(sessionId)
      let entries: HistoryEntryLike[]
      let title: string | undefined
      if (live !== undefined) {
        entries = live.events as unknown as HistoryEntryLike[]
      } else {
        // Cold (archived, persisted) session — read from sessionPersistence.
        let inspected
        try {
          inspected = await deps.sessionPersistence.inspect(sessionId)
        } catch {
          return notFound(`session "${sessionId}" 不存在或不可读`)
        }
        if (inspected.meta.cwd === undefined) return notFound(`session "${sessionId}" 不存在或不可读`)
        entries = inspected.events as unknown as HistoryEntryLike[]
        title = inspected.meta.title
      }
      const history: HistoryResponseLike = { events: entries }
      const header: { sessionId: string; title?: string } = title === undefined ? { sessionId } : { sessionId, title }
      const rendered = renderHistoryToMarkdown(history, header)
      return ok({ markdown: rendered.markdown, sessionId, messageCount: rendered.messageCount })
    }

    if (op === 'list') {
      const archived: readonly string[] = deps.workspaceRegistry.requireState().archivedSessionIds
      const eventType = (e: unknown): string | undefined => {
        if (e === null || typeof e !== 'object') return undefined
        if ('event' in e && typeof (e.event as { type?: unknown }).type === 'string') return (e.event as { type: string }).type
        if ('type' in e && typeof (e as { type?: unknown }).type === 'string') return (e as { type: string }).type
        return undefined
      }
      const countMessages = (events: readonly unknown[]): number => {
        let n = 0
        for (const e of events) {
          const t = eventType(e)
          if (t === 'user/message' || t === 'assistant/message') n++
        }
        return n
      }
      // The workspace registry is the authoritative archive set; we
      // inspect every id without pre-filtering on sessionPersistence.list
      // because a cold session is by definition in the persistence
      // store but list() may still be loading or scoped to cwd-bearing
      // entries only.
      const items: ArchivedSummary[] = []
      for (const id of archived) {
        const live = deps.sessions.get(id)
        if (live !== undefined) {
          items.push({ id, title: id, updatedAt: Date.now(), messageCount: countMessages(live.events) })
          continue
        }
        let inspected
        try {
          inspected = await deps.sessionPersistence.inspect(id)
        } catch {
          continue
        }
        if (inspected.meta.cwd === undefined) continue
        items.push({
          id,
          title: inspected.meta.title ?? id,
          updatedAt: Date.parse(inspected.meta.updatedAt ?? '') || Date.now(),
          messageCount: countMessages(inspected.events),
        })
      }
      items.sort((a, b) => b.updatedAt - a.updatedAt)
      return ok({ items })
    }

    if (op === 'info') {
      const live = deps.sessions.get(sessionId)
      let entries: readonly unknown[]
      let title: string
      let updatedAt: number
      if (live !== undefined) {
        entries = live.events
        title = sessionId
        updatedAt = Date.now()
      } else {
        let inspected
        try {
          inspected = await deps.sessionPersistence.inspect(sessionId)
        } catch {
          return notFound(`session "${sessionId}" 不存在或不可读`)
        }
        if (inspected.meta.cwd === undefined) return notFound(`session "${sessionId}" 不存在或不可读`)
        entries = inspected.events
        title = inspected.meta.title ?? sessionId
        updatedAt = Date.parse(inspected.meta.updatedAt ?? '') || Date.now()
      }
      return ok({ sessionId, title, updatedAt, events: entries })
    }

    return bad(`未知操作：${op}`)
  }
}

/**
 * Host-level RPC handler: receives (endpoint, payload) from
 * `connection.rpc.handle`. Dispatches on the `op` field in the payload
 * (since the whole plugin shares a single endpoint path 'archive' and
 * uses an `op` discriminator inside the payload).
 */
function hostHandler(deps: ArchiveManagerDeps) {
  const inner = createArchiveManagerHandler(deps)
  return async (endpoint: string, payload: unknown): Promise<RpcResult<unknown>> => {
    if (endpoint !== 'archive') return { ok: false, error: { code: 'bad-request', message: `unknown endpoint "${endpoint}"`, details: { issues: [] } } }
    const op = typeof (payload as { op?: unknown })?.op === 'string' ? (payload as { op: string }).op : ''
    if (op === '') return { ok: false, error: { code: 'bad-request', message: 'payload 缺少 op 字段', details: { issues: [] } } }
    return inner(op, payload)
  }
}

/**
 * Host plugin entry. Registers a trusted-host RPC handler under the
 * `dsh-archive-manager` channel. Required services are resolved
 * structurally off `ctx` — see `ArchiveManagerDeps`.
 */
export const name = 'dsh-archive-manager'

/** Required services — declared for Cordis runtime-checked dependency wiring. */
export const inject = ['connection', 'workspaceRegistry', 'sessions', 'sessionPersistence']

export function apply(ctx: Context): void {
  // ctx.workspaceRegistry / ctx.sessions / ctx.sessionPersistence /
  // ctx.connection are not in the public Cordis Context type — they are
  // service-shaped extensions the host dsh composition provides at
  // runtime. We reach them through an `unknown` bridge so the type
  // checker accepts them; runtime errors surface as `undefined` and the
  // safe-typed dispatch path above will produce a clean bad-request.
  const ext = ctx as unknown as {
    workspaceRegistry: WorkspaceRegistryLike
    sessions: SessionsLike
    sessionPersistence: SessionPersistenceLike
    connection: {
      rpc: {
        handle: (
          channel: string,
          handler: ConnectionRpcHandler,
          options: { authority: 'trusted-host' | 'loopback' },
        ) => Promise<unknown>
      }
    }
  }
  const deps: ArchiveManagerDeps = {
    workspaceRegistry: ext.workspaceRegistry,
    sessions: ext.sessions,
    sessionPersistence: ext.sessionPersistence,
  }
  const handler = hostHandler(deps)
  const connection = ctx.connection
  ctx.effect(
    () => connection.rpc.handle(
      DSH_ARCHIVE_MANAGER_CHANNEL,
      (endpoint: string, payload: unknown, _signal: AbortSignal) => handler(endpoint, payload),
      { authority: 'trusted-host' },
    ),
    'dsh-archive-manager: rpc',
  )
}
