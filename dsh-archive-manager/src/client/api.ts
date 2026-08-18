/**
 * RPC wrappers for the host bridge. Mirrors the wire shape of the host
 * `createArchiveManagerHandler` in src/index.ts.
 */
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { DSH_ARCHIVE_MANAGER_CHANNEL, type ArchivedSummary, type ArchiveInfoResult, type ExportMdResult, type RestoreResult } from '../contracts.ts'

export class ArchiveManagerApi {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  private async call<T>(op: string, sessionId: string): Promise<T> {
    const result = await this.rpc.call(DSH_ARCHIVE_MANAGER_CHANNEL, 'archive', { op, payload: { sessionId } })
    if (!result.ok) throw new Error(result.error.message)
    return result.value as T
  }

  async list(): Promise<readonly ArchivedSummary[]> {
    // list op does not need a sessionId — pass the archived id of the
    // first archive as a stub to satisfy the payload shape, the host
    // ignores it for the list op.
    const list = await this.rpc.call(DSH_ARCHIVE_MANAGER_CHANNEL, 'archive', { op: 'list', payload: { sessionId: '' } })
    if (!list.ok) throw new Error(list.error.message)
    return (list.value as { items: readonly ArchivedSummary[] }).items
  }

  info(sessionId: string): Promise<ArchiveInfoResult> {
    return this.call<ArchiveInfoResult>('info', sessionId)
  }

  exportMd(sessionId: string): Promise<ExportMdResult> {
    return this.call<ExportMdResult>('export-md', sessionId)
  }

  restore(sessionId: string): Promise<RestoreResult> {
    return this.call<RestoreResult>('restore', sessionId)
  }
}