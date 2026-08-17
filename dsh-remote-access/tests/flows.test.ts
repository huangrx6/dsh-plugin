import { describe, expect, it } from 'vitest'
import { fetchServeStatus, fetchStatus, startServe, stopServe, TailscaleError, type TailRunner } from '../src/tailscale.ts'

type Scripted = Record<string, { stdout?: string; stderr?: string; code?: number } | Error>

/** Fake runner keyed by joined args, e.g. { "status --json": { stdout, code: 0 } }. */
function fakeRunner(script: Scripted): TailRunner {
  return async (args) => {
    const key = args.join(' ')
    const entry = script[key]
    if (entry === undefined) {
      const known = Object.keys(script).map(k => `  ${k}`).join('\n')
      throw new Error(`unexpected command: ${key}\nknown:\n${known}`)
    }
    if (entry instanceof Error) throw entry
    return { stdout: entry.stdout ?? '', stderr: entry.stderr ?? '', code: entry.code ?? 0 }
  }
}

const STATUS_OK = JSON.stringify({
  BackendState: 'Running',
  Self: { DNSName: 'mac.tail.ts.net.', HostName: 'mac' },
})

describe('fetchStatus', () => {
  it('parses a running status', async () => {
    const status = await fetchStatus(fakeRunner({ 'status --json': { stdout: STATUS_OK } }))
    expect(status.loggedIn).toBe(true)
    expect(status.dnsName).toBe('mac.tail.ts.net')
  })
  it('throws a not-running issue on nonzero exit', async () => {
    const run = fakeRunner({ 'status --json': { code: 1, stderr: 'tailscaled not running' } })
    await expect(fetchStatus(run)).rejects.toBeInstanceOf(TailscaleError)
  })
})

describe('fetchServeStatus', () => {
  it('prefers json output', async () => {
    const serve = await fetchServeStatus(fakeRunner({
      'serve status --json': { stdout: JSON.stringify({ HTTPS: { 'mac.tail.ts.net': { Handlers: { '/': { Proxy: 'http://127.0.0.1:3080' } } } } }) },
    }))
    expect(serve.servingPort).toBe(3080)
  })
  it('falls back to legacy text when --json is unsupported', async () => {
    const serve = await fetchServeStatus(fakeRunner({
      'serve status --json': { code: 1, stderr: 'unknown flag' },
      'serve status': { stdout: '|-- / proxy http://127.0.0.1:3080' },
    }))
    expect(serve.servingPort).toBe(3080)
  })
  it('resolves to idle when both probes fail', async () => {
    const serve = await fetchServeStatus(fakeRunner({
      'serve status --json': { code: 1 },
      'serve status': { code: 1 },
    }))
    expect(serve.servingPort).toBeNull()
  })
})

describe('startServe', () => {
  it('passes on exit 0', async () => {
    await startServe(fakeRunner({ 'serve --bg 3080': { code: 0 } }), 3080)
  })
  it('maps certificate errors to https-certificates-disabled', async () => {
    const run = fakeRunner({ 'serve --bg 3080': { code: 1, stderr: 'error: HTTPS is disabled on your tailnet' } })
    const error = await startServe(run, 3080).catch(e => e)
    expect(error).toBeInstanceOf(TailscaleError)
    expect((error as TailscaleError).code).toBe('https-certificates-disabled')
  })
  it('maps other failures to serve-failed', async () => {
    const run = fakeRunner({ 'serve --bg 3080': { code: 1, stderr: 'boom' } })
    const error = await startServe(run, 3080).catch(e => e)
    expect((error as TailscaleError).code).toBe('serve-failed')
  })
})

describe('stopServe', () => {
  it('uses the per-port off first', async () => {
    const calls: string[] = []
    const run: TailRunner = async (args) => {
      calls.push(args.join(' '))
      return { stdout: '', stderr: '', code: 0 }
    }
    await stopServe(run, 3080)
    expect(calls).toEqual(['serve --3080 off'])
  })
  it('resets when the per-port off is rejected', async () => {
    const calls: string[] = []
    const run: TailRunner = async (args) => {
      const key = args.join(' ')
      calls.push(key)
      return { stdout: '', stderr: '', code: key === 'serve --3080 off' ? 1 : 0 }
    }
    await stopServe(run, 3080)
    expect(calls).toEqual(['serve --3080 off', 'serve reset'])
  })
})
