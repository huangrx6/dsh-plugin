import { describe, expect, it } from 'vitest'
import { PatchLayer, parseYamlPatches } from '../src/patch-file.ts'
import {
  appendServer,
  collectMcpEntries,
  recordToServerConfig,
  removeServer,
  serverConfigToRecord,
  setServerDisabled,
  updateServer,
  validateServerConfig,
} from '../src/server-config.ts'
import type { McpServerConfig } from '../src/contracts.ts'

function layerOf(text: string, origin: 'profile' | 'home' = 'profile'): { layer: PatchLayer; origin: 'profile' | 'home' } {
  return { layer: new PatchLayer('/virtual/patch.yml', parseYamlPatches(text)), origin }
}

const ENTRY = [
  "- insert:",
  "    - id: mcp-github",
  "      name: '@deepseek-ai/dsh-mcp-client'",
  '      config:',
  '        serverName: github',
  '        transport: stdio',
  '        command: npx',
  "        args: ['-y', '@modelcontextprotocol/server-github']",
].join('\n')

const httpConfig = (serverName: string): McpServerConfig => ({ serverName, transport: 'streamable-http', url: 'http://localhost:8931/mcp' })

describe('collectMcpEntries', () => {
  it('projects inserted entries with configs', () => {
    const records = collectMcpEntries([layerOf(ENTRY)])
    expect(records).toHaveLength(1)
    expect(records[0]?.entryId).toBe('mcp-github')
    expect(records[0]?.inserted).toBe(true)
    expect(records[0]?.disabled).toBe(false)
    expect(recordToServerConfig(records[0]?.config)?.command).toBe('npx')
  })

  it('applies id-target overrides across and within layers', () => {
    const profile = layerOf(ENTRY)
    const home = layerOf('- id: mcp-github\n  disabled: true\n', 'home')
    const records = collectMcpEntries([profile, home])
    expect(records).toHaveLength(1)
    expect(records[0]?.disabled).toBe(true)

    const renamed = layerOf(`${ENTRY}\n- id: mcp-github\n  config:\n    serverName: gh2\n    transport: streamable-http\n    url: http://x/mcp\n`)
    const updated = collectMcpEntries([renamed])
    expect(recordToServerConfig(updated[0]?.config)?.serverName).toBe('gh2')
  })

  it('creates foreign override-only records for mcp-prefixed ids', () => {
    const records = collectMcpEntries([layerOf('- id: mcp-foreign\n  disabled: true\n')])
    expect(records).toHaveLength(1)
    expect(records[0]?.inserted).toBe(false)
    expect(records[0]?.disabled).toBe(true)
  })

  it('ignores patches for other plugins', () => {
    const records = collectMcpEntries([layerOf("- insert:\n    - id: layout\n      name: dsh-layout\n- id: layout\n  disabled: true\n")])
    expect(records).toHaveLength(0)
  })
})

describe('validateServerConfig', () => {
  it('enforces name pattern and transport-specific fields', () => {
    expect(() => validateServerConfig({ serverName: 'bad name', transport: 'stdio', command: 'x' })).toThrow(/服务器名/)
    expect(() => validateServerConfig({ serverName: 'ok', transport: 'stdio' })).toThrow(/command/)
    expect(() => validateServerConfig({ serverName: 'ok', transport: 'streamable-http', url: 'notaurl' })).toThrow(/url/)
    expect(() => validateServerConfig({ serverName: 'ok', transport: 'stdio', command: 'x', env: { K: 3 as unknown as string } })).toThrow(/env/)
    expect(() => validateServerConfig({ serverName: 'ok', transport: 'stdio', command: 'x', reconnect: { maxAttempts: -1 } })).toThrow(/reconnect/)
  })

  it('accepts js expression values in env maps', () => {
    expect(() => validateServerConfig({ serverName: 'ok', transport: 'stdio', command: 'x', env: { TOKEN: { __jsExpr: 'process.env.TOKEN' } } })).not.toThrow()
  })
})

describe('edit operations', () => {
  it('appends a new server and round-trips it', () => {
    const layer = new PatchLayer('/virtual/patch.yml', [])
    const entryId = appendServer(layer, httpConfig('web'))
    expect(entryId).toBe('mcp-web')
    const records = collectMcpEntries([{ layer, origin: 'profile' }])
    expect(records).toHaveLength(1)
    expect(recordToServerConfig(records[0]?.config)?.url).toBe('http://localhost:8931/mcp')
  })

  it('updates insert configs and keeps override patches in sync', () => {
    const layer = layerOf(`${ENTRY}\n- id: mcp-github\n  config:\n    serverName: gh-old\n    transport: stdio\n    command: echo\n`)
    const records = collectMcpEntries([layer])
    updateServer(records[0]!, httpConfig('gh-new'))
    const reparsed = collectMcpEntries([layer])
    expect(reparsed).toHaveLength(1)
    expect(recordToServerConfig(reparsed[0]?.config)?.serverName).toBe('gh-new')
    expect(recordToServerConfig(reparsed[0]?.config)?.transport).toBe('streamable-http')
  })

  it('toggles disabled on insert and overrides together', () => {
    const layer = layerOf(`${ENTRY}\n- id: mcp-github\n  disabled: true\n`)
    const records = collectMcpEntries([layer])
    setServerDisabled(records[0]!, false)
    expect(collectMcpEntries([layer])[0]?.disabled).toBe(false)
    setServerDisabled(records[0]!, true)
    expect(collectMcpEntries([layer])[0]?.disabled).toBe(true)
  })

  it('removes insert entries with their override patches', () => {
    const layer = layerOf("- insert:\n    - id: mcp-a\n      name: '@deepseek-ai/dsh-mcp-client'\n      config:\n        serverName: a\n        transport: stdio\n        command: x\n- id: mcp-a\n  disabled: true\n- insert:\n    - id: mcp-b\n      name: '@deepseek-ai/dsh-mcp-client'\n      config:\n        serverName: b\n        transport: stdio\n        command: y\n")
    const records = collectMcpEntries([layer])
    removeServer(records.find(record => record.entryId === 'mcp-a')!)
    const remaining = collectMcpEntries([layer])
    expect(remaining.map(record => record.entryId)).toEqual(['mcp-b'])
    expect(layer.layer.patches).toHaveLength(1)
  })

  it('refuses to remove foreign override-only records', () => {
    const records = collectMcpEntries([layerOf('- id: mcp-foreign\n  disabled: true\n')])
    expect(() => removeServer(records[0]!)).toThrow(/删除/)
  })
})

describe('serverConfigToRecord', () => {
  it('drops empty optionals', () => {
    const record = serverConfigToRecord({ serverName: 's', transport: 'stdio', command: 'c', env: {} })
    expect(record).toEqual({ serverName: 's', transport: 'stdio', command: 'c' })
    expect('env' in record).toBe(false)
  })
})
