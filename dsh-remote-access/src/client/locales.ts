export const REMOTE_ACCESS_NS = 'settings.remoteAccess'

export type RemoteAccessLocaleKey =
  | 'tab'
  | 'groupService'
  | 'groupQr'
  | 'loading'
  | 'loadFailed'
  | 'retry'
  | 'refresh'
  | 'statusOn'
  | 'statusOff'
  | 'statusPartial'
  | 'networkName'
  | 'httpsSecure'
  | 'httpsNone'
  | 'pickerMissing'
  | 'copyUrl'
  | 'copied'
  | 'showQr'
  | 'hideQr'
  | 'qrTitle'
  | 'qrUnavailable'
  | 'enable'
  | 'enabling'
  | 'disable'
  | 'disabling'
  | 'disableConfirm'
  | 'actionFailed'
  | 'issuesTitle'
  | 'issueHintPrefix'
  | 'loopbackNote'
  | 'trustedHostNote'

export const zhCN: Record<RemoteAccessLocaleKey, string> = {
  tab: '远程访问',
  groupService: '服务状态',
  groupQr: '二维码',
  loading: '正在读取远程访问状态…',
  loadFailed: '暂时无法读取远程访问状态。',
  retry: '重试',
  refresh: '刷新',
  statusOn: '已开启',
  statusOff: '未开启',
  statusPartial: '部分就绪',
  networkName: 'Tailscale',
  httpsSecure: 'HTTPS 安全',
  httpsNone: '未建立',
  pickerMissing: '未检测到 browse picker',
  copyUrl: '复制',
  copied: '已复制',
  showQr: '显示二维码',
  hideQr: '收起',
  qrTitle: '用手机扫码打开',
  qrUnavailable: '开启远程访问后可生成访问二维码。',
  enable: '开启',
  enabling: '正在开启…',
  disable: '停止',
  disabling: '正在停止…',
  disableConfirm: '停止后手机将无法访问本机 dsh，确定停止？',
  actionFailed: '操作失败：{message}',
  issuesTitle: '需要处理',
  issueHintPrefix: '建议',
  loopbackNote: 'dsh 始终只监听 127.0.0.1，远程流量由 Tailscale Serve 反向代理，不经公网。',
  trustedHostNote: '若手机打开地址提示 Host 校验失败，请用 dsh web --trusted-host <设备名> 重启 dsh。',
}

export const enUS: Record<RemoteAccessLocaleKey, string> = {
  tab: 'Remote Access',
  groupService: 'Service Status',
  groupQr: 'QR Code',
  loading: 'Reading remote access status…',
  loadFailed: 'Failed to read remote access status.',
  retry: 'Retry',
  refresh: 'Refresh',
  statusOn: 'Enabled',
  statusOff: 'Disabled',
  statusPartial: 'Partially ready',
  networkName: 'Tailscale',
  httpsSecure: 'HTTPS secure',
  httpsNone: 'Not established',
  pickerMissing: 'browse picker not detected',
  copyUrl: 'Copy',
  copied: 'Copied',
  showQr: 'Show QR code',
  hideQr: 'Hide',
  qrTitle: 'Scan with your phone to open',
  qrUnavailable: 'Enable remote access to generate a QR code.',
  enable: 'Start',
  enabling: 'Starting…',
  disable: 'Stop',
  disabling: 'Stopping…',
  disableConfirm: 'Devices will lose access to this dsh. Disable?',
  actionFailed: 'Action failed: {message}',
  issuesTitle: 'Needs attention',
  issueHintPrefix: 'Hint',
  loopbackNote: 'dsh keeps binding to 127.0.0.1 only; remote traffic is proxied by Tailscale Serve and never traverses the public internet.',
  trustedHostNote: 'If your device reports a Host check failure, restart dsh with dsh web --trusted-host <device-name>.',
}
