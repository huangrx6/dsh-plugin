export const REMOTE_ACCESS_NS = 'settings.remoteAccess'

export type RemoteAccessLocaleKey =
  | 'tab'
  | 'groupService'
  | 'groupQr'
  | 'loading'
  | 'statusError'
  | 'retry'
  | 'refresh'
  | 'statusOn'
  | 'statusOff'
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
  | 'diagnosticsTitle'
  | 'issuesOk'
  | 'issueHintPrefix'
  | 'loopbackNote'
  | 'trustedHostNote'

export const zhCN: Record<RemoteAccessLocaleKey, string> = {
  tab: '远程访问',
  groupService: '服务状态',
  groupQr: '二维码',
  loading: '正在读取远程访问状态…',
  statusError: '无法读取状态',
  retry: '重试',
  refresh: '刷新',
  statusOn: '已启用',
  statusOff: '未启用',
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
  enable: '启用',
  enabling: '正在启用…',
  disable: '停用',
  disabling: '正在停用…',
  disableConfirm: '停用后手机将无法访问本机 dsh，确定停用？',
  actionFailed: '操作失败：{message}',
  diagnosticsTitle: '诊断',
  issuesOk: '一切正常',
  issueHintPrefix: '建议',
  loopbackNote: 'dsh 始终只监听 127.0.0.1，远程流量由 Tailscale Serve 反向代理，不经公网。',
  trustedHostNote: '若手机打开地址提示 Host 校验失败，请用 dsh web --trusted-host <设备名> 重启 dsh。',
}

export const enUS: Record<RemoteAccessLocaleKey, string> = {
  tab: 'Remote Access',
  groupService: 'Service Status',
  groupQr: 'QR Code',
  loading: 'Reading remote access status…',
  statusError: 'Status unavailable',
  retry: 'Retry',
  refresh: 'Refresh',
  statusOn: 'Enabled',
  statusOff: 'Not enabled',
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
  enable: 'Enable',
  enabling: 'Enabling…',
  disable: 'Disable',
  disabling: 'Disabling…',
  disableConfirm: 'Devices will lose access to this dsh. Disable?',
  actionFailed: 'Action failed: {message}',
  diagnosticsTitle: 'Diagnostics',
  issuesOk: 'All clear',
  issueHintPrefix: 'Hint',
  loopbackNote: 'dsh keeps binding to 127.0.0.1 only; remote traffic is proxied by Tailscale Serve and never traverses the public internet.',
  trustedHostNote: 'If your device reports a Host check failure, restart dsh with dsh web --trusted-host <device-name>.',
}
