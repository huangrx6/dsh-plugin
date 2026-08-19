import { describe, expect, it } from 'vitest'
import {
  classifySourceUrl,
  discoverSource,
  mcpServersToItems,
  normalizeSourceUrl,
  rawConfigCandidates,
} from '../src/client/market/discover.ts'
import { clearManifestCache, fetchManifest, fetchAllManifests } from '../src/client/market/manifest.ts'
import type { MarketSource } from '../src/client/market/types.ts'

/** Minimal fetch stand-in routed by URL substring; keeps tests offline. */
interface RoutedFetch {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>
  calls: string[]
}
function routeFetch(
  routes: ReadonlyArray<{ readonly match: string; readonly status?: number; readonly body?: unknown }>,
): RoutedFetch {
  const calls: string[] = []
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push(url)
    void init
    const route = routes.find((entry) => url.includes(entry.match))
    if (route === undefined) {
      return new Response('not found', { status: 404 })
    }
    const body = route.body === undefined ? '' : JSON.stringify(route.body)
    return new Response(body, {
      status: route.status ?? 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as RoutedFetch
  fetcher.calls = calls
  return fetcher
}

const source = (url: string): MarketSource => ({
  id: 's1',
  name: 'Test',
  url,
  builtIn: false,
  order: 0,
})

describe('normalizeSourceUrl', () => {
  it('prepends https:// when the scheme is missing', () => {
    expect(normalizeSourceUrl('github.com/a/b')).toBe('https://github.com/a/b')
    expect(normalizeSourceUrl('  example.com/m.json ')).toBe('https://example.com/m.json')
  })
  it('keeps existing schemes and rejects only emptiness', () => {
    expect(normalizeSourceUrl('http://example.com/x')).toBe('http://example.com/x')
    expect(normalizeSourceUrl('HTTPS://example.com/x')).toBe('HTTPS://example.com/x')
    expect(normalizeSourceUrl('   ')).toBe('')
  })
})

describe('classifySourceUrl', () => {
  it('classifies a bare GitHub repo URL', () => {
    expect(classifySourceUrl('https://github.com/owner/repo')).toEqual({
      kind: 'github',
      owner: 'owner',
      repo: 'repo',
    })
  })
  it('strips .git and tolerates a missing scheme / trailing slash', () => {
    expect(classifySourceUrl('github.com/owner/repo.git/')).toEqual({
      kind: 'github',
      owner: 'owner',
      repo: 'repo',
    })
  })
  it('parses tree URLs into ref + subpath', () => {
    expect(
      classifySourceUrl('https://github.com/owner/repo/tree/main/configs/mcp'),
    ).toEqual({
      kind: 'github',
      owner: 'owner',
      repo: 'repo',
      ref: 'main',
      subpath: 'configs/mcp',
    })
  })
  it('accepts a tree URL without a subpath', () => {
    expect(classifySourceUrl('https://github.com/owner/repo/tree/dev')).toEqual({
      kind: 'github',
      owner: 'owner',
      repo: 'repo',
      ref: 'dev',
    })
  })
  it('treats non-github and non-repo URLs as direct fetches', () => {
    expect(classifySourceUrl('https://example.com/manifest.json')).toEqual({
      kind: 'direct',
      url: 'https://example.com/manifest.json',
    })
    expect(
      classifySourceUrl('https://raw.githubusercontent.com/o/r/main/.mcp.json'),
    ).toEqual({
      kind: 'direct',
      url: 'https://raw.githubusercontent.com/o/r/main/.mcp.json',
    })
    expect(classifySourceUrl('https://github.com/only-owner')).toBeUndefined()
  })
  it('rejects non-http schemes and garbage', () => {
    expect(classifySourceUrl('ftp://example.com/x')).toBeUndefined()
    expect(classifySourceUrl('')).toBeUndefined()
    expect(classifySourceUrl('http://')).toBeUndefined()
  })
})

describe('rawConfigCandidates', () => {
  it('checks .mcp.json then mcp.json at the repo root', () => {
    const target = classifySourceUrl('https://github.com/o/r')
    expect(target?.kind === 'github' && rawConfigCandidates(target, 'main')).toEqual([
      'https://raw.githubusercontent.com/o/r/main/.mcp.json',
      'https://raw.githubusercontent.com/o/r/main/mcp.json',
    ])
  })
  it('checks the tree subpath first, then the repo root', () => {
    const target = classifySourceUrl('https://github.com/o/r/tree/main/sub/dir')
    expect(target?.kind === 'github' && rawConfigCandidates(target, 'main')).toEqual([
      'https://raw.githubusercontent.com/o/r/main/sub/dir/.mcp.json',
      'https://raw.githubusercontent.com/o/r/main/sub/dir/mcp.json',
      'https://raw.githubusercontent.com/o/r/main/.mcp.json',
      'https://raw.githubusercontent.com/o/r/main/mcp.json',
    ])
  })
})

describe('mcpServersToItems', () => {
  it('maps bare stdio entries with env filtering', () => {
    const items = mcpServersToItems(
      {
        fetch: {
          command: 'npx',
          args: ['-y', 'mcp-fetch', 42],
          env: { A: '1', B: 2, C: null },
          description: 'Fetch things',
          version: '1.4.0',
        },
      },
      'owner/repo',
    )
    expect(items).toHaveLength(1)
    expect(items[0]).toEqual({
      id: 'mcp-fetch',
      name: 'fetch',
      description: 'Fetch things',
      tags: ['github'],
      kind: 'mcp',
      version: '1.4.0',
      payload: {
        serverName: 'fetch',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', 'mcp-fetch'],
        env: { A: '1' },
      },
    })
  })
  it('maps typed stdio entries and uses the fallback description', () => {
    const items = mcpServersToItems(
      { fs: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] } },
      'owner/repo',
    )
    expect(items[0]?.name).toBe('fs')
    expect(items[0]?.description).toBe('来自 owner/repo 的 MCP 服务器')
    expect(items[0]?.payload).toEqual({
      serverName: 'fs',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem'],
    })
    expect(items[0]?.version).toBeUndefined()
  })
  it('maps URL entries (sse / url types) to an sse payload with headers', () => {
    const items = mcpServersToItems(
      {
        remote: { type: 'sse', url: 'https://mcp.example.com/sse', headers: { Authorization: 'Bearer x', n: 1 } },
        plain: { url: 'https://mcp.example.com/other' },
      },
      'owner/repo',
    )
    expect(items[0]?.payload).toEqual({
      serverName: 'remote',
      transport: 'sse',
      url: 'https://mcp.example.com/sse',
      headers: { Authorization: 'Bearer x' },
    })
    expect(items[1]?.payload).toEqual({
      serverName: 'plain',
      transport: 'sse',
      url: 'https://mcp.example.com/other',
    })
  })
  it('skips entries it cannot map and non-object roots', () => {
    expect(
      mcpServersToItems({ bad: 'nope', empty: {}, arr: [1, 2], '': { command: 'x' } }, 'o/r'),
    ).toEqual([])
    expect(mcpServersToItems('nope', 'o/r')).toEqual([])
    expect(mcpServersToItems(null, 'o/r')).toEqual([])
  })
})

describe('discoverSource (direct)', () => {
  it('keeps the manifest envelope mode fully backward compatible', async () => {
    const fetcher = routeFetch([
      {
        match: 'example.com/manifest.json',
        body: { name: 'Custom', items: [{ id: 'x', name: 'X', description: 'd', kind: 'mcp' }] },
      },
    ])
    const outcome = await discoverSource('https://example.com/manifest.json', fetcher)
    expect(outcome.state).toBe('ok')
    if (outcome.state === 'ok') {
      expect(outcome.name).toBe('Custom')
      expect(outcome.items.map((item) => item.id)).toEqual(['x'])
    }
  })
  it('accepts a direct .mcp.json / mcpServers response', async () => {
    const fetcher = routeFetch([
      { match: 'example.com/.mcp.json', body: { mcpServers: { srv: { command: 'node' } } } },
    ])
    const outcome = await discoverSource('https://example.com/.mcp.json', fetcher)
    expect(outcome.state).toBe('ok')
    if (outcome.state === 'ok') {
      expect(outcome.items[0]?.name).toBe('srv')
      expect(outcome.items[0]?.description).toBe('来自 example.com 的 MCP 服务器')
    }
  })
  it('reports readable errors for 401 / 404 / 429 and non-JSON bodies', async () => {
    const unauthorized = await discoverSource(
      'https://example.com/private.json',
      routeFetch([{ match: 'private.json', status: 401, body: {} }]),
    )
    expect(unauthorized).toMatchObject({ state: 'offline', error: '访问被拒绝（HTTP 401）：可能为私有仓库或缺少访问凭证' })

    const missing = await discoverSource(
      'https://example.com/gone.json',
      routeFetch([{ match: 'gone.json', status: 404, body: {} }]),
    )
    expect(missing).toMatchObject({ state: 'offline', error: 'HTTP 404' })

    const limited = await discoverSource(
      'https://example.com/limited.json',
      routeFetch([{ match: 'limited.json', status: 429, body: {} }]),
    )
    expect(limited).toMatchObject({ state: 'offline', error: '请求触发 GitHub 限流，请稍后再试' })

    const html = new Response('<html>not json</html>', { status: 200 })
    const notJson = await discoverSource('https://example.com/x.json', (async () => html) as typeof fetch)
    expect(notJson).toMatchObject({ state: 'invalid', error: '响应不是有效 JSON' })

    const neither = await discoverSource(
      'https://example.com/other.json',
      routeFetch([{ match: 'other.json', body: { hello: 'world' } }]),
    )
    expect(neither.state).toBe('invalid')
    expect((neither as { error: string }).error).toContain('items')
  })
  it('rejects URLs that are not http(s) sources', async () => {
    const outcome = await discoverSource('javascript:alert(1)', routeFetch([]))
    expect(outcome.state).toBe('invalid')
    expect((outcome as { error: string }).error).toContain('源地址无效')
  })
})

describe('discoverSource (GitHub adapter)', () => {
  it('resolves the default branch then reads .mcp.json', async () => {
    const fetcher = routeFetch([
      { match: 'api.github.com/repos/o/r', body: { default_branch: 'develop' } },
      {
        match: 'raw.githubusercontent.com/o/r/develop/.mcp.json',
        body: { mcpServers: { git: { command: 'uvx', args: ['mcp-server-git'] } } },
      },
    ])
    const outcome = await discoverSource('https://github.com/o/r', fetcher)
    expect(outcome.state).toBe('ok')
    if (outcome.state === 'ok') {
      expect(outcome.items[0]?.payload).toEqual({
        serverName: 'git',
        transport: 'stdio',
        command: 'uvx',
        args: ['mcp-server-git'],
      })
      expect(outcome.description).toBe('GitHub · o/r')
    }
    expect(fetcher.calls).toEqual([
      'https://api.github.com/repos/o/r',
      'https://raw.githubusercontent.com/o/r/develop/.mcp.json',
    ])
  })
  it('skips the branch lookup when the tree URL pins a ref', async () => {
    const fetcher = routeFetch([
      {
        match: 'raw.githubusercontent.com/o/r/v1/.mcp.json',
        body: { mcpServers: { a: { command: 'x' } } },
      },
    ])
    const outcome = await discoverSource('https://github.com/o/r/tree/v1', fetcher)
    expect(outcome.state).toBe('ok')
    expect(fetcher.calls.some((call) => call.includes('api.github.com'))).toBe(false)
  })
  it('falls back from .mcp.json 404 to mcp.json', async () => {
    const fetcher = routeFetch([
      { match: 'api.github.com/repos/o/r', body: { default_branch: 'main' } },
      {
        match: '/mcp.json',
        body: { mcpServers: { b: { type: 'stdio', command: 'y' } } },
      },
    ])
    const outcome = await discoverSource('https://github.com/o/r', fetcher)
    expect(outcome.state).toBe('ok')
    expect(fetcher.calls[1]).toBe('https://raw.githubusercontent.com/o/r/main/.mcp.json')
    expect(fetcher.calls[2]).toBe('https://raw.githubusercontent.com/o/r/main/mcp.json')
  })
  it('falls back to main when the branch lookup fails to parse', async () => {
    const fetcher = routeFetch([
      { match: 'api.github.com/repos/o/r', body: 'not-an-object' },
      { match: 'raw.githubusercontent.com', body: { mcpServers: { c: { command: 'z' } } } },
    ])
    const outcome = await discoverSource('https://github.com/o/r', fetcher)
    expect(outcome.state).toBe('ok')
    expect(fetcher.calls[1]).toContain('/main/.mcp.json')
  })
  it('reports the friendly no-config error when the repo has neither file', async () => {
    const fetcher = routeFetch([
      { match: 'api.github.com/repos/o/r', body: { default_branch: 'main' } },
    ])
    const outcome = await discoverSource('https://github.com/o/r', fetcher)
    expect(outcome).toMatchObject({
      state: 'invalid',
      error: expect.stringContaining('该仓库没有 .mcp.json / mcp.json'),
    })
  })
  it('maps api 404 to a repo-not-found error and 403 to rate limiting', async () => {
    const notFound = await discoverSource(
      'https://github.com/o/missing',
      routeFetch([{ match: 'api.github.com/repos/o/missing', status: 404, body: {} }]),
    )
    expect(notFound).toMatchObject({
      state: 'offline',
      error: expect.stringContaining('不存在或不可访问'),
    })
    const limited = await discoverSource(
      'https://github.com/o/r',
      routeFetch([{ match: 'api.github.com/repos/o/r', status: 403, body: {} }]),
    )
    expect(limited).toMatchObject({ state: 'offline', error: '请求触发 GitHub 限流，请稍后再试' })
  })
  it('surfaces a raw 403 as an access-denied error instead of no-config', async () => {
    const fetcher = routeFetch([
      { match: 'api.github.com/repos/o/r', body: { default_branch: 'main' } },
      { match: 'raw.githubusercontent.com', status: 403, body: {} },
    ])
    const outcome = await discoverSource('https://github.com/o/r', fetcher)
    expect(outcome).toMatchObject({
      state: 'offline',
      error: expect.stringContaining('访问被拒绝（HTTP 403）'),
    })
  })
  it('turns network failures into the offline state', async () => {
    const fetcher = (async () => {
      throw new Error('boom')
    }) as typeof fetch
    const outcome = await discoverSource('https://github.com/o/r', fetcher)
    expect(outcome).toMatchObject({ state: 'offline', error: 'boom' })
  })
})

describe('manifest fetcher integration', () => {
  it('discovers a GitHub source through fetchManifest / fetchAllManifests', async () => {
    clearManifestCache()
    const fetcher = routeFetch([
      { match: 'api.github.com/repos/o/r', body: { default_branch: 'main' } },
      {
        match: 'raw.githubusercontent.com/o/r/main/.mcp.json',
        body: { mcpServers: { git: { command: 'uvx', args: ['mcp-server-git'] } } },
      },
    ])
    const result = await fetchManifest(source('https://github.com/o/r'), fetcher)
    expect(result.state).toBe('ok')
    if (result.state === 'ok') {
      expect(result.envelope.items[0]?.name).toBe('git')
    }
    const snapshots = await fetchAllManifests([source('https://github.com/o/r')], fetcher)
    expect(snapshots[0]?.state).toBe('ok')
    expect(snapshots[0]?.items?.[0]?.id).toBe('mcp-git')
    clearManifestCache()
  })
})
