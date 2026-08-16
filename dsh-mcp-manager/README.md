# DSH MCP Manager

`dsh-mcp-manager` 是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 端的 MCP 服务器管理插件：把"手编 `cordis.patch.yml` + 重启"的流程换成图形界面——状态总览、增删改、启停、工具明细、连接测试。入口在 **设置 → 插件 → MCP 服务器**。

## 功能

- **状态总览**：每台服务器一张卡片——传输方式、命令 / URL 摘要、Cordis fiber 状态点（运行中 / 失败 / 加载中…，来自 plugin inventory）、已注册工具数、启用 / 停用标签。
- **增删改**：双传输表单（stdio：command / args / 环境变量 / cwd；streamable-http：URL / 请求头）+ 高级项（调用超时、failOnStartupError、自动重连）。写入 profile 层 `cordis.patch.yml`（不可用时回落 home 层），`!!js` 表达式值以只读形式保留、原样回写；另有 YAML 源码模式，直接编辑该服务器的 config。写入前自动留 `.bak` 备份，原子替换。
- **启停**：切换条目 `disabled`；外来条目（非本层插入）只允许停用不允许删除。
- **工具明细**：展开卡片查看每台服务器注册的工具（`mcp__<server>__<tool>` 公开名 + 描述 + 参数 JSON Schema 树）。
- **测试连接**：保存前可让宿主真实拉起（stdio）或连接（http）该服务器，完成 initialize + 分页 tools/list，展示服务端版本、耗时、完整工具清单，随后立即关闭，不注册任何工具。
- **热生效**：patch 文件由 Cordis HMR 监听，保存后自动断开重连，无需重启进程（README 与 `dsh-mcp-client` 行为一致）。

## 架构

- 宿主侧（`src/index.ts`）：注入 `connection` + `tools` + `loader`，在 `/dsh-mcp-manager` 通道（loopback authority）上提供 `list` / `save` / `toggle` / `delete` / `test` / `parseYaml` / `dumpYaml`。
- `src/patch-file.ts`：entry-list YAML 方言的读写——与 `@deepseek-ai/cordis-plugin-include` 相同的 `JSON_SCHEMA + !!js` 标签（js-yaml 4），表达式节点 `{__jsExpr}` 完整往返。
- `src/server-config.ts`：patch → 服务器记录的投影（insert 条目 + 跨层 id-target 覆盖，`config` 整体替换语义与 `applyEntryPatches` 一致）、字段校验（serverName `^[A-Za-z0-9_-]{1,32}$`、按传输的必填项）、编辑操作。
- `src/test-connection.ts`：`@modelcontextprotocol/sdk` 一次性探针。
- Web 侧（`src/client/`）：向 `settings.plugins.tab` 注册 `mcp` 页，zh/en 双语；写入后轮询数次让状态落定。

## 开发

```bash
pnpm install
pnpm run check   # typecheck + vitest + build
```

链接进 DSH profile（profile 的 `package.json`）：

```json
{
  "dependencies": { "dsh-mcp-manager": "link:/path/to/dsh-mcp-manager" },
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-mcp-manager"] } }
}
```

然后 `pnpm install` 并重启 DSH。
