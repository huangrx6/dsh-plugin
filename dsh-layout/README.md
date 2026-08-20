# DSH Layout · 页面布局与材质

`dsh-layout` 是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web 端的布局外观插件：用一张磨砂材质统一整个页面，并收口少量对话级排版选项。入口在 **设置 → 页面布局**。

核心原则：**默认即原生**——不做任何设置时，页面与 DSH 完全一致；**一个设置只做一件事**——开启/关闭任何一项，只影响它自己声明的范围，关掉即精确还原原生。

## 设置总览

设置页分三个页签：**全局 → 材质 → 对话**。每项默认保持原生；已修改的项带「已自定义」标记，可单独恢复（↶）或一键恢复全部默认。

### 全局（跨区域）

| 设置 | 说明 |
| --- | --- |
| 滚动条 | 显示（原生）/ 隐藏，作用于对话内容区与会话列表 |
| 界面圆角 | 原生 / 自定义 0–20px。只影响白名单内的稳定表面（按钮、输入框、弹窗、菜单等），头像、开关等圆形元素保持圆形；hero 卡片的虚线投放环（SVG mask）会同步换圆角 |
| 页面背景 | 原生 / 纯色 / 图片 / 视频。本地文件存入浏览器 IndexedDB（设置里只留 `idb:` 标记），远程 URL 直接引用；视频在标签页隐藏或系统"减少动态效果"时自动暂停 |
| 设置弹窗 | 自定义设置弹窗的宽（600–1280）/ 高（480–1080），留空为 DSH 原生 800×min(800, vh−48) |
| 页面边距 | 自动 / 自定义。自定义按 **桌面端 / 手机端** 两组分别设置 头部/内容区/输入区 × 左/右（留空用预设：桌面 头部 20/28、内容区与输入区 28/28；手机 0/8、8/8），与阅读宽度无关、任何时候生效 |
| 窄屏头部换行 | 开启（默认，防手机端标题行重叠换行）/ 关闭（原生） |
| 手机侧边栏 | 仅窄屏（<768px）：原生（DSH 自身布局）/ 全屏覆盖 / 悬浮。全屏覆盖：内容区独占整屏，侧边栏离屏收起，从屏幕左缘向右滑动或点左侧细条把手唤起，铺满全屏显示**展开后的真实内容**（打开时自动点击 DSH 自身的展开按钮，避免显示收起态的白雾）；悬浮：定宽（min(320px, 86vw)）悬浮抽屉盖在内容上方、不挤压内容列。打开后把手隐藏，用 **X 关闭按钮**（带放大点击区）关闭，也可选中会话或 Esc 关闭并自动收回到 rail 态；不再遮挡头部 |
| 桌面侧边栏 | 仅宽屏（≥768px）：原生（DSH 内联侧边栏，展开时挤压内容）/ 悬浮。悬浮：侧边栏变为定宽悬浮抽屉，内容列独占整行、**不随侧边栏开合挤压**（窄桌面窗口同样生效）；打开/关闭方式与窄屏一致（左缘把手唤起、点遮罩/选中会话/Esc 关闭）。与手机侧边栏互不影响，各自独立设置 |

### 材质（整页一张）

一张磨砂材质覆盖**侧边栏 + 内容区域**（含内容区头部），由一个开关、四个档位、三个滑杆描述：

| 档位 | 意境 | 不透明度 | 模糊 | 饱和度 |
| --- | --- | --- | --- | --- |
| 宣纸 | 素净纸面 · 隐约透光 | 95% | 8px | 102% |
| 蝉翼 | 薄如蝉翼 · 轻雾拂面 | 86% | 16px | 112% |
| 烟岚 | 山间雾霭 · 朦胧含黛 | 72% | 26px | 130% |
| 琉璃 | 琉璃映彩 · 深处见光 | 58% | 40px | 160% |

- 档位只是预设：点选卡片会写入三个数值，拖动**不透明度 / 模糊强度 / 饱和度**任一滑杆后即为自定义（卡片取消选中）
- 配合「全局 → 页面背景」的图片/视频使用时，磨砂会真实采样背后的画面；纯色页面表现为半透明色罩
- 无障碍兜底：系统开启"减少透明度"或浏览器不支持 `backdrop-filter` 时，自动退化为实色着色，可读性优先

### 对话（排版与信息）

| 设置 | 说明 |
| --- | --- |
| 阅读宽度 | 原生 / 充满窗口。**纯几何**：对话与输入框横向铺满，其余样式不变；消息、输入卡与头部对齐同一条 28px（手机 8px）边线 |
| 输入框行数 | 原生 / 2–6 行。独立于阅读宽度，任何时候生效，只改 textarea 最小高度 |
| 对话收笔 | 全屏滚动（原生）/ 收笔（止于输入区上方）。**纯几何**：输入区脱离滚动流，对话记录滚动到输入区上方即止，输入框外观（圆角、按钮、配色）保持原生；回到底部悬浮按钮按 DSH 原生锚点重新定位，屏幕位置不变 |
| 对话气泡 | 原生 / 磨砂 / 实色 / 无背景（只留描边） |
| 轨迹页背景 | 原生白 / 透出材质（轨迹页白色画布透明化，显示页面材质） |
| 轨迹页宽度 | 原生全宽 / 对齐头部 / 对齐阅读区 |
| 轨迹表留白 | 原生 / 移除（收笔已自行预留底部空间时，去掉原生 202px 尾巴） |
| 统计信息 | 原生 / 框内图标 / 框内短信息 / 框下方，附 8 项指标勾选：轮次、步骤、模型耗时、工具耗时、首 token、生成速度、缓存命中、Token 用量。新会话尚无回复（无任何数据）时入口自动隐藏，首条回复出现后恢复 |
| 繁忙时快捷提交（手机，无需设置） | agent 运行中，输入框工具行右缘出现「排队 / 插话」胶囊：DSH 原生在繁忙态把发送按钮换成「停止」，且「繁忙时 Enter 键行为」只管键盘——手机既没有可靠的 Enter（中文输入法 composing 会放行换行），也没有 Cmd+Enter 的反向手势。胶囊点击后在输入框上合成 Enter（普通 = 设置的偏好，Ctrl = 相反行为）走 DSH 自己的提交策略，实时跟随「繁忙时 Enter 键行为」的当前值；停止仍用原生按钮 |

## 设计说明

- **材质只画在两层 `::before` 上**（侧边栏列、内容列各一张）。宿主元素本身绝不携带 `backdrop-filter`——被滤镜的祖先会成为 fixed 后代的包含块，而 DSH 把设置弹窗渲染在侧边栏列里。`#root` 抬升为层叠上下文，负 z 材质层位于其背景之上、内容之下
- **全宽与收笔是几何开关**。样式表中不存在任何"因全宽/收笔而重绘输入卡、按钮、任务队列"的规则——每条规则都能对应到唯一一个设置（有契约测试锁定）
- **标记而非改名**：所有 DOM 适配走稳定地标（`data-slot` 锚点、`data-conversation-scroll`、`data-composer-card`、`[data-phase]` hero 判定）+ 插件自有 data 属性，绝不依赖 CSS-module 哈希类名；设置关闭即移除属性与变量，页面自动回到原生
- **宽度走原生变量**：阅读宽度与输入卡都通过 `--dsh-chat-content-width` / `--dsh-composer-card-max-width` 生效，对话列、输入卡、dock 始终同宽；hero（新会话欢迎卡）不受全宽影响，保持原生居中
- **触屏提示气泡**：DSH 的 tooltip 是 hover/focus 触发的，触屏设备点一下会粘住不消失。插件在 `(hover: none)` 的设备上直接隐藏所有 `role='tooltip'` 气泡——没有悬停能力的设备上提示本来就无法发挥作用
- **一个 MutationObserver**：全部 DOM pass（shell 标记、composer 标记、原生统计抑制）共享一个观察器，变更合并进单次 rAF 刷新；另有 250ms watchdog 兜底——隐藏的 webview 会冻结 rAF，没有兜底时标记会一直停滞
- **配置持久化**：以 profile 文件 `~/.dsh/dsh-layout.json` 为准（v3），浏览器存储重置不影响；旧版本配置的全局字段自动带入，其余归零。逐字段状态与恢复以"与原生默认的差异"为基准

## 安装

### 方式一：一行安装（推荐，从 GitHub 构建）

DSH 官方 CLI 的 `dsh plugin` 命令会转发给 profile 目录下的 pnpm：

```bash
dsh plugin --profile web add "github:huangrx6/dsh-plugin#main&path:/dsh-layout"
```

pnpm（≥ 9）会克隆仓库的对应子目录、安装依赖并执行 `prepare` 完成构建。`dsh plugin` 随后会自动对账 `dsh.profile.bundles`——包声明了 `dsh.bundle` 即自动加入加载层，**无需手改任何配置文件**。更新时重新执行上一条 add 命令（带完整 spec）。

> ⚠️ 请勿使用 `dsh plugin update`：它会把 spec 里的 `#main&path:` 截断，导致装进整个仓库而非 `dsh-layout` 子包。

### 方式二：固定版本（GitHub Release 预构建包，免本机构建）

仓库打了 `0.x.y` tag 后，GitHub Actions 会自动构建并把 npm tarball 挂到 [Releases](https://github.com/huangrx6/dsh-plugin/releases)。从 Release 页复制对应包的 `.tgz` 地址（路径带版本号、文件名不带）：

```bash
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/0.1.0/dsh-layout.tgz
```

### 方式三：本地开发（link 热迭代）

```bash
git clone git@github.com:huangrx6/dsh-plugin.git
cd dsh-plugin/dsh-layout && pnpm install && pnpm run build
```

profile（`~/.dsh/profiles/web/package.json`）：

```jsonc
{
  "dependencies": { "dsh-layout": "link:/绝对路径/dsh-plugin/dsh-layout" },
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-layout"] } }
}
```

然后 `cd ~/.dsh/profiles/web && pnpm install`，启动 `npx @deepseek-ai/dsh web`。

> 热更规律：Web 客户端（`lib/client.js`）重新构建后**刷新页面**即生效；宿主侧（`lib/index.mjs`）在进程启动时载入内存，重新构建后需**重启 `dsh web`**。

## 开发

```bash
pnpm install
pnpm run check   # typecheck + vitest + build
```

- `src/client/types.ts` — 设置模型 v3（全局/材质/对话）与默认值
- `src/client/store.ts` — 归一化与持久化（localStorage v3 key + profile 文件双写）
- `src/client/shell.ts` — 页面骨架标记 + 设置项到 `<html>` 数据开关/变量 的渲染
- `src/client/workbench.ts` — composer 结构标记、座位高度与滚动条槽实测
- `src/client/styles.ts` — 全部覆盖样式（每条规则归属唯一设置）
- `src/client/dom-sync.ts` — 共享 MutationObserver 批处理
- `tests/` — 48 项测试：CSS 契约锁定（一个设置一个关注点）、shell/workbench 标记、归一化、统计视图

## License

MIT
