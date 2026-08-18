# DSH Plugins

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web 端插件合集。所有插件均为「宿主 + Web 客户端」双形态，随 DSH Web 一起加载，无需侵入平台代码。

## 插件导航

| 插件 | 一句话 | 详细文档 |
| --- | --- | --- |
| [`dsh-launcher`](./dsh-launcher) | 个人空间：侧栏底部 launcher 按钮 + 浮层面板 + 全屏工作区（覆盖视图），集成 Skill / MCP 市场，左菜单 + 右侧卡片化内容，H5 自适应 | **[→ dsh-launcher/README.md](./dsh-launcher/README.md)** |
| [`dsh-layout`](./dsh-layout) | 页面布局与材质：一张磨砂材质覆盖整页，全局（圆角/背景/弹窗/边距）+ 对话排版（阅读宽度/收笔/气泡/轨迹/统计） | **[→ dsh-layout/README.md](./dsh-layout/README.md)** |
| [`dsh-skill-manager`](./dsh-skill-manager) | Skill 导入（URL / GitHub / zip）与详情查看，连同 launcher 内的 Skill 市场（多源 / 模糊筛选 / 一键安装） | **[→ dsh-skill-manager/README.md](./dsh-skill-manager/README.md)** |
| [`dsh-mcp-manager`](./dsh-mcp-manager) | MCP 服务器全生命周期管理：增删改、启停、测试连接、工具明细，连同 launcher 内的 MCP 市场 | **[→ dsh-mcp-manager/README.md](./dsh-mcp-manager/README.md)** |
| [`dsh-remote-access`](./dsh-remote-access) | 远程访问：Tailscale Serve 把本机 dsh 暴露为 HTTPS 地址 + 切换官方 browse 目录选择器，手机扫码即用 | **[→ dsh-remote-access/README.md](./dsh-remote-access/README.md)** |
| [`dsh-archive-manager`](./dsh-archive-manager) | 归档会话管理：列表、阅读消息、恢复工作区、导出 zip（官方 session.export）或 Markdown | **[→ dsh-archive-manager/README.md](./dsh-archive-manager/README.md)** |

深入阅读：

- 插件如何与 DSH 平台协作：[docs/architecture.md](./docs/architecture.md)
- 源码解读：[docs/skill-manager.md](./docs/skill-manager.md) · [docs/mcp-manager.md](./docs/mcp-manager.md)

每个插件的**功能明细、使用说明、设置项对照、架构与开发指南**都在各自的 README 里，本页只做概览与导航。

## 安装

所有插件通过 GitHub Release 预构建包安装（已含 `lib/` 产物，无需本机构建）。**用版本化 URL**（含版本号）——pnpm 按 URL 缓存，版本号每次不同所以永不撞 `TARBALL_INTEGRITY`（这是 `latest` 固定链接升级时的已知坑）。<version> 换成 [Releases 页](https://github.com/huangrx6/dsh-plugin/releases) 最新 tag 号：

```bash
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/<version>/dsh-launcher-0.1.0.tgz
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/<version>/dsh-layout-0.1.0.tgz
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/<version>/dsh-skill-manager-0.1.0.tgz
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/<version>/dsh-mcp-manager-0.1.0.tgz
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/<version>/dsh-remote-access-0.1.0.tgz
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/<version>/dsh-archive-manager-0.1.0.tgz
```

例如当前最新 `v0.6.2`：把 `<version>` 换为 `v0.6.2`。**升级 = 换新版本号重跑**（URL 变了，pnpm 缓存自动失效）。装完重启 dsh（或 `/reload`）。

> `releases/latest/download/` 固定链接（如 `.../dsh-remote-access.tgz`）仅供**一次性试用**：内容每次发布都会变而 URL 不变，pnpm 缓存 integrity 会冲突（`ERR_PNPM_TARBALL_INTEGRITY`）。升级请始终用版本化 URL。

没有本地 `dsh` 命令时用 `npx @deepseek-ai/dsh plugin --profile web add ...`。

### 本地开发（clone + link）

```bash
git clone git@github.com:huangrx6/dsh-plugin.git
cd dsh-plugin
for pkg in dsh-launcher dsh-layout dsh-skill-manager dsh-mcp-manager dsh-remote-access; do
  (cd "$pkg" && pnpm install && pnpm run build)
done
```

在 profile（如 `~/.dsh/profiles/web`）的 `package.json` 里用 `link:` 挂载，并加入 bundles：

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

然后 `cd ~/.dsh/profiles/web && pnpm install`，启动 `npx @deepseek-ai/dsh web --host 127.0.0.1 --port 3080`。

> 热更规律：**Web 客户端**（`lib/client.js`）重新构建后刷新页面即生效；**宿主侧**（`lib/index.mjs`）在进程启动时载入内存，需重启 `dsh web`。MCP 的 `cordis.patch.yml` 写入由平台 HMR 即时应用，无需重启。

## 环境要求

- Node.js ≥ 24
- pnpm ≥ 10
- DSH CLI（`@deepseek-ai/dsh`，可 `npx` 调用）

## 仓库结构

```
dsh-plugin/
├── dsh-launcher/        # 个人空间：launcher 面板 + 全屏工作区 + 市场（详见其 README）
├── dsh-layout/          # 布局 / 材质 / 背景设置（详见其 README）
├── dsh-skill-manager/   # Skill 导入 / 详情 / 文件预览 + Skill 市场（详见其 README）
├── dsh-mcp-manager/     # MCP 服务器管理 + MCP 市场（详见其 README）
├── dsh-remote-access/   # 远程访问：Tailscale Serve + browse picker（详见其 README）
├── dsh-archive-manager/ # 归档会话：列表 / 阅读 / 恢复 / 导出（详见其 README）
└── docs/                # 架构与源码解读
```

仓库内每个包独立安装、独立构建（无根 workspace）；`pnpm run check` = 类型检查 + 单测 + 构建全流程。

## License

MIT
