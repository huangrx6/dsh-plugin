import { describe, expect, it } from 'vitest'
import {
  injectPolyfill,
  POLYFILL_SENTINEL,
  RANDOM_UUID_POLYFILL,
} from '../src/polyfill.ts'

/**
 * 直接测试真实导出的注入函数 —— 本插件唯一的 index.html 改写逻辑。
 * （早期版本在测试里复制了一份逻辑，测的是复制品；重构后 polyfill
 * 独立成模块，测试与真品不再可能漂移。）
 */
describe('injectPolyfill', () => {
  it('inserts once, right after <head>, before any sibling content', () => {
    const html = injectPolyfill('<html><head><title>dsh</title></head><body></body></html>')
    expect(html).toContain(POLYFILL_SENTINEL)
    expect(html.indexOf(RANDOM_UUID_POLYFILL)).toBeLessThan(html.indexOf('<title>'))
  })

  it('is idempotent (sentinel guard)', () => {
    const once = injectPolyfill('<html><head></head></html>')
    expect(injectPolyfill(once)).toBe(once)
  })

  it('keeps head attributes intact', () => {
    const html = injectPolyfill('<head lang="en">')
    expect(html.startsWith('<head lang="en">')).toBe(true)
  })

  it('leaves headless documents untouched (no silent rewrite)', () => {
    expect(injectPolyfill('<body></body>')).toBe('<body></body>')
  })

  it('polyfill script is guarded no-op when randomUUID exists', () => {
    // 脚本自身的守卫条件：真 HTTPS 下 window.crypto.randomUUID 是函数，
    // 因此注入体里必须包含 typeof !== 'function' 的存在性判断。
    expect(RANDOM_UUID_POLYFILL).toContain("typeof window.crypto.randomUUID!=='function'")
    expect(RANDOM_UUID_POLYFILL).toContain('getRandomValues')
  })
})
