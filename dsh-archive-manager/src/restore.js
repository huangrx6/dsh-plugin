/**
 * Host-side session unarchive: remove a sessionId from the workspace's
 * `archivedSessionIds` list so it appears in the workspace again.
 *
 * The WorkspaceRegistry service only exposes `archiveSession(id)` — there is
 * no public unarchive/restore. The unarchive path is the same persistence
 * mutation in reverse: drop the id from `archivedSessionIds` and persist
 * via the official `enqueueOperation → setState` flow, which automatically
 * broadcasts `host/archived-sessions-changed` to every connected
 * WorkspaceManager instance so all clients update together.
 *
 * Logic is pure-functional in the surface it cares about (the state shape
 * it produces) so unit tests can run against an in-memory fake without
 * pulling in cordis or the dsh-settings-file stack.
 */
export class RestoreError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'RestoreError';
    }
}
/**
 * Remove `sessionId` from the workspace's archivedSessionIds list.
 *
 * @throws RestoreError - 'session-not-found' if no session storage carries it
 * @throws RestoreError - 'not-archived' if the id is not currently archived
 *   (restoring a non-archived session is a no-op ambiguity, fail loud)
 */
export async function restoreArchivedSession(registry, sessionId) {
    if (!await registry.sessionKnown(sessionId)) {
        throw new RestoreError('session-not-found', `session "${sessionId}" not found in storage`);
    }
    return registry.enqueueOperation(async () => {
        const state = registry.requireState();
        if (!state.archivedSessionIds.includes(sessionId)) {
            throw new RestoreError('not-archived', `session "${sessionId}" is not archived`);
        }
        const next = {
            ...state,
            archivedSessionIds: state.archivedSessionIds.filter(id => id !== sessionId),
        };
        await registry.setState(next);
        return {
            restoredSessionId: sessionId,
            remainingArchivedIds: next.archivedSessionIds.slice(),
        };
    });
}
