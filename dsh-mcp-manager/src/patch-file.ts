/**
 * Patch-layer persistence for MCP loader entries: reads and writes the
 * entry-list YAML dialect (`cordis.patch.yml`) that the Cordis include
 * loader mounts and hot-reloads. `!!js` expression scalars round-trip as
 * `{ __jsExpr }` nodes exactly like `@deepseek-ai/cordis-plugin-include`
 * parses and dumps them, so a rewrite never destroys user expressions.
 */
import * as yaml from 'js-yaml'
import { readFile, rename, writeFile } from 'node:fs/promises'
import type { McpJsExprValue } from './contracts.ts'

export interface JsExprNode {
  __jsExpr: string
}

export function isJsExpr(value: unknown): value is JsExprNode {
  return typeof value === 'object' && value !== null && '__jsExpr' in value && typeof (value as { __jsExpr: unknown }).__jsExpr === 'string'
}

const JsExprType = new yaml.Type('tag:yaml.org,2002:js', {
  kind: 'scalar',
  resolve: data => typeof data === 'string',
  construct: data => ({ __jsExpr: data as string }),
  predicate: (data: unknown) => isJsExpr(data),
  represent: (data: unknown) => (data as JsExprNode).__jsExpr,
})

const schema = yaml.JSON_SCHEMA.extend(JsExprType)

/** One parsed patch layer: the patch array plus bookkeeping for edits. */
export class PatchLayer {
  readonly patches: unknown[]

  constructor(readonly path: string, patches: unknown[]) {
    this.patches = patches
  }

  static async load(path: string): Promise<PatchLayer> {
    const text = await readFile(path, 'utf8').catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return '[]'
      throw error
    })
    const data = yaml.load(text, { schema })
    if (!Array.isArray(data)) throw new Error(`${path}: patch 层必须是数组`)
    return new PatchLayer(path, data as unknown[])
  }

  /** Serialize back with a `.bak` backup and an atomic rename. */
  async save(): Promise<void> {
    const content = `${yaml.dump(this.patches, { schema, lineWidth: 120, noRefs: true })}`
    await writeFile(`${this.path}.bak`, await readFile(this.path, 'utf8').catch(() => ''), 'utf8').catch(() => {})
    const temporary = `${this.path}.mcp-manager-${process.pid}.tmp`
    await writeFile(temporary, content, 'utf8')
    await rename(temporary, this.path)
  }
}

export function parseYamlPatches(text: string): unknown[] {
  const data = yaml.load(text, { schema })
  if (!Array.isArray(data)) throw new Error('YAML 顶层必须是数组')
  return data as unknown[]
}

export function dumpYamlPatches(patches: unknown[]): string {
  return yaml.dump(patches, { schema, lineWidth: 120, noRefs: true })
}

export function parseYamlConfig(text: string): Record<string, unknown> {
  const data = yaml.load(text, { schema })
  if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('YAML 必须是对象（键值对）')
  return data as Record<string, unknown>
}

export function dumpYamlConfig(config: Record<string, unknown>): string {
  return yaml.dump(config, { schema, lineWidth: 120, noRefs: true })
}

export function containsJsExpr(value: unknown): boolean {
  if (isJsExpr(value)) return true
  if (Array.isArray(value)) return value.some(containsJsExpr)
  if (typeof value === 'object' && value !== null) return Object.values(value).some(containsJsExpr)
  return false
}

export type { McpJsExprValue }
