import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dumpYamlConfig, evaluateJsExpr, isJsExpr, PatchLayer, parseYamlConfig, parseYamlPatches, resolveEntryValue } from '../src/patch-file.ts'

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

describe('js expression evaluation (probe semantics)', () => {
  it('reads the live host environment like the loader does', () => {
    process.env['DSHM_PROBE_TEST_VAR'] = 'probe-value'
    try {
      expect(evaluateJsExpr('process.env.DSHM_PROBE_TEST_VAR')).toBe('probe-value')
      expect(resolveEntryValue({ __jsExpr: 'process.env.DSHM_PROBE_TEST_VAR' })).toBe('probe-value')
    } finally {
      delete process.env['DSHM_PROBE_TEST_VAR']
    }
  })

  it('passes plain strings through and drops undefined / non-scalar results', () => {
    expect(resolveEntryValue('literal')).toBe('literal')
    expect(resolveEntryValue({ __jsExpr: 'process.env.DSHM_PROBE_MISSING' })).toBeUndefined()
    expect(resolveEntryValue({ __jsExpr: '1 + 2' })).toBe('3')
  })

  it('throws on syntax errors so callers can decide', () => {
    expect(() => evaluateJsExpr('process.env.(')).toThrow()
  })

  it('a quoted literal is a string, never an expression node', () => {
    const parsed = parseYamlPatches("- insert:\n  - id: x\n    config:\n      env:\n        K: '!!js process.env.X'\n") as [{ insert: [{ config: { env: Record<string, unknown> } }] }]
    const value = parsed[0]?.insert[0]?.config.env['K']
    expect(typeof value).toBe('string')
    expect(isJsExpr(value)).toBe(false)
    // …while the unquoted tag form round-trips as an expression node
    const parsedExpr = parseYamlPatches('- insert:\n  - id: x\n    config:\n      env:\n        K: !!js process.env.X\n') as [{ insert: [{ config: { env: Record<string, unknown> } }] }]
    expect(isJsExpr(parsedExpr[0]?.insert[0]?.config.env['K'])).toBe(true)
  })
})
