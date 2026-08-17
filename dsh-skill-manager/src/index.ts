/**
 * Host half of dsh-skill-manager: exposes the skill catalog (registry winners
 * plus shadowed / invalid filesystem entries), full skill details, import
 * (URL / zip / uploaded file) and delete over the loopback RPC channel.
 */
import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-skill'
import type { SkillDefinition, SkillSummary, SkillViewOptions } from '@deepseek-ai/dsh-skill'
import { basename, join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { DSH_SKILL_MANAGER_CHANNEL } from './contracts.ts'
import type { SkillDetail, SkillFileContent, SkillListItem, SkillListRequest, SkillListResponse } from './contracts.ts'
import { FileValidationError, readSkillFile } from './file-content.ts'
import {
  deleteManagedSkill,
  listSkillFiles,
  managedRootByPath,
  parseSkillFile,
  scanManagedRoots,
  writeImportedSkill,
  type ScannedSkill,
} from './skill-files.ts'
import { materialFromBase64, materialFromUrl } from './import-source.ts'

export const name = 'dsh-skill-manager'

export const inject = ['skills', 'connection']

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.connection.rpc.handle(
    DSH_SKILL_MANAGER_CHANNEL,
    (endpoint, payload) => handle(ctx, endpoint, payload),
    { authority: 'trusted-host' },
  ), 'dsh-skill-manager: rpc')
}

class ImportValidationError extends Error {}

type Endpoint = 'list' | 'detail' | 'import' | 'delete' | 'file'

async function handle(ctx: Context, endpoint: string, payload: unknown): Promise<RpcResult<unknown>> {
  try {
    switch (endpoint as Endpoint) {
      case 'list': return ok(await listSkills(ctx, payload as SkillListRequest | null))
      case 'detail': return ok(await detailSkill(ctx, payload as { name?: unknown; path?: unknown } | null))
      case 'import': return ok(await importSkill(ctx, payload as { source?: unknown; destination?: unknown } | null))
      case 'delete': return ok(await deleteSkill(payload as { path?: unknown } | null))
      case 'file': return ok(await fileSkill(ctx, payload as { name?: unknown; file?: unknown } | null))
      default: return fail('bad-request', `未知操作：${endpoint}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const code = error instanceof ImportValidationError || error instanceof FileValidationError ? 'bad-request' : 'internal'
    return fail(code, message)
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new ImportValidationError(`${field} 不能为空`)
  return value
}

function summaryItem(summary: SkillSummary, scanned: readonly ScannedSkill[]): SkillListItem {
  const base = summary.resourceBase
  const directory = base !== undefined && base.kind === 'directory' ? base.path : undefined
  const path = directory !== undefined ? join(directory, 'SKILL.md') : undefined
  const match = scanned.find(entry => entry.directory === directory)
  return {
    name: summary.name,
    description: summary.description,
    whenToUse: summary.whenToUse,
    invocation: { modelInvocable: summary.invocation.modelInvocable, userInvocable: summary.invocation.userInvocable },
    source: summary.source,
    provider: summary.provider,
    path,
    directory,
    rank: match?.rank,
    shadowed: false,
    managed: path !== undefined && managedRootByPath(path) !== undefined,
    invalid: undefined,
  }
}

function scannedItem(entry: ScannedSkill, winnerDirectory: string | undefined): SkillListItem {
  const parsed = entry.parsed
  return {
    name: entry.name,
    description: parsed?.description ?? '',
    whenToUse: parsed?.whenToUse,
    invocation: parsed !== undefined ? { modelInvocable: parsed.invocation.modelInvocable, userInvocable: parsed.invocation.userInvocable } : { modelInvocable: false, userInvocable: false },
    source: entry.source,
    provider: 'filesystem',
    path: entry.path,
    directory: entry.directory,
    rank: entry.rank,
    shadowed: entry.invalid === undefined && winnerDirectory !== undefined && winnerDirectory !== entry.directory,
    managed: true,
    invalid: entry.invalid,
  }
}

async function listSkills(ctx: Context, request: SkillListRequest | null): Promise<SkillListResponse> {
  const options: SkillViewOptions | undefined = request?.cwd !== undefined && request.cwd !== null && request.cwd !== ''
    ? { cwd: String(request.cwd) }
    : undefined
  const [snapshot, scanned] = await Promise.all([
    ctx.skills.snapshot(options),
    scanManagedRoots(),
  ])
  const items: SkillListItem[] = snapshot.skills.map(summary => summaryItem(summary, scanned))
  const winnerByName = new Map(snapshot.skills.map(summary => {
    const base = summary.resourceBase
    return [summary.name, base !== undefined && base.kind === 'directory' ? base.path : undefined] as const
  }))
  for (const entry of scanned) {
    const winnerDirectory = winnerByName.get(entry.name)
    if (winnerDirectory === entry.directory) continue
    items.push(scannedItem(entry, winnerDirectory))
  }
  items.sort((a, b) => a.name.localeCompare(b.name))
  return { skills: items }
}

async function detailSkill(ctx: Context, payload: { name?: unknown; path?: unknown } | null): Promise<SkillDetail> {
  const name = payload?.name !== undefined && payload.name !== null ? String(payload.name) : undefined
  const path = payload?.path !== undefined && payload.path !== null ? String(payload.path) : undefined
  if (name === undefined && path === undefined) throw new ImportValidationError('缺少 skill 名称')
  if (path !== undefined) return detailFromPath(path)
  const definition: SkillDefinition | undefined = await ctx.skills.get(name!)
  if (definition !== undefined) {
    const scanned = await scanManagedRoots()
    const base = definition.resourceBase
    const directory = base !== undefined && base.kind === 'directory' ? base.path : definition.path !== undefined ? parentOf(definition.path) : undefined
    const files = directory !== undefined && basename(definition.path ?? '') === 'SKILL.md'
      ? await listSkillFiles(directory)
      : definition.path !== undefined ? [{ name: basename(definition.path), size: (await readFile(definition.path, 'utf8')).length, directory: false }] : []
    return {
      name: definition.name,
      description: definition.description,
      whenToUse: definition.whenToUse,
      invocation: { modelInvocable: definition.invocation.modelInvocable, userInvocable: definition.invocation.userInvocable },
      source: definition.source,
      provider: definition.provider,
      path: definition.path,
      directory,
      rank: scanned.find(entry => entry.directory === directory)?.rank,
      shadowed: false,
      managed: definition.path !== undefined && managedRootByPath(definition.path) !== undefined,
      content: definition.content,
      metadata: definition.metadata === undefined ? undefined : { ...definition.metadata },
      files,
    }
  }
  const scanned = await scanManagedRoots()
  const entry = scanned.find(candidate => candidate.name === name)
  if (entry === undefined) throw new ImportValidationError(`未找到 skill：${name}`)
  return detailFromPath(entry.path)
}

function parentOf(path: string): string | undefined {
  const index = path.lastIndexOf('/')
  return index <= 0 ? undefined : path.slice(0, index)
}

async function detailFromPath(path: string): Promise<SkillDetail> {
  const text = await readFile(path, 'utf8')
  let detail: SkillDetail
  try {
    const parsed = parseSkillFile(text)
    detail = {
      name: parsed.name,
      description: parsed.description,
      whenToUse: parsed.whenToUse,
      invocation: parsed.invocation,
      source: 'filesystem',
      provider: 'filesystem',
      path,
      directory: parentOf(path),
      shadowed: false,
      managed: managedRootByPath(path) !== undefined,
      content: parsed.body,
      metadata: parsed.metadata === undefined ? undefined : { ...parsed.metadata },
      files: [],
      invalid: undefined,
    }
  } catch (error) {
    detail = {
      name: basename(path).replace(/\.md$/u, ''),
      description: '',
      invocation: { modelInvocable: false, userInvocable: false },
      source: 'filesystem',
      provider: 'filesystem',
      path,
      directory: parentOf(path),
      shadowed: false,
      managed: managedRootByPath(path) !== undefined,
      content: text,
      files: [],
      invalid: error instanceof Error ? error.message : String(error),
    }
  }
  const isBundle = basename(path) === 'SKILL.md'
  detail = { ...detail, files: isBundle && detail.directory !== undefined ? await listSkillFiles(detail.directory) : [{ name: basename(path), size: Buffer.byteLength(text), directory: false }] }
  return detail
}

async function importSkill(ctx: Context, payload: { source?: unknown; destination?: unknown } | null): Promise<{ name: string; path: string; files: number; warnings: string[] }> {
  const source = payload?.source
  if (source === null || typeof source !== 'object') throw new ImportValidationError('缺少导入来源')
  const destination = payload?.destination === 'user-agents' ? 'user-agents' : 'user-dsh'
  const material = await (async () => {
    const record = source as { kind?: unknown; url?: unknown; filename?: unknown; base64?: unknown }
    if (record.kind === 'url') return materialFromUrl(requireString(record.url, 'URL'))
    if (record.kind === 'bytes') {
      const filename = requireString(record.filename, '文件名')
      const base64 = requireString(record.base64, '文件内容')
      if (base64.length > 128 * 1024 * 1024) throw new ImportValidationError('文件过大')
      return materialFromBase64(filename, base64)
    }
    throw new ImportValidationError('未知的导入来源')
  })()
  const [snapshot, scanned] = await Promise.all([ctx.skills.snapshot(), scanManagedRoots()])
  const existing = new Set<string>(snapshot.skills.map(summary => summary.name))
  for (const entry of scanned) existing.add(entry.name)
  const result = await writeImportedSkill(destination, material, existing)
  return { ...result, warnings: [...material.warnings] }
}

async function deleteSkill(payload: { path?: unknown } | null): Promise<{ deleted: boolean }> {
  const path = payload?.path
  if (typeof path !== 'string' || path === '') throw new ImportValidationError('缺少 skill 路径')
  await deleteManagedSkill(path)
  return { deleted: true }
}

/**
 * Resolves the directory a skill's files live in the same way `detail` does,
 * so preview reads can never target an arbitrary path — only files of a skill
 * the registry / scan actually knows about. Flat single-file skills may read
 * exactly their own SKILL.md-style file and nothing else.
 */
async function skillDirectoryOf(ctx: Context, name: string): Promise<{ root: string; flatFile?: string }> {
  const definition = await ctx.skills.get(name)
  if (definition !== undefined) {
    const base = definition.resourceBase
    const directory = base !== undefined && base.kind === 'directory' ? base.path : definition.path !== undefined ? parentOf(definition.path) : undefined
    if (directory !== undefined && basename(definition.path ?? '') === 'SKILL.md') return { root: directory }
    if (definition.path !== undefined) {
      const parent = parentOf(definition.path)
      if (parent !== undefined) return { root: parent, flatFile: basename(definition.path) }
    }
  }
  const scanned = await scanManagedRoots()
  const entry = scanned.find(candidate => candidate.name === name)
  if (entry === undefined) throw new ImportValidationError(`未找到 skill：${name}`)
  if (entry.directory !== undefined) return { root: entry.directory }
  const parent = parentOf(entry.path)
  if (parent === undefined) throw new ImportValidationError(`未找到 skill 目录：${name}`)
  return { root: parent, flatFile: basename(entry.path) }
}

async function fileSkill(ctx: Context, payload: { name?: unknown; file?: unknown } | null): Promise<SkillFileContent> {
  const name = requireString(payload?.name, 'skill 名称')
  const file = requireString(payload?.file, '文件路径')
  const target = await skillDirectoryOf(ctx, name)
  if (target.flatFile !== undefined && file !== target.flatFile) {
    throw new ImportValidationError('该 Skill 是单文件 Skill，只能读取其自身文件')
  }
  return readSkillFile(target.root, file)
}

function ok(value: unknown): RpcResult<unknown> { return { ok: true, value } }
function fail(code: 'bad-request' | 'internal', message: string): RpcResult<unknown> {
  return code === 'bad-request'
    ? { ok: false, error: { code: 'bad-request', message, details: { issues: [] } } }
    : { ok: false, error: { code: 'internal', message, details: {} } }
}
