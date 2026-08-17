import type React from 'react'
import { createContext, useContext, useRef, useState, useSyncExternalStore } from 'react'
import type { LayoutStore } from './store.ts'
import { deleteMedia, saveMedia } from './media.ts'
import { countOverrides, isOverridden, resetField } from './settings-utils.ts'
import { GlassIcon, RadiusIcon, WidthIcon } from './icons.tsx'
import {
  DIALOG_HEIGHT_LIMITS,
  DIALOG_WIDTH_LIMITS,
  MATERIAL_GRADES,
  MATERIAL_LIMITS,
  PAD_LIMITS,
  PAD_PRESETS,
  RADIUS_LIMITS,
  STATS_METRICS,
  materialGrade,
  type LayoutSettings,
  type MaterialSettings,
  type StatsMode,
} from './types.ts'

export interface LayoutSettingsInjected { readonly store: LayoutStore }

const METRIC_LABELS: Readonly<Record<string, string>> = {
  turns: '轮次', steps: '步骤', llm: '模型耗时', tools: '工具耗时',
  ttft: '首 token', speed: '生成速度', cache: '缓存命中', tokens: 'Token 用量',
}

/** The store flows through context so Field rows can offer single-field
    restore without prop drilling. */
const StoreContext = createContext<LayoutStore | null>(null)

export function LayoutSettingsSection({ store }: LayoutSettingsInjected): React.ReactElement {
  const settings = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return <SettingsBody store={store} settings={settings} />
}

function SettingsBody({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const [tab, setTab] = useState<TabId>('global')
  const overrides = countOverrides(settings)

  return <section className="dsh-layout-settings">
    <StoreContext.Provider value={store}>
    <header className="dsh-layout-settings__header">
      <div>
        <h2>页面布局</h2>
        <p>材质、宽度与信息密度；每项默认保持 DSH 原生样式，只做对应的事。</p>
      </div>
      {overrides > 0 && <span className="dsh-layout-dirty" title="与原生默认的差异项数">已修改 {overrides} 项</span>}
    </header>

    <div className="dsh-layout-tabs" role="tablist" aria-label="布局设置分区">
      {TABS.map(entry => (
        <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} onClick={() => setTab(entry.id)}>{entry.label}</button>
      ))}
    </div>

    {tab === 'global' && <GlobalCard store={store} settings={settings} />}
    {tab === 'material' && <MaterialCard store={store} settings={settings} />}
    {tab === 'conversation' && <ConversationCard store={store} settings={settings} />}

    <footer><button type="button" onClick={() => store.reset()}>恢复全部默认</button></footer>
    </StoreContext.Provider>
  </section>
}

type TabId = 'global' | 'material' | 'conversation'
const TABS: readonly { readonly id: TabId; readonly label: string }[] = [
  { id: 'global', label: '全局' },
  { id: 'material', label: '材质' },
  { id: 'conversation', label: '对话' },
]

/** A light band header that segments a dense card into groups. */
function Group({ label }: { label: string }): React.ReactElement {
  return <div className="dsh-layout-settings__group">{label}</div>
}

/** A settings row: label on the left rail, controls in one column.
    `path` wires status ("differs from native") and single-field restore. */
function Field({ label, path, children }: { label: string; path?: string; children: React.ReactNode }): React.ReactElement {
  const store = useContext(StoreContext)
  const overridden = path !== undefined && store !== null && isOverridden(store.getSnapshot(), path)
  return <div className="dsh-layout-settings__field">
    <div className="dsh-layout-settings__label">
      <strong>{label}</strong>
      {overridden && <>
        <span className="dsh-layout-field-status">已自定义</span>
        {store !== null && <button type="button" className="dsh-layout-field-reset" aria-label={`恢复${label}为原生`} title="恢复原生" onClick={() => resetField(store, path as string)}>↶</button>}
      </>}
    </div>
    <div className="dsh-layout-settings__control">{children}</div>
  </div>
}

function CardHeading({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }): React.ReactElement {
  return <div className="dsh-layout-section-heading">
    <div className="dsh-layout-settings__label"><span className="dsh-layout-settings__icon">{icon}</span>
      <div><h3>{title}</h3><p>{hint}</p></div>
    </div>
  </div>
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }): React.ReactElement {
  return <label className="dsh-layout-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><i aria-hidden="true" /></label>
}

function GlobalCard({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const global = settings.global
  const background = global.background
  const setGlobal = (patch: Partial<LayoutSettings['global']>): void => store.update({ global: { ...global, ...patch } })
  const setBackground = (patch: Partial<LayoutSettings['global']['background']>): void => setGlobal({ background: { ...background, ...patch } })

  /** Local files become IndexedDB blobs; the setting keeps a small marker. */
  const pickLocalFile = async (file: File, slot: 'imageUrl' | 'videoUrl'): Promise<void> => {
    try {
      const previous = background[slot]
      const marker = await saveMedia(file)
      setBackground({ [slot]: marker })
      if (previous !== marker) void deleteMedia(previous)
    } catch (error) {
      console.error('dsh-layout local media could not be stored:', error)
    }
  }
  return <section className="dsh-layout-settings__card">
    <CardHeading icon={<RadiusIcon />} title="全局" hint="圆角、页面背景、弹窗尺寸与边距等跨区域选项；默认保持 DSH 原生。" />
    <Field label="滚动条" path="global.scrollbar">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={global.scrollbar === 'native'} onClick={() => setGlobal({ scrollbar: 'native' })}>显示（原生）</SegmentedButton>
        <SegmentedButton pressed={global.scrollbar === 'hidden'} onClick={() => setGlobal({ scrollbar: 'hidden' })}>隐藏</SegmentedButton>
      </div>
      <p>作用于对话内容区与会话列表。</p>
    </Field>
    <Field label="界面圆角" path="global.radius">
      <div className="dsh-layout-range">
        <Toggle checked={global.radius !== null} onChange={value => setGlobal({ radius: value ? 8 : null })} label={global.radius === null ? '原生' : '自定义'} />
        {global.radius !== null && <input type="range" min={RADIUS_LIMITS[0]} max={RADIUS_LIMITS[1]} value={global.radius} onChange={event => setGlobal({ radius: Number(event.target.value) })} />}
        {global.radius !== null && <output>{global.radius}px</output>}
      </div>
    </Field>
    <Field label="页面背景" path="global.background">
      <div className="dsh-layout-segmented">
        {(['native', 'color', 'image', 'video'] as const).map(mode => (
          <SegmentedButton key={mode} pressed={background.mode === mode} onClick={() => setBackground({ mode })}>
            {mode === 'native' ? '原生' : mode === 'color' ? '颜色' : mode === 'image' ? '图片' : '视频'}
          </SegmentedButton>
        ))}
      </div>
      {background.mode === 'color' && <div className="dsh-layout-colors"><input type="color" value={background.color} onChange={event => setBackground({ color: event.target.value })} /></div>}
      {background.mode === 'image' && <>
        <input type="url" value={background.imageUrl} placeholder="图片地址 https://…" onChange={event => setBackground({ imageUrl: event.target.value })} />
        <FilePicker accept="image/*" label="选择本地图片…" onPick={file => void pickLocalFile(file, 'imageUrl')} />
      </>}
      {background.mode === 'video' && <>
        <input type="url" value={background.videoUrl} placeholder="视频地址 https://…" onChange={event => setBackground({ videoUrl: event.target.value })} />
        <FilePicker accept="video/*" label="选择本地视频…" onPick={file => void pickLocalFile(file, 'videoUrl')} />
      </>}
    </Field>
    <Field label="设置弹窗" path="global.dialog">
      <div className="dsh-layout-range">
        <Toggle checked={global.dialog.width !== null || global.dialog.height !== null} onChange={value => setGlobal({ dialog: value ? { width: global.dialog.width ?? 1000, height: global.dialog.height ?? 880 } : { width: null, height: null } })} label={global.dialog.width === null && global.dialog.height === null ? '原生' : '自定义'} />
        {global.dialog.width !== null && <input type="range" min={DIALOG_WIDTH_LIMITS[0]} max={DIALOG_WIDTH_LIMITS[1]} step={20} value={global.dialog.width} onChange={event => setGlobal({ dialog: { ...global.dialog, width: Number(event.target.value) } })} />}
        {global.dialog.width !== null && <output>宽 {global.dialog.width}</output>}
      </div>
      {global.dialog.height !== null && <div className="dsh-layout-range">
        <input type="range" min={DIALOG_HEIGHT_LIMITS[0]} max={DIALOG_HEIGHT_LIMITS[1]} step={20} value={global.dialog.height} onChange={event => setGlobal({ dialog: { ...global.dialog, height: Number(event.target.value) } })} />
        <output>高 {global.dialog.height}</output>
      </div>}
    </Field>
    <Field label="页面边距" path="global.padding">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={global.padding.mode === 'auto'} onClick={() => setGlobal({ padding: { ...global.padding, mode: 'auto' } })}>自动</SegmentedButton>
        <SegmentedButton pressed={global.padding.mode === 'custom'} onClick={() => setGlobal({ padding: { ...global.padding, mode: 'custom' } })}>自定义</SegmentedButton>
      </div>
      {global.padding.mode === 'custom' && (['desktop', 'mobile'] as const).map(viewport => (
        <div key={viewport} className="dsh-layout-pads">
          <p className="dsh-layout-pads__hint">{viewport === 'desktop' ? '桌面端 >767px' : '手机端 ≤767px'} · 留空使用预设</p>
          {([['header', '头部'], ['content', '内容区'], ['composer', '输入区']] as const).map(([area, label]) => {
            const preset = PAD_PRESETS[viewport][area]
            const sides = global.padding[viewport][area]
            const setSide = (side: 'left' | 'right', raw: string): void => setGlobal({ padding: { ...global.padding, [viewport]: { ...global.padding[viewport], [area]: { ...sides, [side]: raw === '' ? null : Number(raw) } } } })
            return (
              <div key={area} className="dsh-layout-pads__row">
                <span>{label}</span>
                <label>左 <input type="number" min={PAD_LIMITS[0]} max={PAD_LIMITS[1]} placeholder={String(preset.left)} value={sides.left ?? ''} onChange={event => setSide('left', event.target.value)} /></label>
                <label>右 <input type="number" min={PAD_LIMITS[0]} max={PAD_LIMITS[1]} placeholder={String(preset.right)} value={sides.right ?? ''} onChange={event => setSide('right', event.target.value)} /></label>
              </div>
            )
          })}
        </div>
      ))}
    </Field>
    <Field label="窄屏头部换行" path="global.narrow.headerWrap">
      <Toggle checked={global.narrow.headerWrap} onChange={value => setGlobal({ narrow: { ...global.narrow, headerWrap: value } })} label={global.narrow.headerWrap ? '开启（防重叠）' : '关闭（原生）'} />
    </Field>
    <Field label="手机侧边栏" path="global.narrow.sidebar">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={global.narrow.sidebar === 'native'} onClick={() => setGlobal({ narrow: { ...global.narrow, sidebar: 'native' } })}>原生</SegmentedButton>
        <SegmentedButton pressed={global.narrow.sidebar === 'fullscreen'} onClick={() => setGlobal({ narrow: { ...global.narrow, sidebar: 'fullscreen' } })}>全屏覆盖</SegmentedButton>
      </div>
      <p>全屏覆盖：窄屏下内容区独占整屏，侧边栏收起为左上角悬浮按钮，点开铺满全屏（点遮罩、选中会话或 Esc 关闭）。</p>
    </Field>
  </section>
}

function FilePicker({ accept, label, onPick }: { accept: string; label: string; onPick: (file: File) => void }): React.ReactElement {
  return <label>
    <input type="file" accept={accept} hidden onChange={event => { const file = event.target.files?.[0]; if (file !== undefined) onPick(file); event.target.value = '' }} />
    <span className="dsh-layout-file-button">{label}</span>
  </label>
}

function MaterialCard({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const material = settings.material
  const setMaterial = (patch: Partial<MaterialSettings>): void => store.update({ material: { ...material, ...patch } })
  const active = materialGrade(material)
  return <section className="dsh-layout-settings__card">
    <CardHeading icon={<GlassIcon />} title="材质" hint="一张磨砂材质覆盖整个页面：侧边栏与内容区域共用同一层。" />
    <Field label="磨砂材质" path="material.enabled">
      <Toggle checked={material.enabled} onChange={value => setMaterial({ enabled: value })} label={material.enabled ? '开启' : '关闭（原生）'} />
    </Field>
    {material.enabled && <>
      <Field label="材质档位">
        <div className="dsh-layout-tiers">
          {MATERIAL_GRADES.map(grade => (
            <button key={grade.id} type="button" aria-pressed={active?.id === grade.id} onClick={() => setMaterial({ ...grade.values })}>
              <strong>{grade.name}</strong>
              <span>{grade.hint}</span>
            </button>
          ))}
        </div>
        <p>档位只是预设；拖动下面的滑杆后即为自定义。</p>
      </Field>
      <Field label="不透明度" path="material.opacity">
        <div className="dsh-layout-range"><input type="range" min={MATERIAL_LIMITS.opacity[0]} max={MATERIAL_LIMITS.opacity[1]} value={material.opacity} onChange={event => setMaterial({ opacity: Number(event.target.value) })} /><output>{material.opacity}%</output></div>
      </Field>
      <Field label="模糊强度" path="material.blur">
        <div className="dsh-layout-range"><input type="range" min={MATERIAL_LIMITS.blur[0]} max={MATERIAL_LIMITS.blur[1]} value={material.blur} onChange={event => setMaterial({ blur: Number(event.target.value) })} /><output>{material.blur}px</output></div>
      </Field>
      <Field label="饱和度" path="material.saturation">
        <div className="dsh-layout-range"><input type="range" min={MATERIAL_LIMITS.saturation[0]} max={MATERIAL_LIMITS.saturation[1]} value={material.saturation} onChange={event => setMaterial({ saturation: Number(event.target.value) })} /><output>{material.saturation}%</output></div>
      </Field>
    </>}
  </section>
}

function ConversationCard({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const conversation = settings.conversation
  const setConversation = (patch: Partial<LayoutSettings['conversation']>): void => store.update({ conversation: { ...conversation, ...patch } })
  return <section className="dsh-layout-settings__card">
    <CardHeading icon={<WidthIcon />} title="对话" hint="阅读宽度、输入区与对话内容的呈现；每一项只做自己的事。" />
    <Group label="排版" />
    <Field label="阅读宽度" path="conversation.width">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={conversation.width === 'native'} onClick={() => setConversation({ width: 'native' })}>原生</SegmentedButton>
        <SegmentedButton pressed={conversation.width === 'full'} onClick={() => setConversation({ width: 'full' })}>充满窗口</SegmentedButton>
      </div>
      <p>充满窗口是纯宽度变化：对话与输入框横向铺满，其余样式保持原生。</p>
    </Field>
    <Field label="输入框行数" path="conversation.inputRows">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={conversation.inputRows === null} onClick={() => setConversation({ inputRows: null })}>原生</SegmentedButton>
        {[2, 3, 4, 5, 6].map(rows => (
          <SegmentedButton key={rows} pressed={conversation.inputRows === rows} onClick={() => setConversation({ inputRows: rows })}>{rows} 行</SegmentedButton>
        ))}
      </div>
    </Field>
    <Field label="对话收笔" path="conversation.scrollEnd">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={conversation.scrollEnd === 'native'} onClick={() => setConversation({ scrollEnd: 'native' })}>全屏滚动（原生）</SegmentedButton>
        <SegmentedButton pressed={conversation.scrollEnd === 'above'} onClick={() => setConversation({ scrollEnd: 'above' })}>收笔（止于输入区上方）</SegmentedButton>
      </div>
      <p>收笔只调整滚动范围：对话记录止于输入区上方，输入框外观保持原生。</p>
    </Field>
    <Group label="气泡与轨迹页" />
    <Field label="对话气泡" path="conversation.bubble">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={conversation.bubble === 'native'} onClick={() => setConversation({ bubble: 'native' })}>原生</SegmentedButton>
        <SegmentedButton pressed={conversation.bubble === 'glass'} onClick={() => setConversation({ bubble: 'glass' })}>磨砂</SegmentedButton>
        <SegmentedButton pressed={conversation.bubble === 'solid'} onClick={() => setConversation({ bubble: 'solid' })}>实色</SegmentedButton>
        <SegmentedButton pressed={conversation.bubble === 'transparent'} onClick={() => setConversation({ bubble: 'transparent' })}>无背景</SegmentedButton>
      </div>
    </Field>
    <Field label="轨迹页背景" path="conversation.trace.background">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={conversation.trace.background === 'native'} onClick={() => setConversation({ trace: { ...conversation.trace, background: 'native' } })}>原生白</SegmentedButton>
        <SegmentedButton pressed={conversation.trace.background === 'clear'} onClick={() => setConversation({ trace: { ...conversation.trace, background: 'clear' } })}>透出材质</SegmentedButton>
      </div>
    </Field>
    <Field label="轨迹页宽度" path="conversation.trace.width">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={conversation.trace.width === 'full'} onClick={() => setConversation({ trace: { ...conversation.trace, width: 'full' } })}>原生全宽</SegmentedButton>
        <SegmentedButton pressed={conversation.trace.width === 'inset'} onClick={() => setConversation({ trace: { ...conversation.trace, width: 'inset' } })}>对齐头部</SegmentedButton>
        <SegmentedButton pressed={conversation.trace.width === 'message'} onClick={() => setConversation({ trace: { ...conversation.trace, width: 'message' } })}>对齐阅读区</SegmentedButton>
      </div>
    </Field>
    <Field label="轨迹表留白" path="conversation.trace.tableTail">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={conversation.trace.tableTail === 'native'} onClick={() => setConversation({ trace: { ...conversation.trace, tableTail: 'native' } })}>原生</SegmentedButton>
        <SegmentedButton pressed={conversation.trace.tableTail === 'none'} onClick={() => setConversation({ trace: { ...conversation.trace, tableTail: 'none' } })}>移除</SegmentedButton>
      </div>
    </Field>
    <Group label="统计" />
    <Field label="统计信息" path="conversation.stats">
      <div className="dsh-layout-segmented">
        {(['native', 'icon', 'brief', 'below'] as const).map((mode: StatsMode) => (
          <SegmentedButton key={mode} pressed={conversation.stats === mode} onClick={() => setConversation({ stats: mode })}>
            {mode === 'native' ? '原生' : mode === 'icon' ? '框内图标' : mode === 'brief' ? '框内短信息' : '框下方'}
          </SegmentedButton>
        ))}
      </div>
      {conversation.stats !== 'native' && <div className="dsh-layout-chips">
        {STATS_METRICS.map(metric => (
          <label key={metric}>
            <input type="checkbox" checked={conversation.statsMetrics[metric]} onChange={event => setConversation({ statsMetrics: { ...conversation.statsMetrics, [metric]: event.target.checked } })} />
            {METRIC_LABELS[metric]}
          </label>
        ))}
      </div>}
    </Field>
  </section>
}

function SegmentedButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }): React.ReactElement {
  return <button type="button" aria-pressed={pressed} onClick={onClick}>{children}</button>
}
