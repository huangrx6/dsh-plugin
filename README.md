# DSH Plugins

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web 端插件合集。所有插件均为「宿主 + Web 客户端」双形态，随 DSH Web 一起加载，无需侵入平台代码。

## 插件导航

| 插件 | 一句话 | 详细文档 |
| --- | --- | --- |
| [`dsh-layout`](./dsh-layout) | 页面布局与材质：一张磨砂材质覆盖整页，全局（圆角/背景/弹窗/边距）+ 对话排版（阅读宽度/收笔/气泡/轨迹/统计） | **[→ dsh-layout/README.md](./dsh-layout/README.md)** |
| [`dsh-skill-manager`](./dsh-skill-manager) | Skill 导入（URL / GitHub / zip）与详情查看：来源层级、frontmatter 元数据、文件树、多格式实时预览 | **[→ dsh-skill-manager/README.md](./dsh-skill-manager/README.md)** |
| [`dsh-mcp-manager`](./dsh-mcp-manager) | MCP 服务器全生命周期管理：增删改、启停、测试连接、工具明细 | **[→ dsh-mcp-manager/README.md](./dsh-mcp-manager/README.md)** |

深入阅读：

- 插件如何与 DSH 平台协作：[docs/architecture.md](./docs/architecture.md)
- 源码解读：[docs/skill-manager.md](./docs/skill-manager.md) · [docs/mcp-manager.md](./docs/mcp-manager.md)

每个插件的**功能明细、使用说明、设置项对照、架构与开发指南**都在各自的 README 里，本页只做概览与导航。

## 安装

### 一行安装（推荐）

DSH 官方 CLI 自带 `dsh plugin` 命令（等价于在 profile 目录执行 pnpm）。三个插件任选：

```bash
dsh plugin --profile web add "github:huangrx6/dsh-plugin#main&path:/dsh-layout"
dsh plugin --profile web add "github:huangrx6/dsh-plugin#main&path:/dsh-skill-manager"
dsh plugin --profile web add "github:huangrx6/dsh-plugin#main&path:/dsh-mcp-manager"
```

pnpm（≥ 9）会克隆本仓库的对应子目录、安装依赖并执行 `prepare` 完成构建。`dsh plugin` 随后会自动对账 `dsh.profile.bundles`——包声明了 `dsh.bundle` 即自动加入加载层，**无需手改任何配置文件**。更新时重新执行上面的 add 命令（带完整 spec）。

> ⚠️ 请勿使用 `dsh plugin update`：它会把 spec 里的 `#main&path:` 截断，导致装进整个仓库而非对应子包。

```bash
dsh plugin --profile web add "github:huangrx6/dsh-plugin#main&path:/dsh-layout"
```

没有本地 `dsh` 命令时用 `npx @deepseek-ai/dsh plugin --profile web add ...`。

### 固定版本（Release 预构建包，免本机构建）

仓库打 `v*` tag 后，GitHub Actions 自动构建并把 npm tarball 挂到 [Releases](https://github.com/huangrx6/dsh-plugin/releases)：

```bash
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/<tag>/dsh-layout-<version>.tgz
```

### 本地开发（clone + link）

```bash
git clone git@github.com:huangrx6/dsh-plugin.git
cd dsh-plugin
for pkg in dsh-layout dsh-skill-manager dsh-mcp-manager; do
  (cd "$pkg" && pnpm install && pnpm run build)
done
```

在 profile（如 `~/.dsh/profiles/web`）的 `package.json` 里用 `link:` 挂载，并加入 bundles：

```jsonc
{
  "name": "dsh-profile-web",
  "private": true,
  "dependencies": {
    "dsh-layout": "link:/绝对路径/dsh-plugin/dsh-layout",
    "dsh-skill-manager": "link:/绝对路径/dsh-plugin/dsh-skill-manager",
    "dsh-mcp-manager": "link:/绝对路径/dsh-plugin/dsh-mcp-manager"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-layout",
        "dsh-skill-manager",
        "dsh-mcp-manager"
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
├── dsh-layout/          # 布局 / 材质 / 背景设置（详见其 README）
├── dsh-skill-manager/   # Skill 导入 / 详情 / 文件预览（详见其 README）
├── dsh-mcp-manager/     # MCP 服务器管理（详见其 README）
└── docs/                # 架构与源码解读
```

仓库内每个包独立安装、独立构建（无根 workspace）；`pnpm run check` = 类型检查 + 单测 + 构建全流程。

## License

MIT
