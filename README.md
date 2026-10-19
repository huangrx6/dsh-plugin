# DSH Plugins（已归档）

> **状态：已归档，不再维护。**
> `main` 分支上的 8 个插件已全部移除，完整代码保存在 Git tag **`archive/web-era-0.6.2`** 中。

---

## 发生了什么

这个仓库是 DeepSeek Harness 还处于网页端时期（平台 `0.1.0-rc.6`）开发的 8 个插件，
形态为「宿主 + Web 客户端」双包。桌面端 `0.2.1-rc.2` 发布后，插件体系本身没有变，
但发生了两件事，使它们不再值得继续维护。

### 一、三个兼容性断裂

| # | 问题 | 影响 |
| --- | --- | --- |
| 1 | `dsh-client-ui-primitives` 图标改名：`Icon*Outline14/16` → `Icon*OutlineRegular/Medium` | `dsh-mcp-manager`、`dsh-skill-manager`、`dsh-remote-access` 面板渲染崩溃 |
| 2 | 客户端服务 `settingsScope` 被删除 | `dsh-layout` 的 `inject` 无法满足 → 条目永久 pending → 触发启动审计抛错，整个界面白屏 |
| 3 | `dsh-remote-access` 把 directory-picker 写成 `dependencies` 并锁 `^0.1.0-rc.6` | 与内置的 0.2.1 版本冲突，装不上 |

完整核对过程与证据：[docs/desktop-0.2.1-compat.md](./docs/desktop-0.2.1-compat.md)。

### 二、四个插件的定位被官方吃掉

官方 0.2.1 已内置的能力：

| 官方包 | 覆盖了谁 |
| --- | --- |
| `dsh-client-ui-plugin-manager`（侧栏 Plugins 面板：装/启/停/重试）<br>`dsh-client-ui-plugin-market`（Discover 市场） | `dsh-launcher`（个人空间 + 市场） |
| `dsh-client-ui-layout`（三栏 AppFrame）<br>`dsh-client-ui-theme`（light/dark/system） | `dsh-layout`（布局 / 材质 / 主题） |
| `dsh-session-log-export`（会话导出） | `dsh-archive-manager`（导出部分） |
| `dsh-agent-preset` + `dsh-client-ui-agent-preset`<br>以及 `~/.dsh/AGENTS.md` 注入机制 | `dsh-agent-rules`（本质只是该文件的编辑器） |

结论：即使按 0.2.1 重写这 4 个，做出来仍然和官方 UI 打架——**问题不是代码旧，是定位重复**。

### 三、仍然有价值的部分

这 3 个能力官方确实没有，若将来重新开工，从这里起步：

- **`dsh-usage`** —— 订阅额度监控（GLM / MiniMax / Opencode）。全包搜 `quota` 0 命中。
- **`dsh-remote-access`** —— Tailscale Serve 暴露 + 手机扫码。全包搜 `tailscale` 0 命中。
- **`dsh-mcp-manager`** —— MCP 服务器增删改 + 连接测试 + 工具明细。官方只有 `dsh-mcp-client` 连接桥，没有管理 UI。

---

## 取回代码

```bash
# 查看归档内容
git ls-tree -r --name-only archive/web-era-0.6.2

# 把某个插件恢复到工作区
git checkout archive/web-era-0.6.2 -- dsh-usage

# 或者整体恢复到一个新分支
git switch -c rebuild archive/web-era-0.6.2
```

注意：`lib/`（构建产物）与 `node_modules/` 从未被 Git 跟踪，归档中**不包含**。
恢复后需在每个插件目录重新构建：

```bash
cd dsh-usage && pnpm install && pnpm run build
```

---

## 仓库中还剩下什么

`main` 只保留文档，作为重新开发时的参考：

| 文件 | 说明 |
| --- | --- |
| [docs/desktop-0.2.1-compat.md](./docs/desktop-0.2.1-compat.md) | **桌面端 0.2.1-rc.2 的 API 面核对**：静态模块表、服务清单、已删除项、复核脚本。新插件开发前必读 |
| [docs/architecture.md](./docs/architecture.md) | DSH 插件架构（宿主 + Web 客户端双形态、cordis 补丁层、RPC 通道） |
| [docs/development-guide.md](./docs/development-guide.md) | 工程开发指南（环境、工作流、样式规范、发版） |
| [docs/design-tokens.md](./docs/design-tokens.md) | 从 8 个插件提取的统一设计令牌 |
| [docs/ui-conventions.md](./docs/ui-conventions.md) | PC / H5 两层 UI 约定 |
| [docs/mcp-manager.md](./docs/mcp-manager.md) | ⚠️ 旧插件源码解读，路径已失效（源码见归档 tag） |
| [docs/skill-manager.md](./docs/skill-manager.md) | ⚠️ 同上 |

`docs/images/` 是旧插件的截图素材，保留仅作历史记录。

---

## License

MIT
