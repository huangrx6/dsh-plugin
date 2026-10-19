# DSH Plugins（已归档）

> **状态：已归档，不再维护。**
> 完整源码保存在 Git tag **`archive/web-era-0.6.2`**，`main` 分支已清空。

---

## 这个仓库曾经是什么

DeepSeek Harness 还处于网页端时期（平台 `0.1.0-rc.6`）的 8 个插件，
形态为「宿主 + Web 客户端」双包：

| 插件 | 一句话 |
| --- | --- |
| `dsh-launcher` | 个人空间：侧栏 launcher + 浮层面板 + 全屏工作区 |
| `dsh-layout` | 布局与材质：圆角 / 背景 / 对话排版 |
| `dsh-skill-manager` | Skill 导入（URL / GitHub / zip）与详情查看 |
| `dsh-mcp-manager` | MCP 服务器全生命周期管理 |
| `dsh-remote-access` | Tailscale Serve 暴露 + 手机扫码 |
| `dsh-agent-rules` | 编辑 `~/.dsh/AGENTS.md` |
| `dsh-usage` | 订阅额度监控（GLM / MiniMax / Opencode） |
| `dsh-archive-manager` | 归档会话：列表 / 阅读 / 恢复 / 导出 |

## 为什么退役

**一、三个兼容性断裂**（桌面端 `0.2.1-rc.2`）

- `dsh-client-ui-primitives` 图标改名 `Icon*Outline14/16` → `Icon*OutlineRegular/Medium`，
  导致 `mcp-manager` / `skill-manager` / `remote-access` 面板渲染崩溃
- 客户端服务 `settingsScope` 被删除，`dsh-layout` 的 inject 无法满足 →
  条目永久 pending → 启动审计抛错 → 整个界面白屏
- `dsh-remote-access` 把 directory-picker 写成 `dependencies` 并锁 `^0.1.0-rc.6`，
  与内置 0.2.1 版本冲突

**二、四个插件的定位已被官方覆盖**

`dsh-client-ui-plugin-manager`（侧栏 Plugins 面板）、`dsh-client-ui-plugin-market`（Discover 市场）、
`dsh-client-ui-layout` + `dsh-client-ui-theme`、`dsh-session-log-export`、`dsh-agent-preset`
分别吃掉了 `launcher`、`layout`、`archive-manager`、`agent-rules` 的主要作用。
即使按 0.2.1 重写，做出来仍然和官方 UI 打架——**问题不是代码旧，是定位重复**。

**三、仍有价值但官方没有的**

`dsh-usage`（额度监控）、`dsh-remote-access`（Tailscale 扫码）、
`dsh-mcp-manager`（MCP 管理界面）。若将来重新开工，从这里起步。

## 取回代码

```bash
# 查看归档内容
git ls-tree -r --name-only archive/web-era-0.6.2

# 只恢复某个插件
git checkout archive/web-era-0.6.2 -- dsh-usage

# 整体恢复到新分支
git switch -c rebuild archive/web-era-0.6.2
```

`lib/`（构建产物）与 `node_modules/` 从未被 Git 跟踪，归档中不包含。
恢复后需在每个插件目录执行 `pnpm install && pnpm run build`。

归档 tag 的 commit message 记录了逐插件的断裂点细节；
`docs/`（架构、开发指南、设计令牌、0.2.1 兼容性核对）也一并保存在该 tag 中。

## License

MIT
