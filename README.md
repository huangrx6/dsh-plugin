# DSH Plugins

[DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh)（DSH）的 Web 端插件合集：给设置面板补上 **Skill 管理** 与 **MCP 服务器管理**，并对整体布局材质做统一收口。所有插件均为「宿主 + Web 客户端」双形态，挂载在 **设置 → 插件** 区内，随 DSH Web 一起加载，无需侵入平台代码。

| 包 | 一句话 | 入口 |
| --- | --- | --- |
| [`dsh-skill-manager`](./dsh-skill-manager) | 从 URL / GitHub / zip 导入 Skill，富详情页 + 文件树 + 多格式实时预览 | 设置 → 插件 → Skill 管理 |
| [`dsh-mcp-manager`](./dsh-mcp-manager) | MCP 服务器全生命周期管理：增删改、启停、测试连接、工具明细 | 设置 → 插件 → MCP 服务器 |
| [`dsh-layout`](./dsh-layout) | 布局 / 材质 / 背景的统一设置面（详见其[README](./dsh-layout/README.md)） | 设置 → 页面布局 |

- 深入了解插件如何与 DSH 平台协作：[docs/architecture.md](./docs/architecture.md)
- 源码解读：[docs/skill-manager.md](./docs/skill-manager.md) · [docs/mcp-manager.md](./docs/mcp-manager.md)

## 环境要求

- Node.js **≥ 24**
- pnpm ≥ 10
- DSH CLI（`@deepseek-ai/dsh`，`npx @deepseek-ai/dsh` 亦可）

## 安装

仓库内每个包独立安装、独立构建（无根 workspace）：

```bash
git clone git@github.com:huangrx6/dsh-plugin.git
cd dsh-plugin

# 按需构建你需要的插件（示例构建全部三个）
for pkg in dsh-layout dsh-skill-manager dsh-mcp-manager; do
  (cd "$pkg" && pnpm install && pnpm run build)
done
```

构建产物为 `lib/index.mjs`（宿主，Node ESM）与 `lib/client.js`（Web 端，浏览器 CJS）。`pnpm run check` = 类型检查 + 单测 + 构建全流程。

### 接入 DSH Profile

DSH 通过 profile 目录决定加载哪些插件。在你的 profile（如 `~/.dsh/profiles/web`）的 `package.json` 里把本仓库的包用 `link:` 挂进依赖，并加入 bundles：

```jsonc
{
  "name": "dsh-profile-web",
  "private": true,
  "dependencies": {
    "dsh-skill-manager": "link:/绝对路径/dsh-plugin/dsh-skill-manager",
    "dsh-mcp-manager": "link:/绝对路径/dsh-plugin/dsh-mcp-manager",
    "dsh-layout": "link:/绝对路径/dsh-plugin/dsh-layout"
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

然后在 profile 目录安装依赖并启动：

```bash
cd ~/.dsh/profiles/web
pnpm install
npx @deepseek-ai/dsh web --host 127.0.0.1 --port 3080
```

浏览器打开 <http://127.0.0.1:3080>，进入 **设置 → 插件** 即可看到两个新 tab。

> 热更规律：**Web 客户端**（`lib/client.js`）刷新页面即生效；**宿主侧**（`lib/index.mjs`）在进程启动时加载进内存，重新构建后需重启 `dsh web` 进程。MCP 的 `cordis.patch.yml` 写入由平台 HMR 即时应用，无需重启。

## 使用

### Skill 管理

- **导入**：点「导入 Skill」，支持三种来源——`SKILL.md` 直链（含 GitHub `/blob/` 链接自动转 raw）、GitHub 仓库或 `/tree/<ref>/<子目录>` 链接（自动取 zip 并定位到子目录）、任意 zip 直链 / 本地上传。导入目的地可选 `~/.dsh/skills`（推荐）或 `~/.agents/skills`
- **列表**：合并注册表快照与本地文件扫描，能看到被高层同名覆盖的「已遮蔽」条目和 frontmatter 校验失败的「无效」条目；支持搜索
- **详情**：hero 头（来源 / rank / 调用策略标签）、元数据 JSON 树、文件树；文件树下方的预览框默认渲染 SKILL.md 正文，点击树中任意文件即原地切换预览——
  - 代码 / 文本：Shiki 语法高亮（29 种常用语言，GitHub Light/Dark 双主题跟随应用主题）
  - Markdown：渲染 ⇆ 源码；CSV / TSV：表格 ⇆ 高亮源码
  - 图片 / PDF / 音视频：浏览器原生预览；未知二进制给出提示
- **删除**：仅限受管根内的 Skill，带确认对话框

### MCP 服务器

- **添加 / 编辑**：表单模式（stdio / streamable-http 分字段、env 与 headers 键值编辑、重连参数等高级项折叠收起）或 YAML 模式（保留 `!!js` 表达式方言）双模切换
- **环境变量**：stdio 子进程默认继承宿主环境（名字含 `KEY/PASSWORD/SECRET/TOKEN` 或 `DSH_` 前缀的除外）；引用宿主变量用 YAML 模式写 `!!js process.env.XXX`
- **启停 / 删除**：写入 `cordis.patch.yml`，平台 HMR 即时拉起 / 终止工具进程
- **测试连接**：一次性探测（initialize 握手 + 全量 tools/list 分页），返回耗时、服务器版本与工具清单（含参数 schema）；卡片上直接展开查看工具明细
- **状态**：聚合插件清单 fiber 阶段与 `ctx.tools` 注册态，卡片上有状态呼吸灯

## 开发

```bash
cd dsh-skill-manager   # 或 dsh-mcp-manager / dsh-layout
pnpm run typecheck     # tsc --noEmit（strict + exactOptionalPropertyTypes）
pnpm run test          # vitest（文件系统类测试全部走 DSH_HOME/DSH_AGENTS_HOME 临时目录沙箱）
pnpm run build         # 清理 → tsc 声明 → tsdown 双 bundle → wrap-client
pnpm run check         # 以上全流程
```

测试断言覆盖：frontmatter 方言与导入选根、路径逃逸防护与预览截断上限、`!!js` YAML 方言往返、补丁层合成与增删改顺序、CSV 解析、文件树投影等。

## 仓库结构

```
dsh-plugin/
├── dsh-skill-manager/   # Skill 导入 / 详情 / 文件预览
│   ├── src/             # 宿主侧逻辑（contracts、导入、文件读取）
│   ├── src/client/      # Web 侧（tab、详情、文件树、预览、Shiki 高亮）
│   └── tests/
├── dsh-mcp-manager/     # MCP 服务器管理
│   ├── src/             # patch 层读写、条目合成、连接探测
│   ├── src/client/      # Web 侧（列表卡片、双模式编辑器、测试面板）
│   └── tests/
├── dsh-layout/          # 布局 / 材质设置（独立 README）
└── docs/                # 架构与源码解读
```

## License

MIT
