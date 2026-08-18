/**
 * RPC contracts for the archive manager.
 *
 * Channel name is unique to this plugin (composed of the package name).
 * Host-side handler dispatches on `op` within the payload; tests inject
 * the handler with a real-shaped `Context`-less interface.
 */
export const DSH_ARCHIVE_MANAGER_CHANNEL = '/dsh-archive-manager' as const

export type ArchiveManagerOp =
  | 'restore'
  | 'export-md'
  | 'list'
  | 'info'

export interface ArchiveManagerPayload {
  readonly op: ArchiveManagerOp
  readonly sessionId: string
}

export interface RestoreResult {
  readonly restoredSessionId: string
  readonly remainingArchivedIds: readonly string[]
}

export interface ExportMdResult {
  readonly markdown: string
  readonly sessionId: string
  readonly messageCount: number
}

export interface ArchivedSummary {
  readonly id: string
  readonly title: string
  readonly updatedAt: number
  readonly messageCount: number
}

export interface ArchiveInfoResult {
  readonly sessionId: string
  readonly title: string
  readonly updatedAt: number
  readonly events: readonly unknown[]
}

export type ArchiveManagerResult =
  | RestoreResult
  | ExportMdResult
  | { readonly items: readonly ArchivedSummary[] }
  | ArchiveInfoResult