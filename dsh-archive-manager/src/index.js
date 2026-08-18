import '@deepseek-ai/dsh-settings';
import { DSH_ARCHIVE_MANAGER_CHANNEL } from './contracts.ts';
import { restoreArchivedSession, RestoreError } from './restore.ts';
import { renderHistoryToMarkdown } from './export-md.ts';
function ok(value) { return Promise.resolve({ ok: true, value }); }
function bad(message) {
    return Promise.resolve({ ok: false, error: { code: 'bad-request', message, details: { issues: [] } } });
}
function notFound(message) {
    return Promise.resolve({ ok: false, error: { code: 'not-found', message, details: {} } });
}
function internal(message) {
    return Promise.resolve({ ok: false, error: { code: 'internal', message, details: {} } });
}
/**
 * Build the dispatcher used by the host's `connection.rpc.handle` hook.
 * Pulled out for testability: tests inject a fake ctx (no cordis needed).
 */
export function createArchiveManagerHandler(ctx) {
    return async (operation, payload) => {
        const body = payload;
        if (body === null || typeof body.sessionId !== 'string' || body.sessionId === '') {
            return bad('sessionId 缺失或为空');
        }
        const { sessionId } = body;
        if (operation === 'restore') {
            try {
                const outcome = await restoreArchivedSession(ctx.workspaceRegistry, sessionId);
                return ok({
                    restoredSessionId: outcome.restoredSessionId,
                    remainingArchivedIds: outcome.remainingArchivedIds,
                });
            }
            catch (error) {
                if (error instanceof RestoreError) {
                    if (error.code === 'session-not-found')
                        return notFound(error.message);
                    if (error.code === 'not-archived')
                        return bad(error.message);
                }
                return internal(error instanceof Error ? error.message : String(error));
            }
        }
        if (operation === 'export-md') {
            // Live (attached) session — its events live in memory.
            const live = ctx.sessions.get(sessionId);
            let entries;
            let header = { sessionId };
            if (live !== undefined) {
                entries = live.events;
            }
            else {
                // Cold (archived, persisted) session — read from sessionPersistence.
                let inspected;
                try {
                    inspected = await ctx.sessionPersistence.inspect(sessionId);
                }
                catch {
                    return notFound(`session "${sessionId}" 不存在或不可读`);
                }
                if (inspected.meta.cwd === undefined)
                    return notFound(`session "${sessionId}" 不存在或不可读`);
                entries = inspected.events;
                header = { sessionId, title: inspected.meta.title };
            }
            const history = { events: entries };
            const rendered = renderHistoryToMarkdown(history, header);
            return ok({ markdown: rendered.markdown, sessionId, messageCount: rendered.messageCount });
        }
        return bad(`未知操作：${operation}`);
    };
}
/**
 * Host plugin entry. Registers a trusted-host RPC handler under the
 * `dsh-archive-manager` channel. Required services:
 *  - `workspaceRegistry` : persist unarchive + read current archive list
 *  - `sessions`          : read live session events for in-progress exports
 *  - `sessionPersistence`: read cold session events for archived exports
 */
export const name = 'dsh-archive-manager';
export async function apply(ctx) {
    const config = ctx.config;
    const authority = config?.authority ?? 'loopback';
    ctx.effect(() => ctx.connection.rpc.handle(DSH_ARCHIVE_MANAGER_CHANNEL, async (endpoint, payload) => {
        if (endpoint !== 'archive')
            return { ok: false, error: { code: 'not-found', message: `unknown endpoint "${endpoint}"`, details: {} } };
        const handler = createArchiveManagerHandler({
            workspaceRegistry: ctx.workspaceRegistry,
            sessions: ctx.sessions,
            sessionPersistence: ctx.sessionPersistence,
        });
        return handler(endpoint === 'archive' ? payload.op ?? '' : '', payload);
    }, { authority }), 'dsh-archive-manager: rpc handler');
}
