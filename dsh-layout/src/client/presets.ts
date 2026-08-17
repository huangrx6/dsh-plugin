import { DEFAULT_SETTINGS, type CoreSettings, type GlassMaterial, type LayoutSettings } from './types.ts'
import type { LayoutStore } from './store.ts'

/**
 * Built-in presets are PATCHES over the defaults — never full configs — so a
 * preset never erases fields it does not declare (user profiles, future
 * settings added by newer versions). Everything the patch leaves undefined
 * resets to the native default, which is the point of a preset: a clean
 * starting point, not a merge onto the current state.
 */
export interface LayoutPreset {
  readonly id: string
  readonly name: string
  readonly hint: string
  readonly patch: (current: LayoutSettings) => Partial<LayoutSettings>
}

const material = (opacity: number, blur: number, saturation: number): GlassMaterial => ({
  enabled: true, tint: '', opacity, blur, saturation,
})

const base = (): CoreSettings => {
  const { profiles: _profiles, ...core } = DEFAULT_SETTINGS
  return core
}

export const BUILTIN_PRESETS: readonly LayoutPreset[] = [
  {
    id: 'native',
    name: 'DSH 原生',
    hint: '清零全部覆盖，回到原生外观',
    patch: () => base(),
  },
  {
    id: 'wide',
    name: '宽屏阅读',
    hint: '内容充满窗口、28px 边距、隐藏滚动条',
    patch: () => ({
      content: { ...base().content, width: 'full' },
      footer: { ...base().footer, scrollRange: 'above' },
    }),
  },
  {
    id: 'immersive',
    name: '沉浸磨砂',
    hint: '侧边栏与内容区标准磨砂、气泡磨砂',
    patch: () => ({
      sidebar: { ...base().sidebar, glass: material(72, 16, 120) },
      content: { ...base().content, glass: material(72, 16, 120), bubble: 'glass' },
    }),
  },
  {
    id: 'minimal',
    name: '极简透明',
    hint: '清透材质、气泡无背景、底板透明',
    patch: () => ({
      sidebar: { ...base().sidebar, glass: material(45, 20, 140) },
      content: { ...base().content, glass: material(45, 20, 140), bubble: 'transparent' },
    }),
  },
  {
    id: 'mobile',
    name: '移动友好',
    hint: '全屏编辑器、头部换行、8px 窄屏边距',
    patch: () => ({
      global: { ...base().global, narrow: { ...base().global.narrow, headerWrap: true } },
    }),
  },
]
