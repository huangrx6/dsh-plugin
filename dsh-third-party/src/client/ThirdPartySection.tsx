/**
 * 「三方能力」section 内容区：横向滚动 tab 条 + 当前 tab 面板。
 *
 * 严格对照官方 ui-settings-plugins 的 PluginsSettingsSection 契约：
 *  - `useTabs` —— section 注册时 slots 注入的 tab 行 store（id/label/order）
 *  - `renderSlot(name, { id, ...props })` —— 渲染指定 tab 的组件面板
 * tab 文本永不换行（nowrap），tab 条横向滚动（overflow-x auto），
 * PC 与手机一致；后续能力通过 settings.thirdparty.tab 注册即出现。
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'

export interface ThirdPartyTabRow {
  readonly id: string
  readonly order: number
  readonly label: string
}

export interface ThirdPartySectionProps {
  readonly t: (key: 'title' | 'intro' | 'empty' | 'tabs') => string
  readonly renderSlot: PropsRenderSlots<'settings.thirdparty.tab'>['renderSlot']
  readonly useTabs: <T>(select: (rows: readonly ThirdPartyTabRow[]) => T) => T
}

export function ThirdPartySection({ t, renderSlot, useTabs }: ThirdPartySectionProps) {
  const tabsId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const rows = useTabs(value => value)
  const [activeId, setActiveId] = useState<string>()
  const [visitedIds, setVisitedIds] = useState<ReadonlySet<string>>(() => new Set())
  const active = rows.find(row => row.id === activeId)?.id ?? rows[0]?.id

  useEffect(() => {
    if (active === undefined) return
    setVisitedIds(previous => {
      if (previous.has(active)) return previous
      return new Set([...previous, active])
    })
  }, [active])

  // 键盘左右切换（照官方 tablist 语义）。
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const index = tabRefs.current.findIndex(node => node === event.currentTarget)
    if (index < 0) return
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (delta === 0) return
    event.preventDefault()
    const next = tabRefs.current[(index + delta + rows.length) % rows.length]
    next?.focus()
    next?.click()
  }

  return (
    <div className="dsh-tp-root">
      <h2 className="dsh-tp-title">{t('title')}</h2>
      <p className="dsh-tp-intro">{t('intro')}</p>
      {rows.length === 0
        ? <p className="dsh-tp-empty">{t('empty')}</p>
        : (
          <>
            <div className="dsh-tp-tabs" role="tablist" aria-label={t('tabs')}>
              {rows.map((row, index) => {
                const selected = row.id === active
                return (
                  <button
                    key={row.id}
                    ref={element => { tabRefs.current[index] = element }}
                    id={`${tabsId}-tab-${row.id}`}
                    type="button"
                    role="tab"
                    className={selected ? 'dsh-tp-tab dsh-tp-tab--active' : 'dsh-tp-tab'}
                    aria-selected={selected}
                    aria-controls={`${tabsId}-panel-${row.id}`}
                    onKeyDown={onKeyDown}
                    onClick={() => { setActiveId(row.id) }}
                  >
                    {row.label}
                  </button>
                )
              })}
            </div>
            {rows
              .filter(row => row.id === active || visitedIds.has(row.id))
              .map(row => {
                const selected = row.id === active
                return (
                  <div
                    key={row.id}
                    id={`${tabsId}-panel-${row.id}`}
                    role="tabpanel"
                    aria-labelledby={`${tabsId}-tab-${row.id}`}
                    hidden={!selected}
                  >
                    {/* 官方 renderSlot 第三参 `{ only: id }` 限定只渲染该 tab 注册项；
                        第二参是 owner props（容器不传）——之前传 { id } 导致全部渲染。 */}
                    {renderSlot('settings.thirdparty.tab', {}, { only: row.id })}
                  </div>
                )
              })}
          </>
        )}
    </div>
  )
}
