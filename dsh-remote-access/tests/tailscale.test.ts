import { describe, expect, it } from 'vitest'
import {
  buildServeResetArgs,
  buildServeStartArgs,
  composeHttpsUrl,
  parseServeStatus,
  parseStatusJson,
  parseVersion,
  looksLikeHttpsCertificatesDisabled,
  parseServeAuthUrl,
  stopServe,
  TailscaleError,
  type TailRunner,
} from '../src/tailscale.ts'

// ---------------------------------------------------------------------------
// parseStatusJson
// ---------------------------------------------------------------------------

const STATUS_RUNNING = JSON.stringify({
  BackendState: 'Running',
  Self: { DNSName: 'huangrx6-mac.tail4c4c.ts.net.', HostName: 'huangrx6-mac' },
  MagicDNSSuffix: 'tail4c4c.ts.net.',
})

const STATUS_STOPPED = JSON.stringify({ BackendState: 'Stopped', Self: null })

describe('parseStatusJson', () => {
  it('extracts backend state, login, and strips the MagicDNS trailing dot', () => {
    const parsed = parseStatusJson(STATUS_RUNNING)
    expect(parsed.backendState).toBe('Running')
    expect(parsed.loggedIn).toBe(true)
    expect(parsed.dnsName).toBe('huangrx6-mac.tail4c4c.ts.net')
    expect(parsed.hostName).toBe('huangrx6-mac')
  })

  it('reports not logged in when Self is absent', () => {
    const parsed = parseStatusJson(STATUS_STOPPED)
    expect(parsed.backendState).toBe('Stopped')
    expect(parsed.loggedIn).toBe(false)
    expect(parsed.dnsName).toBeNull()
  })

  it('survives garbage input', () => {
    const parsed = parseStatusJson('not json at all')
    expect(parsed.backendState).toBeNull()
    expect(parsed.loggedIn).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// parseVersion / parseServeStatus
// ---------------------------------------------------------------------------

describe('parseVersion', () => {
  it('takes the first line', () => {
    expect(parseVersion('1.82.5\n  tailscale commit: abc\n')).toBe('1.82.5')
  })
  it('returns null for empty text', () => {
    expect(parseVersion('   \n')).toBeNull()
  })
})

describe('parseServeStatus', () => {
  it('finds the proxy target in the JSON shape', () => {
    const json = JSON.stringify({
      HTTPS: {
        'huangrx6-mac.tail4c4c.ts.net': {
          Handlers: {
            '/': { Type: 'proxy', Proxy: 'http://127.0.0.1:3080' },
          },
        },
      },
    })
    const parsed = parseServeStatus(json)
    expect(parsed.servingPort).toBe(3080)
    expect(parsed.target).toBe('http://127.0.0.1:3080')
  })

  it('scans legacy plain-text output', () => {
    const parsed = parseServeStatus('https://huangrx6-mac.tail4c4c.ts.net/\n|-- / proxy http://127.0.0.1:3080')
    expect(parsed.servingPort).toBe(3080)
  })

  it('returns nulls when nothing is served', () => {
    expect(parseServeStatus('No serve config').servingPort).toBeNull()
    const parsed = parseServeStatus(JSON.stringify({ HTTPS: {} }))
    expect(parsed.target).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// command construction / URL composition
// ---------------------------------------------------------------------------

describe('command construction', () => {
  it('builds serve start args', () => {
    expect(buildServeStartArgs(3080)).toEqual(['serve', '--bg', '3080'])
  })
  it('builds serve reset args (1.102+ has no per-port off syntax)', () => {
    expect(buildServeResetArgs()).toEqual(['serve', 'reset'])
  })
  it('composes an HTTPS url and tolerates trailing dots', () => {
    expect(composeHttpsUrl('mac.tail.ts.net')).toBe('https://mac.tail.ts.net')
    expect(composeHttpsUrl('mac.tail.ts.net..')).toBe('https://mac.tail.ts.net')
  })
})

describe('serve enable diagnostics', () => {
  it('extracts the admin authorization URL from pending output', () => {
    const out = '\nServe is not enabled on your tailnet.\nTo enable, visit:\n\n         https://login.tailscale.com/f/serve?node=nhu89kq98F11CNTRL\n'
    expect(parseServeAuthUrl(out)).toBe('https://login.tailscale.com/f/serve?node=nhu89kq98F11CNTRL')
    expect(parseServeAuthUrl('no url here')).toBeNull()
  })
  it('detects HTTPS-certificates-disabled wording for the admin-console hint', () => {
    expect(looksLikeHttpsCertificatesDisabled('error: HTTPS is disabled on your tailnet')).toBe(true)
    expect(looksLikeHttpsCertificatesDisabled('failed to fetch certificate via ACME')).toBe(true)
    expect(looksLikeHttpsCertificatesDisabled('connection refused')).toBe(false)
  })
})

describe('stopServe', () => {
  it('resets directly (only reliable removal for classic rules)', async () => {
    const calls: string[] = []
    const run: TailRunner = async (args) => {
      calls.push(args.join(' '))
      return { stdout: '', stderr: '', code: 0 }
    }
    await stopServe(run, 3080)
    expect(calls).toEqual(['serve reset'])
  })
  it('surfaces reset failures with the manual hint', async () => {
    const run: TailRunner = async () => ({ stdout: '', stderr: 'boom', code: 1 })
    const error = await stopServe(run, 3080).catch(e => e)
    expect(error).toBeInstanceOf(TailscaleError)
    expect((error as TailscaleError).code).toBe('serve-failed')
  })
})
