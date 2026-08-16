# dsh-skill-manager 源码解读

包路径：[`../dsh-skill-manager`](../dsh-skill-manager)。前置阅读：[architecture.md](./architecture.md)。

功能一句话：不做从零新建，专注 **导入**（URL / GitHub / zip / 上传）与 **看清**（富详情 + 文件树 + 多格式实时预览）。宿主与 Web 端通过 `/dsh-skill-manager` 通道的 5 个 RPC 端点协作：`list` / `detail` / `import` / `delete` / `file`。

## 目录地图

```
src/
├── contracts.ts        # 全部线类型 + 通道名（双端单一事实源）
├── skill-files.ts      # 受管根扫描、frontmatter 方言、导入落盘、删除、文件清单
├── import-source.ts    # URL 归一化、zip 解包选根、字节与大小限制
├── file-content.ts     # 预览读取：分类、截断、路径防护
└── index.ts            # Cordis 宿主：RPC 端点装配
src/client/
├── index.ts            # client 插件入口：slots 注册 + 样式注入
├── SkillManagerTab.tsx # 列表页（搜索、卡片、空态、骨架屏）
├── SkillDetailView.tsx # 详情页装配（hero / 元数据 / 文件树+预览一体框）
├── SkillFileTree.tsx   # react-complex-tree 封装（选中联动）
├── SkillFilePreview.tsx# 多格式预览组件
├── file-tree.ts        # 纯函数：扁平路径 → 树投影（无 React 依赖，可单测）
├── highlight.ts        # Shiki 细粒度高亮服务（单例 + 缓存）
├── csv.ts              # 纯函数：RFC-4180 解析（可单测）
├── theme.ts            # 明暗主题探测 hook
├── api.ts / locales.ts / styles.ts
tests/                  # 4 个文件 42 个用例
```

## 宿主侧

### skill-files.ts —— 平台方言的镜像

这个文件的价值在于**不依赖平台内部实现**地复刻官方 `dsh-skill-filesystem` 的规则，测试也因此可以对临时目录跑：

- `parseSkillFile`：frontmatter YAML 解析。拒绝旧驼峰键（`userInvocable` 之类）、把 `true/false/yes/no` 等布尔词归一化。校验失败抛错，上层据此把条目标记为「无效」
- `scanRoot` / `scanManagedRoots`：一层深扫描 `<name>/SKILL.md` 与 `<name>.md`，附上 rank（`~/.dsh/skills` 400、`~/.agents/skills` 500），环境变量 `DSH_HOME` / `DSH_AGENTS_HOME` 可重定向——单测沙箱的入口
- `writeImportedSkill`：先写 `.name.import-<pid>` 暂存目录再原子 rename；资源名清洗；与现存 skill 重名报错
- `deleteManagedSkill`：只允许删受管根内的路径（守卫在函数内部，UI 层的 managed 标记只是提示）
- `listSkillFiles`：递归列文件（深度 5、上限 400 条），产出 `SkillFileStat[]`（相对路径 + 大小 + 是否目录）

### import-source.ts —— 三种 URL 形态归一

`resolveSourceUrl` 把用户输入折叠成「下载什么 + zip 内取哪段」：

| 输入 | 解析 |
| --- | --- |
| `github.com/{o}/{r}` | codeload zip / HEAD |
| `github.com/{o}/{r}/tree/{ref}/{path}` | zip + 子路径 |
| `github.com/{o}/{r}/blob/{ref}/x.md` | raw 单文件 |
| 其他 | 原样 fetch（要求 Content-Type 可控或扩展名可辨） |

`materialFromZip`（fflate）：跳过目录项；在**最浅层**找 `SKILL.md` 定 skill 根；多候选并列时报错并列出候选让用户换更精确的 URL；`/tree/` 子路径在剥掉外层包装目录后生效。限额：zip 64MB、单文件 8MB、30s 超时。

### file-content.ts —— 预览的读侧

`readSkillFile(root, file)` 是纯函数（易测）：

1. **路径防护**：拒绝绝对路径、反斜杠、`\0`、空段、`.` / `..` 段；`resolve` 后必须仍以 `root + sep` 开头
2. **分类**：扩展名表 → shiki 语言 id（py→python、yml→yaml…共 60+ 映射）；png/jpg/svg… → image（svg 归 image 但按文本渲染由前端决定）；pdf / 音视频各归其类；**未知扩展名读前 1KB 嗅探**，含 `\0` 判二进制，否则按纯文本
3. **限额**：文本 256KB 截断（`truncated: true`），媒体 8MB 拒绝（错误信息带上限）
4. 特判：`Dockerfile` / `Makefile` 按文件名（非扩展名）识别

### index.ts —— 端点装配

`skillDirectoryOf(ctx, name)` 是 `file` 端点的安全核心：**每次读取都按 skill 名重新解析目录**（先查注册表 `ctx.skills.get`，再退化到本地扫描），绝不信前端传来的路径；扁平单文件 skill 只允许读它自己那一个文件。`list` 端点做注册表快照与本地扫描的**合并**——快照赢家的 `resourceBase` 与扫描条目对齐后，剩下的扫描条目就是「已遮蔽」或「无效」，全部展示。

## Web 侧

### 列表与详情

`SkillManagerTab`：工具栏（搜索 + 图标刷新）→ 标题行（计数 chip + 主操作「导入」）→ 骨架屏 / 空态 / 卡片列表。卡片带来源标签、调用策略标签、遮蔽 / 无效的着色变体。

`SkillDetailView` 的装配顺序：返回头 → hero（图标砖 + 名称 + 标签组）→ 遮蔽 / 无效提示 → 描述与元数据卡 → **文件卡**。文件卡是本文重点：

```
文件 · N 个文件
├── SkillFileTree          （选中态高亮）
└── 预览框（唯一一个）
     默认 = SKILL.md 渲染正文（frontmatter 已剥）
     点树中任意文件 → 原地替换为该文件预览
```

实现细节：详情加载完成后 `selectedFile` 初始化为 `SKILL.md`（不存在则取首个文件）；**只有用户点击**才触发平滑滚动（`scrollRequested` ref 区分初始态）；换 skill 时树以 `key` 强制重挂载，避免选中态串台。

### 文件树：为什么是 react-complex-tree

选型对比过 react-arborist（拖 react-dnd / redux / react-window 一串依赖）与手写递归（可达性、键盘导航成本高）。react-complex-tree 零运行时依赖、WAI-ARIA 树语义、`renderItem` 完全自定义：

- `file-tree.ts` 的 `buildTreeItems` 把扁平相对路径投影成树：索引即**完整相对路径**，`ensureFolder` 补齐缺失中间目录，目录排前 + 字母序。纯函数所以 `skill-file-tree.test.ts` 直接断言（注意 children 是全路径索引）
- 树组件只加两个口子：`selectedFile`（初始选中）与 `onSelectFile`（`onSelectItems` 回调里过滤掉文件夹和 root 才上报）

### 预览：SkillFilePreview

一个组件吃下所有格式，按 `kind` 分发：

| kind | 渲染 | 备注 |
| --- | --- | --- |
| text + markdown | `MarkdownText`（平台组件）⇆ Shiki 源码 | 渲染模式先 `stripFrontmatter` |
| text + csv/tsv | 表格 ⇆ Shiki 源码 | 默认表格视图；`csv.ts` 解析（引号转义、500 行上限、超宽单元格截断） |
| text 其他 | Shiki 高亮 | 未知语言自动落回纯文本 |
| image / pdf / 音视频 | blob URL + 原生标签 | `useEffect` 里创建、清理函数里 `revokeObjectURL` |
| binary | 友好空态 + 大小 | — |

头部栏：按 kind 着色的图标砖 + 文件名（等宽字体）+ chips（格式 / 大小 / 截断徽标 / 相对路径）+ 视图切换 seg + 复制按钮（文本类）+ 新标签页打开（图片 / PDF）。

`highlight.ts` 的工程取舍：

- **细粒度导入**：`shiki/core` + 29 个 `shiki/langs/*.mjs` 语法模块 + 两个主题，而非 720 语言全量 bundle
- **纯 JS 引擎** `createJavaScriptRegexEngine`：免 wasm，浏览器 ModuleLoader 环境零麻烦
- **双主题一次编译**：`themes: { light: 'github-light', dark: 'github-dark' }` 产出 `--shiki-dark` CSS 变量；切主题只是给容器换 class（`.dshm-previewDark`），**不重新高亮**
- 单例 Promise + 32 条 LRU 缓存；未注册语言 `getLoadedLanguages()` 守卫落回 `text`

`theme.ts`：应用主题独立于操作系统，所以读 `--dsw-alias-bg-layer-1` 的计算值算亮度；预览挂载期间 1s 轻量轮询兜底，切换后 1s 内着色自动翻面。

## 测试要点

`tests/` 全部无网络、无真实家目录：

- `skill-files.test.ts`：`DSH_HOME` / `DSH_AGENTS_HOME` 指向 `mkdtemp` 目录的沙箱模式（beforeEach 建、afterEach 删并还原环境变量）——**任何测试都不许碰真实 `~/.dsh`**
- `import-source.test.ts`：zip 选根、并列候选报错、子路径、大小上限（fflate 传参要用 `strToU8`，直接传字符串会栈溢出）
- `file-content.test.ts`：分类矩阵（python/png/pdf/svg/Dockerfile/嗅探）、截断、路径逃逸全排列拒绝
- `skill-file-tree.test.ts` / csv 用例：纯函数断言
