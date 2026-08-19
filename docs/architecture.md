# DSH 插件架构文档

> 目标受众：后续要开发新插件的开发者或 AI Agent。
> 阅读本文后，你应该能独立创建一个符合规范的 DSH 插件。

---

## 1. 概述

dsh-plugin 是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web 端的插件合集。所有插件均为「宿主 + Web 客户端」双形态，随 DSH Web 一起加载，无需侵入平台代码。

### 插件一览

| 插件 | 一句话 |
|---|---|
| **dsh-launcher** | 容器层：个人空间（侧栏 FAB + 浮层面板 + 全屏工作区），左菜单 + 右侧卡片化内容，承载其余所有插件的 UI 区块 |
| **dsh-agent-rules** | 编辑 `~/.dsh/AGENTS.md` 全局指令文件，注入到所有会话的持久基线 |
| **dsh-usage** | 订阅额度监控：GLM / MiniMax / Opencode 用量查询与配置管理 |
| **dsh-layout** | 页面布局与材质：磨砂材质覆盖整页，圆角 / 背景 / 弹窗 / 边距 / 对话排版 |
| **dsh-skill-manager** | Skill 导入（URL / GitHub / zip）与详情查看，连同 launcher 内的 Skill 市场 |
| **dsh-mcp-manager** | MCP 服务器全生命周期管理：增删改、启停、测试连接、工具明细，连同 launcher 内的 MCP 市场 |
| **dsh-remote-access** | 远程访问：Tailscale Serve 把本机 dsh 暴露为 HTTPS 地址 + 二维码扫码即用 |
| **dsh-archive-manager** | 归档会话管理：列表、阅读消息、恢复工作区、导出 zip 或 Markdown |

---

## 2. 整体架构

### 2.1 仓库结构

dsh-plugin 是**单仓库、独立包**（非 monorepo workspace）。每个插件有自己的 `package.json`、`tsconfig.json`、`tsdown.config.ts`，各自独立安装依赖、独立构建。

```
dsh-plugin/
├── dsh-launcher/           # 容器层（个人空间）
├── dsh-agent-rules/        # Agent 全局指令编辑器
├── dsh-usage/              # 订阅额度监控
├── dsh-layout/             # 页面布局与材质
├── dsh-skill-manager/      # Skill 管理 + 市场
├── dsh-mcp-manager/        # MCP 管理 + 市场
├── dsh-remote-access/      # 远程访问（Tailscale）
├── dsh-archive-manager/    # 归档会话管理
└── docs/                   # 文档
```

### 2.2 平台依赖

所有插件共享 `@deepseek-ai/*` 平台层依赖，分为宿主侧和客户端侧：

**宿主侧（Node.js）：**
- `@deepseek-ai/cordis` — 插件模型框架
- `@deepseek-ai/dsh-client-connection` — RPC 通道类型（`ConnectionRpcHandler`）

**客户端侧（Browser）：**
- `@deepseek-ai/dsh-client-runtime` — 客户端运行时（`ClientContext`）
- `@deepseek-ai/dsh-client-connection/client` — RPC 调用（`ClientConnectionRpc`、`ConnectionHandle`）
- `@deepseek-ai/dsh-client-locale/client` — 国际化
- `@deepseek-ai/dsh-client-ui-slots` — 插槽注册（`SlotMap`、`LocaleNamespaceMap`）
- `@deepseek-ai/dsh-client-ui-settings/client` — 设置面板（部分插件使用）
- `@deepseek-ai/dsh-client-ui-primitives` — UI 基础组件

### 2.3 插件间零依赖

插件之间没有直接依赖。协作通过**插槽机制**间接实现：dsh-launcher 声明 `dsh-launcher.workspace.section` 插槽，其余插件通过 `ctx.slots.inject('dsh-launcher.workspace.section', ...)` 注册自己的 UI 区块。

---

## 3. 插件生命周期

### 3.1 Cordis 插件模型

每个插件导出 Cordis 标准形状：

```ts
// 宿主侧（src/index.ts）
export const name = 'dsh-agent-rules'
export const inject = ['connection'] as const
export function apply(ctx: unknown): void {
  // 注册 RPC 通道、副作用等
}
```

```ts
// 客户端侧（src/client/index.ts）
export const inject = ['slots', 'locale', 'connection'] as const
export function apply(ctx: ClientContext): void {
  // 注册国际化、注入样式、注册插槽区块
}
```

**关键纪律：**
- **服务先声明后使用**：用到的 `ctx.xxx` 必须在 `inject` 数组里声明，否则运行时报 "cannot get property X without inject"
- **副作用走 `ctx.effect(disposer, label)`**：返回清理函数，插件停用/热重载时自动回收

### 3.2 宿主侧生命周期

宿主插件在 Node.js 进程中运行，负责：

1. 注册 RPC 通道：`ctx.connection.rpc.handle(channel, handler, { authority: 'trusted-host' })`
2. 处理客户端请求：文件读写、API 调用、子进程管理等
3. 通过 `ctx.effect()` 管理资源清理

### 3.3 客户端侧生命周期

客户端插件在浏览器中运行，负责：

1. 注入样式：`installStyles(document)`
2. 注册国际化：`ctx.locale.register(namespace, { zh, en })`
3. 注册 UI 区块：`ctx.slots.inject(slotName, () => ctx.slots.register(...))`
4. 通过 `connection.rpc.call()` 调用宿主侧 RPC

### 3.4 启动顺序

```
宿主进程启动 (dsh web)
  → 加载 cordis.patch.yml，注册宿主插件
  → 各插件 apply(ctx) 执行，注册 RPC 通道
  → 浏览器请求页面
    → ModuleLoader 加载客户端 bundle
    → 各插件 client apply(ctx) 执行
    → 注册插槽区块
    → UI 渲染
```

### 3.5 热更边界

| 变更 | 热更方式 |
|---|---|
| `cordis.patch.yml` 被改写 | 平台 HMR 即时应用（如 MCP 服务器配置变更） |
| `lib/client.js` 重新构建 | 刷新浏览器页面即生效 |
| `lib/index.mjs` 重新构建 | **必须重启 `dsh web` 进程** |

---

## 4. 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                       dsh-launcher                          │  容器层（个人空间）
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │  rules   │  usage   │  layout  │  skills  │   mcp    │   │
│  │(agent-   │(usage)   │(layout)  │(skill-   │(mcp-     │   │
│  │ rules)   │          │          │ manager) │ manager) │   │
│  ├──────────┴──────────┴──────────┴──────────┴──────────┤   │
│  │  remote   │  archive                                 │   │
│  │(remote-   │(archive-                                 │   │
│  │ access)   │ manager)                                 │   │
│  └───────────┴──────────────────────────────────────────┘   │
│                   插槽区块（各插件注册）                      │
└─────────────────────────────────────────────────────────────┘
              ↕ RPC (trusted-host / loopback)
┌─────────────────────────────────────────────────────────────┐
│                  宿主侧 (Node.js / Cordis)                   │
│  ~/.dsh/ 配置读写 + 外部 API 调用 + 文件操作 + 子进程管理    │
└─────────────────────────────────────────────────────────────┘
```

**职责分层：**
- **dsh-launcher**：容器层，声明 `dsh-launcher.workspace.section` 插槽，提供菜单、布局、动画
- **其余插件**：插槽区块层，各自注册独立的 UI 区块，通过 RPC 调用宿主侧能力
- **宿主侧**：数据层，负责文件系统操作、外部 API 调用、配置管理

---

## 5. 目录结构规范

标准插件目录结构：

```
dsh-{name}/
├── package.json              # 包配置 + dsh manifest
├── tsconfig.json             # 类型检查配置
├── tsconfig.build.json       # 构建时类型声明输出配置
├── tsdown.config.ts          # 双 bundle 配置
├── cordis.patch.yml          # 宿主侧 loader 补丁
├── scripts/
│   ├── clean.mjs             # 清理 lib/
│   └── wrap-client.mjs       # 包装客户端 CJS bundle
├── src/
│   ├── index.ts              # 宿主入口（Node.js，Cordis plugin）
│   ├── contracts.ts          # 共享契约（channel 名 + payload/result 类型）
│   ├── client/
│   │   ├── index.ts(x)       # 客户端入口（Browser，Cordis plugin）
│   │   ├── {Name}Section.tsx  # 主 UI 组件（React）
│   │   ├── api.ts            # RPC 调用封装
│   │   ├── locales.ts        # zh/en 国际化
│   │   └── styles.ts         # CSS 注入
│   └── (其他宿主侧模块)
├── tests/
│   └── *.test.ts             # vitest 测试
└── lib/                      # 构建产物（git 忽略）
    ├── index.mjs             # 宿主 ESM 产物
    ├── client.js             # 客户端 CJS 产物（ModuleLoader 包装）
    └── types/                # 类型声明
```

### 各文件职责

**`src/index.ts`（宿主入口）：**
- 导出 `name`、`inject`、`apply(ctx)`
- 注册 RPC 通道处理客户端请求
- 处理文件系统、API 调用等宿主侧逻辑

**`src/contracts.ts`（共享契约）：**
- 定义 RPC 通道名称常量
- 定义 Payload / Result 类型
- 宿主和客户端共同引用，确保类型一致

**`src/client/index.ts(x)`（客户端入口）：**
- 导出 `inject`、`apply(ctx)`
- 注册国际化、注入样式
- 注册插槽 UI 区块

**`src/client/{Name}Section.tsx`（主 UI 组件）：**
- React 组件，渲染插件的主要界面
- 通过 `api.ts` 封装的 RPC 调用与宿主通信

**`src/client/api.ts`（RPC 封装）：**
- 封装 `connection.rpc.call()` 调用
- 处理 `RpcResult` 的 ok/error 分支
- 提供类型安全的方法签名

**`src/client/locales.ts`（国际化）：**
- 定义 locale namespace 常量
- 导出 `zhCN` 和 `enUS` 翻译对象
- 导出 locale key 类型

**`src/client/styles.ts`（样式注入）：**
- 导出 CSS 字符串常量
- 导出 `installStyles(document)` 函数
- 使用 `document.createElement('style')` 注入

---

## 6. 契约模式 (contracts.ts)

### 6.1 Channel 名称约定

通道名称应唯一标识插件，有两种风格：

```ts
// 短名（用于 payload 中有 op 字段分发的情况）
export const DSH_AGENT_RULES_CHANNEL = 'dsh-agent-rules'

// 路径名（用于 endpoint 分发的情况）
export const DSH_SKILL_MANAGER_CHANNEL = '/dsh-skill-manager'
export const DSH_MCP_MANAGER_CHANNEL = '/dsh-mcp-manager'
```

命名规则：`dsh-{插件名}` 或 `/dsh-{插件名}`，用 kebab-case。

### 6.2 Payload / Result 类型定义

**简单 RPC（单操作）：**
```ts
export interface AgentRulesPayload {
  readonly op: 'read' | 'write'
  readonly payload?: { readonly text?: string }
}
```

**复杂 RPC（多操作）：**
```ts
export type UsageOp = 'config.read' | 'config.write' | 'query'

export interface UsagePayload {
  op: UsageOp
  payload?: { config?: UsageConfig }
}
```

**Endpoint 分发（推荐用于多操作插件）：**
宿主侧按 endpoint 字符串分发，客户端侧 `rpc.call(channel, endpoint, payload)`：

```ts
// 宿主侧
const handler: ConnectionRpcHandler = async (endpoint, payload) => {
  switch (endpoint) {
    case 'list': return ok(await listItems(ctx, payload))
    case 'detail': return ok(await getDetail(ctx, payload))
    // ...
  }
}

// 客户端侧
const result = await this.rpc.call(CHANNEL, 'list', { /* payload */ })
```

### 6.3 RpcResult 形状

```ts
// 成功
{ ok: true, value: T }

// 失败
{
  ok: false,
  error: {
    code: 'bad-request' | 'internal' | 'session-not-found',
    message: string,
    details: { issues: [] }  // bad-request 时必须有 issues 字段
  }
}
```

**错误码约定：**
- `'bad-request'`：参数校验失败、业务规则错误（前端直接展示 message）
- `'internal'`：未预期的服务端错误
- `'session-not-found'`：会话不存在（archive-manager 使用）

### 6.4 exactOptionalPropertyTypes 陷阱

项目开启了 `exactOptionalPropertyTypes: true`，这意味着：

```ts
interface Foo {
  readonly bar?: string | undefined
}

// 编译错误！不能显式传 undefined
const bad: Foo = { bar: undefined }

// 正确
const good: Foo = {}
const also: Foo = { bar: 'value' }
```

**解决方案：**
- 接口定义中可选属性必须写 `?: T | undefined`
- 构建对象时，使用条件展开避免显式 undefined：

```ts
// 错误
return { name: entry.name, version: entry.version }  // version 可能是 undefined

// 正确
return {
  name: entry.name,
  ...(entry.version === undefined ? {} : { version: entry.version }),
}
```

---

## 7. RPC 通信模式

### 7.1 宿主侧：ConnectionRpcHandler

```ts
import type { ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'

export function apply(ctx: unknown): void {
  const ext = ctx as {
    effect?: (fn: () => () => void, label?: string) => void
    connection: {
      rpc: {
        handle: (
          channel: string,
          handler: ConnectionRpcHandler,
          options: { authority: 'trusted-host' | 'loopback' },
        ) => Promise<unknown>
      }
    }
  }

  const handler: ConnectionRpcHandler = async (_endpoint, payload) => {
    try {
      // 业务逻辑
      return ok(result)
    } catch (error) {
      return fail(error)
    }
  }

  ext.effect?.(() => {
    const handlePromise = ext.connection.rpc.handle(
      CHANNEL,
      handler,
      { authority: 'trusted-host' },
    )
    return () => { void handlePromise }
  }, 'plugin-name: rpc')
}
```

### 7.2 客户端侧：connection.rpc.call()

```ts
// api.ts
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { CHANNEL } from '../contracts.ts'

export class MyApi {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  private async call<T>(endpoint: string, payload: unknown): Promise<T> {
    const result = await this.rpc.call(CHANNEL, endpoint, payload)
    if (!result.ok) throw new Error(result.error.message)
    return result.value as T
  }

  async list(): Promise<ListResponse> {
    return this.call<ListResponse>('list', {})
  }
}
```

### 7.3 错误处理规范

- 宿主侧：参数校验 → `bad-request`，其他异常 → `internal`
- 客户端侧：`result.ok === false` 时抛出 `Error(result.error.message)`
- UI 层：catch 错误后展示 toast 或 inline 错误提示

---

## 8. 插槽注册模式

### 8.1 dsh-launcher.workspace.section 插槽

dsh-launcher 声明了 `dsh-launcher.workspace.section` 插槽，其余插件通过注入该插槽将自己的 UI 区块注册到个人空间工作区。

```ts
// 声明插槽类型（在客户端入口）
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'dsh-launcher.workspace.section': {
      kind: 'list'
      scope: 'root'
      owner: object
    }
  }
}

// 注册区块
ctx.slots.inject('dsh-launcher.workspace.section', () =>
  ctx.slots.register(
    {
      name: 'dsh-launcher.workspace.section',
      id: 'rules',           // 对应 launcher 的 SectionMetadata.id
      order: 70,             // 排序权重
      label: () => t('section'),  // 菜单标签
      locale: AGENT_RULES_NS,     // 国际化命名空间
      inject: () => ({ api }),    // 传递给组件的依赖
    },
    AgentRulesSection,  // React 组件
  ),
)
```

### 8.2 SectionConfig 类型

```ts
interface SectionConfig {
  name: string              // 插槽名称
  id: string                // 区块 id，对应 launcher 配置的 SectionMetadata.id
  order: number             // 排序权重（数值越小越靠前）
  label: () => string       // 菜单标签（国际化函数）
  locale: string            // 国际化命名空间
  inject: () => object      // 传递给 React 组件的 props
}
```

### 8.3 menuGroup / menuPriority 元数据

dsh-launcher 通过 `$DSH_HOME/launcher-sections.json` 配置文件驱动区块发现。配置格式：

```json
[
  {
    "id": "rules",
    "menuGroup": "agent",
    "menuPriority": 1,
    "zh": { "name": "Agent 规则", "desc": "编辑 ~/.dsh/AGENTS.md" },
    "en": { "name": "Agent rules", "desc": "Edit ~/.dsh/AGENTS.md" }
  }
]
```

配置文件不存在时使用内置默认值。menuGroup 可选值：`agent`、`manage`、`appearance`、`tools`。

### 8.4 插槽注册 ID 对照表

| 插件 | 区块 id | menuGroup | order |
|---|---|---|---|
| dsh-agent-rules | `rules` | agent | 70 |
| dsh-usage | `usage` | manage | 75 |
| dsh-layout | `layout` | appearance | 46 |
| dsh-skill-manager | `skills` | manage | 50 |
| dsh-mcp-manager | `mcp` | manage | 51 |
| dsh-remote-access | `remote` | tools | 52 |
| dsh-archive-manager | `archive` | tools | 60 |

---

## 9. 构建流水线

### 9.1 tsc + tsdown 双包输出

构建流程：`pnpm run clean && tsc -p tsconfig.build.json && tsdown && node ./scripts/wrap-client.mjs`

1. **tsc**：生成类型声明到 `lib/types/`（`tsconfig.build.json` 配置 `emitDeclarationOnly: true`）
2. **tsdown**：打包两个 bundle
   - `lib/index.mjs` — 宿主 ESM（`format: ['esm']`，外部化 `yaml`、`fflate` 等）
   - `lib/client.raw.js` — 客户端 CJS（`format: ['cjs']`，`platform: 'browser'`）
3. **wrap-client.mjs**：把 `client.raw.js` 包装成 ModuleLoader 格式，输出 `client.js`

### 9.2 tsdown.config.ts 配置

```ts
import { defineConfig } from 'tsdown'

export default defineConfig([
  // 宿主 bundle
  {
    name: 'dsh-my-plugin',
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2024',
    outDir: 'lib',
    clean: false,
    dts: false,
    external: ['yaml', 'fflate'],
  },
  // 客户端 bundle
  {
    name: 'dsh-my-plugin/client',
    entry: ['src/client/index.ts'],
    format: ['cjs'],
    target: 'es2022',
    platform: 'browser',
    outDir: 'lib',
    clean: false,
    dts: false,
    sourcemap: false,
    outputOptions: {
      entryFileNames: 'client.raw.js',
    },
  },
])
```

### 9.3 scripts/wrap-client.mjs 的作用

将 tsdown 输出的 `client.raw.js` 包装为 DSH ModuleLoader 格式：

```js
window.__ModuleLoader__.load({
  id: "dsh-my-plugin",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    // ... 原始 bundle 内容 ...
    return module.exports;
  }
});
```

这是必需的，因为 DSH 的浏览器端模块加载器不是标准的 CommonJS/ESM，而是自定义的 `window.__ModuleLoader__` 机制。

### 9.4 CI 标签注入版本号

`.github/workflows/release.yml` 在推送 `v*` 标签时触发：

1. 从 tag 名提取版本号（去掉 `v` 前缀）
2. 用 `npm pkg set "version=$VERSION"` 写入每个插件的 `package.json`
3. 按顺序构建所有插件（dsh-launcher 必须先构建）
4. `pnpm pack` 生成 tarball
5. 上传到 GitHub Release

构建顺序很重要：dsh-launcher 必须先构建，因为其他插件的客户端 bundle 可能引用它的导出。

### 9.5 package.json 的 dsh manifest

```jsonc
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"    // 宿主侧 loader 补丁
    },
    "client": {
      "platform": "web",
      "inject": [                       // 客户端允许 require 的平台包白名单
        "@deepseek-ai/dsh-client-runtime",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-connection",
        "@deepseek-ai/dsh-client-ui-slots"
      ]
    }
  }
}
```

`dsh.client.inject` 是浏览器侧的依赖白名单：ModuleLoader 只解析列出的 `@deepseek-ai/*` 包与 `react`，其余一律要求打包进 bundle。

### 9.6 cordis.patch.yml

```yaml
- insert:
    - id: dsh-my-plugin
      name: dsh-my-plugin
```

最简形式，告诉宿主 loader 注册这个插件。复杂的插件（如 dsh-mcp-manager）可以在 patch 中添加更多配置。

---

## 10. 新插件脚手架

### 10.1 创建新插件步骤清单

假设要创建一个名为 `dsh-notify` 的通知管理插件。

#### 步骤 1：创建目录结构

```bash
mkdir -p dsh-notify/src/client
mkdir -p dsh-notify/scripts
mkdir -p dsh-notify/tests
```

#### 步骤 2：创建 `package.json`

```json
{
  "name": "dsh-notify",
  "version": "0.0.0",
  "description": "Notification management for DeepSeek Harness",
  "type": "module",
  "main": "lib/index.mjs",
  "types": "lib/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./lib/types/index.d.ts",
      "default": "./lib/index.mjs"
    },
    "./client": {
      "types": "./lib/types/client/index.d.ts",
      "default": "./lib/client.js"
    },
    "./package.json": "./package.json"
  },
  "files": [
    "lib/index.mjs",
    "lib/client.js",
    "lib/types/**/*.d.ts",
    "cordis.patch.yml",
    "README.md",
    "LICENSE"
  ],
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    },
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-runtime",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-connection",
        "@deepseek-ai/dsh-client-ui-slots",
        "@deepseek-ai/dsh-client-ui-primitives"
      ]
    }
  },
  "scripts": {
    "build": "pnpm run clean && tsc -p tsconfig.build.json && tsdown && node ./scripts/wrap-client.mjs",
    "clean": "node ./scripts/clean.mjs",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "check": "pnpm run typecheck && pnpm run test && pnpm run build",
    "prepare": "pnpm run build"
  },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "@deepseek-ai/dsh-client-connection": "^0.1.0-rc.6",
    "@deepseek-ai/dsh-client-locale": "^0.1.0-rc.6",
    "@deepseek-ai/dsh-client-runtime": "^0.1.0-rc.6",
    "@deepseek-ai/dsh-client-ui-primitives": "^0.1.0-rc.6",
    "@deepseek-ai/dsh-client-ui-slots": "^0.1.0-rc.6",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "@deepseek-ai/dsh-client-connection": "^0.1.0-rc.6",
    "@deepseek-ai/dsh-client-locale": "^0.1.0-rc.6",
    "@deepseek-ai/dsh-client-runtime": "^0.1.0-rc.6",
    "@deepseek-ai/dsh-client-ui-primitives": "^0.1.0-rc.6",
    "@deepseek-ai/dsh-client-ui-slots": "^0.1.0-rc.6",
    "@types/node": "^24.0.0",
    "@types/react": "~18.3.1",
    "jsdom": "^30.0.1",
    "react": "^18.2.0",
    "tsdown": "^0.22.2",
    "typescript": "^6.0.3",
    "vitest": "^4.1.8"
  },
  "engines": {
    "node": ">=24"
  },
  "license": "MIT"
}
```

#### 步骤 3：创建 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts", "tsdown.config.ts"]
}
```

#### 步骤 4：创建 `tsconfig.build.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "lib/types",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

#### 步骤 5：创建 `tsdown.config.ts`

```ts
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    name: 'dsh-notify',
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2024',
    outDir: 'lib',
    clean: false,
    dts: false,
    external: ['yaml', 'fflate'],
  },
  {
    name: 'dsh-notify/client',
    entry: ['src/client/index.ts'],
    format: ['cjs'],
    target: 'es2022',
    platform: 'browser',
    outDir: 'lib',
    clean: false,
    dts: false,
    sourcemap: false,
    outputOptions: {
      entryFileNames: 'client.raw.js',
    },
  },
])
```

#### 步骤 6：创建 `scripts/clean.mjs`

```js
import { rm } from 'node:fs/promises'
await rm(new URL('../lib', import.meta.url), { recursive: true, force: true })
```

#### 步骤 7：创建 `scripts/wrap-client.mjs`

```js
import { readFile, rename, rm, writeFile } from 'node:fs/promises'

const rawPath = new URL('../lib/client.raw.js', import.meta.url)
const outputPath = new URL('../lib/client.js', import.meta.url)
const temporaryPath = new URL('../lib/.client.js.tmp', import.meta.url)
const body = (await readFile(rawPath, 'utf8')).replace(/\n?\/\/# sourceMappingURL=.*$/u, '')
const wrapped = `window.__ModuleLoader__.load({
  id: "dsh-notify",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${indent(body, 4)}
    return module.exports;
  }
});
`

await writeFile(temporaryPath, wrapped)
await rename(temporaryPath, outputPath)
await rm(rawPath, { force: true })

function indent(value, spaces) {
  const prefix = ' '.repeat(spaces)
  return value.split('\n').map(line => `${prefix}${line}`).join('\n')
}
```

#### 步骤 8：创建 `cordis.patch.yml`

```yaml
- insert:
    - id: dsh-notify
      name: dsh-notify
```

#### 步骤 9：创建源文件

**`src/contracts.ts`：**
```ts
export const DSH_NOTIFY_CHANNEL = 'dsh-notify'

export interface NotifyPayload {
  readonly op: 'list' | 'mark-read'
  readonly payload?: { readonly id?: string }
}

export interface NotifyItem {
  readonly id: string
  readonly title: string
  readonly read: boolean
  readonly createdAt: number
}
```

**`src/index.ts`（宿主入口）：**
```ts
import type { ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection'
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import { DSH_NOTIFY_CHANNEL } from './contracts.ts'

export const name = 'dsh-notify'
export const inject = ['connection'] as const

function ok(value: unknown): RpcResult<unknown> {
  return { ok: true, value }
}
function fail(error: unknown): RpcResult<unknown> {
  return {
    ok: false,
    error: {
      code: 'internal',
      message: error instanceof Error ? error.message : String(error),
      details: {},
    },
  }
}

export function apply(ctx: unknown): void {
  const ext = ctx as {
    effect?: (fn: () => () => void, label?: string) => void
    connection: {
      rpc: {
        handle: (channel: string, handler: ConnectionRpcHandler, options: { authority: 'trusted-host' }) => Promise<unknown>
      }
    }
  }

  const handler: ConnectionRpcHandler = async (_endpoint, payload) => {
    try {
      // 实现业务逻辑
      return ok({ items: [] })
    } catch (error) {
      return fail(error)
    }
  }

  ext.effect?.(() => {
    const handlePromise = ext.connection.rpc.handle(
      DSH_NOTIFY_CHANNEL,
      handler,
      { authority: 'trusted-host' },
    )
    return () => { void handlePromise }
  }, 'dsh-notify: rpc')
}
```

**`src/client/locales.ts`：**
```ts
export const NOTIFY_NS = 'dsh-notify'

export type NotifyLocaleKey = 'section' | 'title' | 'markRead'

export const zhCN: Record<NotifyLocaleKey, string> = {
  section: '通知管理',
  title: '通知',
  markRead: '标为已读',
}

export const enUS: Record<NotifyLocaleKey, string> = {
  section: 'Notifications',
  title: 'Notifications',
  markRead: 'Mark as read',
}
```

**`src/client/api.ts`：**
```ts
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { DSH_NOTIFY_CHANNEL } from '../contracts.ts'

export class NotifyApi {
  constructor(private readonly rpc: ClientConnectionRpc) {}

  private async call<T>(payload: unknown): Promise<T> {
    const result = await this.rpc.call(DSH_NOTIFY_CHANNEL, 'dsh-notify', payload)
    if (!result.ok) throw new Error(result.error.message)
    return result.value as T
  }

  async list(): Promise<{ items: readonly NotifyItem[] }> {
    return this.call({ op: 'list' })
  }
}
```

**`src/client/styles.ts`：**
```ts
export const NOTIFY_STYLES = `
/* 插件样式 */
`

let installed = false

export function installStyles(target: Document): () => void {
  if (installed) return () => {}
  installed = true
  const style = target.createElement('style')
  style.className = 'dsh-notify-styles'
  style.textContent = NOTIFY_STYLES
  target.head.append(style)
  return () => {
    installed = false
    style.remove()
  }
}
```

**`src/client/NotifySection.tsx`：**
```tsx
import { useState, useEffect } from 'react'
import type { NotifyApi } from './api.ts'

export function NotifySection({ api }: { api: NotifyApi }) {
  const [items, setItems] = useState<readonly NotifyItem[]>([])

  useEffect(() => {
    api.list().then(r => setItems(r.items)).catch(console.error)
  }, [api])

  return (
    <div className="notify-section">
      {/* UI 实现 */}
    </div>
  )
}
```

**`src/client/index.ts`（客户端入口）：**
```ts
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import '@deepseek-ai/dsh-client-locale/client'
import type { NotifyLocaleKey } from './locales.ts'
import { NOTIFY_NS, enUS, zhCN } from './locales.ts'
import { NotifyApi } from './api.ts'
import { NotifySection } from './NotifySection.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-notify': NotifyLocaleKey
  }
  interface SlotMap {
    'dsh-launcher.workspace.section': {
      kind: 'list'
      scope: 'root'
      owner: object
    }
  }
}

export const inject = ['slots', 'locale', 'connection'] as const

export function apply(ctx: ClientContext): void {
  const connection = (ctx as unknown as { connection: ConnectionHandle }).connection
  const api = new NotifyApi(connection.rpc)

  ctx.effect(() => ctx.locale.register(NOTIFY_NS, { zh: zhCN, en: enUS }), 'dsh-notify: dictionaries')
  ctx.effect(() => installStyles(document), 'dsh-notify: styles')

  const t = ctx.locale.bind(NOTIFY_NS)
  ctx.slots.inject('dsh-launcher.workspace.section', () =>
    ctx.slots.register(
      {
        name: 'dsh-launcher.workspace.section',
        id: 'notify',
        order: 65,
        label: () => t('section'),
        locale: NOTIFY_NS,
        inject: () => ({ api }),
      },
      NotifySection,
    ),
  )
}
```

#### 步骤 10：注册到 launcher 配置文件

编辑 `$DSH_HOME/launcher-sections.json`，添加：

```json
{
  "id": "notify",
  "menuGroup": "tools",
  "menuPriority": 8,
  "zh": { "name": "通知管理", "desc": "查看和管理系统通知。" },
  "en": { "name": "Notifications", "desc": "View and manage system notifications." }
}
```

#### 步骤 11：添加到 CI release.yml

编辑 `.github/workflows/release.yml`，在 `for pkg in` 循环中添加 `dsh-notify`：

```yaml
for pkg in dsh-launcher dsh-layout dsh-skill-manager dsh-mcp-manager dsh-remote-access dsh-archive-manager dsh-agent-rules dsh-usage dsh-notify; do
```

#### 步骤 12：安装依赖并构建

```bash
cd dsh-notify
pnpm install
pnpm run build
```

### 10.2 快速验证清单

- [ ] `pnpm run typecheck` 通过
- [ ] `pnpm run test` 通过
- [ ] `pnpm run build` 生成 `lib/index.mjs`、`lib/client.js`、`lib/types/`
- [ ] 在 dsh profile 的 `package.json` 中添加 `link:` 依赖
- [ ] 重启 `dsh web`，确认宿主侧加载
- [ ] 刷新浏览器，确认客户端侧加载
- [ ] 在个人空间工作区中看到新区块
