# dsh-remote-access

> 把本机 dsh 变成手机可以打开的 HTTPS 地址 —— **Tailscale Serve 作为正式远程通道，dsh 官方 browse 目录选择器作为远程目录交互**，dsh 本身始终只监听 `127.0.0.1`。

在 iPhone / iPad / 其他电脑上打开 `https://<你的设备名>.ts.net`，就能远程使用这台 Mac 上的 DeepSeek Harness：选项目目录、建 session、和 Agent 对话、让它干活。无论家里 Wi-Fi、手机 5G 还是外地酒店，都是同一个地址 —— 不需要关心内网 IP、端口映射、DDNS 或自签名证书。

## 它解决什么问题

直接把 `http://192.168.x.x:3080` 发给手机，会撞上两堵墙，且都不是 dsh 的 bug：

**第一堵墙：Secure Context。** `crypto.randomUUID()` 在规范里明确要求 Secure Context，手机通过局域网 HTTP 打开时这个 API 直接不存在，dsh 的部分前端功能会失效。绕过去的方式（打 polyfill）是打不完的 —— 后面还排着剪贴板、通知等一整队 Secure-Context API。

**第二堵墙：原生目录选择器。** dsh 默认的 `directory-picker-auto` 在启动时采样三个信号：bind 是否 loopback、是否 SSH 启动、有无显示会话。三个信号都指向「操作员坐在电脑前」，于是挂载 native chooser —— 在 Mac 上弹 Finder 窗口。远程场景下这个窗口没人看，选择永远无法完成。且 `host.pickDirectory` 本身属于 dsh 的 loopback-only privileged API，远程调用直接 403。

本插件对这两堵墙的处理都换到了**根上**而不是表面：

| 问题 | 本插件的解法 |
| --- | --- |
| Secure Context | Tailscale Serve 提供真 `https://*.ts.net`（证书自动签发）。另保留一个 `tapIndex` polyfill 作为裸 HTTP 的兼容兜底，但明确不是主方案 |
| 原生选择器不可用 | 安装时静态 patch：禁用 auto chooser，挂载官方 [`dsh-host-directory-picker-browse`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/host/directory-picker-browse) —— 手机端出现应用内 Miller 双栏目录浏览器，走 `host.listDirectory` / `host.createDirectory` |
| `--host 0.0.0.0` 被 dsh CLI 拒绝 | 不动 dsh 绑定。Tailscale Serve 在本机反向代理，流量只在你的 tailnet 内，Tailscale ACL 继续生效 |

## 功能

**V1 交付四个能力**（对应 Settings → Plugins → 远程访问 面板）：

1. **Enable / Disable** —— 一键执行 `tailscale serve --bg 3080` / `tailscale serve --3080 off`（失败自动回退 `serve reset`），启用幂等：已有规则不重复创建
2. **URL + 二维码** —— 显示 `https://<设备名>.ts.net`，一键复制、扫码即达；二维码在 host（Node）侧生成，前端零依赖
3. **远程目录选择器（自动）** —— 插件安装时经 bundle patch 静态完成切换，无需任何运行时操作；面板里的「远程目录选择器」字段是对当前运行树的诚实探测（有人手动改掉 patch 会显示「未检测到」）
4. **诊断** —— Tailscale 未装 / 未运行 / 未登录 / HTTPS 证书未启用 / serve 失败，每条带可执行建议

面板一览：

```
Remote Access
通过 Tailscale Serve 把本机 dsh 暴露为 HTTPS 地址…

状态      ● 已开启            网络    Tailscale
传输      HTTPS 安全          设备    huangrx6-mac.tailxxxx.ts.net
地址      https://huangrx6-mac.tailxxxx.ts.net
远程目录选择器   已启用（应用内浏览）

[ 复制地址 ] [ 二维码 ]
[ 开启远程访问 ]  [ 停止远程访问 ]
```

## 安装

通过 GitHub Release 预构建包安装（已含构建产物，无需本机构建）：

```bash
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/<tag>/dsh-remote-access-<version>.tgz
```

把 `<tag>` 与 `<version>` 换为 [Releases 页](https://github.com/huangrx6/dsh-plugin/releases) 上最新的实际值。装完重启 dsh（或 `/reload`）；升级时用新 tag 重跑同一条命令。

### 一次性前置

1. Mac 安装 [Tailscale](https://tailscale.com/download) 并登录
2. 手机安装 Tailscale 并登录**同一 tailnet**
3. （管理员一次性）Tailscale 管理后台 → DNS → MagicDNS → **HTTPS Certificates** 启用 —— `serve` 依赖它签发证书，这是唯一的外部依赖

装好后远程目录选择器已自动切换完成（bundle patch 静态生效）。

## 使用

1. Mac 上启动 `dsh web`（一切保持默认，仍只监听 `127.0.0.1:3080`）
2. 打开 Web UI → **Settings → Plugins → 远程访问**
3. 点 **开启远程访问**
4. 手机扫码 → 进入 dsh → 点 Choose workspace → 手机上出现目录浏览器，浏览 Mac 文件系统选项目 → 开始对话

关闭随时可点 **停止远程访问**。升级插件：重跑上面的 `add` 命令（带完整 spec）。

### 若手机打开提示 Host 校验失败

说明该版本 Tailscale Serve 反代时未把 Host 头归一为 loopback，把设备名加入 dsh 信任名单后重启即可：

```bash
dsh web --trusted-host huangrx6-mac.tailxxxx.ts.net
```

## 诊断对照表

| Code | 含义 | 建议 |
| --- | --- | --- |
| `tailscale-not-installed` | 未找到 `tailscale` 命令 | 安装 Tailscale |
| `tailscale-not-running` | `tailscale status` 非零退出 | 打开 Tailscale 应用连接 |
| `tailscale-not-logged-in` | 无已登录 Self 节点 | `tailscale up` |
| `https-certificates-disabled` | tailnet 未启用 HTTPS 证书 | 管理后台 → DNS → HTTPS Certificates |
| `serve-failed` | serve 启停失败 | 见面板错误详情；可手动 `tailscale serve reset` |

## 实现理念

### 路线选择：为什么不走 `0.0.0.0` + HTTP + polyfill

dsh Web 是 Agent 控制面，官方当前安全模型明确不把 Host/Origin fence 当认证层。把绑定点改成全网卡、再用 HTTP 明文裸奔、再逐个 API 打 polyfill，是「能跑」但不可维护的路线 —— 每一个新 Secure-Context API 都是新漏洞。Tailscale Serve 路线让 dsh 保持最保守姿态（loopback-only），把「可达性」这件事交给专门的层：WireGuard 隧道、自动证书、tailnet ACL。**插件的产品承诺因此非常干净：装上即用，长期不腐烂。**

### 三处架构决策（每处都有源码级依据）

**1. picker 切换是静态 patch，不是运行时逻辑。** Cordis patch 的 `name` 字段是**守卫**（校验目标行包名）而非赋值 —— 源码 `applyEntryPatches` 里 `name` 不进 overrides，所以不能「改包名」，只能「禁旧行 + 插新行」。bundle patch 在插件安装时即生效，于是 V1 的「自动切换 Remote Directory Picker」从一段运行时代码坍缩为 8 行 YAML：

```yaml
- id: directory-picker                      # 禁用 dsh-base 的 auto chooser
  disabled: true
- insert:                                   # 挂载官方 browse backend（host + client 双面）
    - id: directory-picker-browse
      name: '@deepseek-ai/dsh-host-directory-picker-browse'
- insert:
    - id: dsh-remote-access
      name: dsh-remote-access
```

`@deepseek-ai/dsh-host-directory-picker-browse` 同时声明在本包 `dependencies` 里 —— patch 行里的裸插件名走 profile 的 `node_modules` 解析，必须让 pnpm 真实装到。

**2. Tailscale 逻辑是纯函数 + 注入端口（Ports & Adapters）。** `src/tailscale.ts` 只含解析/构造/流程，外部交互收敛到 `TailRunner` 端口；生产实现在 `src/runner.ts`（spawn + 超时 + 输出收集），测试注入 fake runner 即可覆盖全部分支 —— 包括「证书未启用」「老版本 CLI」「serve off 被拒回退 reset」这类难在真机上摆拍的场景。

**3. host/client 之间两条铁律。** ① `RpcError.code`/`details` 是封闭枚举，自定义 code 塞不进去 —— 领域错误的修复建议用 `\n[hint] ` 分隔符编入 message，client 切分还原；② QR 在 host 侧生成 —— client 保持零依赖，不受浏览器 QR 库差异影响。

### 模块结构

```
dsh-remote-access/
├── src/
│   ├── contracts.ts            # Shared Kernel：wire 类型（host/client 共享，零依赖）
│   ├── tailscale.ts            # 领域层：解析/命令构造/流程（纯逻辑 + TailRunner 端口）
│   ├── runner.ts               # 适配器：tailscale CLI 真实执行（spawn/超时/收集）
│   ├── polyfill.ts             # 兼容兜底：randomUUID 守卫脚本 + 幂等注入
│   ├── status.ts               # 用例层：组装 RemoteAccessStatus 投影
│   ├── index.ts                # 组合根：RPC 分发 + tapIndex 挂载
│   └── client/
│       ├── index.ts            # 注册 Settings tab（slots/locale/styles）
│       ├── api.ts              # RPC 薄封装
│       ├── RemoteAccessTab.tsx # 容器：状态机 + 动作
│       ├── IssuesList.tsx      # 展示：诊断列表
│       ├── QrPanel.tsx         # 展示：二维码
│       ├── locales.ts          # zh / en 文案
│       └── styles.ts
├── cordis.patch.yml            # ★ 核心静态效果（见上）
├── tests/                      # 26 用例：解析 / fake-runner 流程 / polyfill
└── lib/                        # 构建产物（host ESM + client ModuleLoader 包裹）
```

### RPC 参考

通道 `/dsh-remote-access`（`authority: 'loopback'`）：

| Endpoint | 请求 | 响应 |
| --- | --- | --- |
| `status` | `{}` | `RemoteAccessStatus`（安装/登录/DNS/serve/picker/诊断） |
| `enable` | `{}` | `{ httpsUrl, alreadyServing }` |
| `disable` | `{}` | `{ ok: true }` |
| `getQr` | `{ text }` | `{ svg }` |

## 已接受的限制

- **远程 Settings / Credentials 与 localhost 不一致**：`settings.*`、`credentials.*`、`llm.discoverModels`、`host.openPath`、`agentPreset.*` 是 loopback-only privileged API，即使配了 `--trusted-host` 也 403。这是 dsh 刻意保留到有真正认证层之后的边界 —— 用远程面板改 API Key 目前做不到，回本机操作。
- **核心工作流不受影响**：远程打开 → 目录浏览器选项目 → 建 session → 对话 → Agent 干活。
- **本机目录选择也变成应用内浏览器**（不再是 Finder）——静态 patch 无法区分来源，单人场景通常可接受甚至更顺手。

## 开发

```bash
pnpm install
pnpm run check        # typecheck + 26 tests + build
```

本地试装（软链 profile）并验证 patch 生效：

```bash
dsh plugin --profile web add /path/to/dsh-remote-access
dsh --profile web --dump-config | grep -B1 -A2 directory-picker
# 应看到：auto 行 disabled: true；browse 行由 dsh-remote-access 层插入
```

## License

MIT © huangrx6
