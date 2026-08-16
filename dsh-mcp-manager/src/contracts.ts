/** Wire contract shared by the host RPC plugin and the web client. */

export const DSH_MCP_MANAGER_CHANNEL = '/dsh-mcp-manager'

export const MCP_MODULE = '@deepseek-ai/dsh-mcp-client'

export type McpTransport = 'stdio' | 'streamable-http'

export interface McpReconnectView {
  readonly enabled: boolean
  readonly initialDelayMs: number
  readonly maxDelayMs: number
  readonly maxAttempts: number
}

/** One MCP server entry, shaped for the editor form. */
export interface McpServerConfig {
  readonly serverName: string
  readonly transport: McpTransport
  readonly command?: string | undefined
  readonly args?: readonly string[] | undefined
  readonly env?: Readonly<Record<string, string | McpJsExprValue>> | undefined
  readonly cwd?: string | undefined
  readonly url?: string | undefined
  readonly headers?: Readonly<Record<string, string | McpJsExprValue>> | undefined
  readonly toolCallTimeoutMs?: number | undefined
  readonly failOnStartupError?: boolean | undefined
  readonly reconnect?: Partial<McpReconnectView> | undefined
}

/** A `!!js` expression value from the patch dialect, preserved verbatim. */
export interface McpJsExprValue {
  readonly __jsExpr: string
}

export interface McpToolView {
  readonly publicName: string
  readonly description: string
  readonly parameters: Record<string, unknown>
}

export interface McpServerView {
  readonly serverName: string
  readonly entryId: string
  /** Which patch layer carries the entry. */
  readonly origin: 'profile' | 'home' | 'live'
  readonly disabled: boolean
  /** Entry was inserted by a writable patch layer and can be removed. */
  readonly removable: boolean
  readonly config?: McpServerConfig | undefined
  /** Any config value is a !!js expression; form fields render read-only. */
  readonly hasExpressions: boolean
  /** Cordis fiber phase from the plugin inventory, when observable. */
  readonly fiberPhase: string | null
  readonly tools: readonly McpToolView[]
}

export interface McpPatchFilesView {
  readonly profilePath: string | null
  readonly homePath: string
  readonly writingPath: string
}

export interface McpListResponse {
  readonly servers: readonly McpServerView[]
  readonly patchFiles: McpPatchFilesView
}

export interface McpSaveRequest {
  readonly entryId?: string | undefined
  readonly config: McpServerConfig
}

export interface McpSaveResponse {
  readonly entryId: string
  readonly appliedVia: 'hmr'
}

export interface McpToggleRequest {
  readonly entryId: string
  readonly disabled: boolean
}

export interface McpDeleteRequest {
  readonly entryId: string
}

export interface McpTestRequest {
  readonly config: McpServerConfig
}

export interface McpTestTool {
  readonly name: string
  readonly description: string
  readonly inputSchema: Record<string, unknown>
}

export interface McpTestResponse {
  readonly ok: boolean
  readonly durationMs: number
  readonly serverName?: string | undefined
  readonly serverVersion?: string | undefined
  readonly tools?: readonly McpTestTool[] | undefined
  readonly error?: string | undefined
}

export interface McpParseYamlRequest {
  readonly yaml: string
}

export interface McpParseYamlResponse {
  readonly config: McpServerConfig
}

export interface McpDumpYamlRequest {
  readonly config: McpServerConfig
}

export interface McpDumpYamlResponse {
  readonly yaml: string
}
