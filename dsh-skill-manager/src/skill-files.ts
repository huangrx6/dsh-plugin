/**
 * Filesystem half of the skill manager: mirrors the official
 * `dsh-skill-filesystem` discovery rules for the user-level roots (one level
 * deep, `<name>/SKILL.md` bundle form or `<name>.md` flat form), parses and
 * validates SKILL.md frontmatter with the same dialect, and owns import /
 * delete writes into those roots.
 */
import { homedir } from 'node:os'
import { basename, dirname, join, resolve, sep } from 'node:path'
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'

export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Managed roots, ordered by precedence (lower rank wins). */
export interface ManagedRoot {
  readonly id: 'user-dsh' | 'user-agents'
  readonly root: string
  readonly rank: number
  readonly source: string
}

export function resolveDshHome(): string {
  const override = process.env.DSH_HOME
  return override !== undefined && override.trim() !== '' ? resolve(override) : join(homedir(), '.dsh')
}

export function resolveAgentsHome(): string {
  const override = process.env.DSH_AGENTS_HOME
  return override !== undefined && override.trim() !== '' ? resolve(override) : join(homedir(), '.agents')
}

export function managedRoots(): ManagedRoot[] {
  return [
    { id: 'user-dsh', root: join(resolveDshHome(), 'skills'), rank: 400, source: 'user-dsh' },
    { id: 'user-agents', root: join(resolveAgentsHome(), 'skills'), rank: 500, source: 'user-agents' },
  ]
}

export function managedRootByPath(path: string): ManagedRoot | undefined {
  return managedRoots().find(root => isWithin(path, root.root))
}

export function isWithin(path: string, root: string): boolean {
  const target = resolve(path) + sep
  const base = resolve(root) + sep
  return target.startsWith(base)
}

/** Parsed SKILL.md: frontmatter fields plus the markdown body. */
export interface ParsedSkillFile {
  readonly name: string
  readonly description: string
  readonly whenToUse?: string | undefined
  /** Optional top-level frontmatter `version` (market update detection). */
  readonly version?: string | undefined
  readonly metadata?: Record<string, unknown> | undefined
  readonly invocation: { modelInvocable: boolean; userInvocable: boolean }
  readonly body: string
}

const BOOLEAN_WORDS: Record<string, boolean> = {
  'true': true, 'false': false,
  'yes': true, 'no': false,
  'on': true, 'off': false,
  '1': true, '0': false,
}

function parseBooleanish(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.trim().toLocaleLowerCase()
    if (lower in BOOLEAN_WORDS) return BOOLEAN_WORDS[lower]
  }
  return undefined
}

/**
 * Split the leading `---` frontmatter block and parse it. Mirrors the
 * loader's rules: required kebab-case `name` and non-empty `description`,
 * optional `whenToUse` / `metadata` / `disable-model-invocation` /
 * `user-invocable`; the legacy camelCase spellings are rejected rather than
 * silently honored.
 */
export function parseSkillFile(text: string): ParsedSkillFile {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
  if (match === null) throw new Error('missing frontmatter block')
  const frontmatter = match[1]
  if (frontmatter === undefined) throw new Error('empty frontmatter block')
  const data = parseYaml(frontmatter) as Record<string, unknown>
  if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new Error('frontmatter is not a mapping')
  for (const key of ['disableModelInvocation', 'modelInvocable', 'userInvocable']) {
    if (key in data) throw new Error(`legacy frontmatter key "${key}" is not supported; use the kebab-case spelling`)
  }
  const name = data['name']
  if (typeof name !== 'string' || !SKILL_NAME_PATTERN.test(name)) throw new Error('frontmatter "name" must be a kebab-case string')
  const description = data['description']
  if (typeof description !== 'string' || description.trim() === '') throw new Error('frontmatter "description" must be a non-empty string')
  const whenToUse = data['whenToUse']
  if (whenToUse !== undefined && typeof whenToUse !== 'string') throw new Error('frontmatter "whenToUse" must be a string')
  const versionRaw = data['version']
  if (versionRaw !== undefined && typeof versionRaw !== 'string') throw new Error('frontmatter "version" must be a string')
  const version = versionRaw === undefined || versionRaw.trim() === '' ? undefined : versionRaw.trim()
  const metadata = data['metadata']
  if (metadata !== undefined && (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata))) throw new Error('frontmatter "metadata" must be a mapping')
  const disableModelInvocation = data['disable-model-invocation']
  const userInvocable = data['user-invocable']
  const modelFlag = disableModelInvocation === undefined ? undefined : parseBooleanish(disableModelInvocation)
  const userFlag = userInvocable === undefined ? undefined : parseBooleanish(userInvocable)
  if (disableModelInvocation !== undefined && modelFlag === undefined) throw new Error('frontmatter "disable-model-invocation" must be a boolean')
  if (userInvocable !== undefined && userFlag === undefined) throw new Error('frontmatter "user-invocable" must be a boolean')
  return {
    name,
    description,
    whenToUse: whenToUse === undefined ? undefined : whenToUse,
    ...(version === undefined ? {} : { version }),
    metadata: metadata === undefined ? undefined : metadata as Record<string, unknown>,
    invocation: { modelInvocable: modelFlag === undefined ? true : !modelFlag, userInvocable: userFlag === undefined ? true : userFlag },
    body: text.slice(match[0].length),
  }
}

/** One discovered skill file under a managed root. */
export interface ScannedSkill {
  readonly name: string
  readonly path: string
  readonly directory: string
  readonly rootId: 'user-dsh' | 'user-agents'
  readonly rank: number
  readonly source: string
  readonly parsed?: ParsedSkillFile | undefined
  readonly invalid?: string | undefined
  readonly bundled: boolean
}

/** Scan one managed root, mirroring the loader's one-level-deep discovery. */
export async function scanRoot(root: ManagedRoot): Promise<ScannedSkill[]> {
  const entries = await readdir(root.root, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return []
    throw error
  })
  const results: ScannedSkill[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    let path: string
    let directory: string
    let bundled: boolean
    if (entry.isDirectory()) {
      if (root.id === 'user-dsh' && entry.name === '.system') continue
      path = join(root.root, entry.name, 'SKILL.md')
      directory = join(root.root, entry.name)
      bundled = true
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      path = join(root.root, entry.name)
      directory = root.root
      bundled = false
    } else {
      continue
    }
    const text = await readFile(path, 'utf8').catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined
      throw error
    })
    if (text === undefined) continue
    let parsed: ParsedSkillFile | undefined
    let invalid: string | undefined
    try {
      parsed = parseSkillFile(text)
      if (bundled && parsed.name !== entry.name) {
        invalid = `frontmatter name "${parsed.name}" does not match directory name "${entry.name}"`
      }
    } catch (error) {
      invalid = error instanceof Error ? error.message : String(error)
    }
    results.push({
      name: parsed !== undefined ? parsed.name : entry.name.replace(/\.md$/u, ''),
      path,
      directory,
      rootId: root.id,
      rank: root.rank,
      source: root.source,
      parsed: parsed !== undefined && invalid === undefined ? parsed : undefined,
      invalid,
      bundled,
    })
  }
  return results
}

export async function scanManagedRoots(): Promise<ScannedSkill[]> {
  const all: ScannedSkill[] = []
  for (const root of managedRoots()) all.push(...await scanRoot(root))
  return all
}

/** List files of a skill directory (recursive, bounded). */
export async function listSkillFiles(directory: string, limit = 400): Promise<{ name: string; size: number; directory: boolean }[]> {
  const out: { name: string; size: number; directory: boolean }[] = []
  const walk = async (dir: string, prefix: string, depth: number): Promise<void> => {
    if (out.length >= limit || depth > 5) return
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
    entries.sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      if (out.length >= limit) return
      const relative = prefix === '' ? entry.name : `${prefix}/${entry.name}`
      if (entry.isDirectory()) {
        out.push({ name: relative, size: 0, directory: true })
        await walk(join(dir, entry.name), relative, depth + 1)
      } else if (entry.isFile()) {
        const info = await stat(join(dir, entry.name)).catch(() => undefined)
        out.push({ name: relative, size: info?.size ?? 0, directory: false })
      }
    }
  }
  await walk(directory, '', 0)
  return out
}

/** Material to persist for one imported skill. */
export interface ImportMaterial {
  readonly skillMd: string
  readonly resources: readonly { name: string; data: Uint8Array }[]
  readonly warnings: string[]
}

function sanitizeResourceName(name: string): string | undefined {
  if (name === '' || name.includes('\0')) return undefined
  if (name.startsWith('/') || name.includes('..') || name.includes('\\')) return undefined
  return name
}

/**
 * Validate import material and write it into `root` as `<root>/<name>/`.
 * The directory is staged as a hidden temp dir and renamed into place, so a
 * half-written import never occupies the final name. With `overwrite` the
 * existing skill of the same name is removed just before the swap (the
 * market's update path); otherwise an existing name is refused.
 */
export async function writeImportedSkill(rootId: 'user-dsh' | 'user-agents', material: ImportMaterial, existingNames: ReadonlySet<string>, options: { overwrite?: boolean } = {}): Promise<{ name: string; path: string; files: number }> {
  const parsed = parseSkillFile(material.skillMd)
  if (!SKILL_NAME_PATTERN.test(parsed.name)) throw new Error(`invalid skill name "${parsed.name}"`)
  if (existingNames.has(parsed.name) && options.overwrite !== true) throw new Error(`skill "${parsed.name}" already exists`)
  const root = managedRoots().find(candidate => candidate.id === rootId)
  if (root === undefined) throw new Error(`unknown destination "${rootId}"`)
  const target = join(root.root, parsed.name)
  const staging = join(root.root, `.${parsed.name}.import-${process.pid}`)
  await rm(staging, { recursive: true, force: true })
  await mkdir(staging, { recursive: true })
  try {
    await writeFile(join(staging, 'SKILL.md'), material.skillMd, 'utf8')
    let files = 1
    for (const resource of material.resources) {
      const name = sanitizeResourceName(resource.name)
      if (name === undefined || name === 'SKILL.md') continue
      const destination = join(staging, name)
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, resource.data)
      files += 1
    }
    await mkdir(root.root, { recursive: true })
    if (options.overwrite === true) await rm(target, { recursive: true, force: true })
    try {
      await rename(staging, target)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOTEMPTY' || (error as NodeJS.ErrnoException).code === 'EEXIST' || (error as NodeJS.ErrnoException).code === 'EPERM') {
        throw new Error(`skill "${parsed.name}" already exists`)
      }
      throw error
    }
    return { name: parsed.name, path: join(target, 'SKILL.md'), files }
  } catch (error) {
    await rm(staging, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

/** Delete a skill file or directory, but only under a managed root. */
export async function deleteManagedSkill(path: string): Promise<void> {
  const root = managedRootByPath(path)
  if (root === undefined) throw new Error('path is outside the managed skill roots')
  const info = await stat(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') throw new Error('skill file no longer exists')
    throw error
  })
  if (info.isDirectory()) throw new Error('path must be the SKILL.md file, not a directory')
  if (basename(path) !== 'SKILL.md') {
    // Flat `<root>/<name>.md` form: the file itself is the skill.
    await rm(path, { force: true })
    return
  }
  const directory = dirname(path)
  if (managedRootByPath(directory)?.root !== root.root || dirname(directory) !== root.root) {
    throw new Error('skill directory is not a direct child of a managed root')
  }
  await rm(directory, { recursive: true, force: true })
}
