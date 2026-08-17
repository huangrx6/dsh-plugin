import type { RemoteAccessLocaleKey } from './locales.ts'

export interface QrPanelProps {
  readonly t: (key: RemoteAccessLocaleKey) => string
  readonly svg: string
}

/**
 * 二维码展示（纯展示）。SVG 由 host 侧生成并经 RPC 传入，
 * client 不引入任何 QR 依赖 —— `dangerouslySetInnerHTML` 的输入
 * 全程来自本插件 host 代码（qrcode 库输出），非用户可控文本。
 */
export function QrPanel({ t, svg }: QrPanelProps) {
  return (
    <figure className="ra-qr">
      <figcaption className="ra-qr-title">{t('qrTitle')}</figcaption>
      <div className="ra-qr-svg" dangerouslySetInnerHTML={{ __html: svg }} />
    </figure>
  )
}
