# DSH Skill Manager

`dsh-skill-manager` 是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 端的 Skill 管理插件：不提供从零新建，专注两件事——**导入**（URL / GitHub 仓库 / zip / 本地上传）与**清晰的详情查看**（来源层级、调用策略、frontmatter 元数据、渲染后的 Markdown 正文、资源文件清单）。入口在 **设置 → 插件 → Skill 管理**。

## 功能

- **列表**：合并注册表快照（有效 skill，含项目 / 自定义 / 内置 / 运行时来源）与本地文件扫描（能发现被同名高层覆盖的"已遮蔽"条目、frontmatter 校验失败的"无效"条目），支持搜索。
- **详情页**：描述 / 使用时机 / 来源与 rank / 提供者 / 路径 / 元数据（JSON 树）/ 文件清单（含大小）/ 渲染后的 Markdown 正文（GFM、代码高亮，来自平台 `MarkdownText`）。
- **文件预览**：点击文件树中的任意文件即可在下方实时预览——
  - 代码 / 文本：Shiki 语法高亮（VS Code 同款 TextMate 引擎，细粒度打包 29 种常用语言，纯 JS 引擎无 wasm），跟随应用明暗主题（GitHub Light / Dark 双主题一次编译）
  - Markdown：渲染视图 ⇆ 源码切换；CSV / TSV：表格视图 ⇆ 高亮源码切换（自研 RFC-4180 解析，含引号转义与行数上限）
  - 图片（png / jpg / gif / webp / svg / bmp / ico / avif）：等比预览 + 新标签页打开；PDF：内嵌原生查看器；音频 / 视频：原生控件
  - 未知扩展名按 NUL 字节嗅探兜底为文本或二进制；文本上限 256 KB（超出自动截断并标记），媒体上限 8 MB
  - 安全：读取端点按 skill 名重新解析目录，拒绝 `..`、绝对路径与目录逃逸；单文件 skill 仅可读自身
- **导入**：
  - SKILL.md 直链（`raw.githubusercontent.com` 等）
  - GitHub 仓库链接（默认分支 HEAD zip）、`/tree/<ref>/<子目录>` 链接、`/blob/<ref>/x.md` 文件链接
  - 任意 zip 直链：自动选取最浅的 `SKILL.md` 所在目录为 skill 根，保留其资源文件；并列候选时报错并列出
  - 本地上传 `.md` / `.zip`
  - 目标目录可选 `~/.dsh/skills`（默认）或 `~/.agents/skills`；重名拒绝；临时目录 + 原子 rename，失败不留半成品；zip 内 `..`、绝对路径等危险条目跳过并提示
- **删除**：仅限受管根（`~/.dsh/skills`、`~/.agents/skills`）内的文件；bundle 形式连目录一起删。
- 导入 / 删除后由平台文件监听即时生效，无需重启。

## 架构

- 宿主侧（`src/index.ts`）：注入 `skills` + `connection`，在 `/dsh-skill-manager` 通道（loopback authority）上提供 `list` / `detail` / `import` / `delete` / `file`（按需读取预览内容）五个 RPC。
- `src/skill-files.ts`：镜像官方 `dsh-skill-filesystem` 的发现规则（一层深、`<name>/SKILL.md` 或 `<name>.md`）与 frontmatter 方言（kebab-case `name`、必填 `description`、`disable-model-invocation` / `user-invocable`、拒绝旧驼峰键）。
- `src/import-source.ts`：URL 归一化（GitHub → codeload zip / raw md）、zip 解包选根（fflate）、大小与超时限制。
- Web 侧（`src/client/`）：向 `settings.plugins.tab` 注册 `skills` 页，zh/en 双语，样式使用 `--dsw-alias-*` 设计令牌。

## 安装

### 方式一：一行安装（推荐，从 GitHub 构建）

DSH 官方 CLI 的 `dsh plugin` 命令会转发给 profile 目录下的 pnpm：

```bash
dsh plugin --profile web add "github:huangrx6/dsh-plugin#main&path:/dsh-skill-manager"
```

pnpm（≥ 9）会克隆仓库的对应子目录、安装依赖并执行 `prepare` 完成构建。`dsh plugin` 随后会自动对账 `dsh.profile.bundles`——包声明了 `dsh.bundle` 即自动加入加载层，**无需手改任何配置文件**。更新时执行 `dsh plugin --profile web update dsh-skill-manager`。

### 方式二：固定版本（GitHub Release 预构建包，免本机构建）

仓库打了 `v*` tag 后，GitHub Actions 会自动构建并把 npm tarball 挂到 [Releases](https://github.com/huangrx6/dsh-plugin/releases)。从 Release 页复制对应包的 `.tgz` 地址：

```bash
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/<tag>/dsh-skill-manager-<version>.tgz
```


### 方式三：本地开发（link 热迭代）

```bash
git clone git@github.com:huangrx6/dsh-plugin.git
cd dsh-plugin/dsh-skill-manager && pnpm install && pnpm run build
```

profile（`~/.dsh/profiles/web/package.json`）：

```json
{
  "dependencies": { "dsh-skill-manager": "link:/绝对路径/dsh-plugin/dsh-skill-manager" },
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-skill-manager"] } }
}
```

然后 `cd ~/.dsh/profiles/web && pnpm install` 并重启 DSH。

## 开发

```bash
pnpm install
pnpm run check   # typecheck + vitest + build
```

