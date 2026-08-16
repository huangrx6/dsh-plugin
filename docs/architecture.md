# DSH 插件架构：平台如何装载我们

本文说明 DeepSeek Harness（DSH）插件的运行模型，以及本仓库三个插件各自挂在哪根筋上。理解了这层，读各包源码会非常顺。

## 进程与形态：一个插件，两半身体

DSH Web 跑在 **一个 Node 宿主进程**里（`dsh web`），同时向浏览器提供静态资源和 WebSocket。因此每个插件有两个构建产物：

| 产物 | 运行环境 | 格式 | 职责 |
| --- | --- | --- | --- |
| `lib/index.mjs` | 宿主 Node 进程 | ESM（Cordis 插件） | 文件系统、注册表、子进程——一切有权限的事 |
| `lib/client.js` | 浏览器 | CJS（被 `window.__ModuleLoader__` 包裹加载） | React UI、RPC 调用、样式注入 |

两半通过 **manifest** 声明（`package.json` 的 `dsh` 字段）：

```jsonc
{
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },   // 宿主：本包向 loader 声明的补丁
    "client": {
      "platform": "web",
      "inject": [                                   // Web 侧允许 require 的平台包白名单
        "@deepseek-ai/dsh-client-runtime",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-settings",
        "@deepseek-ai/dsh-client-connection",
        "@deepseek-ai/dsh-client-ui-primitives"
      ]
    }
  }
}
```

`dsh.client.inject` 是浏览器侧的依赖白名单：ModuleLoader 只解析列出的 `@deepseek-ai/*` 包与 `react`，其余一律要求**打包进 bundle**。所以本仓库把 `react-complex-tree`、`shiki` 等运行库放在 `devDependencies`（tsdown 默认把 `dependencies` 外置，devDeps 会被打进产物）。

## Cordis：宿主侧骨架

宿主插件导出 Cordis 标准形状：

```ts
export const name = 'dsh-skill-manager'
export const inject = ['skills', 'connection']   // 用到的服务必须声明，否则访问抛错
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.connection.rpc.handle(...), 'label')
}
```

关键纪律：

- **服务先声明后使用**：`ctx.skills` / `ctx.loader` / `ctx.tools` / `ctx.pluginInventory` 不在 `inject` 里就取不到（运行时报 "cannot get property X without inject"）
- **副作用走 `ctx.effect(disposer)`**：返回清理函数，插件停用/热重载时自动回收
- **服务有作用域**：`ctx.tools`（ToolRuntime）是 **session 级**的，根上下文调用 `ctx.tools.schemas()` 会抛错——这就是 MCP 管理器拿不到"实时已注册工具总数"、改用测试连接探测的原因

## RPC：两半之间唯一的桥

宿主在 **loopback 通道**上注册处理器：

```ts
ctx.connection.rpc.handle('/dsh-skill-manager', (endpoint, payload) => handler(ctx, endpoint, payload), { authority: 'loopback' })
```

浏览器侧调用：

```ts
const result = await rpc.call('/dsh-skill-manager', 'detail', { name })
// RpcResult<T> = { ok: true, value: T } | { ok: false, error: { code, message, details } }
```

`code: 'bad-request'` 时 `details` 必须形如 `{ issues: [] }`（平台类型约束）。本仓库的约定：**参数校验错误 → bad-request，其余异常 → internal**，前端对 bad-request 的 message 直接展示。

## Slots：UI 挂载点

设置弹框的「插件」区暴露了一个列表型插槽 `settings.plugins.tab`（声明在 `@deepseek-ai/dsh-client-ui-settings` 包里——想扩展它的类型必须 import 这个包，哪怕只用类型）。注册一个 tab：

```ts
ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
  name: 'dsh-skill-manager', id: 'skill-manager', order: 30,
  label: t('tab'), locale: 'settings.skillManager',
}, SkillManagerTab))
```

`locale` 对应的 key 需要向平台的 `LocaleNamespaceMap` 做 `declare module '@deepseek-ai/dsh-client-ui-slots'` 类型增广（注意：命名空间表在这个包，不在 locale 包）。

## 设计令牌与主题

所有样式骑在 `<body>` 上的 `--dsw-alias-*` 令牌（`label-primary/secondary/tertiary`、`border-l1/l2`、`bg-layer-1/3`、`bg-module-platform`、`interactive-bg-hover/active`、`state-business/success/error-primary`）与 `--dsw-shadow-lv1/lv2`、`--ds-font-family-code`、`--ds-ease-in-out` 上，浅深主题自动适配。

两条红线：

1. **禁止硬编码 `rgba(0,0,0,…)` 这类边框色**——深色主题下会消失；用 `color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent)`
2. 应用主题**独立于** `prefers-color-scheme`（用户可在设置里手切），需要感知主题时读令牌值（如 `--dsw-alias-bg-layer-1` 的亮度）而不是 matchMedia——见 `dsh-skill-manager/src/client/theme.ts`

## 配置与热更（HMR）

DSH 的插件配置不是写进 `package.json`，而是 **补丁层**：`cordis.patch.yml`（js-yaml 4 方言，支持 `!!js` 表达式节点）。装载器按 profile → home 层序合成，后层覆盖前层。

热更边界（实测结论，很重要）：

- **`cordis.patch.yml` 被改写** → 平台 HMR 即时应用：MCP 服务器写完保存，工具进程立刻拉起 / 终止，无需重启
- **`lib/client.js` 重新构建** → 浏览器刷新页面即拿到新版（静态资源按请求从磁盘读）
- **`lib/index.mjs` 重新构建** → **必须重启 `dsh web` 进程**（宿主代码启动时 require 进内存，且 Node require 缓存不会失效）

少踩坑：改完宿主代码 build 完不重启，就会出现「前端调新端点、后端报 未知操作」的错位。

## Skill 体系速览

- 发现规则：受管根下**一层深**——`<name>/SKILL.md`（bundle 形态）或 `<name>.md`（扁平形态）
- 层级 rank：项目 `.dsh/skills`（100）→ 项目 `.agents/skills` → … → 用户 `~/.dsh/skills`（400）→ `~/.agents/skills`（500）→ 内置（600），**同名低 rank 胜出**，输家即「已遮蔽」
- frontmatter 方言：`name`（kebab-case，必填）、`description`（必填）、`disable-model-invocation`、`user-invocable`；旧驼峰键直接拒绝

## MCP 体系速览

- 每个服务器 = loader 里一条 `@deepseek-ai/dsh-mcp-client` 条目（`cordis.patch.yml` 的 insert 补丁）
- stdio 子进程 env = 清洗后的宿主环境 + 配置条目覆盖；清洗剔除名字含 `KEY|PASSWORD|SECRET|TOKEN`（不区分大小写）或 `DSH_` 前缀的变量
- `!!js process.env.XXX` 在**宿主进程内**求值（loader 对 YAML 表达式节点做 `with(ctx){ eval(expr) }`），求出的真实值传给子进程
- 工具命名：`mcp__<serverName>__<toolName>`

## 工程骨架（三包共用）

```
package.json          # dsh manifest + scripts（check = typecheck + test + build）
tsconfig.json         # strict + exactOptionalPropertyTypes + noUncheckedIndexedAccess + verbatimModuleSyntax
tsdown.config.ts      # 双 bundle：宿主 ESM（外置 yaml/fflate 等）+ 客户端 CJS（platform: browser）
scripts/clean.mjs     # 清 lib/
scripts/wrap-client.mjs # 把 tsdown 产物包成 ModuleLoader 的 CJS 包装
src/contracts.ts      # 双端共享的 RPC 线类型（单一事实源）
tests/                # vitest；文件系统类测试用 DSH_HOME/DSH_AGENTS_HOME 指向临时目录
```

TypeScript 纪律：可选属性写 `?: T | undefined`（exactOptionalPropertyTypes）；导入类型用 `import type`（verbatimModuleSyntax）；`packages` 里的平台包同时出现在 `peerDependencies` 与 `devDependencies`。
