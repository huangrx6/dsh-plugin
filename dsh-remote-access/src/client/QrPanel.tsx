import type { RemoteAccessLocaleKey } from './locales.ts'

export interface QrPanelProps {
  readonly t: (key: RemoteAccessLocaleKey) => string
  readonly svg: string
  /** 点击「收起」时由容器收起二维码（恢复为待加载态）。 */
  readonly onCollapse?: () => void
}

/**
 * 二维码展示（纯展示）：白色托盘居中 + 下方一行提示 + 可选收起入口。
 * SVG 由 host 侧生成并经 RPC 传入，client 不引入任何 QR 依赖 ——
 * `dangerouslySetInnerHTML` 的输入全程来自本插件 host 代码
 * （qrcode 库输出），非用户可控文本。
 */
export function QrPanel({ t, svg, onCollapse }: QrPanelProps) {
  return (
    <div className="dsh-ra-qr-body">
      <div className="dsh-ra-qr-plate" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="dsh-ra-qr-hint">{t('qrTitle')}</p>
      {onCollapse !== undefined && (
        <button type="button" className="dsh-ra-qr-collapse" onClick={onCollapse}>{t('hideQr')}</button>
      )}
    </div>
  )
}
