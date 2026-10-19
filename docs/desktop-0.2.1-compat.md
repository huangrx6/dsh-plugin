# 桌面端兼容性评估（DSH 0.2.1-rc.2）

> 评估日期：2026-10-19
> 评估对象：本仓库 8 个插件（`0.6.2`，按平台 `^0.1.0-rc.6` 构建）
> 目标环境：DeepSeek Harness 桌面端 `0.2.1-rc.2`（macOS / arm64）
> 结论来源：解包 `/Applications/DeepSeek Harness.app/Contents/Resources/app.asar` 静态核对，**未做运行时实测**

---

## 1. 结论速览

| 插件 | 判断 | 卡点 |
| --- | --- | --- |
| [`dsh-launcher`](../dsh-launcher) | ✅ 大概率可用 | 无硬伤，需实测 |
| [`dsh-usage`](../dsh-usage) | ✅ 大概率可用 | 无 |
| [`dsh-agent-rules`](../dsh-agent-rules) | ✅ 大概率可用 | 无 |
| [`dsh-archive-manager`](../dsh-archive-manager) | 🟡 较可能可用 | 宿主调用面最大，需实测 |
| [`dsh-mcp-manager`](../dsh-mcp-manager) | ⚠️ 面板会崩 | 图标改名 |
| [`dsh-skill-manager`](../dsh-skill-manager) | ⚠️ 面板会崩 | 图标改名 |
| [`dsh-remote-access`](../dsh-remote-access) | ⚠️ 面板会崩 + 装不上 | 图标改名；directory-picker 依赖版本冲突 |
| [`dsh-layout`](../dsh-layout) | ⛔ 暂勿安装 | `settingsScope` 服务已被删除，可能导致整个界面无法启动 |

**前置依赖**：8 个插件全部把界面注册到 `dsh-launcher.workspace.section`。
**launcher 是基石——它不装，其余 7 个没有任何入口。**

---

## 2. 机制还在：桌面端就是同一个 Web 前端

这是所有判断的前提，已逐项验证：

1. 桌面端内置了 `@deepseek-ai/dsh-web-app` bundle 与 `@deepseek-ai/dsh-web-frontend/dist`，
   前端里存在 `globalThis.dshDesktopBoot` 分支（桌面壳注入 `injections` + `streamBaseUrl`）。
2. **插件声明协议未变**：`package.json` 的 `dsh.client.platform` / `dsh.client.inject`、
   客户端入口的 `export const inject = [...]`、以及
   `window.__ModuleLoader__.load({ id, factory })` 懒加载注册表，全部保留。
3. **客户端静态模块表**（前端 dist 中 `SZ()` 的返回值，插件 bundle 只能 require 这些）：

   ```
   react, react/jsx-runtime, react-dom, react-dom/client,
   @deepseek-ai/cordis, zod, @tanstack/react-virtual,
   @deepseek-ai/dsh-client-store,
   @deepseek-ai/dsh-client-ui-slots,
   @deepseek-ai/dsh-client-ui-primitives,
   @deepseek-ai/dsh-client-ui-dockkit
   ```

   我们插件运行时需要的 `ui-slots` / `ui-primitives` 都在其中；`react-dom/client` **不在**
   （launcher 的注释里已经写明了这一点，所以它才不自己建 React root——这个设计是对的）。
4. **`dsh plugin` 命令在桌面端可用**，但 `desktop` profile 由 Electron 独占：

   ```bash
   "/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
     plugin --profile desktop add <包名>
   ```

   用外部的 `dsh` / `npx @deepseek-ai/dsh` 跑 `--profile desktop` 会被拒绝：
   `error: profile "desktop" is managed exclusively by the Electron application`。
   桌面端 CLI 走的是 `runDesktopCli({ manageDesktopProfile: true })`，因此放行。

当前 `~/.dsh/profiles/desktop` 的 `dependencies` 为空，即桌面端目前**没装任何插件**。

---

## 3. 三个真实断裂点

### 3.1 图标全部改名（影响 3 个插件）

`dsh-client-ui-primitives` 仍在，组件 `Modal` / `JsonTree` / `MarkdownText` 都还在，
但**图标命名规则变了**：

| | 旧（0.1.0-rc.6） | 新（0.2.1-rc.2） |
| --- | --- | --- |
| 命名 | `Icon<Name>Outline14` / `Outline16` | `Icon<Name>OutlineRegular` / `OutlineMedium` |
| 数量 | — | 188 个（`OutlineRegular` 79 + `OutlineMedium` 79 + 其他） |

全量核对：新版图标表中 `Outline16` **0 命中**、`Outline14` **0 命中**；
插件实际用到的 17 个旧图标名**全部 MISSING**。

后果：`require("@deepseek-ai/dsh-client-ui-primitives")` 返回的是 `Object.freeze` 命名空间对象，
取不存在的属性得到 `undefined`，React 渲染时抛
`Element type is invalid: expected a string ... but got: undefined`。

受影响文件（`src/client/` 下 `import ... from '@deepseek-ai/dsh-client-ui-primitives'` 的位置）：

- `dsh-mcp-manager`：`McpManagerSection.tsx`、`McpEditor.tsx`、`ModalShell.tsx`、`ToolList.tsx`
- `dsh-skill-manager`：`SkillManagerSection.tsx`、`SkillImportView.tsx`、`SkillDetailView.tsx`、`SkillFilePreview.tsx`
- `dsh-remote-access`：`RemoteAccessSection.tsx`、`IssuesList.tsx`

### 3.2 `settingsScope` 服务被删除（影响 `dsh-layout`，后果最严重）

全包搜索 `settingsScope`：**0 命中**。

而 [`dsh-layout/src/client/index.ts`](../dsh-layout/src/client/index.ts) 把它写进了客户端 inject：

```ts
export const inject = ["slots", "locale", "connection", "remote", "settingsScope"];
//                                                        ^^^^^^^^^^^^^^ 已不存在
```

前端 dist 的启动流程里有一段**激活审计**（`kZ` → `bZ`）：

```js
for (const i of ctx.loader.entries()) {
  const s = vx[i.fiber.state];
  if (s !== "active")
    if (s === "pending") {
      const missing = Object.keys(i.fiber.inject).filter(d => ctx.get(d) === undefined);
      problems.push(`${name}: pending (waiting for service: ${missing.join(", ")})`);
    } else problems.push(`${name}: ${s}`);
}
if (problems.length > 0) throw new Error(`web boot: ${problems.length} entries did not activate\n...`);
```

cordis 里 inject 的服务不存在时该 fiber 永远停在 `pending`，
于是审计抛错 → 桌面壳进入失败态。**即：装上 dsh-layout 有白屏风险。**

替代品方向：0.2.1 里有 `configForms`（18 个内置包在用）与 `settingsSchema`，
但 `settingsScope.bind({ namespace })` 返回的 `BusyEnterScope` 语义需要重新找落点，
这是 8 个插件里**唯一需要改逻辑**的地方。

### 3.3 `dsh-remote-access` 的依赖版本锁死

[`dsh-remote-access/package.json`](../dsh-remote-access/package.json) 把平台包写成了
**dependencies**（而非 peerDependencies），且锁在旧区间：

```json
"dependencies": {
  "@deepseek-ai/dsh-host-directory-picker-browse": "^0.1.0-rc.6",
  "@deepseek-ai/dsh-client-ui-directory-picker-browse": "^0.1.0-rc.6"
}
```

`^0.1.0-rc.6` 按 semver 等价于 `>=0.1.0-rc.6 <0.2.0`，**匹配不到内置的 0.2.1-rc.2**，
pnpm 会去 registry 拉一份 0.1.x 旧包，与应用内版本并存 → 冲突或安装失败。

---

## 4. 两个「看起来像坑、其实不是」的点

### 4.1 `@deepseek-ai/dsh-client-runtime` 消失了，但无害

0.2.1 中该包**完全不存在**（全包搜索 0 命中），客户端体系被拆成了
`dsh-client-modules` + `dsh-client-ui-renderer` + `dsh-cordis-client-runner`。

但我们的插件只在**类型位置**引用它：

```ts
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
```

`import type` 编译后消失，运行时不会 require。同理 `@deepseek-ai/dsh-client-ui-slots`
在源码里只出现在 `declare module` 类型增强里，运行时依赖的是**静态模块**版本。

至于 `package.json` 里 `dsh.client.inject` 仍然列着 `@deepseek-ai/dsh-client-runtime`——
`dsh-client-modules` 的装配代码是这么处理的：

```js
for (const packageName of row.inject) {
  const dependency = this.graphRows.get(packageName);
  if (dependency !== void 0) await this.arriveDependency(...);  // 图上没有 → 静默跳过
}
```

**指向图上不存在的包会被静默忽略**，不影响加载。

### 4.2 宿主侧 API 逐个查过，都还在

| 插件 | 用到的宿主 API | 0.2.1 状态 |
| --- | --- | --- |
| 全部 | `ctx.connection.rpc.handle(channel, handler)` | ✅ 存在 |
| `dsh-remote-access` | `ctx.webServer.tapIndex(...)` | ✅ 存在 |
| `dsh-remote-access` | `settings.describe/writable/documentPath/update/replace/mutate/get/write`、`SettingsConflictError` | ✅ 全部存在 |
| `dsh-skill-manager` | `ctx.skills.get/snapshot` | ✅ 存在 |
| `dsh-archive-manager` | `workspaceRegistry.requireState`、`sessions.get/history`、`sessionPersistence.inspect/list` | ✅ 存在 |
| `dsh-mcp-manager` | `tools` / `loader` / `pluginInventory` 服务 | ✅ 存在 |

客户端侧服务 `slots` / `locale` / `connection` / `remote` / `theme` 也都存在，
且 slot 名（`shell.overlay`、`conversation.composer.dock`、`conversation.input.right`、
`settings.section` 等）在 0.2.1 的 slot 表里都能找到。

内置同类插件（`dsh-client-ui-jobs`、`dsh-client-ui-skill`）的写法与我们的完全一致：

```js
ctx.effect(() => ctx.locale.register(NS, { zh, en }), "...")
ctx.slots.inject("some.slot", () => ctx.slots.register({ name, id, order, locale, inject }, Component))
```

---

## 5. 逐插件明细

### `dsh-launcher` ✅

- 客户端 inject：`slots` / `locale` / `connection` —— 均存在
- 注册到 `shell.overlay`（0.2.1 仍存在），并通过 `children` 声明
  `dsh-launcher.workspace.section`——`children` 字段在 0.2.1 的 register 签名里仍有
- 侧栏按钮是 **best-effort 纯 DOM 注入**，找不到 rail 会静默失败，FAB 是保底入口
- 唯一不确定项：rail DOM 结构可能变了（0.2.1 有 `sidebar.footer.action` slot 可用作替代）

### `dsh-usage` ✅ / `dsh-agent-rules` ✅

- 客户端只 require `dsh-client-locale/client` + `react` + `react/jsx-runtime`
- 宿主只 inject `connection`
- 两者都是最简单的形态，风险最低

### `dsh-archive-manager` 🟡

- 客户端 require `connection` / `locale` / `ui-settings` —— 均存在
- 宿主 inject 最多：`connection` / `workspaceRegistry` / `sessions` / `sessionPersistence`，
  四个服务及其方法都验证存在
- 不确定性来自调用面最大（列表 / 阅读 / 恢复 / 导出 zip / 导出 Markdown）

### `dsh-mcp-manager` ⚠️

- 除图标外无其他问题：`Modal` / `JsonTree` / `MarkdownText` 都在
- 宿主侧另外依赖自带的 `@modelcontextprotocol/sdk`、`js-yaml`（普通 deps，正常安装）

### `dsh-skill-manager` ⚠️

- 除图标外，`JsonTree` / `MarkdownText` 都在
- 自带 deps：`fflate`、`yaml`

### `dsh-remote-access` ⚠️

- 图标 + directory-picker 依赖版本双问题
- 另有 `@deepseek-ai/dsh-settings`（peer）+ `qrcode`（dep）

### `dsh-layout` ⛔

- `settingsScope` 不存在 → inject 无法满足 → 条目永远 pending → 启动审计抛错
- 另：该插件有大量 DOM 层面的壳操作（`shell.ts` / `background.ts` / `menu-clamp.ts` /
  `dom-sync.ts` / `mobile-sidebar.ts`），0.2.1 的侧栏与布局结构变化较大，即使修好
  `settingsScope` 也需要重新校准

---

## 6. 如果要适配 0.2.1，改动清单

按工作量从低到高：

1. **图标名映射**：`Icon<Name>Outline14|16` → `Icon<Name>OutlineRegular|Medium`，
   3 个插件约 17 处。建议加一层本地映射模块，避免以后再次改名时全仓替换。
2. **`dsh-remote-access` 依赖归位**：把两个 directory-picker 从 `dependencies` 移到
   `peerDependencies`，并放开版本区间。
3. **放宽所有插件的平台 peer 区间**：`^0.1.0-rc.6` → `>=0.1.0-rc.6 <0.3.0`
   （或直接 `^0.2.0-rc.1`），否则 semver 上永远匹配不到 0.2.x。
4. **`dsh-layout` 服务替换**：`settingsScope` → `configForms` / `settingsSchema`，
   并重新校准 DOM 壳操作。
5. **`dsh-launcher` 侧栏按钮**：可考虑从 DOM 注入改为挂 `sidebar.footer.action` slot。
6. **ESM/CJS 与构建工具**：本次未发现构建产物层面的阻塞（`lib/client.js` 的
   `window.__ModuleLoader__.load` 形态与 0.2.1 内置包完全一致）。

---

## 7. 复核方法（下次版本更新后怎么重测）

`app.asar` 的头结构与常见 asar 略有差别，直接按通用解析会踩坑：

```
偏移 0   uint32  = 4
偏移 4   uint32  = headerSize      （数据区起点 = 8 + headerSize）
偏移 8   uint32  = jsonSize
偏移 12  uint32  = 实际 JSON 字节数
偏移 16  起为 JSON 文本
```

最小读取脚本：

```python
import json, struct, os
P = "/Applications/DeepSeek Harness.app/Contents/Resources/app.asar"
fd = os.open(P, os.O_RDONLY)
hdr = os.pread(fd, 16, 0)
data_start = 8 + struct.unpack("<I", hdr[4:8])[0]
json_size = struct.unpack("<I", hdr[12:16])[0]
header = json.loads(os.pread(fd, json_size, 16).decode("utf8"))
```

关键路径：

- `dsh/node_modules/@deepseek-ai/<pkg>/package.json` —— 版本与 `dsh.client` 声明
- `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-*.js` —— 客户端静态模块表 `SZ()` 与启动审计
- `dsh/node_modules/@deepseek-ai/dsh-client-modules/lib/client.js` —— 模块装配与 `inject` 处理
- `dsh/desktop-runtime.json` —— 运行时清单

复核时优先看三件事：

1. 静态模块表里 `ui-slots` / `ui-primitives` / `client-store` 是否还在；
2. 我们插件 inject 的每个客户端服务名是否仍被某个内置包 `provide`；
3. 图标命名规则是否又变。

---

## 8. 附：本次核对过的版本对照

| 项 | 值 |
| --- | --- |
| 桌面端版本 | `0.2.1-rc.2` |
| 内置 `@deepseek-ai/*` 包数 | 307 |
| 插件构建目标 | `@deepseek-ai/dsh-client-*` `^0.1.0-rc.6` |
| 客户端模块数（client 包） | 67 |
| 客户端静态模块 | 11 个（见 §2 第 3 条） |
| 已删除包 | `dsh-client-runtime`、`dsh-client-ui-slots`(转静态)、`dsh-client-ui-primitives`(转静态) |
| 已删除服务 | `settingsScope` |
