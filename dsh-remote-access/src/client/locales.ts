export const REMOTE_ACCESS_NS = 'settings.remoteAccess'

export type RemoteAccessLocaleKey =
  | 'tab'
  | 'title'
  | 'subtitle'
  | 'loading'
  | 'loadFailed'
  | 'retry'
  | 'refresh'
  | 'fieldStatus'
  | 'fieldNetwork'
  | 'fieldHttps'
  | 'fieldDevice'
  | 'fieldUrl'
  | 'fieldPicker'
  | 'statusOn'
  | 'statusOff'
  | 'statusPartial'
  | 'networkName'
  | 'httpsSecure'
  | 'httpsNone'
  | 'pickerEnabled'
  | 'pickerMissing'
  | 'copyUrl'
  | 'copied'
  | 'showQr'
  | 'hideQr'
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
  | 'qrTitle'

export const zhCN: Record<RemoteAccessLocaleKey, string> = {
  tab: '远程访问',
  title: 'Remote Access',
  subtitle: '通过 Tailscale Serve 把本机 dsh 暴露为 HTTPS 地址，手机或任意设备即可访问。',
  loading: '正在读取远程访问状态…',
  loadFailed: '暂时无法读取远程访问状态。',
  retry: '重试',
  refresh: '刷新',
  fieldStatus: '状态',
  fieldNetwork: '网络',
  fieldHttps: '传输',
  fieldDevice: '设备',
  fieldUrl: '地址',
  fieldPicker: '远程目录选择器',
  statusOn: '已开启',
  statusOff: '未开启',
  statusPartial: '部分就绪',
  networkName: 'Tailscale',
  httpsSecure: 'HTTPS 安全',
  httpsNone: '未建立',
  pickerEnabled: '已启用（应用内浏览）',
  pickerMissing: '未检测到 browse picker',
  copyUrl: '复制地址',
  copied: '已复制',
  showQr: '二维码',
  hideQr: '收起二维码',
  enable: '开启远程访问',
  enabling: '正在开启…',
  disable: '停止远程访问',
  disabling: '正在停止…',
  disableConfirm: '停止后手机将无法访问本机 dsh，确定停止？',
  actionFailed: '操作失败：{message}',
  issuesTitle: '需要处理',
  issueHintPrefix: '建议',
  loopbackNote: 'dsh 始终只监听 127.0.0.1，远程流量由 Tailscale Serve 反向代理，不经公网。',
  trustedHostNote: '若手机打开地址提示 Host 校验失败，请用 dsh web --trusted-host <设备名> 重启 dsh。',
  qrTitle: '扫码访问',
}

export const enUS: Record<RemoteAccessLocaleKey, string> = {
  tab: 'Remote Access',
  title: 'Remote Access',
  subtitle: 'Expose this dsh instance over Tailscale Serve as an HTTPS URL reachable from any device in your tailnet.',
  loading: 'Reading remote access status…',
  loadFailed: 'Failed to read remote access status.',
  retry: 'Retry',
  refresh: 'Refresh',
  fieldStatus: 'Status',
  fieldNetwork: 'Network',
  fieldHttps: 'Transport',
  fieldDevice: 'Device',
  fieldUrl: 'URL',
  fieldPicker: 'Remote directory picker',
  statusOn: 'Enabled',
  statusOff: 'Disabled',
  statusPartial: 'Partially ready',
  networkName: 'Tailscale',
  httpsSecure: 'HTTPS secure',
  httpsNone: 'Not established',
  pickerEnabled: 'Enabled (in-app browsing)',
  pickerMissing: 'browse picker not detected',
  copyUrl: 'Copy URL',
  copied: 'Copied',
  showQr: 'QR code',
  hideQr: 'Hide QR',
  enable: 'Enable remote access',
  enabling: 'Enabling…',
  disable: 'Disable remote access',
  disabling: 'Disabling…',
  disableConfirm: 'Devices will lose access to this dsh. Disable?',
  actionFailed: 'Action failed: {message}',
  issuesTitle: 'Needs attention',
  issueHintPrefix: 'Hint',
  loopbackNote: 'dsh keeps binding to 127.0.0.1 only; remote traffic is proxied by Tailscale Serve and never traverses the public internet.',
  trustedHostNote: 'If your device reports a Host check failure, restart dsh with dsh web --trusted-host <device-name>.',
  qrTitle: 'Scan to open',
}
