/**
 * RPC contracts for the archive manager.
 *
 * Channel name is unique to this plugin (composed of the package name).
 * Host-side handler dispatches on `op` within the payload; tests inject
 * the handler with a real-shaped `Context`-less interface.
 */
export const DSH_ARCHIVE_MANAGER_CHANNEL = 'dsh-archive-manager';
