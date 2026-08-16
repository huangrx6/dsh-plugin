# dsh-mcp-manager 源码解读

包路径：[`../dsh-mcp-manager`](../dsh-mcp-manager)。前置阅读：[architecture.md](./architecture.md)。

功能一句话：MCP 服务器的**全生命周期管理**——增删改、启停、测试连接、工具明细，全部落在平台的 `cordis.patch.yml` 补丁层上，由平台 HMR 即时生效。RPC 通道 `/dsh-mcp-manager`，端点 7 个：`list` / `save` / `toggle` / `delete` / `test` / `parseYaml` / `dumpYaml`。

## 目录地图

```
src/
├── contracts.ts      # 线类型（McpServerConfig 双形态：字符串值或 !!js 表达式值）
├── patch-file.ts     # PatchLayer：js-yaml 4 方言读写 cordis.patch.yml（.bak 备份 + 原子替换）
├── server-config.ts  # 条目投影、校验、四种写操作
├── test-connection.ts# 一次性 MCP 探测
└── index.ts          # 宿主：层装载、状态聚合、端点装配
src/client/
├── McpManagerTab.tsx # 列表：服务器卡片（状态呼吸灯、传输标签、工具明细展开）
├── McpEditor.tsx     # 双模式编辑器（表单 ⇆ YAML）
├── api.ts / index.ts / locales.ts / styles.ts
tests/                # patch-file / server-config，17 用例
```

## patch-file.ts —— 最微妙的一层

平台用 **js-yaml 4** 解析 `cordis.patch.yml`，其中 `!!js` 标签节点在 loader 里被求值（`with(ctx){ eval(expr) }`）。要让「读 → 改 → 写」全程无损，必须复刻这套方言：

```ts
const JsExprType = new yaml.Type('tag:yaml.org,2002:js', {
  kind: 'scalar',
  resolve: data => typeof data === 'string',
  construct: data => ({ __jsExpr: data }),        // 解析：tag → 标记对象
  predicate: data => isJsExpr(data),
  represent: data => (data as JsExprNode).__jsExpr, // 序列化：标记对象 → tag
})
const schema = yaml.JSON_SCHEMA.extend(JsExprType)
```

坑：**必须锁 js-yaml 4**（`^4.1.0`）——5.x 删除了 `Type` / `Schema.extend` API。`PatchLayer.save` 先写 `.bak` 再原子 rename；`parseYamlConfig` / `dumpYamlConfig` 供编辑器 YAML 模式复用同一方言，保证用户在 YAML 里写的 `!!js process.env.XXX` 能无损往返。

## server-config.ts —— 补丁语义的镜像

`collectMcpEntries(layers)` 把 profile → home 两层补丁按序合成条目，语义对齐平台 `applyEntryPatches`：

- `insert` 列表新增条目（`looksLikeMcpEntry` 靠 `name === '@deepseek-ai/dsh-mcp-client'` 或 config 形状识别）
- 后续同 `id` 的补丁可**整体替换 config** 或改 `disabled`
- 每条记录保留 `insertAt`（插在哪层哪个下标）与 `overrideIndexes`（哪些覆盖补丁碰过它）——写操作要同时维护这两处

四个写操作里最容易错的是 `removeServer`：**先删覆盖补丁再删插入条目**（倒序 splice），顺序反了下标会漂移、删错补丁——这是单测抓出来的真 bug。`updateServer` 同步改写插入条目与所有覆盖补丁，保证层叠语义不破。`validateServerConfig` 里 env / headers 的值允许「字符串或 `!!js` 表达式」两种形态。

## index.ts —— 宿主装配

- **层定位**：home 层固定 `~/.dsh/cordis.patch.yml`（`DSH_HOME` 可重定向）；profile 层先试 `ctx.loader.config.baseUrl`，**再退到 `process.cwd()`**（实测部分启动方式下 baseUrl 为空），且只有目录 manifest 声明了 `dsh.profile` 才认。写入层优先 profile，退 home
- **状态聚合**：`ctx.pluginInventory` 取 MCP 插件 fiber 阶段；`ctx.tools` 尝试枚举 `mcp__<server>__*` 前缀——两者都包 try/catch，因为 ToolRuntime 是 session 级服务，根上下文不可用（平台设计），实时工具数拿不到就由「测试连接」补位
- **`test` 端点**转调 `testMcpConnection`，`parseYaml` / `dumpYaml` 给编辑器 YAML 模式提供无损转换

## test-connection.ts —— 一次性探测

和平台 `dsh-mcp-client` 同样的姿势拉起连接，但**什么都不注册**：

- stdio：`StdioClientTransport({ command, args, env: {...cleanProcessEnv(), ...plainEntries(env)} })`——env 合成语义照抄平台（继承宿主环境 + 配置覆盖）；`!!js` 表达式值在探测中**跳过**（loader 求值发生在真实装载时，探测进程拿不到已求值配置）
- streamable-http：`StreamableHTTPClientTransport` + headers
- initialize 握手 + `tools/list` 分页拉全（上限 50 页），返回耗时 / 服务器版本 / 工具清单（含 inputSchema）
- 30s 超时（AbortController），`finally` 里必关连接——探测失败也绝不留孤儿进程

已知取舍：需要 `!!js` env 的服务器测试可能因缺变量失败，但真实运行正常；界面文案已说明。

## client —— 卡片与双模式编辑器

`McpManagerTab`：标题行 + 计数 + 刷新；服务器卡片 = 图标砖（停用变灰、失败变红）+ 名称 + 传输标签 + **状态呼吸灯**（halo + breathe 动画）+ 展开区（command / url、env 键值、工具列表——`JsonTree` 渲染每个工具的参数 schema）。写操作后 `settleRefresh` 轮询 4×1.2s，等 HMR 状态落定再刷新列表。

`McpEditor` 双模式：

- **表单模式**：stdio / streamable-http 分段切换；env 与 headers 用 `KeyValueEditor`（`!!js` 行显示为琥珀色锁定行——只读可删，改表达式切 YAML）；重连参数等收进「高级」折叠区；底部粘性操作条（backdrop-filter 模糊）
- **YAML 模式**：直接编辑 `parseYaml` 产出的 YAML，`!!js` 方言无损；保存前经同一套 `validateServerConfig`
- **测试面板**：成功（绿砖 + 耗时 + 服务器版本 + 工具数徽标）/ 失败（红砖 + 错误信息），工具逐个展开看参数

## 环境变量引用速查

```yaml
# YAML 模式：
env:
  GITHUB_TOKEN: !!js process.env.GITHUB_TOKEN   # loader 在宿主进程内求值
```

- stdio 子进程默认继承宿主环境，但名字含 `KEY/PASSWORD/SECRET/TOKEN`（不区分大小写）或 `DSH_` 前缀的会被清洗——**密钥类变量必须显式配置**
- `${VAR}` 字符串插值**不支持**（平台无展开逻辑，按字面量传）
- `process.env` 是 dsh 宿主进程的环境：shell 里改了变量要**重启 dsh web** 才会被求值拿到

## 测试要点

- `patch-file.test.ts`：`!!js` 节点往返无损、`.bak` 备份、原子写
- `server-config.test.ts`：层合成（insert + override + disabled）、校验矩阵、四个写操作——含 removeServer 的删除顺序回归用例
