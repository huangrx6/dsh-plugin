import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  deleteManagedSkill,
  managedRoots,
  parseSkillFile,
  scanRoot,
  writeImportedSkill,
  type ImportMaterial,
  type ManagedRoot,
} from '../src/skill-files.ts'

let home: string
let agentsHome: string
let root: ManagedRoot
let previousDshHome: string | undefined
let previousAgentsHome: string | undefined

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), 'dshm-home-'))
  agentsHome = await mkdtemp(join(tmpdir(), 'dshm-agents-'))
  previousDshHome = process.env.DSH_HOME
  previousAgentsHome = process.env.DSH_AGENTS_HOME
  process.env.DSH_HOME = home
  process.env.DSH_AGENTS_HOME = agentsHome
  const rootPath = join(home, 'skills')
  await mkdir(rootPath, { recursive: true })
  root = { id: 'user-dsh', root: rootPath, rank: 400, source: 'user-dsh' }
})

afterEach(async () => {
  if (previousDshHome === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = previousDshHome
  if (previousAgentsHome === undefined) delete process.env.DSH_AGENTS_HOME
  else process.env.DSH_AGENTS_HOME = previousAgentsHome
  await rm(home, { recursive: true, force: true })
  await rm(agentsHome, { recursive: true, force: true })
})

describe('parseSkillFile', () => {
  it('parses frontmatter and body', () => {
    const parsed = parseSkillFile(`---\nname: pdf-toolkit\ndescription: PDF 工具集\nwhenToUse: 处理 PDF 时\nmetadata:\n  version: 2\n---\n\n# 内容\n`)
    expect(parsed.name).toBe('pdf-toolkit')
    expect(parsed.description).toBe('PDF 工具集')
    expect(parsed.whenToUse).toBe('处理 PDF 时')
    expect(parsed.metadata).toEqual({ version: 2 })
    expect(parsed.invocation).toEqual({ modelInvocable: true, userInvocable: true })
    expect(parsed.body).toContain('# 内容')
  })

  it('honors invocation switches including boolean words', () => {
    const parsed = parseSkillFile('---\nname: a-b\ndescription: d\ndisable-model-invocation: yes\nuser-invocable: "false"\n---\nbody')
    expect(parsed.invocation).toEqual({ modelInvocable: false, userInvocable: false })
  })

  it('rejects legacy camelCase keys', () => {
    expect(() => parseSkillFile('---\nname: a-b\ndescription: d\ndisableModelInvocation: true\n---\nbody')).toThrow(/disableModelInvocation/)
  })

  it('rejects invalid names and missing descriptions', () => {
    expect(() => parseSkillFile('---\nname: Bad_Name\ndescription: d\n---\nb')).toThrow(/name/)
    expect(() => parseSkillFile('---\nname: ok\ndescription: ""\n---\nb')).toThrow(/description/)
    expect(() => parseSkillFile('no frontmatter')).toThrow(/frontmatter/)
  })
})

describe('scanRoot', () => {
  it('finds bundle and flat forms one level deep', async () => {
    await mkdir(join(root.root, 'pdf-toolkit'))
    await writeFile(join(root.root, 'pdf-toolkit', 'SKILL.md'), '---\nname: pdf-toolkit\ndescription: pdf\n---\nbody')
    await writeFile(join(root.root, 'quick.md'), '---\nname: quick\ndescription: q\n---\nbody')
    await mkdir(join(root.root, 'nested', 'deep'), { recursive: true })
    await writeFile(join(root.root, 'nested', 'deep', 'SKILL.md'), '---\nname: deep\ndescription: d\n---\nb')
    const scanned = await scanRoot(root)
    expect(scanned.map(entry => entry.name).sort()).toEqual(['pdf-toolkit', 'quick'])
    expect(scanned.find(entry => entry.name === 'pdf-toolkit')?.bundled).toBe(true)
    expect(scanned.find(entry => entry.name === 'quick')?.bundled).toBe(false)
  })

  it('marks invalid frontmatter instead of throwing', async () => {
    await mkdir(join(root.root, 'broken'))
    await writeFile(join(root.root, 'broken', 'SKILL.md'), '---\nname: Broken\ndescription: d\n---\nb')
    const scanned = await scanRoot(root)
    expect(scanned).toHaveLength(1)
    expect(scanned[0]?.invalid).toBeDefined()
    expect(scanned[0]?.parsed).toBeUndefined()
  })
})

describe('writeImportedSkill / deleteManagedSkill', () => {
  const material = (): ImportMaterial => ({
    skillMd: '---\nname: imported-skill\ndescription: imported\n---\n\nhello',
    resources: [
      { name: 'assets/logo.png', data: new Uint8Array([1, 2, 3]) },
      { name: '../escape.txt', data: new Uint8Array([9]) },
    ],
    warnings: [],
  })

  it('writes resources and rejects unsafe names', async () => {
    const result = await writeImportedSkill('user-dsh', material(), new Set())
    expect(result.name).toBe('imported-skill')
    expect(result.files).toBe(2)
    const dir = join(root.root, 'imported-skill')
    await expect(readdir(join(dir, 'assets'))).resolves.toEqual(['logo.png'])
    const rootEntries = await readdir(root.root)
    expect(rootEntries).toContain('imported-skill')
    expect(rootEntries.find(name => name.startsWith('.'))).toBeUndefined()
  })

  it('writes into the agents root too', async () => {
    const result = await writeImportedSkill('user-agents', material(), new Set())
    expect(result.path.startsWith(join(agentsHome, 'skills'))).toBe(true)
  })

  it('refuses name conflicts', async () => {
    await expect(writeImportedSkill('user-dsh', material(), new Set(['imported-skill']))).rejects.toThrow(/already exists/)
  })

  it('deletes bundle directories and flat files under managed roots only', async () => {
    await writeImportedSkill('user-dsh', material(), new Set())
    await deleteManagedSkill(join(root.root, 'imported-skill', 'SKILL.md'))
    await expect(readdir(root.root)).resolves.toEqual([])
    await writeFile(join(root.root, 'flat.md'), '---\nname: flat\ndescription: f\n---\nb')
    await deleteManagedSkill(join(root.root, 'flat.md'))
    await expect(readdir(root.root)).resolves.toEqual([])
    await writeFile(join(home, 'outside.md'), 'x')
    await expect(deleteManagedSkill(join(home, 'outside.md'))).rejects.toThrow(/outside/)
  })
})

describe('managedRoots', () => {
  it('respects DSH_HOME and DSH_AGENTS_HOME', () => {
    const roots = managedRoots()
    expect(roots.find(candidate => candidate.id === 'user-dsh')?.root).toBe(join(home, 'skills'))
    expect(roots.find(candidate => candidate.id === 'user-agents')?.root).toBe(join(agentsHome, 'skills'))
  })
})
