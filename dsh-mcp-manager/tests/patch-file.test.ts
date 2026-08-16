import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dumpYamlConfig, isJsExpr, PatchLayer, parseYamlConfig, parseYamlPatches } from '../src/patch-file.ts'

let dir: string
let previousHome: string | undefined

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mcpmgr-'))
  previousHome = process.env.DSH_HOME
  process.env.DSH_HOME = dir
})

afterEach(async () => {
  if (previousHome === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = previousHome
  await rm(dir, { recursive: true, force: true })
})

describe('patch dialect round-trip', () => {
  it('parses !!js expressions as nodes', () => {
    const patches = parseYamlPatches([
      "- id: mcp-github",
      "  name: '@deepseek-ai/dsh-mcp-client'",
      '  config:',
      '    serverName: github',
      '    transport: stdio',
      '    command: npx',
      '    env:',
      '      GITHUB_TOKEN: !!js process.env.GITHUB_TOKEN',
    ].join('\n'))
    const entry = patches[0] as { config?: { env?: Record<string, unknown> } } | undefined
    const token = entry?.config?.env?.['GITHUB_TOKEN']
    expect(isJsExpr(token)).toBe(true)
    expect((token as { __jsExpr: string }).__jsExpr).toBe('process.env.GITHUB_TOKEN')
  })

  it('dumps js nodes back as !!js scalars', () => {
    const yaml = dumpYamlConfig({ env: { TOKEN: { __jsExpr: 'process.env.TOKEN' } } })
    expect(yaml).toContain('!!js process.env.TOKEN')
  })

  it('loads, mutates and saves a patch layer with a backup', async () => {
    const path = join(dir, 'cordis.patch.yml')
    await writeFile(path, "- insert:\n    - id: mcp-a\n      name: '@deepseek-ai/dsh-mcp-client'\n      config:\n        serverName: a\n        transport: stdio\n        command: npx\n", 'utf8')
    const layer = await PatchLayer.load(path)
    layer.patches.push({ id: 'mcp-a', disabled: true })
    await layer.save()
    const saved = await readFile(path, 'utf8')
    expect(saved).toContain('mcp-a')
    expect(saved).toContain('disabled: true')
    const backup = await readFile(`${path}.bak`, 'utf8')
    expect(backup).toContain('command: npx')
    const reparsed = parseYamlPatches(saved)
    expect(reparsed).toHaveLength(2)
  })

  it('treats a missing file as an empty layer and rejects non-arrays', async () => {
    const layer = await PatchLayer.load(join(dir, 'missing.yml'))
    expect(layer.patches).toEqual([])
    const bad = join(dir, 'bad.yml')
    await writeFile(bad, 'just: a mapping\n', 'utf8')
    await expect(PatchLayer.load(bad)).rejects.toThrow(/数组/)
  })

  it('parses config objects only', () => {
    expect(parseYamlConfig('serverName: x\ntransport: stdio')).toEqual({ serverName: 'x', transport: 'stdio' })
    expect(() => parseYamlConfig('- a\n- b')).toThrow(/对象/)
  })
})
