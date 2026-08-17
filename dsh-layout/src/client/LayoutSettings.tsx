import type React from 'react'
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { LayoutLocaleKey } from './locales.ts'
import type { LayoutStore } from './store.ts'
import { normalizeSettings } from './store.ts'
import { deleteMedia, saveMedia } from './media.ts'
import { BUILTIN_PRESETS } from './presets.ts'
import { countOverrides, isOverridden, resetField } from './settings-utils.ts'
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
  MobileIcon,
  RadiusIcon,
  RangeIcon,
  RowsIcon,
  ScaleIcon,
  ScrollbarIcon,
  StatsIcon,
  TraceIcon,
  WidthIcon,
} from './icons.tsx'
import {
  DENSITY_LIMITS,
  DIALOG_HEIGHT_LIMITS,
  DIALOG_WIDTH_LIMITS,
  PAD_LIMITS,
  GLASS_LIMITS,
  GLASS_TIERS,
  RADIUS_LIMITS,
  READ_WIDTH_LIMITS,
  ROWS_LIMITS,
  SCALE_LIMITS,
  SIDEBAR_WIDTH_LIMITS,
  SIDEBAR_PADDING_LIMITS,
  SIDEBAR_ROW_HEIGHT_LIMITS,
  SIDEBAR_ROW_GAP_LIMITS,
  STATS_METRICS,
  glassTier,
  type CoreSettings,
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
  const mobile = useMediaQuery('(max-width: 768px)')
  // The native DSH settings section remains an embedded fallback/launcher;
  // the global controller below owns direct full-page opening.
  if (settings.global.settingsView === 'page' || mobile) {
    return <section className="dsh-layout-settings__card">
      <CardHeading icon={<DialogIcon />} title="页面布局" hint="全屏编辑器已启用；从侧边栏“设置”直接打开。" />
      <Field icon={<DialogIcon />} label="打开方式">
        <span className="dsh-layout-settings__note">全屏页面</span>
      </Field>
    </section>
  }
  return <SettingsBody store={store} settings={settings} />
}

/** Mounted once at the app root. In page mode it captures the DSH sidebar
    settings trigger and opens our editor directly, so users never go through
    DSH settings → 页面布局 → 打开编辑器. */
export function LayoutFullPageOverlay({ store }: LayoutSettingsInjected): React.ReactElement | null {
  const settings = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const [open, setOpen] = useState(false)
  const mobile = useMediaQuery('(max-width: 768px)')
  useEffect(() => {
    const handle = (event: MouseEvent): void => {
      if (settings.global.settingsView !== 'page' && !mobile) return
      const target = event.target instanceof Element ? event.target.closest('button') : null
      if (target === null || target.closest('.dsh-layout-fullpage') !== null) return
      const label = (target.getAttribute('aria-label') ?? target.textContent ?? '').trim()
      if (label !== '设置' && !label.startsWith('设置')) return
      event.preventDefault()
      event.stopPropagation()
      setOpen(true)
    }
    document.addEventListener('click', handle, true)
    return () => document.removeEventListener('click', handle, true)
  }, [mobile, settings.global.settingsView])
  if (!open) return null
  return <FullPageSettings store={store} onClose={() => setOpen(false)} />
}

/** The full-page editor overlay: a portal above everything, with its own
    scroll, a sticky top bar, and the shared settings body inside. */
export function FullPageSettings({ store, onClose }: { store: LayoutStore; onClose: () => void }): React.ReactElement {
  const settings = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previous
    }
  }, [onClose])
  return createPortal(
    <div className="dsh-layout-fullpage" role="dialog" aria-modal="true" aria-label="页面布局编辑器">
      <header className="dsh-layout-fullpage__bar">
        <button type="button" onClick={onClose} aria-label="返回">‹ 返回</button>
        <h2>页面布局</h2>
      </header>
      <div className="dsh-layout-fullpage__scroll">
        <SettingsBody store={store} settings={settings} />
      </div>
    </div>,
    document.body,
  )
}

function SettingsBody({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const fileInput = useRef<HTMLInputElement>(null)
  const [profileName, setProfileName] = useState('')
  const [profileId, setProfileId] = useState('')
  const [tab, setTab] = useState<TabId>('global')
  const [query, setQuery] = useState('')

  const download = (): void => {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(settings, null, 2)}\n`], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'dsh-layout.json'; anchor.click(); URL.revokeObjectURL(url)
  }
  const importFile = async (file: File): Promise<void> => {
    try { store.hydrate(normalizeSettings(JSON.parse(await file.text())), true) } catch (error) { console.error('dsh-layout import failed:', error) }
  }

  const overrides = countOverrides(settings)
  const searching = query.trim() !== ''

  return <section className="dsh-layout-settings">
    <StoreContext.Provider value={store}>
    <SearchContext.Provider value={query.trim().toLowerCase()}>
    <header className="dsh-layout-settings__header">
      <div>
        <h2>页面布局</h2>
        <p>分区自定义材质、宽度与信息密度；每项默认保持 DSH 原生样式。</p>
      </div>
      {overrides > 0 && <span className="dsh-layout-dirty" title="与原生默认的差异项数">已修改 {overrides} 项</span>}
    </header>
    <input className="dsh-layout-search" type="search" placeholder="搜索设置：边距、磨砂、轨迹、滚动…" value={query} onChange={event => setQuery(event.target.value)} />

    {!searching && <div className="dsh-layout-tabs" role="tablist" aria-label="布局设置分区">
      {TABS.map(entry => (
        <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} onClick={() => setTab(entry.id)}>{entry.label}</button>
      ))}
    </div>}

    {(searching || tab === 'global') && <GlobalCard store={store} settings={settings} />}
    {(searching || tab === 'sidebar') && <SidebarCard store={store} settings={settings} />}
    {(searching || tab === 'content') && <ContentCard store={store} settings={settings} />}
    {(searching || tab === 'footer') && <FooterCard store={store} settings={settings} />}
    {(!searching && tab === 'profiles') && <>
      <section className="dsh-layout-settings__card">
        <CardHeading icon={<BookmarkIcon />} title="内置方案" hint="一键套用的起点配置；套用后可继续自由调整，已存的方案不受影响。" />
        <div className="dsh-layout-presets">
          {BUILTIN_PRESETS.map(preset => (
            <button key={preset.id} type="button" onClick={() => store.update({ ...preset.patch(store.getSnapshot()) })}>
              <strong>{preset.name}</strong>
              <span>{preset.hint}</span>
            </button>
          ))}
        </div>
      </section>
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
    </SearchContext.Provider>
    </StoreContext.Provider>
  </section>
}

/** Subscribes to a media query so the section re-renders on breakpoint
    crossings (e.g. resizing the desktop window down to phone width). */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || window.matchMedia === undefined) return false
    return window.matchMedia(query).matches
  })
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia === undefined) return
    const list = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent): void => { setMatches(event.matches) }
    list.addEventListener('change', handler)
    setMatches(list.matches)
    return () => { list.removeEventListener('change', handler) }
  }, [query])
  return matches
}

/** Search query and store flow through context so Field rows can filter
    themselves and offer single-field restore without prop drilling. */
const SearchContext = createContext('')
const StoreContext = createContext<LayoutStore | null>(null)

type TabId = 'global' | 'sidebar' | 'content' | 'footer' | 'profiles'
const TABS: readonly { readonly id: TabId; readonly label: string }[] = [
  { id: 'global', label: '全局' },
  { id: 'sidebar', label: '侧边栏' },
  { id: 'content', label: '内容区' },
  { id: 'footer', label: '底部' },
  { id: 'profiles', label: '方案' },
]

/** A light band header that segments a dense card into groups; hidden
    while searching (matches show flat across groups). */
function Group({ label }: { label: string }): React.ReactElement | null {
  const searching = useContext(SearchContext) !== ''
  if (searching) return null
  return <div className="dsh-layout-settings__group">{label}</div>
}

/** A settings row: icon + label on the left rail, controls in one column.
    `path` wires status ("differs from native") and single-field restore;
    `keywords` extends search beyond the label. */
function Field({ icon, label, path, keywords, children }: { icon: React.ReactNode; label: string; path?: string; keywords?: string; children: React.ReactNode }): React.ReactElement | null {
  const query = useContext(SearchContext)
  const store = useContext(StoreContext)
  if (query !== '' && !`${label} ${keywords ?? ''}`.toLowerCase().includes(query)) return null
  const overridden = path !== undefined && store !== null && isOverridden(store.getSnapshot(), path)
  return <div className="dsh-layout-settings__field">
    <div className="dsh-layout-settings__label">
      <span className="dsh-layout-settings__icon">{icon}</span>
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
    <CardHeading icon={<RadiusIcon />} title="全局" hint="圆角、页面背景与弹窗尺寸等跨区域选项。" />
    <Field icon={<RadiusIcon />} label="界面圆角" path="global.radius">
      <div className="dsh-layout-range">
        <Toggle checked={global.radius !== null} onChange={value => setGlobal({ radius: value ? 8 : null })} label="自定义" />
        {global.radius !== null && <input type="range" min={RADIUS_LIMITS[0]} max={RADIUS_LIMITS[1]} value={global.radius} onChange={event => setGlobal({ radius: Number(event.target.value) })} />}
        {global.radius !== null && <output>{global.radius}px</output>}
      </div>
    </Field>
    <Field icon={<ImageIcon />} label="页面背景" path="global.background">
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
    <Field icon={<DialogIcon />} label="设置弹窗" path="global.dialog">
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
    <Field icon={<MobileIcon />} label="页面边距" path="global.padding">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={global.padding.mode === 'auto'} onClick={() => setGlobal({ padding: { ...global.padding, mode: 'auto' } })}>自动</SegmentedButton>
        <SegmentedButton pressed={global.padding.mode === 'custom'} onClick={() => setGlobal({ padding: { ...global.padding, mode: 'custom' } })}>自定义</SegmentedButton>
      </div>
      {global.padding.mode === 'custom' && <div className="dsh-layout-pads">
        {([['header', '头部', 20, 28], ['content', '内容区', 28, 28], ['composer', '输入区', 28, 28]] as const).map(([area, label, presetL, presetR]) => (
          <div key={area} className="dsh-layout-pads__row">
            <span>{label}</span>
            <label>左 <input type="number" min={PAD_LIMITS[0]} max={PAD_LIMITS[1]} placeholder={String(presetL)} value={global.padding[area].left ?? ''} onChange={event => setGlobal({ padding: { ...global.padding, [area]: { ...global.padding[area], left: event.target.value === '' ? null : Number(event.target.value) } } })} /></label>
            <label>右 <input type="number" min={PAD_LIMITS[0]} max={PAD_LIMITS[1]} placeholder={String(presetR)} value={global.padding[area].right ?? ''} onChange={event => setGlobal({ padding: { ...global.padding, [area]: { ...global.padding[area], right: event.target.value === '' ? null : Number(event.target.value) } } })} /></label>
          </div>
        ))}
        <p className="dsh-layout-pads__hint">留空使用预设（桌面全宽 20/28、28/28；手机 0/8、8/8）；仅全宽模式生效。</p>
      </div>}
    </Field>
    <Field icon={<MobileIcon />} label="窄屏头部换行" path="global.narrow.headerWrap">
      <Toggle checked={global.narrow.headerWrap} onChange={value => setGlobal({ narrow: { ...global.narrow, headerWrap: value } })} label={global.narrow.headerWrap ? '开启（防重叠）' : '关闭（原生）'} />
    </Field>
    <Field icon={<DialogIcon />} label="设置页形式" path="global.settingsView">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={global.settingsView === 'embedded'} onClick={() => setGlobal({ settingsView: 'embedded' })}>弹窗内嵌</SegmentedButton>
        <SegmentedButton pressed={global.settingsView === 'page'} onClick={() => setGlobal({ settingsView: 'page' })}>全屏页面</SegmentedButton>
      </div>
    </Field>
    <Field icon={<FluidIcon />} label="渲染质量" path="global.quality">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={global.quality === 'quality'} onClick={() => setGlobal({ quality: 'quality' })}>高质量</SegmentedButton>
        <SegmentedButton pressed={global.quality === 'balanced'} onClick={() => setGlobal({ quality: 'balanced' })}>平衡</SegmentedButton>
        <SegmentedButton pressed={global.quality === 'performance'} onClick={() => setGlobal({ quality: 'performance' })}>高性能</SegmentedButton>
      </div>
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
    <CardHeading icon={<GlassIcon />} title="侧边栏" hint="会话导航、列表节奏、材质和分割线。原生状态不写任何覆盖。" />
    <Group label="布局" />
    <Field icon={<WidthIcon />} label="侧边栏宽度" path="sidebar.width">
      <div className="dsh-layout-range">
        <Toggle checked={sidebar.width !== null} onChange={value => setSidebar({ width: value ? 280 : null })} label={sidebar.width === null ? '原生 280px' : '自定义'} />
        {sidebar.width !== null && <input type="range" min={SIDEBAR_WIDTH_LIMITS[0]} max={SIDEBAR_WIDTH_LIMITS[1]} step={4} value={sidebar.width} onChange={event => setSidebar({ width: Number(event.target.value) })} />}
        {sidebar.width !== null && <output>{sidebar.width}px</output>}
      </div>
    </Field>
    <Field icon={<WidthIcon />} label="内容水平内距" path="sidebar.paddingX">
      <div className="dsh-layout-range"><Toggle checked={sidebar.paddingX !== null} onChange={value => setSidebar({ paddingX: value ? 12 : null })} label={sidebar.paddingX === null ? '原生' : '自定义'} />{sidebar.paddingX !== null && <input type="range" min={SIDEBAR_PADDING_LIMITS[0]} max={SIDEBAR_PADDING_LIMITS[1]} value={sidebar.paddingX} onChange={event => setSidebar({ paddingX: Number(event.target.value) })} />} {sidebar.paddingX !== null && <output>{sidebar.paddingX}px</output>}</div>
    </Field>
    <Field icon={<WidthIcon />} label="内容垂直内距" path="sidebar.paddingY">
      <div className="dsh-layout-range"><Toggle checked={sidebar.paddingY !== null} onChange={value => setSidebar({ paddingY: value ? 6 : null })} label={sidebar.paddingY === null ? '原生' : '自定义'} />{sidebar.paddingY !== null && <input type="range" min={SIDEBAR_PADDING_LIMITS[0]} max={SIDEBAR_PADDING_LIMITS[1]} value={sidebar.paddingY} onChange={event => setSidebar({ paddingY: Number(event.target.value) })} />} {sidebar.paddingY !== null && <output>{sidebar.paddingY}px</output>}</div>
    </Field>
    <Group label="会话列表" />
    <Field icon={<RowsIcon />} label="会话行高" path="sidebar.rowHeight">
      <div className="dsh-layout-range"><Toggle checked={sidebar.rowHeight !== null} onChange={value => setSidebar({ rowHeight: value ? 36 : null })} label={sidebar.rowHeight === null ? '原生' : '自定义'} />{sidebar.rowHeight !== null && <input type="range" min={SIDEBAR_ROW_HEIGHT_LIMITS[0]} max={SIDEBAR_ROW_HEIGHT_LIMITS[1]} value={sidebar.rowHeight} onChange={event => setSidebar({ rowHeight: Number(event.target.value) })} />} {sidebar.rowHeight !== null && <output>{sidebar.rowHeight}px</output>}</div>
    </Field>
    <Field icon={<DensityIcon />} label="会话行间距" path="sidebar.rowGap">
      <div className="dsh-layout-range"><Toggle checked={sidebar.rowGap !== null} onChange={value => setSidebar({ rowGap: value ? 4 : null })} label={sidebar.rowGap === null ? '原生' : '自定义'} />{sidebar.rowGap !== null && <input type="range" min={SIDEBAR_ROW_GAP_LIMITS[0]} max={SIDEBAR_ROW_GAP_LIMITS[1]} value={sidebar.rowGap} onChange={event => setSidebar({ rowGap: Number(event.target.value) })} />} {sidebar.rowGap !== null && <output>{sidebar.rowGap}px</output>}</div>
    </Field>
    <Field icon={<ScrollbarIcon />} label="滚动条" path="sidebar.scrollbar"><div className="dsh-layout-segmented"><SegmentedButton pressed={sidebar.scrollbar === 'native'} onClick={() => setSidebar({ scrollbar: 'native' })}>原生</SegmentedButton><SegmentedButton pressed={sidebar.scrollbar === 'hidden'} onClick={() => setSidebar({ scrollbar: 'hidden' })}>隐藏</SegmentedButton></div></Field>
    <Group label="外观" />
    <GlassFields material={sidebar.glass} onChange={glass => setSidebar({ glass })} />
    <Field icon={<DividerIcon />} label="分割线" path="sidebar.divider"><div className="dsh-layout-segmented"><SegmentedButton pressed={sidebar.divider === 'native'} onClick={() => setSidebar({ divider: 'native' })}>显示（原生）</SegmentedButton><SegmentedButton pressed={sidebar.divider === 'hidden'} onClick={() => setSidebar({ divider: 'hidden' })}>隐藏</SegmentedButton></div></Field>
  </section>
}

function ContentCard({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const content = settings.content
  const setContent = (patch: Partial<LayoutSettings['content']>): void => store.update({ content: { ...content, ...patch } })
  const customWidth = typeof content.width === 'number'
  return <section className="dsh-layout-settings__card">
    <CardHeading icon={<GlassIcon />} title="对话内容区" hint="内容列与顶部标题栏共用的磨砂材质；阅读宽度同时决定输入框宽度。" />
    <Group label="材质" />
    <GlassFields material={content.glass} onChange={glass => setContent({ glass })} />
    <Group label="阅读与排版" />
    <Field icon={<WidthIcon />} label="阅读宽度" path="content.width">
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
    <Field icon={<DensityIcon />} label="消息间距" path="content.density">
      <div className="dsh-layout-range">
        <Toggle checked={content.density !== null} onChange={value => setContent({ density: value ? 16 : null })} label="自定义" />
        {content.density !== null && <input type="range" min={DENSITY_LIMITS[0]} max={DENSITY_LIMITS[1]} value={content.density} onChange={event => setContent({ density: Number(event.target.value) })} />}
        {content.density !== null && <output>{content.density}px</output>}
      </div>
    </Field>
    <Field icon={<ScaleIcon />} label="内容缩放" path="content.scale">
      <div className="dsh-layout-range">
        <Toggle checked={content.scale !== 100} onChange={value => setContent({ scale: value ? 110 : 100 })} label="自定义" />
        {content.scale !== 100 && <input type="range" min={SCALE_LIMITS[0]} max={SCALE_LIMITS[1]} value={content.scale} onChange={event => setContent({ scale: Number(event.target.value) })} />}
        {content.scale !== 100 && <output>{content.scale}%</output>}
      </div>
    </Field>
    <Field icon={<WidthIcon />} label="消息对齐" path="content.align">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={content.align === 'center'} onClick={() => setContent({ align: 'center' })}>居中</SegmentedButton>
        <SegmentedButton pressed={content.align === 'start'} onClick={() => setContent({ align: 'start' })}>靠左</SegmentedButton>
      </div>
    </Field>
    <Field icon={<ScrollbarIcon />} label="滚动条" path="content.scrollbar">
      <div className="dsh-layout-segmented">
        {(['native', 'hidden'] as const).map((mode: ScrollbarMode) => (
          <SegmentedButton key={mode} pressed={content.scrollbar === mode} onClick={() => setContent({ scrollbar: mode })}>{mode === 'native' ? '原生' : '隐藏'}</SegmentedButton>
        ))}
      </div>
    </Field>
    <Group label="气泡与轨迹页" />
    <Field icon={<BubbleIcon />} label="对话气泡" path="content.bubble">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={content.bubble === 'native'} onClick={() => setContent({ bubble: 'native' })}>原生</SegmentedButton>
        <SegmentedButton pressed={content.bubble === 'glass'} onClick={() => setContent({ bubble: 'glass' })}>磨砂</SegmentedButton>
        <SegmentedButton pressed={content.bubble === 'solid'} onClick={() => setContent({ bubble: 'solid' })}>实色</SegmentedButton>
        <SegmentedButton pressed={content.bubble === 'transparent'} onClick={() => setContent({ bubble: 'transparent' })}>无背景</SegmentedButton>
      </div>
    </Field>
    <Field icon={<TraceIcon />} label="轨迹页背景" path="content.trace.background">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={content.trace.background === 'native'} onClick={() => setContent({ trace: { ...content.trace, background: 'native' } })}>原生白</SegmentedButton>
        <SegmentedButton pressed={content.trace.background === 'clear'} onClick={() => setContent({ trace: { ...content.trace, background: 'clear' } })}>透明磨砂</SegmentedButton>
      </div>
    </Field>
    <Field icon={<WidthIcon />} label="轨迹页宽度" path="content.trace.width">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={content.trace.width === 'full'} onClick={() => setContent({ trace: { ...content.trace, width: 'full' } })}>原生全宽</SegmentedButton>
        <SegmentedButton pressed={content.trace.width === 'inset'} onClick={() => setContent({ trace: { ...content.trace, width: 'inset' } })}>对齐头部</SegmentedButton>
        <SegmentedButton pressed={content.trace.width === 'message'} onClick={() => setContent({ trace: { ...content.trace, width: 'message' } })}>对齐阅读区</SegmentedButton>
      </div>
    </Field>
    <Field icon={<TraceIcon />} label="轨迹表留白" path="content.trace.tableTail">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={content.trace.tableTail === 'native'} onClick={() => setContent({ trace: { ...content.trace, tableTail: 'native' } })}>原生</SegmentedButton>
        <SegmentedButton pressed={content.trace.tableTail === 'none'} onClick={() => setContent({ trace: { ...content.trace, tableTail: 'none' } })}>移除</SegmentedButton>
      </div>
    </Field>
  </section>
}

function FooterCard({ store, settings }: { store: LayoutStore; settings: LayoutSettings }): React.ReactElement {
  const footer = settings.footer
  const setFooter = (patch: Partial<LayoutSettings['footer']>): void => store.update({ footer: { ...footer, ...patch } })
  return <section className="dsh-layout-settings__card">
    <CardHeading icon={<RangeIcon />} title="底部输入区" hint="输入框是不透明面板；滚动范围决定对话记录止于输入区上方还是全屏滚过。" />
    <Field icon={<RangeIcon />} label="对话滚动范围" path="footer.scrollRange">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={footer.scrollRange === 'native'} onClick={() => setFooter({ scrollRange: 'native' })}>全屏（原生）</SegmentedButton>
        <SegmentedButton pressed={footer.scrollRange === 'above'} onClick={() => setFooter({ scrollRange: 'above' })}>止于输入区上方</SegmentedButton>
      </div>
    </Field>
    {footer.scrollRange === 'native' && <Field icon={<GlassIcon />} label="输入区底板" path="footer.plate">
      <div className="dsh-layout-segmented">
        <SegmentedButton pressed={footer.plate === 'transparent'} onClick={() => setFooter({ plate: 'transparent' })}>透明</SegmentedButton>
        <SegmentedButton pressed={footer.plate === 'solid'} onClick={() => setFooter({ plate: 'solid' })}>实色</SegmentedButton>
      </div>
    </Field>}
    <Field icon={<RowsIcon />} label="输入框行数" path="footer.rows">
      <div className="dsh-layout-range">
        <input type="range" min={ROWS_LIMITS[0]} max={ROWS_LIMITS[1]} value={footer.rows} onChange={event => setFooter({ rows: Number(event.target.value) })} />
        <output>{footer.rows} 行{settings.content.width === 'full' ? '' : '（全宽时生效）'}</output>
      </div>
    </Field>
    <Field icon={<StatsIcon />} label="统计信息" path="footer.stats">
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
