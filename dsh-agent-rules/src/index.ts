/**
 * Host half of dsh-agent-rules.
 *
 * Exposes one trusted-host RPC channel that reads/writes the user-global
 * agent instructions file `$DSH_HOME/AGENTS.md` (default `~/.dsh/AGENTS.md`),
 * which @deepseek-ai/dsh-agent-instructions loads into every session as a
 * persistent baseline. The web client (`个人空间 → Agent 规则`) renders the
 * editor around this channel.
 */
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import type { ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import {
  DSH_AGENT_RULES_CHANNEL,
  type AgentRulesPayload,
} from './contracts.ts'

export const name = 'dsh-agent-rules'

/** Required services — resolved structurally off ctx (see apply). */
export const inject = ['connection']

/** Resolve `$DSH_HOME/AGENTS.md`; DSH_HOME defaults to `~/.dsh`. */
function rulesFilePath(): string {
  const home = process.env['DSH_HOME'] ?? join(homedir(), '.dsh')
  return join(home, 'AGENTS.md')
}

function ok(value: unknown): RpcResult<unknown> {
  return { ok: true, value }
}
function fail(message: string): RpcResult<unknown> {
  return { ok: false, error: { code: 'internal', message, details: {} } }
}

export function apply(ctx: unknown): void {
  const ext = ctx as {
    effect?: (fn: () => () => void, label?: string) => void
    connection: {
      rpc: {
        handle: (
          channel: string,
          handler: ConnectionRpcHandler,
          options: { authority: 'trusted-host' | 'loopback' },
        ) => Promise<unknown>
      }
    }
  }

  const handler: ConnectionRpcHandler = async (_endpoint, payload) => {
    const request = payload as AgentRulesPayload
    const file = rulesFilePath()
    try {
      if (request?.op === 'read') {
        let text = ''
        try {
          text = await readFile(file, 'utf8')
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        }
        return ok({ text })
      }
      if (request?.op === 'write') {
        const next = request.payload?.text ?? ''
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, next, 'utf8')
        return ok({ bytes: Buffer.byteLength(next, 'utf8') })
      }
      return fail(`unknown op: ${String(request?.op)}`)
    } catch (error) {
      return fail(error instanceof Error ? error.message : String(error))
    }
  }

  ext.effect?.(
    () => {
      const handlePromise = ext.connection.rpc.handle(
        DSH_AGENT_RULES_CHANNEL,
        handler,
        { authority: 'trusted-host' },
      )
      return () => {
        void handlePromise
      }
    },
    'dsh-agent-rules: rpc',
  )
}
