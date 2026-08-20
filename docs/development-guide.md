# DSH 插件工程开发指南

> 目标受众：日常开发。
> 本文涵盖环境搭建、开发工作流、样式规范、发版流程和调试技巧。

---

## 1. 环境搭建

### 1.1 版本要求

| 工具 | 版本要求 |
|---|---|
| Node.js | >= 24 |
| pnpm | >= 10 |
| DSH CLI | `@deepseek-ai/dsh`（可 `npx` 调用） |

### 1.2 Clone 与安装

```bash
git clone git@github.com:huangrx6/dsh-plugin.git
cd dsh-plugin

# 每个插件独立安装（非 monorepo workspace）
for pkg in dsh-launcher dsh-layout dsh-skill-manager dsh-mcp-manager dsh-remote-access dsh-archive-manager dsh-agent-rules dsh-usage; do
  (cd "$pkg" && pnpm install)
done
```

### 1.3 本地开发环境启动

**方式一：link 到 dsh profile（推荐）**

在 dsh profile（如 `~/.dsh/profiles/web`）的 `package.json` 中用 `link:` 挂载：

```jsonc
{
  "name": "dsh-profile-web",
  "private": true,
  "dependencies": {
    "dsh-launcher": "link:/绝对路径/dsh-plugin/dsh-launcher",
    "dsh-layout": "link:/绝对路径/dsh-plugin/dsh-layout",
    "dsh-skill-manager": "link:/绝对路径/dsh-plugin/dsh-skill-manager",
    "dsh-mcp-manager": "link:/绝对路径/dsh-plugin/dsh-mcp-manager",
    "dsh-remote-access": "link:/绝对路径/dsh-plugin/dsh-remote-access"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-launcher",
        "dsh-layout",
        "dsh-skill-manager",
        "dsh-mcp-manager",
        "dsh-remote-access"
      ]
    }
  }
}
```

然后：

```bash
cd ~/.dsh/profiles/web
pnpm install
npx @deepseek-ai/dsh web --host 127.0.0.1 --port 3080
```

**方式二：使用预构建包（快速试用）**

```bash
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/0.1.0/dsh-launcher.tgz
# ... 其他插件
```

### 1.4 热更规律

| 层 | 热更方式 |
|---|---|
| Web 客户端（`lib/client.js`） | 重新构建后刷新浏览器页面即生效 |
| 宿主侧（`lib/index.mjs`） | 需重启 `dsh web` 进程 |
| MCP 配置（`cordis.patch.yml`） | 平台 HMR 即时应用，无需重启 |

---

## 2. 开发工作流

### 2.1 从零开发一个插件

完整步骤参见 [architecture.md 第 10 节](./architecture.md#10-新插件脚手架)。核心流程：

1. 创建目录结构和配置文件
2. 实现 `src/contracts.ts`（共享契约）
3. 实现 `src/index.ts`（宿主侧 RPC 处理）
4. 实现 `src/client/` 目录下的客户端代码
5. 构建并 link 到 dsh profile
6. 重启 dsh web 验证

### 2.2 代码风格约定

#### TypeScript 配置

所有插件使用统一的 TypeScript 严格配置：

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
  }
}
```

#### 关键纪律

**exactOptionalPropertyTypes：**
- 可选属性必须写 `?: T | undefined`（不能省略 `| undefined`）
- 构建对象时不能显式传 `undefined`，使用条件展开：
  ```ts
  // 错误
  { version: entry.version }  // version 可能是 undefined
  // 正确
  { ...(entry.version === undefined ? {} : { version: entry.version }) }
  ```

**verbatimModuleSyntax：**
- 类型导入必须用 `import type`：
  ```ts
  import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
  ```
- 值导入不能用 `import type`：
  ```ts
  import { DSH_CHANNEL } from './contracts.ts'  // 值导入
  ```

**noUncheckedIndexedAccess：**
- 数组索引和对象属性访问返回 `T | undefined`，需要检查：
  ```ts
  const first = arr[0]
  if (first === undefined) return  // 必须检查
  ```

#### React 组件规范

- 使用函数组件 + hooks
- 组件文件用 PascalCase 命名：`AgentRulesSection.tsx`
- Props 接口用 `{ api, t }` 对象形式传递
- 避免使用 `any`，类型不明确时用 `unknown` + 类型守卫
- 样式通过 `styles.ts` 注入，不使用 CSS Modules 或 styled-components

### 2.3 测试

使用 vitest 进行测试。

```bash
# 运行单个插件的测试
cd dsh-agent-rules
pnpm run test

# 类型检查 + 测试 + 构建全流程
pnpm run check
```

**测试文件位置：** `tests/*.test.ts`

**文件系统类测试：** 使用 `DSH_HOME` / `DSH_AGENTS_HOME` 环境变量指向临时目录，避免影响真实配置。

**测试示例：**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('my-feature', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'dsh-test-'))
    process.env.DSH_HOME = tempDir
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
    delete process.env.DSH_HOME
  })

  it('should read config', async () => {
    // 测试逻辑
  })
})
```

---

## 3. 样式开发规范

### 3.1 设计令牌 (Design Tokens)

详见 [design-tokens.md](./design-tokens.md)。核心要点：

- 所有颜色使用 `color-mix` 配方基于 `var(--dsw-alias-label-primary, #fff)` 派生
- 圆角通过 `var(--dsh-layout-radius-user, 8px)` / `var(--dsh-layout-radius-user-lg, 12px)` 桥接
- 禁止硬编码 `rgba(0,0,0,...)` 边框色（深色主题下会消失）

**常用配方速查：**

```css
/* 分组背景 */
background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.03));

/* 分组边框 */
border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);

/* 输入框背景 */
background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent);

/* hover 背景 */
background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent);

/* 主按钮背景 */
background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent);
border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent);

/* 按下反馈 */
transform: scale(0.97);

/* 过渡 */
transition: background-color 120ms var(--ds-ease-in-out, ease);
```

### 3.2 PC / H5 两层开发流程

详见 [ui-conventions.md](./ui-conventions.md)。每个插件按 Desktop + H5 两套设计：

```css
/* ── Desktop（默认，无媒体查询）────────────────────────────── */
.my-component { /* 桌面版式 */ }

/* ── H5（≤767px）──────────────────────────────────────────── */
@media (max-width: 767px) {
  .my-component { /* 手机版式 */ }
}
```

**H5 开发规则：**
- 触控目标 >= 36px（建议 40px）
- 工具栏分段条、搜索框各自独占整行
- 卡片网格：`minmax(min(190px, 100%), 1fr)`
- 弹窗：`width: 100%`（± 12px 遮罩内边距）
- 长文本：`overflow-wrap: anywhere`

**验收标准：**
- PC（1440px）和 H5（375px）各看一眼
- H5 无横向滚动条
- `pnpm run check` 全过

### 3.3 styles.ts 编写规范

```ts
/** 插件样式字符串 */
export const MY_PLUGIN_STYLES = `
/* 命名空间前缀：每个插件用自己的前缀，避免冲突 */
.myp-section { max-width: 760px; }
.myp-group {
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.03));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent);
  border-radius: var(--dsh-layout-radius-user-lg, 12px);
  padding: 6px;
}

/* ── H5（≤767px）──────────────────────────────────────────── */
@media (max-width: 767px) {
  .myp-section { padding: 0 16px; }
}

/* ── 减弱动效 ────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .myp-btn { transition: none; }
}
`

let installed = false

export function installStyles(target: Document): () => void {
  if (installed) return () => {}
  installed = true
  const style = target.createElement('style')
  style.className = 'dsh-my-plugin-styles'  // 类名标识
  style.textContent = MY_PLUGIN_STYLES
  target.head.append(style)
  return () => {
    installed = false
    style.remove()
  }
}
```

**规范要点：**
- CSS 选择器用插件专属前缀（如 `.myp-`、`.agr-`、`.ra-`）
- 使用 `color-mix` 配方而非硬编码颜色
- 包含 `prefers-reduced-motion` 媒体查询
- `installStyles` 使用模块级 `installed` 标志防止重复注入
- 返回清理函数供 `ctx.effect()` 使用

---

## 4. 发版流程

### 4.1 Git Tag 触发 CI

发版只需打 tag 并推送：

```bash
git tag 0.7.0
git push --tags
```

GitHub Actions（`.github/workflows/release.yml`）会自动：

1. tag 名直接就是版本号（`0.x.y`，无 `v` 前缀）
2. 用 `npm pkg set "version=$VERSION"` 写入每个插件的 `package.json`
3. 按顺序构建所有插件
4. 产出 tarball 并去掉文件名里的版本号（详见 4.5）
5. 上传到 GitHub Release

### 4.2 版本号自动注入

仓库里的 `package.json` 中的 `version` 字段只是本地兜底，CI 发版时会用 tag 号覆盖。不需要手动 bump 版本、也不需要 `chore(release)` 提交。

### 4.3 构建顺序

CI 按以下顺序构建（dsh-launcher 必须先构建）：

```
dsh-launcher → dsh-layout → dsh-skill-manager → dsh-mcp-manager →
dsh-remote-access → dsh-archive-manager → dsh-agent-rules → dsh-usage
```

### 4.4 添加新插件到 release.yml

编辑 `.github/workflows/release.yml`，在两处 `for pkg in` 循环中添加新插件名：

```yaml
# Stamp the tag version
for pkg in dsh-launcher dsh-layout ... dsh-usage dsh-notify; do

# Build & pack
for pkg in dsh-launcher dsh-layout ... dsh-usage dsh-notify; do
```

注意：新插件要放在列表末尾，确保它依赖的插件在前面。

### 4.5 Release 产物

每个插件在 release 中产出一个不带版本号的 tarball（文件名固定为 `<package>.tgz`，如 `dsh-notify.tgz`）；版本号写到 **release tag + 路径** 上 —— `download/<version>/<package>.tgz`：

```bash
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/0.1.0/dsh-notify.tgz
```

`releases/latest/download/` 是固定链接的兜底入口（不带版本号、不带路径前缀），指向当前最新 release；多次发布会撞 `ERR_PNPM_TARBALL_INTEGRITY`，仅供一次性试用，**不要用于升级路径**。

---

## 5. 调试技巧

### 5.1 在 dsh 宿主中测试插件

**宿主侧调试：**

```bash
# 启动 dsh web（带调试输出）
npx @deepseek-ai/dsh web --host 127.0.0.1 --port 3080

# 查看宿主日志
# 宿主插件的 console.log 会输出到终端
```

**客户端侧调试：**

1. 打开浏览器 DevTools
2. Console 中查看 `console.log` 输出
3. Network 面板查看 WebSocket 消息（RPC 调用）
4. Sources 面板查看 `lib/client.js` 源码

### 5.2 RPC 调试

**查看 RPC 调用：**

在浏览器 DevTools 的 Console 中：

```js
// 查看连接状态
window.__dsh_connection__

// 手动调用 RPC（调试用）
const result = await window.__dsh_connection__.rpc.call('/dsh-notify', 'list', {})
console.log(result)
```

**宿主侧 RPC 日志：**

在宿主插件的 handler 中添加日志：

```ts
const handler: ConnectionRpcHandler = async (endpoint, payload) => {
  console.log(`[dsh-notify] RPC: ${endpoint}`, payload)
  // ...
}
```

### 5.3 常见错误排查

#### "cannot get property X without inject"

**原因：** 在 `apply(ctx)` 中访问了 `ctx.X`，但 `X` 没有在 `inject` 数组中声明。

**解决：** 在 `export const inject` 中添加缺失的服务名。

#### "未知操作" 错误

**原因：** 客户端调用了新的 RPC endpoint，但宿主侧代码没有更新（改了宿主代码但没重启 dsh web）。

**解决：** 改完宿主代码后必须 `pnpm run build` 并重启 `dsh web`。

#### TARBALL_INTEGRITY 错误

**原因：** 使用了 `releases/latest/download/` 固定链接，URL 不变但内容变了。

**解决：** 使用版本化路径 `releases/download/<version>/`。

#### 样式不生效

**检查清单：**
- `installStyles` 是否在 `apply` 中调用？
- CSS 类名是否有拼写错误？
- `installed` 标志是否阻止了重复注入？
- 是否被其他插件的样式覆盖？（检查选择器优先级）

#### 插槽区块不显示

**检查清单：**
- `id` 是否与 launcher 配置中的 `SectionMetadata.id` 匹配？
- `declare module '@deepseek-ai/dsh-client-ui-slots'` 是否正确定义了 `SlotMap`？
- `ctx.slots.inject()` 是否在 `apply` 中调用？
- 浏览器 Console 是否有报错？

#### exactOptionalPropertyTypes 编译错误

**错误示例：**
```
Type 'undefined' is not assignable to type 'string'
```

**解决：** 使用条件展开代替显式 `undefined`：

```ts
// 错误
{ version: entry.version }

// 正确
{ ...(entry.version === undefined ? {} : { version: entry.version }) }
```

#### verbatimModuleSyntax 编译错误

**错误示例：**
```
A type-only import can specifier 'type' modifier must be used to import in 'verbatimModuleSyntax' mode
```

**解决：** 类型导入加 `type` 关键字：

```ts
// 错误
import { RpcResult } from '@deepseek-ai/dsh-client-connection/client'

// 正确
import type { RpcResult } from '@deepseek-ai/dsh-client-connection/client'
```

### 5.4 构建调试

```bash
# 类型检查（不生成产物）
pnpm run typecheck

# 完整检查（类型检查 + 测试 + 构建）
pnpm run check

# 仅构建
pnpm run build

# 清理构建产物
pnpm run clean
```

### 5.5 快速迭代技巧

**修改客户端代码：**
1. 改代码
2. `pnpm run build`
3. 刷新浏览器

**修改宿主代码：**
1. 改代码
2. `pnpm run build`
3. 重启 `dsh web`

**修改样式：**
1. 改 `styles.ts`
2. `pnpm run build`（或手动复制 CSS 到 DevTools 实时调试）
3. 刷新浏览器

**修改国际化：**
1. 改 `locales.ts`
2. `pnpm run build`
3. 刷新浏览器

---

## 附录 A：常用命令速查

| 命令 | 说明 |
|---|---|
| `pnpm install` | 安装依赖 |
| `pnpm run typecheck` | 类型检查 |
| `pnpm run test` | 运行测试 |
| `pnpm run build` | 构建产物 |
| `pnpm run check` | 类型检查 + 测试 + 构建 |
| `pnpm run clean` | 清理 `lib/` |
| `pnpm run prepare` | 构建（npm lifecycle hook） |

## 附录 B：插件依赖对照表

| 插件 | 宿主侧 inject | 客户端侧 inject |
|---|---|---|
| dsh-launcher | `connection` | `slots`, `locale` |
| dsh-agent-rules | `connection` | `slots`, `locale`, `connection` |
| dsh-usage | `connection` | `slots`, `locale`, `connection` |
| dsh-layout | `connection` | `slots`, `locale`, `connection`, `remote`, `settingsScope` |
| dsh-skill-manager | `skills`, `connection` | `slots`, `locale`, `connection` |
| dsh-mcp-manager | `connection`, `tools`, `loader`, `pluginInventory` | `slots`, `locale`, `connection` |
| dsh-remote-access | `connection`, `webServer`, `pluginInventory`, `settings` | `slots`, `locale`, `connection`, `theme`, `remote` |
| dsh-archive-manager | `connection`, `workspaceRegistry`, `sessions`, `sessionPersistence` | `slots`, `locale`, `connection` |

## 附录 C：RPC 通道名称对照表

| 插件 | 通道名称 | 分发方式 |
|---|---|---|
| dsh-launcher | `dsh-launcher-sections` | 单操作（返回 sections） |
| dsh-agent-rules | `dsh-agent-rules` | payload.op 分发（read/write） |
| dsh-usage | `dsh-usage` | payload.op 分发（config.read/config.write/query） |
| dsh-layout | `/dsh-layout` | endpoint 分发（load/save） |
| dsh-skill-manager | `/dsh-skill-manager` | endpoint 分发（list/detail/import/delete/file） |
| dsh-mcp-manager | `/dsh-mcp-manager` | endpoint 分发（list/save/toggle/delete/test/parseYaml/dumpYaml） |
| dsh-remote-access | `/dsh-remote-access` | endpoint 分发（status/enable/disable/getQr/bridge） |
| dsh-archive-manager | `/dsh-archive-manager` | endpoint + payload.op 分发（restore/export-md/list/info） |
