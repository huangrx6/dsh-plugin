import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import {
  DSH_MCP_MANAGER_CHANNEL,
  type McpListResponse,
  type McpParseYamlResponse,
  type McpSaveRequest,
  type McpSaveResponse,
  type McpServerConfig,
  type McpTestResponse,
} from '../contracts.ts'

/** Thin RPC wrapper: every call throws on business errors. */
export class McpManagerApi {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  async list(): Promise<McpListResponse> {
    const result = await this.rpc.call(DSH_MCP_MANAGER_CHANNEL, 'list', {})
    if (!result.ok) throw new Error(result.error.message)
    return result.value as McpListResponse
  }

  async save(request: McpSaveRequest): Promise<McpSaveResponse> {
    const result = await this.rpc.call(DSH_MCP_MANAGER_CHANNEL, 'save', request)
    if (!result.ok) throw new Error(result.error.message)
    return result.value as McpSaveResponse
  }

  async toggle(entryId: string, disabled: boolean): Promise<void> {
    const result = await this.rpc.call(DSH_MCP_MANAGER_CHANNEL, 'toggle', { entryId, disabled })
    if (!result.ok) throw new Error(result.error.message)
  }

  async deleteServer(entryId: string): Promise<void> {
    const result = await this.rpc.call(DSH_MCP_MANAGER_CHANNEL, 'delete', { entryId })
    if (!result.ok) throw new Error(result.error.message)
  }

  async test(config: McpServerConfig): Promise<McpTestResponse> {
    const result = await this.rpc.call(DSH_MCP_MANAGER_CHANNEL, 'test', { config })
    if (!result.ok) throw new Error(result.error.message)
    return result.value as McpTestResponse
  }

  async parseYaml(yaml: string): Promise<McpParseYamlResponse> {
    const result = await this.rpc.call(DSH_MCP_MANAGER_CHANNEL, 'parseYaml', { yaml })
    if (!result.ok) throw new Error(result.error.message)
    return result.value as McpParseYamlResponse
  }

  async dumpYaml(config: McpServerConfig): Promise<string> {
    const result = await this.rpc.call(DSH_MCP_MANAGER_CHANNEL, 'dumpYaml', { config })
    if (!result.ok) throw new Error(result.error.message)
    return (result.value as { yaml: string }).yaml
  }
}
