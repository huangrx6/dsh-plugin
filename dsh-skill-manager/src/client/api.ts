import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import {
  DSH_SKILL_MANAGER_CHANNEL,
  type SkillDetail,
  type SkillDestination,
  type SkillFileContent,
  type SkillImportResult,
  type SkillImportSource,
  type SkillListItem,
  type SkillListResponse,
} from '../contracts.ts'

/** Thin RPC wrapper: every call throws on business errors. */
export class SkillManagerApi {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  async list(): Promise<readonly SkillListItem[]> {
    const result = await this.rpc.call(DSH_SKILL_MANAGER_CHANNEL, 'list', {})
    if (!result.ok) throw new Error(result.error.message)
    return (result.value as SkillListResponse).skills
  }

  async detail(name: string, path?: string): Promise<SkillDetail> {
    const result = await this.rpc.call(DSH_SKILL_MANAGER_CHANNEL, 'detail', { name, path })
    if (!result.ok) throw new Error(result.error.message)
    return result.value as SkillDetail
  }

  async importSkill(source: SkillImportSource, destination: SkillDestination): Promise<SkillImportResult> {
    const result = await this.rpc.call(DSH_SKILL_MANAGER_CHANNEL, 'import', { source, destination })
    if (!result.ok) throw new Error(result.error.message)
    return result.value as SkillImportResult
  }

  async deleteSkill(path: string): Promise<void> {
    const result = await this.rpc.call(DSH_SKILL_MANAGER_CHANNEL, 'delete', { path })
    if (!result.ok) throw new Error(result.error.message)
  }

  async readFile(name: string, file: string): Promise<SkillFileContent> {
    const result = await this.rpc.call(DSH_SKILL_MANAGER_CHANNEL, 'file', { name, file })
    if (!result.ok) throw new Error(result.error.message)
    return result.value as SkillFileContent
  }
}
