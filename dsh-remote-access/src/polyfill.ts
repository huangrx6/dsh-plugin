/**
 * crypto.randomUUID 的 Secure-Context 兼容兜底。
 *
 * 定位（重要）：这是**兼容垫片，不是远程访问方案的一部分**。
 * 在 Tailscale Serve 的 `https://*.ts.net` 下，浏览器原生提供
 * `crypto.randomUUID()`，本模块注入的脚本为 no-op。它只服务一种边缘
 * 场景：有人继续用裸 `http://192.168.x.x:3080` 访问 —— 该环境不是
 * Secure Context，规范允许 `randomUUID` 直接不存在。裸 HTTP 不被
 * 本插件支持为长期使用方式（后续还会撞上其他 Secure-Context API），
 * 这里只是让旧习惯不至于白屏。
 *
 * 挂载方式：官方 `ctx.webServer.tapIndex(transform)` 扩展点，对每个
 * index response 生效。
 */

/** 幂等哨兵：标记该文档已注入，防止多个插件层叠重复插入。 */
export const POLYFILL_SENTINEL = 'crypto.randomUUID polyfill'

/**
 * 守卫脚本本体：存在即跳过（no-op），缺失且平台有 getRandomValues
 * 才补一个符合 RFC 4122 v4 的实现。ES5 语法，避免任何转译假设。
 */
export const RANDOM_UUID_POLYFILL = `<script>(function(){if(!window.crypto||typeof window.crypto.randomUUID!=='function'&&window.crypto.getRandomValues){window.crypto.randomUUID=function(){var b=new Uint8Array(16);window.crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;var h='';for(var i=0;i<16;i++){h+=('0'+b[i].toString(16)).slice(-2)}return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)}}})();</script>`

/**
 * 纯函数：将 polyfill 插入 index.html 的 `<head>` 内首位。
 *
 * 行为契约：
 *  - 已含哨兵 → 原样返回（幂等）；
 *  - `<head>` 带任意属性 → 保留属性，插在开标签之后；
 *  - 无 `<head>` → 原样返回（dsh 的 index.html 恒有 head，此分支
 *    仅为防御异常模板，不静默篡改无头文档）。
 */
export function injectPolyfill(html: string): string {
  if (html.includes(POLYFILL_SENTINEL)) return html
  if (!/<head[^>]*>/iu.test(html)) return html
  return html.replace(
    /<head([^>]*)>/iu,
    `<head$1><!--${POLYFILL_SENTINEL}-->${RANDOM_UUID_POLYFILL}`,
  )
}
