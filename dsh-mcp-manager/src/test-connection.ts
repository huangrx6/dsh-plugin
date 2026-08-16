/**
 * One-shot MCP connection probe for the editor's "test connection" action:
 * spawns / dials exactly like dsh-mcp-client does, performs the initialize
 * handshake, drains tools/list with pagination, and always tears the
 * transport down again. Nothing is registered on ctx.tools.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { McpServerConfig, McpTestResponse, McpTestTool } from './contracts.ts'

const TEST_TIMEOUT_MS = 30_000
const MAX_TOOL_PAGES = 50

export async function testMcpConnection(config: McpServerConfig, timeoutMs: number = TEST_TIMEOUT_MS): Promise<McpTestResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort(new Error('timeout')) }, timeoutMs)
  const client = new Client({ name: 'dsh-mcp-manager', version: '0.1.0' })
  const started = Date.now()
  try {
    const transport = createTransport(config)
    // The SDK's own transports don't satisfy its Transport interface under
    // exactOptionalPropertyTypes; this cast is type-level only.
    await client.connect(transport as never, { signal: controller.signal, timeout: timeoutMs })
    const tools: McpTestTool[] = []
    let cursor: string | undefined = undefined
    let pages = 0
    for (;;) {
      const result = await client.listTools(cursor === undefined ? {} : { cursor }, { signal: controller.signal, timeout: timeoutMs })
      for (const tool of result.tools) {
        tools.push({
          name: tool.name,
          description: tool.description ?? '',
          inputSchema: (tool.inputSchema ?? { type: 'object' }) as Record<string, unknown>,
        })
      }
      cursor = result.nextCursor
      pages += 1
      if (cursor === undefined || pages >= MAX_TOOL_PAGES) break
    }
    const serverInfo = client.getServerVersion()
    return {
      ok: true,
      durationMs: Date.now() - started,
      serverName: serverInfo?.name,
      serverVersion: serverInfo?.version,
      tools,
    }
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
    await client.close().catch(() => {})
  }
}

function createTransport(config: McpServerConfig) {
  switch (config.transport) {
    case 'stdio': {
      const parameters: { command: string; args: string[]; env: Record<string, string>; cwd?: string } = {
        command: config.command ?? '',
        args: config.args !== undefined ? [...config.args] : [],
        env: { ...cleanProcessEnv(), ...plainEntries(config.env) },
      }
      if (config.cwd !== undefined && config.cwd !== '') parameters.cwd = config.cwd
      return new StdioClientTransport(parameters)
    }
    case 'streamable-http':
      return new StreamableHTTPClientTransport(new URL(config.url ?? ''), { requestInit: { headers: plainEntries(config.headers) } })
  }
}

/** Expression values cannot be evaluated here; they are skipped for the probe. */
function plainEntries(map: Readonly<Record<string, string | { readonly __jsExpr: string }>> | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (map === undefined) return out
  for (const [key, value] of Object.entries(map)) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

function cleanProcessEnv(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) out[key] = value
  }
  return out
}
