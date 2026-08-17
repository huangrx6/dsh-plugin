import { useMemo, useState } from 'react'
import { IconChevronRightOutline14, IconSearchOutline16, JsonTree, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { McpManagerLocaleKey } from './locales.ts'
import type { CachedTool } from './tool-cache.ts'

/** Shape the list renders — covers both cached probes and live registrations. */
export interface ToolRow {
  readonly name: string
  readonly description: string
  readonly schema?: Readonly<Record<string, unknown>> | undefined
}

/**
 * Master–detail tool list: compact rows (dot + name + clamped description +
 * parameter count) that stay scannable, and a right-side drawer carrying
 * everything worth reading — full description, parameter table and the raw
 * schema — so the list itself never turns into documentation.
 */
export function ToolList({ t, tools, withSearch = false }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly tools: readonly ToolRow[]
  readonly withSearch?: boolean
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | undefined>(undefined)

  const needle = query.trim().toLowerCase()
  const filtered = useMemo(
    () => needle === ''
      ? tools
      : tools.filter(tool => tool.name.toLowerCase().includes(needle) || tool.description.toLowerCase().includes(needle)),
    [tools, needle],
  )
  const selectedTool = selected !== undefined ? tools.find(tool => tool.name === selected) : undefined

  if (tools.length === 0) return null
  return (
    <div className="dshmcp-toolsArea">
      {withSearch
        ? (
          <div className="dshmcp-toolSearch">
            <IconSearchOutline16 size={14} aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder={t('toolSearch')}
              aria-label={t('toolSearch')}
              onChange={event => { setQuery(event.currentTarget.value) }}
            />
            {query.trim() !== '' ? <span className="dshmcp-toolSearchCount">{filtered.length}/{tools.length}</span> : null}
          </div>
        )
        : null}
      {filtered.length === 0
        ? <p className="dshmcp-status">{t('toolSearchEmpty')}</p>
        : (
          <ul className="dshmcp-toolList">
            {filtered.map(tool => (
              <li key={tool.name}>
                <button
                  type="button"
                  className={`dshmcp-toolHead${selected === tool.name ? ' is-selected' : ''}`}
                  aria-expanded={selected === tool.name}
                  onClick={() => { setSelected(current => current === tool.name ? undefined : tool.name) }}
                >
                  <span className="dshmcp-toolDot" aria-hidden="true" />
                  <span className="dshmcp-toolMain">
                    <span className="dshmcp-toolName">{tool.name}</span>
                    {tool.description.trim() !== ''
                      ? <span className="dshmcp-toolDesc" title={tool.description}>{tool.description}</span>
                      : null}
                  </span>
                  <span className="dshmcp-toolParamsHint">{paramsHint(t, tool.schema)}</span>
                  <span className="dshmcp-toolChevron"><IconChevronRightOutline14 size={12} aria-hidden="true" /></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      {selectedTool !== undefined ? <ToolDetails t={t} tool={selectedTool} onClose={() => { setSelected(undefined) }} /> : null}
    </div>
  )
}

/** Tool detail dialog on top of the settings dialog: description, parameter table, raw schema. */
function ToolDetails({ t, tool, onClose }: {
  readonly t: (key: McpManagerLocaleKey) => string
  readonly tool: ToolRow
  readonly onClose: () => void
}) {
  const params = paramRows(tool.schema)
  return (
    <Modal open onClose={onClose} title={tool.name} closeLabel={t('drawerClose')} contentClassName="dshmcp-toolModalBody">
      {tool.description.trim() !== ''
        ? (
          <section>
            <h6>{t('drawerDescription')}</h6>
            <p className="dshmcp-toolModalDesc">{tool.description}</p>
          </section>
        )
        : null}
      <section>
        <h6>{t('drawerParameters')}</h6>
        {params.length > 0
          ? (
            <table className="dshmcp-paramTable">
              <tbody>
                {params.map(row => (
                  <tr key={row.name}>
                    <td className="dshmcp-paramName">{row.name}</td>
                    <td className="dshmcp-paramType">{row.type}</td>
                    <td className={row.required ? 'dshmcp-paramRequired' : 'dshmcp-paramOptional'}>{row.required ? t('paramRequired') : t('paramOptional')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
          : <p className="dshmcp-status">{t('toolNoParams')}</p>}
      </section>
      <section>
        <h6>{t('drawerSchema')}</h6>
        {tool.schema !== undefined && Object.keys(tool.schema).length > 0
          ? <JsonTree data={tool.schema as Record<string, unknown>} label={tool.name} copyable expandTopLevel />
          : <p className="dshmcp-status">{t('toolNoParams')}</p>}
      </section>
    </Modal>
  )
}

interface ParamRow {
  readonly name: string
  readonly type: string
  readonly required: boolean
}

function paramRows(schema: ToolRow['schema']): readonly ParamRow[] {
  if (schema === undefined || typeof schema !== 'object') return []
  const properties = schema['properties']
  if (typeof properties !== 'object' || properties === null) return []
  const required = Array.isArray(schema['required']) ? schema['required'] : []
  return Object.entries(properties as Record<string, unknown>).map(([name, property]) => {
    const record = typeof property === 'object' && property !== null ? property as Record<string, unknown> : {}
    const type = Array.isArray(record['enum']) ? 'enum' : typeof record['type'] === 'string' ? record['type'] : '—'
    return { name, type, required: required.includes(name) }
  })
}

function paramsHint(t: (key: McpManagerLocaleKey) => string, schema: ToolRow['schema']): string {
  const rows = paramRows(schema)
  if (rows.length === 0) return t('toolNoParamsShort')
  const required = rows.filter(row => row.required).length
  return required > 0 ? t('paramCountRequired').replace('{n}', String(rows.length)).replace('{r}', String(required)) : t('paramCount').replace('{n}', String(rows.length))
}

export function cachedToolsToRows(cached: readonly CachedTool[]): readonly ToolRow[] {
  return cached.map(tool => ({ name: tool.name, description: tool.description, schema: tool.inputSchema }))
}
