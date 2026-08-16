import { useEffect, useState } from 'react'

/**
 * The app theme is user-chosen and independent of prefers-color-scheme, so
 * the preview infers it from the luminance of the `--dsw-alias-bg-layer-1`
 * token. A lightweight poll re-checks while the preview is mounted so a
 * theme flip re-tints Shiki's output within a second.
 */
export function useIsDarkTheme(): boolean {
  const read = (): boolean => {
    if (typeof document === 'undefined') return false
    const value = getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-layer-1').trim()
    const match = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(value)
    if (match === null) return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    const [r = 0, g = 0, b = 0] = [Number(match[1]), Number(match[2]), Number(match[3])]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128
  }
  const [dark, setDark] = useState(read)
  useEffect(() => {
    const timer = setInterval(() => { setDark(read()) }, 1000)
    return () => { clearInterval(timer) }
  }, [])
  return dark
}
