import type React from 'react'
import { useRef, useState, useSyncExternalStore } from 'react'
import type { LayoutLocaleKey } from './locales.ts'
import type { LayoutStore } from './store.ts'
import { normalizeSettings } from './store.ts'
import { deleteMedia, saveMedia } from './media.ts'
import {
  BookmarkIcon,
  BubbleIcon,
  DensityIcon,
  DialogIcon,
  DividerIcon,
  FileIcon,
  FluidIcon,
  GlassIcon,
  ImageIcon,
  RadiusIcon,
  RangeIcon,
  RowsIcon,
  ScaleIcon,
  ScrollbarIcon,
  StatsIcon,
  WidthIcon,
} from './icons.tsx'
import {
  DENSITY_LIMITS,
  DIALOG_HEIGHT_LIMITS,
  DIALOG_WIDTH_LIMITS,
  GLASS_LIMITS,
  GLASS_TIERS,
  RADIUS_LIMITS,
  READ_WIDTH_LIMITS,
  ROWS_LIMITS,
  SCALE_LIMITS,
  STATS_METRICS,
  glassTier,
  type GlassMaterial,
  type LayoutSettings,
  type ScrollbarMode,
  type StatsMode,
} from './types.ts'

export interface LayoutSettingsInjected { readonly store: LayoutStore; readonly t: (key: LayoutLocaleKey) => string }

const TIER_LABELS: Readonly<Record<string, [string, string]>> = {
  airy: ['清透', '壁纸大量透出'],
  standard: ['标准', 'macOS 侧边栏质感'],
  solid: ['厚实', '近实色保留层次'],
}

const METRIC_LABELS: Readonly<Record<string, string>> = {
  turns: '轮次', steps: '步骤', llm: '模型耗时', tools: '工具耗时',
  ttft: '首 token', speed: '生成速度', cache: '缓存命中', tokens: 'Token 用量',
}

export function LayoutSettingsSection({ store }: LayoutSettingsInjected): React.ReactElement {
  const settings = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const fileInput = useRef<HTMLInputElement>(null)
  const [profileName, setProfileName] = useState('')
  const [profileId, setProfileId] = useState('')
  const [tab, setTab] = useState<TabId>('global')

  const download = (): void => {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(settings, null, 2)}\n`], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'dsh-layout.json'; anchor.click(); URL.revokeObjectURL(url)
  }
  const importFile = async (file: File): Promise<void> => {
    try { store.hydrate(normalizeSettings(JSON.parse(await file.text())), true) } catch (error) { console.error('dsh-layout import failed:', error) }
  }

  return <section className="dsh-layout-settings">
    <header className="dsh-layout-settings__header">
      <div>
        <h2>页面布局</h2>
        <p>分区自定义材质、宽度与信息密度；每项默认保持 DSH 原生样式。</p>
      </div>
    </header>

    <div className="dsh-layout-tabs" role="tablist" aria-label="布局设置分区">
      {TABS.map(entry => (
        <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} onClick={() => setTab(entry.id)}>{entry.label}</button>
      ))}
    </div>

    {tab === 'global' && <GlobalCard store={store} settings={settings} />}
    {tab === 'sidebar' && <SidebarCard store={store} settings={settings} />}
    {tab === 'content' && <ContentCard store={store} settings={settings} />}
    {tab === 'footer' && <FooterCard store={store} settings={settings} />}
    {tab === 'profiles' && <>
      <section className="dsh-layout-settings__card">
        <CardHeading icon={<BookmarkIcon />} title="配置与方案" hint="配置写入 DSH profile 的 dsh-layout.json；方案是当前配置的命名快照。" />
        <Field icon={<BookmarkIcon />} label="已存方案">
          <div className="dsh-layout-profile">
            <select value={profileId} onChange={event => setProfileId(event.target.value)}>
              <option value="">选择方案…</option>
              {settings.profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
            <button type="button" disabled={profileId === ''} onClick={() => { store.applyProfile(profileId); setProfileId('') }}>应用</button>
            <button type="button" disabled={profileId === ''} onClick={() => { store.deleteProfile(profileId); setProfileId('') }}>删除</button>
          </div>
          <div className="dsh-layout-profile">
            <input type="text" value={profileName} placeholder="新方案名称" onChange={event => setProfileName(event.target.value)} />
            <button type="button" disabled={profileName.trim() === ''} onClick={() => { store.saveProfile(profileName); setProfileName('') }}>存为方案</button>
          </div>
        </Field>
      </section>

      <section className="dsh-layout-settings__card dsh-layout-settings__files">
        <CardHeading icon={<FileIcon />} title="配置文件" hint="导入后立即生效；浏览器存储重置不会丢失配置。" />
        <Field icon={<FileIcon />} label="导入 / 导出">
          <div>
            <button type="button" onClick={download}>导出配置</button>
            <button type="button" onClick={() => fileInput.current?.click()}>导入配置</button>
            <input ref={fileInput} type="file" accept="application/json" hidden onChange={event => { const file = event.target.files?.[0]; if (file !== undefined) void importFile(file); event.target.value = '' }} />
          </div>
        </Field>
      </section>

      <footer><button type="button" onClick={() => store.reset()}>恢复全部默认</button></footer>
    </>}
  </section>
}

type TabId = 'global' | 'sidebar' | 'content' | 'footer' | 'profiles'
const TABS: readonly { readonly id: TabId; readonly label: string }[] = [
  { id: 'global', label: '全局' },
  { id: 'sidebar', label: '侧边栏' },
  { id: 'content', label: '内容区' },
  { id: 'footer', label: '底部' },
  { id: 'profiles', label: '方案' },
]

/** A settings row: icon + label on the left rail, controls in one column. */
function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }): React.ReactElement {
  return <div className="dsh-layout-settings__field">
    <div className="dsh-layout-settings__label"><span className="dsh-layout-settings__icon">{icon}</span><strong>{label}</strong></div>
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
    <CardHeading icon={<RadiusIcon />} title="全局" hint="圆角、页面背景与弹窗尺寸等跨区域选项。" />
    <Field icon={<RadiusIcon />} label="界面圆角">
      <div className="dsh-layout-range">
        <Toggle checked={global.radius !== null} onChange={value => setGlobal({ radius: value ? 8 : null })} label="自定义" />
        {global.radius !== null && <input type="range" min={RADIUS_LIMITS[0]} max={RADIUS_LIMITS[1]} value={global.radius} onChange={event => setGlobal({ radius: Number(event.target.value) })} />}
        {global.radius !== null && <output>{global.radius}px</output>}
      </div>
    </Field>
    <Field icon={<ImageIcon />} label="页面背景">
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
    <Field icon={<DialogIcon />} label="设置弹窗">
      <div className="dsh-layout-range">
        <Toggle checked={global.dialog.width !== null || global.dialog.height !== null} onChange={value => setGlobal({ dialog: value ? { width: global.dialog.width ?? 1000, height: global.dialog.height ?? 880 } : { width: null, height: null } })} label="自定义" />
        {global.dialog.width !== null && <input type="range" min={DIALOG_WIDTH_LIMITS[0]} max={DIALOG_WIDTH_LIMITS[1]} step={20} value={global.dialog.width} onChange={event => setGlobal({ dialog: { ...global.dialog, width: Number(event.target.value) } })} />}
        {global.dialog.width !== null && <output>宽 {global.dialog.width}</output>}
      </div>
      {global.dialog.height !== null && <div className="dsh-layout-range">
        <input type="range" min={DIALOG_HEIGHT_LIMITS[0]} max={DIALOG_HEIGHT_LIMITS[1]} step={20} value={global.dialog.height} onChange={event => setGlobal({ dialog: { ...global.dialog, height: Number(event.target.value) } })} />
        <output>高 {global.dialog.height}</output>
      </div>}
    </Field>
    <Field icon={<FluidIcon />} label="磨砂流畅模式">
      <Toggle checked={global.fluidGlass} onChange={value => setGlobal({ fluidGlass: value })} label={global.fluidGlass ? '已开启（仅保留半透明填充）' : '关闭（完整模糊）'} />
    </Field>
  </section>
}

function FilePicker({ accept, label, onPick }: { accept: string; label: string; onPick: (file: File) => void }): React.ReactElement {
  return <label>
    <input type="file" accept={accept} hidden onChange={event => { const file = event.target.files?.[0]; if (file !== undefined) onPick(file); event.target.value = '' }} />
    <span className="dsh-layout-file-button">{label}</span>
  </label>
}

function SidebarCard({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const sidebar = settings.sidebar
  const setSidebar = (patch: Partial<LayoutSettings['sidebar']>): void => store.update({ sidebar: { ...sidebar, ...patch } })
  return <section className="dsh-layout-settings__card">
    <CardHeading icon={<GlassIcon />} title="侧边栏" hint="左侧会话栏的磨砂材质与分割线。" />
    <GlassFields material={sidebar.glass} onChange={glass => setSidebar({ glass })} />
    <Field icon={<DividerIcon />} label="分割线">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={sidebar.divider === 'native'} onClick={() => setSidebar({ divider: 'native' })}>显示（原生）</SegmentedButton>
        <SegmentedButton pressed={sidebar.divider === 'hidden'} onClick={() => setSidebar({ divider: 'hidden' })}>隐藏</SegmentedButton>
      </div>
    </Field>
  </section>
}

function ContentCard({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const content = settings.content
  const setContent = (patch: Partial<LayoutSettings['content']>): void => store.update({ content: { ...content, ...patch } })
  const customWidth = typeof content.width === 'number'
  return <section className="dsh-layout-settings__card">
    <CardHeading icon={<GlassIcon />} title="对话内容区" hint="内容列与顶部标题栏共用的磨砂材质；阅读宽度同时决定输入框宽度。" />
    <GlassFields material={content.glass} onChange={glass => setContent({ glass })} />
    <Field icon={<WidthIcon />} label="阅读宽度">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={content.width === 'native'} onClick={() => setContent({ width: 'native' })}>原生</SegmentedButton>
        <SegmentedButton pressed={content.width === 'full'} onClick={() => setContent({ width: 'full' })}>充满窗口</SegmentedButton>
        <SegmentedButton pressed={customWidth} onClick={() => setContent({ width: 900 })}>自定义</SegmentedButton>
      </div>
      {customWidth && <div className="dsh-layout-range">
        <input type="range" min={READ_WIDTH_LIMITS[0]} max={READ_WIDTH_LIMITS[1]} step={20} value={content.width as number} onChange={event => setContent({ width: Number(event.target.value) })} />
        <output>{content.width}px</output>
      </div>}
    </Field>
    <Field icon={<DensityIcon />} label="消息间距">
      <div className="dsh-layout-range">
        <Toggle checked={content.density !== null} onChange={value => setContent({ density: value ? 16 : null })} label="自定义" />
        {content.density !== null && <input type="range" min={DENSITY_LIMITS[0]} max={DENSITY_LIMITS[1]} value={content.density} onChange={event => setContent({ density: Number(event.target.value) })} />}
        {content.density !== null && <output>{content.density}px</output>}
      </div>
    </Field>
    <Field icon={<ScaleIcon />} label="内容缩放">
      <div className="dsh-layout-range">
        <Toggle checked={content.scale !== 100} onChange={value => setContent({ scale: value ? 110 : 100 })} label="自定义" />
        {content.scale !== 100 && <input type="range" min={SCALE_LIMITS[0]} max={SCALE_LIMITS[1]} value={content.scale} onChange={event => setContent({ scale: Number(event.target.value) })} />}
        {content.scale !== 100 && <output>{content.scale}%</output>}
      </div>
    </Field>
    <Field icon={<BubbleIcon />} label="对话气泡">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={content.bubble === 'native'} onClick={() => setContent({ bubble: 'native' })}>原生</SegmentedButton>
        <SegmentedButton pressed={content.bubble === 'glass'} onClick={() => setContent({ bubble: 'glass' })}>磨砂</SegmentedButton>
      </div>
    </Field>
    <Field icon={<ScrollbarIcon />} label="滚动条">
      <div className="dsh-layout-segmented">
        {(['native', 'hidden'] as const).map((mode: ScrollbarMode) => (
          <SegmentedButton key={mode} pressed={content.scrollbar === mode} onClick={() => setContent({ scrollbar: mode })}>{mode === 'native' ? '原生' : '隐藏'}</SegmentedButton>
        ))}
      </div>
    </Field>
  </section>
}

function FooterCard({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const footer = settings.footer
  const setFooter = (patch: Partial<LayoutSettings['footer']>): void => store.update({ footer: { ...footer, ...patch } })
  return <section className="dsh-layout-settings__card">
    <CardHeading icon={<RangeIcon />} title="底部输入区" hint="输入框是不透明面板；滚动范围决定对话记录止于输入区上方还是全屏滚过。" />
    <Field icon={<RangeIcon />} label="对话滚动范围">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={footer.plate === 'native'} onClick={() => setFooter({ plate: 'native' })}>全屏（原生）</SegmentedButton>
        <SegmentedButton pressed={footer.plate === 'above'} onClick={() => setFooter({ plate: 'above' })}>止于输入区上方</SegmentedButton>
        <SegmentedButton pressed={footer.plate === 'solid'} onClick={() => setFooter({ plate: 'solid' })}>实色底板</SegmentedButton>
      </div>
    </Field>
    <Field icon={<RowsIcon />} label="输入框行数">
      <div className="dsh-layout-range">
        <input type="range" min={ROWS_LIMITS[0]} max={ROWS_LIMITS[1]} value={footer.rows} onChange={event => setFooter({ rows: Number(event.target.value) })} />
        <output>{footer.rows} 行{settings.content.width === 'full' ? '' : '（全宽时生效）'}</output>
      </div>
    </Field>
    <Field icon={<StatsIcon />} label="统计信息">
      <div className="dsh-layout-segmented">
        {(['native', 'icon', 'brief', 'below'] as const).map((mode: StatsMode) => (
          <SegmentedButton key={mode} pressed={footer.stats === mode} onClick={() => setFooter({ stats: mode })}>
            {mode === 'native' ? '原生' : mode === 'icon' ? '框内图标' : mode === 'brief' ? '框内短信息' : '框下方'}
          </SegmentedButton>
        ))}
      </div>
      {footer.stats !== 'native' && <div className="dsh-layout-chips">
        {STATS_METRICS.map(metric => (
          <label key={metric}>
            <input type="checkbox" checked={footer.statsMetrics[metric]} onChange={event => setFooter({ statsMetrics: { ...footer.statsMetrics, [metric]: event.target.checked } })} />
            {METRIC_LABELS[metric]}
          </label>
        ))}
      </div>}
    </Field>
  </section>
}

/** The material controls shared by every glass area (heading toggle stays per-card). */
function GlassFields({ material, onChange }: { material: GlassMaterial; onChange: (next: GlassMaterial) => void }): React.ReactElement {
  const enabledToggle = <Field icon={<GlassIcon />} label="磨砂材质">
    <Toggle checked={material.enabled} onChange={value => onChange({ ...material, enabled: value })} label={material.enabled ? '自定义' : '原生'} />
  </Field>
  if (!material.enabled) return enabledToggle
  return <>
    {enabledToggle}
    <Field icon={<GlassIcon />} label="材质档位">
      <div className="dsh-layout-tiers">
        {Object.entries(GLASS_TIERS).map(([id, tier]) => (
          <button key={id} type="button" aria-pressed={glassTier(material) === id} onClick={() => onChange({ ...material, ...tier })}>
            <strong>{TIER_LABELS[id]![0]}</strong><span>{TIER_LABELS[id]![1]}</span>
          </button>
        ))}
      </div>
    </Field>
    <Field icon={<GlassIcon />} label="不透明度">
      <div className="dsh-layout-range"><input type="range" min={GLASS_LIMITS.opacity[0]} max={GLASS_LIMITS.opacity[1]} value={material.opacity} onChange={event => onChange({ ...material, opacity: Number(event.target.value) })} /><output>{material.opacity}%</output></div>
    </Field>
    <Field icon={<FluidIcon />} label="模糊强度">
      <div className="dsh-layout-range"><input type="range" min={GLASS_LIMITS.blur[0]} max={GLASS_LIMITS.blur[1]} value={material.blur} onChange={event => onChange({ ...material, blur: Number(event.target.value) })} /><output>{material.blur}px</output></div>
    </Field>
    <Field icon={<FluidIcon />} label="饱和度">
      <div className="dsh-layout-range"><input type="range" min={GLASS_LIMITS.saturation[0]} max={GLASS_LIMITS.saturation[1]} value={material.saturation} onChange={event => onChange({ ...material, saturation: Number(event.target.value) })} /><output>{material.saturation}%</output></div>
    </Field>
    <Field icon={<ImageIcon />} label="底色">
      <div className="dsh-layout-colors">
        <Toggle checked={material.tint === ''} onChange={value => onChange({ ...material, tint: value ? '' : '#ffffff' })} label="跟随明暗主题" />
        {material.tint !== '' && <input type="color" value={material.tint} onChange={event => onChange({ ...material, tint: event.target.value })} />}
      </div>
    </Field>
  </>
}

function SegmentedButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }): React.ReactElement {
  return <button type="button" aria-pressed={pressed} onClick={onClick}>{children}</button>
}
