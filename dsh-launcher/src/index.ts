/**
 * Host half of dsh-launcher.
 *
 * Reads workspace section metadata from `$DSH_HOME/launcher-sections.json`
 * (falling back to built-in defaults when the file is absent or malformed)
 * and exposes it to the client bundle via the `dsh-launcher-sections` RPC
 * channel. The client uses the metadata to drive menu ordering, grouping,
 * and labels — replacing the previous hardcoded DEFAULT_SECTIONS array.
 *
 * The config file is a JSON array of SectionMetadataEntry objects:
 *   [{id, menuGroup, menuPriority, zh: {name, desc}, en: {name, desc}}, …]
 *
 * If the file does not exist or contains invalid JSON, the built-in
 * defaults (identical to the previous DEFAULT_SECTIONS) are returned.
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import type { ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import {
  LAUNCHER_SECTIONS_CHANNEL,
  type SectionMetadataEntry,
  type SectionMetadata,
} from './contracts.ts'

export const name = 'dsh-launcher'

export const inject = ['connection'] as const

// ─── Built-in fallback metadata (mirrors the previous DEFAULT_SECTIONS) ──

const BUILTIN_SECTIONS: readonly SectionMetadata[] = [
  {
    id: 'rules',
    menuGroup: 'agent',
    menuPriority: 1,
    zh: { name: 'Agent 规则', desc: '编辑 ~/.dsh/AGENTS.md，注入到所有会话的全局指令。' },
    en: { name: 'Agent rules', desc: 'Edit ~/.dsh/AGENTS.md, the global instructions injected into every session.' },
  },
  {
    id: 'usage',
    menuGroup: 'manage',
    menuPriority: 2,
    zh: { name: '订阅额度', desc: '查看 GLM / MiniMax / Opencode 订阅额度使用情况。' },
    en: { name: 'Usage', desc: 'View GLM / MiniMax / Opencode subscription quota usage.' },
  },
  {
    id: 'layout',
    menuGroup: 'appearance',
    menuPriority: 3,
    zh: { name: '页面布局', desc: '页面材质、阅读宽度、收笔、气泡、轨迹、统计。' },
    en: { name: 'Layout', desc: 'Page material, reading width, scroll end, bubbles, trace, stats.' },
  },
  {
    id: 'skills',
    menuGroup: 'manage',
    menuPriority: 4,
    zh: { name: '技能管理', desc: '安装、卸载、管理 SKILL.md 技能。' },
    en: { name: 'Skill Manager', desc: 'Install, uninstall, and manage SKILL.md skills.' },
  },
  {
    id: 'mcp',
    menuGroup: 'manage',
    menuPriority: 5,
    zh: { name: 'MCP 管理', desc: '安装、卸载、管理 MCP 服务器。' },
    en: { name: 'MCP Manager', desc: 'Install, uninstall, and manage MCP servers.' },
  },
  {
    id: 'remote',
    menuGroup: 'tools',
    menuPriority: 6,
    zh: { name: '远程访问', desc: 'Tailscale Serve + 二维码访问本地 dsh。' },
    en: { name: 'Remote Access', desc: 'Tailscale Serve + QR-code access to your local dsh.' },
  },
  {
    id: 'archive',
    menuGroup: 'tools',
    menuPriority: 7,
    zh: { name: '归档管理', desc: '恢复工作区、导出 zip / Markdown。' },
    en: { name: 'Archive', desc: 'Restore workspaces, export zip or Markdown.' },
  },
]

// ─── Config file resolution ─────────────────────────────────────────────

function configPath(): string {
  const home = process.env['DSH_HOME'] ?? join(homedir(), '.dsh')
  return join(home, 'launcher-sections.json')
}

function isEntry(value: unknown): value is SectionMetadataEntry {
  if (value === null || typeof value !== 'object') return false
  const e = value as Record<string, unknown>
  return (
    typeof e['id'] === 'string' &&
    typeof e['menuGroup'] === 'string' &&
    typeof e['menuPriority'] === 'number' &&
    typeof e['zh'] === 'object' && e['zh'] !== null &&
    typeof (e['zh'] as Record<string, unknown>)['name'] === 'string' &&
    typeof (e['zh'] as Record<string, unknown>)['desc'] === 'string' &&
    typeof e['en'] === 'object' && e['en'] !== null &&
    typeof (e['en'] as Record<string, unknown>)['name'] === 'string' &&
    typeof (e['en'] as Record<string, unknown>)['desc'] === 'string'
  )
}

async function readConfig(): Promise<readonly SectionMetadata[]> {
  try {
    const raw = await readFile(configPath(), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return BUILTIN_SECTIONS
    const valid = (parsed as unknown[]).filter(isEntry) as SectionMetadata[]
    if (valid.length === 0) return BUILTIN_SECTIONS
    return valid.sort((a, b) => a.menuPriority - b.menuPriority)
  } catch {
    return BUILTIN_SECTIONS
  }
}

// ─── RPC helpers ────────────────────────────────────────────────────────

function ok(value: unknown): RpcResult<unknown> {
  return { ok: true, value }
}
function fail(error: unknown): RpcResult<unknown> {
  return {
    ok: false,
    error: {
      code: 'internal',
      message: error instanceof Error ? error.message : String(error),
      details: {},
    },
  }
}

// ─── Plugin entry ───────────────────────────────────────────────────────

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

  const handler: ConnectionRpcHandler = async (_endpoint, _payload) => {
    try {
      const sections = await readConfig()
      return ok({ sections })
    } catch (error) {
      return fail(error)
    }
  }

  ext.effect?.(
    () => {
      const handlePromise = ext.connection.rpc.handle(
        LAUNCHER_SECTIONS_CHANNEL,
        handler,
        { authority: 'trusted-host' },
      )
      return () => {
        void handlePromise
      }
    },
    'dsh-launcher: sections rpc',
  )
}
