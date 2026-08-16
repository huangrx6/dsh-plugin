import { useState } from 'react'
import { IconChevronDownOutline14, JsonTree } from '@deepseek-ai/dsh-client-ui-primitives'
import type { McpManagerLocaleKey } from './locales.ts'
import type { CachedTool } from './tool-cache.ts'

/** Shape the list renders — covers both cached probes and live registrations. */
export interface ToolRow {
  readonly name: string
  readonly description: string
  readonly schema?: Readonly<Record<string, unknown>> | undefined
}

/**
 * Tool listing shared by the server card and the editor's test panel:
 * one compact row per tool (name + 2-line clamped description); clicking a
 * row unclamps the full description and reveals the parameter schema.
 */
export function ToolList({ t, tools }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly tools: readonly ToolRow[]
}) {
  const [openTool, setOpenTool] = useState<string | undefined>(undefined)
  if (tools.length === 0) return null
  return (
    <ul className="dshmcp-toolList">
      {tools.map(tool => {
        const open = openTool === tool.name
        return (
          <li key={tool.name} className={`dshmcp-tool${open ? ' is-open' : ''}`}>
            <button
              type="button"
              className="dshmcp-toolHead"
              aria-expanded={open}
              title={open ? undefined : t('toolExpandHint')}
              onClick={() => { setOpenTool(current => current === tool.name ? undefined : tool.name) }}
            >
              <span className="dshmcp-toolDot" aria-hidden="true" />
              <span className="dshmcp-toolName">{tool.name}</span>
              <span className="dshmcp-spacer" />
              <span className={`dshmcp-toolChevron${open ? ' is-open' : ''}`}>
                <IconChevronDownOutline14 size={12} aria-hidden="true" />
              </span>
            </button>
            {tool.description.trim() !== ''
              ? <p className="dshmcp-toolDesc">{tool.description}</p>
              : null}
            {open
              ? (
                <div className="dshmcp-toolBody">
                  <span className="dshmcp-toolBodyLabel">{t('toolParameters')}</span>
                  {tool.schema !== undefined && Object.keys(tool.schema).length > 0
                    ? <JsonTree data={tool.schema as Record<string, unknown>} label={tool.name} copyable expandTopLevel />
                    : <p className="dshmcp-status">{t('toolNoParams')}</p>}
                </div>
              )
              : null}
          </li>
        )
      })}
    </ul>
  )
}

export function cachedToolsToRows(cached: readonly CachedTool[]): readonly ToolRow[] {
  return cached.map(tool => ({ name: tool.name, description: tool.description, schema: tool.inputSchema }))
}
