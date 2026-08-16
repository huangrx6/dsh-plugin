import type { Context } from '@deepseek-ai/cordis'
import '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { DSH_LAYOUT_CHANNEL } from './contracts.ts'

export const name = 'dsh-layout'

export const inject = ['connection']

export async function apply(ctx: Context): Promise<void> {
  const filePath = resolve(process.env.DSH_LAYOUT_FILE ?? join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'dsh-layout.json'))
  // First-run migration: the plugin shipped as `layout-setting` for a while and
  // wrote layout-setting.json; pick it up once so users keep their choices.
  const legacyPath = resolve(filePath, '..', 'layout-setting.json')
  const handle = async (endpoint: string, payload: unknown): Promise<RpcResult<unknown>> => {
    try {
      if (endpoint === 'load') {
        try {
          return ok(JSON.parse(await readFile(filePath, 'utf8')))
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            try {
              return ok(JSON.parse(await readFile(legacyPath, 'utf8')))
            } catch {
              return ok(null)
            }
          }
          throw error
        }
      }
      if (endpoint === 'save') {
        const settings = (payload as { settings?: unknown } | null)?.settings
        if (settings === undefined) throw new Error('缺少布局配置。')
        await mkdir(resolve(filePath, '..'), { recursive: true })
        const temporary = `${filePath}.${process.pid}.tmp`
        await writeFile(temporary, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
        await rename(temporary, filePath)
        return ok({ saved: true, filePath })
      }
      throw new Error(`未知操作：${endpoint}`)
    } catch (error) {
      return fail(error instanceof Error ? error.message : String(error))
    }
  }
  ctx.effect(() => ctx.connection.rpc.handle(DSH_LAYOUT_CHANNEL, handle, { authority: 'loopback' }), 'dsh-layout: file persistence')
}

function ok(value: unknown): RpcResult<unknown> { return { ok: true, value } }
function fail(error: string): RpcResult<unknown> { return { ok: false, error: { code: 'internal', message: error, details: {} } } }
