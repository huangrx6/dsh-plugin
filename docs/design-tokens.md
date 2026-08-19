# DSH 插件设计令牌 (Design Tokens)

> 本文档从 8 个插件的 `styles.ts` 中**实际提取**并统一的设计令牌。
> 原始色值由 dsh-layout 的 `--dsw-alias-*` 主题变量提供，
> 本文档只定义**配方**（color-mix 百分比），不定义色值本身。
> 圆角通过 dsh-layout 的 `--dsh-layout-radius-user` / `--dsh-layout-radius-user-lg` 桥接。

---

## 1. 间距系统 (Spacing)

从现有代码中提取的 5 级间距梯度。所有值为 px。

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-space-xs` | 2px | 2px | 发丝间距：标签内 gap、列表项 margin、指示条宽度 |
| `--dsh-space-sm` | 4px | 4px | 极小间距：紧凑 gap、tag 间距、行间分隔 |
| `--dsh-space-md` | 6px | 6px | 小间距：分组内衬（group padding）、行间 gap、按钮 gap |
| `--dsh-space-lg` | 8px | 8px | 标准间距：工具栏 gap、行 padding、容器 padding |
| `--dsh-space-xl` | 10px | 10px | 中间距：行间 gap、图标与文字 gap、面板内 gap |
| `--dsh-space-2xl` | 12px | 12px | 区块间距：卡片 gap、分组间 gap、section 间距 |
| `--dsh-space-3xl` | 14px | 14px | 大间距：弹窗 body padding、编辑器 padding |
| `--dsh-space-4xl` | 16px | 12px | 内容区 padding：弹窗 padding、空态 padding |
| `--dsh-space-5xl` | 18px | 14px | 卡片内 padding（PC 宽松，H5 收窄） |
| `--dsh-space-6xl` | 20px | 16px | section 间距、弹窗 overlay padding |
| `--dsh-space-7xl` | 24px | 16px | 内容区 padding（canvas content）、弹窗 overlay padding |
| `--dsh-space-8xl` | 28px | 16px | 内容区外边距（PC 宽松，H5 收窄） |
| `--dsh-space-9xl` | 32px | 20px | 空态区域 padding |

**来源依据：**
- 分组内衬 6px：`dshm-group { padding: 6px }`、`ra-group { padding: 6px }`、`.dam-list { padding: 6px }`
- 行 gap 8px-10px：`.ra-row { gap: 10px }`、`.dshmcp-instRow { gap: 10px }`
- 弹窗 padding 14px：`.dshmcp-modalBody { padding: 14px }`、`.dshm-detailMain { padding: 12px 14px }`
- 卡片 padding 18px：`.dshm-instCard { padding: 18px }`、`.dshmcp-mkt-card { padding: 18px }`
- 内容区 padding 28px：`.dsh-launcher-canvas-content { padding: 28px 32px 80px }`
- H5 收窄到 16px：`.dsh-launcher-canvas-content { padding: 20px 16px 80px }`

---

## 2. 字号系统 (Typography)

| Token 名称 | PC 值 | H5 值 | 字重 | 行高 | 说明 |
|---|---|---|---|---|---|
| `--dsh-font-size-xs` | 10.5px | 10.5px | 500 | 16px | 版本号标签、参数计数、极小辅助文字 |
| `--dsh-font-size-sm` | 11px | 11px | 500 | 15-16px | section label、meta 文字、大写字母标签、路径 |
| `--dsh-font-size-md` | 12px | 12px | 400 | 17-18px | 描述正文、按钮文字、hint 文字 |
| `--dsh-font-size-base` | 12.5px | 12.5px | 400 | 19px | 表单输入、正文、code body、描述文本 |
| `--dsh-font-size-lg` | 13px | 13px | 600 | 17-18px | 行标题、列表项名称、标签、工具栏标题 |
| `--dsh-font-size-xl` | 14px | 14px | 600 | 19px | 卡片名称、弹窗标题、编辑器标题 |
| `--dsh-font-size-2xl` | 15px | 15px | 600 | 20px | hero 名称（详情弹窗） |
| `--dsh-font-size-3xl` | 16px | 15px | 600 | 18px | section header 标题（H5 缩小 1px） |
| `--dsh-font-size-4xl` | 18px | 16px | 600 | 24px | canvas content h1（H5 缩小 2px） |
| `--dsh-font-size-hero` | 17px | 17px | 620 | 23px | 统计面板大数字、设置页 h2 |

**字号使用规则：**

| 语义角色 | Token | PC 值 | 示例 |
|---|---|---|---|
| section label（大写标签） | `--dsh-font-size-sm` | 11px/500/0.05em | `LETTER SPACING` |
| 行名称 / 列表标题 | `--dsh-font-size-lg` | 13px/600 | 插件名、工具名 |
| 卡片名称 | `--dsh-font-size-xl` | 14px/600 | market card title |
| meta / 辅助文字 | `--dsh-font-size-sm` | 11px/400 | 版本、路径、时间戳 |
| 描述正文 | `--dsh-font-size-md` | 12px/400 | 描述文本、状态文字 |
| 按钮文字 | `--dsh-font-size-md` | 12px-12.5px | 按钮 label |
| 输入框文字 | `--dsh-font-size-base` | 12.5px/400 | input、textarea |
| 代码 | `--dsh-font-size-base` | 12-12.5px | code block、路径 |

**字体族：**

| Token | 值 | 说明 |
|---|---|---|
| `--dsh-font-sans` | `var(--dsw-alias-font-sans, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", sans-serif)` | 正文字体 |
| `--dsh-font-mono` | `var(--ds-font-family-code, ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace)` | 等宽字体 |

**来源依据：**
- 11px section label：所有插件统一 `.dshm-sectionLabel { font-size: 11px; font-weight: 500; letter-spacing: 0.05em }`
- 13px/600 行名称：`.dshm-instRowName { font-size: 13px; font-weight: 600 }`
- 14px/600 卡片名称：`.dshmcp-mkt-cardName { font-size: 14px; font-weight: 600 }`
- 12.5px 输入框：`.dshmcp-input { font-size: 12.5px }`、`.dshm-input { font-size: 13px }`（统一为 12.5px）

---

## 3. 圆角系统 (Border Radius)

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-radius-sm` | `calc(var(--dsh-layout-radius-user, 8px) - 2px)` = 6px | 6px | 小元素：小按钮、分段控件内部按钮、compact 搜索框 |
| `--dsh-radius-md` | `var(--dsh-layout-radius-user, 8px)` = 8px | 8px | 标准元素：按钮、输入框、列表行、图标底座、标签页 |
| `--dsh-radius-lg` | `var(--dsh-layout-radius-user-lg, 12px)` = 12px | 12px | 大容器：分组容器、弹窗、编辑器、卡片网格容器 |
| `--dsh-radius-xl` | `var(--dsh-layout-radius-user-lg, 16px)` = 16px | 16px | 超大容器：launcher panel |
| `--dsh-radius-full` | 999px | 999px | 胶囊：tag、badge、pill button、开关、dot |
| `--dsh-radius-round` | 50% | 50% | 圆形：FAB、关闭按钮、avatar |

**圆角使用矩阵：**

| 组件 | 圆角 Token | 实际值 |
|---|---|---|
| 分组容器 (.dshm-group) | `--dsh-radius-lg` | 12px |
| 弹窗 (.dshmcp-modal) | `--dsh-radius-lg` | 12px |
| 卡片 (.dshmcp-instCard) | `--dsh-radius-md` | 8px |
| 按钮 (.dshm-button) | `--dsh-radius-sm` ~ `--dsh-radius-md` | 6px ~ 8px |
| 输入框 (.dshmcp-input) | `--dsh-radius-md` | 8px |
| Tag / Badge | `--dsh-radius-full` | 999px |
| 分段控件轨道 | `--dsh-radius-md` | 8px |
| 分段控件内部按钮 | `--dsh-radius-sm` | 6px |
| 搜索框 (compact) | `--dsh-radius-sm` | 6px |
| FAB | `--dsh-radius-round` | 50% |
| Launcher panel | `--dsh-radius-xl` | 16px |

**来源依据：**
- `--dsh-layout-radius-user` 默认 8px：`dsh-layout/src/client/tokens.ts` 定义
- `--dsh-layout-radius-user-lg` 默认 12px：各插件 fallback 值
- 分组容器统一 12px：`.dshm-group { border-radius: var(--dsh-layout-radius-user-lg, 12px) }`
- 按钮减 2px：`.dshm-button { border-radius: calc(var(--dsh-layout-radius-user, 8px) - 2px) }`

---

## 4. 面色配方 (Color Recipes)

不定义原始色值，只定义 `color-mix` 配方百分比。所有配方以 `var(--dsw-alias-label-primary, #fff)` 为基色。

### 4.1 表面配方 (Surface Recipes)

| Token 名称 | 配方 | 说明 |
|---|---|---|
| `--dsh-surface-group` | `var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.03))` | 分组容器背景 |
| `--dsh-surface-panel` | `var(--dsw-alias-bg-layer-1, #1c1c1f)` | 弹窗/面板背景（不透明） |
| `--dsh-surface-elevated` | `var(--dsw-alias-bg-layer-3, #232327)` | 编辑器 footer、sticky header |
| `--dsh-surface-card` | `linear-gradient(180deg, label-primary 5%→2%)` | 卡片背景（渐变） |
| `--dsh-surface-input` | `color-mix(label-primary 3%)` | 输入框背景 |
| `--dsh-surface-seg-track` | `color-mix(label-primary 4%)` | 分段控件轨道背景 |
| `--dsh-surface-icon-base` | `color-mix(label-primary 6%)` | 图标底座背景 |

### 4.2 边框配方 (Border Recipes)

| Token 名称 | 配方 | 说明 |
|---|---|---|
| `--dsh-border-group` | `color-mix(label-primary 8%)` | 分组容器外边框 |
| `--dsh-border-row` | `color-mix(label-primary 6%)` | 行间分隔线、内边框 |
| `--dsh-border-input` | `color-mix(label-primary 10%)` | 输入框、按钮边框 |
| `--dsh-border-card` | `color-mix(label-primary 6%)` | 卡片默认边框 |
| `--dsh-border-card-hover` | `color-mix(label-primary 18%)` | 卡片悬停边框 |
| `--dsh-border-active` | `color-mix(label-primary 24%)` | 主按钮边框、选中态边框 |
| `--dsh-border-focus` | `color-mix(label-primary 40%)` | 焦点环 outline |
| `--dsh-border-dashed` | `color-mix(label-primary 14%)` | 拖拽区域虚线边框 |
| `--dsh-border-seg-track` | `color-mix(label-primary 8%)` | 分段控件轨道边框 |
| `--dsh-border-primary` | `color-mix(label-primary 24%)` | 主按钮边框 |
| `--dsh-border-primary-hover` | `color-mix(label-primary 28%)` | 主按钮悬停边框 |

### 4.3 交互配方 (Interaction Recipes)

| Token 名称 | 配方 | 说明 |
|---|---|---|
| `--dsh-hover-bg` | `color-mix(label-primary 4%)` | 行/列表项悬停背景 |
| `--dsh-hover-bg-strong` | `color-mix(label-primary 5%)` | 按钮悬停背景 |
| `--dsh-active-bg` | `color-mix(label-primary 6%)` | 选中行背景 |
| `--dsh-active-bg-strong` | `color-mix(label-primary 8%)` | 按钮按下背景 |
| `--dsh-primary-bg` | `color-mix(label-primary 9%~10%)` | 主按钮背景 |
| `--dsh-primary-bg-hover` | `color-mix(label-primary 13%~14%)` | 主按钮悬停背景 |
| `--dsh-primary-highlight` | `inset 0 1px 0 color-mix(label-primary 8%~14%)` | 主按钮顶部内阴影 |
| `--dsh-focus-bg` | `color-mix(business-primary 8%~12%)` | 聚焦行背景 |
| `--dsh-selected-bg` | `color-mix(label-primary 12%)` | 分段控件选中项背景 |

### 4.4 状态色配方 (State Color Recipes)

| Token 名称 | 配方 | 说明 |
|---|---|---|
| `--dsh-state-success-bg` | `color-mix(success-primary 8~10%)` | 成功 badge 背景 |
| `--dsh-state-success-border` | `color-mix(success-primary 18%)` | 成功 badge 边框 |
| `--dsh-state-warning-bg` | `color-mix(warning-primary 8~12%)` | 警告 badge 背景 |
| `--dsh-state-warning-border` | `color-mix(warning-primary 18~22%)` | 警告 badge 边框 |
| `--dsh-state-error-bg` | `color-mix(error-primary 6~10%)` | 错误 badge 背景 |
| `--dsh-state-error-border` | `color-mix(error-primary 18~30%)` | 错误 badge / 按钮边框 |
| `--dsh-state-business-bg` | `color-mix(business-primary 6~9%)` | business callout 背景 |
| `--dsh-state-business-border` | `color-mix(business-primary 16~20%)` | business callout 边框 |

### 4.5 蒙版与阴影

| Token 名称 | 值 | 说明 |
|---|---|---|
| `--dsh-overlay-bg` | `rgba(0, 0, 0, 0.45)` | 弹窗蒙版（所有插件统一） |
| `--dsh-overlay-blur` | `blur(4px)` | 弹窗蒙版模糊 |
| `--dsh-shadow-card` | `0 4px 16px rgba(0,0,0,0.18)` | 卡片默认阴影 |
| `--dsh-shadow-card-hover` | `0 8px 24px rgba(0,0,0,0.26)` | 卡片悬停阴影 |
| `--dsh-shadow-card-highlight` | `inset 0 1px 0 color-mix(label-primary 6%)` | 卡片顶部内阴影 |
| `--dsh-shadow-lv1` | `var(--dsw-shadow-lv1)` | 一级阴影（抽屉手柄） |
| `--dsh-shadow-lv2` | `var(--dsw-shadow-lv2, 0 20px 60px rgba(0,0,0,0.45))` | 二级阴影（FAB、弹窗） |

### 4.6 玻璃材质配方（dsh-layout material 联动）

| 场景 | 配方 | 说明 |
|---|---|---|
| 分组容器 | `color-mix(glass-base 34%, transparent)` | 分组、列表容器 |
| 面板/输入框 | `color-mix(glass-base 46%, transparent)` | 编辑器、搜索框、输入框 |
| 图标底座 | `color-mix(glass-base 52%, transparent)` | tile、icon base |
| 弹窗 | `color-mix(glass-base 88%, transparent)` | 弹窗保持近不透明 |
| 玻璃边框 | `color-mix(line 45~55%, transparent)` | 玻璃模式下的边框 |
| 模糊参数 | `blur(16px) saturate(112%)` | backdrop-filter 默认值 |

**来源依据：**
- 蒙版统一 `rgba(0,0,0,0.45)`：`.dshm-modalOverlay { background: rgba(0,0,0,0.45) }`、`.u-mask { background: rgba(0,0,0,0.45) }`、`.dshmcp-modal > [aria-hidden] { background: rgba(0,0,0,0.45) }`
- 分组背景 `label-primary 3%`：`.dshm-group { background: color-mix(label-primary 3%) }`、`.agr-group { background: color-mix(label-primary 3%) }`
- hover `label-primary 4%`：`.ra-row:hover { background: color-mix(label-primary 4%) }`、`.dshmcp-instRow:hover { background: color-mix(label-primary 4%) }`
- 玻璃 34%/46%/88%：dsh-mcp-manager 和 dsh-skill-manager 的 material bridge 段

---

## 5. 按钮规格 (Buttons)

### 5.1 按钮尺寸体系

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-btn-height-sm` | 26px | 36px | 小按钮（market shelf、工具操作） |
| `--dsh-btn-height-md` | 28px | 36px | 标准按钮（工具栏、modal footer、所有插件统一） |
| `--dsh-btn-height-icon` | 28px | 36px | 图标按钮（正方形） |
| `--dsh-btn-height-icon-sm` | 26px | 36px | 小图标按钮（market、source 管理） |
| `--dsh-btn-padding-x` | 10~12px | 12px | 按钮水平内边距 |
| `--dsh-btn-padding-y` | 0 | 0 | 按钮垂直内边距（靠 height 撑开） |
| `--dsh-btn-gap` | 5~6px | 6px | 按钮内图标与文字间距 |
| `--dsh-btn-font-size` | 12~12.5px | 12px | 按钮字号 |
| `--dsh-btn-radius` | `calc(var(--dsh-layout-radius-user, 8px) - 2px)` ~ `var(--dsh-layout-radius-user, 8px)` | 6px ~ 8px | 按钮圆角 |

### 5.2 按钮类型配方

| 类型 | 背景 | 边框 | 文字色 | 悬停背景 | 悬停边框 | 阴影 |
|---|---|---|---|---|---|---|
| **次要按钮** | transparent | `label-primary 10%` | label-primary | `label-primary 5%` | `label-primary 16%` | 无 |
| **主按钮** | `label-primary 9~10%` | `label-primary 24%` | label-primary | `label-primary 13~14%` | `label-primary 28%` | `inset 0 1px 0 label-primary 8~14%` |
| **危险按钮** | transparent | `error-primary 20~30%` | error-primary | `error-primary 6~10%` | `error-primary 30~40%` | 无 |
| **幽灵按钮** | transparent | 无 | label-tertiary | `label-primary 5%` | — | 无 |
| **quiet 按钮** | transparent | 无 | label-secondary | `label-primary 5%` | — | 无 |
| **图标按钮** | transparent | `label-primary 10%` | label-primary | `label-primary 5%` | `label-primary 16%` | 无 |

### 5.3 按钮交互

| 状态 | 规则 |
|---|---|
| `:hover` | 背景提亮 5%，边框提亮至 16% |
| `:active` | `transform: scale(0.97)` + 背景提亮 8% |
| `:focus-visible` | `outline: 2px solid business-primary` + `outline-offset: -2px` |
| `[disabled]` | `opacity: 0.45~0.5` + `cursor: default` + 移除 active 变换 |

**来源依据：**
- 28px 统一高度：`.dshm-button { height: 28px }`、`.dshmcp-button { height: 28px }`、`.dam-btn { height: 28px }`、`.agr-btn { min-height: 28px }`
- 26px market 按钮：`.dshm-mkt-btn { height: 26px }`、`.dshmcp-mkt-install { height: 26px }`、`.ra-btn { height: 26px }`
- primary 配方：`.dshm-buttonPrimary { background: color-mix(label-primary 10%); border-color: color-mix(label-primary 24%) }`
- press scale(0.97)：所有插件统一 `.dshm-button:active { transform: scale(0.97) }`

---

## 6. 卡片规格 (Cards)

### 6.1 标准卡片

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-card-min-height` | 160px | 160px | 卡片最小高度 |
| `--dsh-card-padding` | 18px | 12~14px | 卡片内边距 |
| `--dsh-card-gap` | 12~13px | 10px | 卡片内 section 间距 |
| `--dsh-card-radius` | `var(--dsh-layout-radius-user, 8px)` | 8px | 卡片圆角 |
| `--dsh-card-bg` | `linear-gradient(180deg, label-primary 5%→2%)` | 同 PC | 卡片背景渐变 |
| `--dsh-card-border` | `label-primary 6%` | 同 PC | 卡片默认边框 |
| `--dsh-card-border-hover` | `label-primary 18%` | 同 PC | 卡片悬停边框 |
| `--dsh-card-shadow` | `inset 0 1px 0 label-primary 6%, 0 4px 16px rgba(0,0,0,0.18)` | 同 PC | 卡片阴影 |
| `--dsh-card-shadow-hover` | `inset 0 1px 0 label-primary 6%, 0 8px 24px rgba(0,0,0,0.26)` | 同 PC | 卡片悬停阴影 |

### 6.2 卡片图标底座

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-card-tile-size` | 46px | 46px | 卡片头部图标尺寸 |
| `--dsh-card-tile-radius` | `var(--dsh-layout-radius-user, 8px)` | 8px | 图标底座圆角 |
| `--dsh-card-tile-bg` | `hsl(hue 55% 55% / 14%→7%)` | 同 PC | 色相渐变背景 |

### 6.3 卡片网格

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-card-grid-min` | 300px | `min(190px, 100%)` | 网格最小列宽 |
| `--dsh-card-grid-gap` | 8px | 10px | 网格间距 |
| `--dsh-card-grid-padding` | 6px | 8px | 网格容器内衬 |

**来源依据：**
- 卡片 18px padding：`.dshm-instCard { padding: 18px }`、`.dshmcp-mkt-card { padding: 18px }`
- H5 收窄：`.dshm-mkt-card { padding: 14px; gap: 10px }`（≤767px）
- 网格 minmax(300px)：`.dshmcp-instCards { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) }`
- H5 minmax：`.dshm-mkt-cards { grid-template-columns: repeat(auto-fill, minmax(min(190px, 100%), 1fr)) }`

---

## 7. 弹窗规格 (Modals/Dialogs)

### 7.1 弹窗蒙版

| Token 名称 | 值 | 说明 |
|---|---|---|
| `--dsh-modal-overlay-bg` | `rgba(0, 0, 0, 0.45)` | 蒙版背景色 |
| `--dsh-modal-overlay-blur` | `blur(4px)` | 蒙版模糊 |
| `--dsh-modal-overlay-padding` | 20~24px (PC) / 12px (H5) | 蒙版内边距 |

### 7.2 弹窗壳体

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-modal-width-sm` | `min(400px, 92vw)` | `100%` | 确认弹窗宽度 |
| `--dsh-modal-width-md` | `min(560px, 100%)` | `100%` | 标准弹窗宽度 |
| `--dsh-modal-width-lg` | `min(640px, 100%)` | `100%` | 大弹窗宽度 |
| `--dsh-modal-width-xl` | `min(1040px, 94vw)` | `100%` | 详情弹窗宽度 |
| `--dsh-modal-max-height` | `calc(100dvh - 48px)` | `calc(100dvh - 24px)` | 弹窗最大高度 |
| `--dsh-modal-bg` | `var(--dsw-alias-bg-layer-1, #1c1c1f)` | 同 PC | 弹窗背景（不透明） |
| `--dsh-modal-border` | `label-primary 8~10%` | 同 PC | 弹窗边框 |
| `--dsh-modal-radius` | `var(--dsh-layout-radius-user-lg, 12px)` | 12px | 弹窗圆角 |

### 7.3 弹窗内部分区

| 分区 | PC padding | H5 padding | 说明 |
|---|---|---|---|
| 头部 (head) | `12px 14px` | `12px 14px` | 标题 + 关闭按钮 |
| 内容 (body) | `14px` | `14px` | 可滚动内容区 |
| 底部 (foot) | `10px 14px` | `10px 14px` | 操作按钮 |
| 头部边框 | `border-bottom: label-primary 6%` | 同 PC | 头部分隔线 |
| 底部边框 | `border-top: label-primary 6%` | 同 PC | 底部分隔线 |

### 7.4 弹窗动画

| Token 名称 | 值 | 说明 |
|---|---|---|
| `--dsh-modal-enter-duration` | 160ms | 弹窗进入动画时长 |
| `--dsh-modal-enter-ease` | `var(--ds-ease-in-out, ease)` | 弹窗进入缓动 |
| `--dsh-modal-enter-transform` | `translateY(10px)` | 弹窗进入位移 |
| `--dsh-modal-fade-duration` | 160ms | 蒙版淡入时长 |

**来源依据：**
- 蒙版统一 `rgba(0,0,0,0.45)` + `blur(4px)`：三个插件完全一致
- 弹窗圆角 12px：`.dshmcp-modal { border-radius: var(--dsh-layout-radius-user-lg, 12px) }`
- 弹窗 160ms slide-up：`@keyframes dshmcp-modalUp { from { opacity: 0; transform: translateY(10px) } }`
- H5 全宽：`.dshm-modal { width: 100% }`（≤767px）

---

## 8. 表单规格 (Forms)

### 8.1 输入框

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-input-height` | 30~32px | 38px | 输入框高度（PC 30-32px，H5 增大触控区） |
| `--dsh-input-height-sm` | 26~28px | 36px | 小输入框（内嵌、KV 编辑器） |
| `--dsh-input-height-search` | 34px | 38px | 搜索框高度 |
| `--dsh-input-padding-x` | 10px | 10px | 输入框水平内边距 |
| `--dsh-input-font-size` | 12.5px | 12.5px | 输入框字号 |
| `--dsh-input-bg` | `color-mix(label-primary 3%)` | 同 PC | 输入框背景 |
| `--dsh-input-border` | `label-primary 10%` | 同 PC | 输入框默认边框 |
| `--dsh-input-border-hover` | `label-primary 16%` | 同 PC | 输入框悬停边框 |
| `--dsh-input-border-focus` | `business-primary` | 同 PC | 输入框聚焦边框 |
| `--dsh-input-radius` | `var(--dsh-layout-radius-user, 8px)` | 8px | 输入框圆角 |
| `--dsh-input-placeholder` | `label-tertiary` | 同 PC | placeholder 颜色 |

### 8.2 文本域

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-textarea-min-height` | 200px | 160px | 文本域最小高度 |
| `--dsh-textarea-padding` | 10px | 10px | 文本域内边距 |
| `--dsh-textarea-font-size` | 12px | 12px | 文本域字号 |
| `--dsh-textarea-line-height` | 1.55 | 1.55 | 文本域行高 |

### 8.3 开关 (Switch)

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-switch-width` | 30px | 36px | 开关宽度 |
| `--dsh-switch-height` | 18px | 20px | 开关高度 |
| `--dsh-switch-knob` | 12px | 16px | 开关旋钮尺寸 |
| `--dsh-switch-radius` | 999px | 999px | 开关圆角（胶囊） |
| `--dsh-switch-off-bg` | `color-mix(label-primary 6%)` | 同 PC | 关闭态背景 |
| `--dsh-switch-off-border` | `label-primary 10%` | 同 PC | 关闭态边框 |
| `--dsh-switch-on-bg` | `color-mix(success-primary 45%)` | 同 PC | 开启态背景 |
| `--dsh-switch-on-border` | `color-mix(success-primary 55%)` | 同 PC | 开启态边框 |

### 8.4 分段控件 (Segmented Control)

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-seg-track-bg` | `color-mix(label-primary 4%)` | 同 PC | 轨道背景 |
| `--dsh-seg-track-border` | `label-primary 8%` | 同 PC | 轨道边框 |
| `--dsh-seg-track-radius` | `var(--dsh-layout-radius-user, 8px)` | 8px | 轨道圆角 |
| `--dsh-seg-track-padding` | 2~3px | 3px | 轨道内衬 |
| `--dsh-seg-btn-height` | 26~28px | 36px | 段按钮高度 |
| `--dsh-seg-btn-radius` | `calc(radius - 2px)` ~ 999px | 同 PC | 段按钮圆角 |
| `--dsh-seg-btn-active-bg` | `color-mix(label-primary 12%)` | 同 PC | 选中项背景 |

**来源依据：**
- 输入框 32px：`.dshm-input { height: 32px }`
- 输入框 30px：`.dshmcp-input { height: 30px }`、`.u-f input { min-height: 30px }`
- 开关 30x18px：`.dshmcp-switch { width: 30px; height: 18px }`
- 分段控件 28px：`.dshm-seg button { height: 28px }`、`.dshmcp-seg button { height: 26px }`
- H5 触控目标 >=36px：ui-conventions.md 规定

---

## 9. 分组容器 (Group Container)

### 9.1 分组容器规格

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-group-bg` | `var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.03))` | 同 PC | 分组背景 |
| `--dsh-group-border` | `color-mix(label-primary 8%)` | 同 PC | 分组边框 |
| `--dsh-group-radius` | `var(--dsh-layout-radius-user-lg, 12px)` | 12px | 分组圆角 |
| `--dsh-group-padding` | 6px | 6px | 分组内衬 |
| `--dsh-group-gap` | 12px | 12px | 分组之间的间距 |

### 9.2 Section Header 规格

| Token 名称 | PC 值 | H5 值 | 说明 |
|---|---|---|---|
| `--dsh-section-title-size` | 16px | 15px | section 标题字号（H5 缩小 1px） |
| `--dsh-section-title-weight` | 600 | 600 | section 标题字重 |
| `--dsh-section-subtitle-size` | 12px | 11px | section 副标题字号 |
| `--dsh-section-subtitle-color` | `label-tertiary` | 同 PC | 副标题颜色 |
| `--dsh-section-margin-bottom` | 20px | 16px | section header 底部间距 |
| `--dsh-section-padding-bottom` | 14px | 12px | section header 底部内边距 |
| `--dsh-section-border` | `border-bottom: label-primary 8%` | 同 PC | section header 底部分隔线 |

### 9.3 Section Label（大写标签）

| Token 名称 | 值 | 说明 |
|---|---|---|
| `--dsh-label-size` | 11px | 标签字号 |
| `--dsh-label-weight` | 500 | 标签字重 |
| `--dsh-label-spacing` | 0.05em | 标字字间距 |
| `--dsh-label-transform` | uppercase | 标字大小写 |
| `--dsh-label-color` | `label-tertiary` | 标字颜色 |

**来源依据：**
- 分组统一配方：`.dshm-group { background: bg-layer-2; border: 1px solid label-primary 8%; border-radius: 12px; padding: 6px }`
- section header：`.dsh-launcher-section-header-title { font-size: 16px; font-weight: 600 }`
- H5 缩小：`.dsh-launcher-section-header-title { font-size: 15px }`（≤767px）

---

## 10. 断点与覆盖 (Breakpoints)

### 10.1 断点定义

| Token 名称 | 值 | 说明 |
|---|---|---|
| `--dsh-breakpoint-h5` | `max-width: 767px` | 手机断点（所有插件统一） |
| `--dsh-breakpoint-tiny` | `max-width: 480px` | 小屏手机断点（可选） |
| `--dsh-breakpoint-narrow` | `max-width: 640px` | 窄屏断点（skill-manager 卡片单列） |

### 10.2 H5 覆盖清单（≤767px）

| 调整项 | PC 值 | H5 值 | 涉及插件 |
|---|---|---|---|
| **内容区 padding** | 28px 32px | 16px 16px | launcher, skill-manager |
| **弹窗 overlay padding** | 20~24px | 12px | 所有插件 |
| **弹窗宽度** | min(560px, 100%) | 100% | 所有插件 |
| **弹窗最大高度** | calc(100dvh - 48px) | calc(100dvh - 24px) | mcp-manager |
| **卡片 padding** | 18px | 12~14px | skill-manager, mcp-manager |
| **卡片网格 min** | 300px | min(190px, 100%) | skill-manager, mcp-manager |
| **卡片网格 gap** | 8px | 10px | skill-manager, mcp-manager |
| **分组容器 padding** | 6px | 8px | mcp-manager |
| **section header margin** | 20px | 16px | launcher |
| **section header title** | 16px | 15px | launcher |
| **section header subtitle** | 12px | 11px | launcher |
| **icon 按钮尺寸** | 28px | 36px | skill-manager, mcp-manager |
| **market icon 按钮** | 28px | 36px | skill-manager, mcp-manager |
| **market 工具栏** | flex 单行 | flex-direction: column 堆叠 | skill-manager, mcp-manager |
| **market search** | min-width: 180px | flex-basis: 100% | skill-manager, mcp-manager |
| **market 段条** | max-width: 420px | width: 100% | skill-manager, mcp-manager |
| **行描述列** | 可见 | display: none | skill-manager, mcp-manager |
| **master-detail 布局** | grid 双列 | grid 单列堆叠 | archive-manager |
| **长文本** | nowrap + ellipsis | overflow-wrap: anywhere | 所有插件 |
| **canvas X 按钮** | top: 12px, right: 14px, 32px | bottom: 18px, right: 16px, 40px | launcher |
| **canvas 导航** | 垂直 rail | 水平 tab bar（等宽分段） | launcher |
| **详情弹窗树面板** | 左侧固定 | 堆叠到顶部，max-height: 180px | skill-manager |
| **FAB** | bottom: 24px, left: 24px, 52px | bottom: 16px, left: 16px, 48px | launcher |
| **触控目标** | — | >= 36px（建议 40px） | 所有插件 |

### 10.3 小屏手机覆盖（≤480px）

| 调整项 | PC 值 | 小屏值 | 涉及插件 |
|---|---|---|---|
| **内容区 padding** | 28px 32px | 10px 10px | launcher |
| **section header title** | 16px | 15px | launcher |
| **FAB** | 52px | 48px | launcher |
| **行操作列** | flex-row | flex-column + align-end | mcp-manager |

**来源依据：**
- 所有插件统一 `@media (max-width: 767px)` 作为 H5 断点
- `@media (max-width: 480px)` 仅 launcher 和 mcp-manager 使用
- `@media (max-width: 640px)` 仅 skill-manager 使用（卡片单列）
- 触控目标 >=36px：ui-conventions.md 规定

---

## 11. 动画规格 (Animation)

### 11.1 过渡时长

| Token 名称 | 值 | 说明 |
|---|---|---|
| `--dsh-transition-fast` | 120ms | 标准交互过渡（background、color、border-color、box-shadow） |
| `--dsh-transition-normal` | 140ms | FAB 变换过渡 |
| `--dsh-transition-slow` | 180ms | 背景图过渡、launcher fade-in |
| `--dsh-transition-fill` | 300ms | 进度条宽度过渡 |

### 11.2 缓动函数

| Token 名称 | 值 | 说明 |
|---|---|---|
| `--dsh-ease-standard` | `var(--ds-ease-in-out, ease)` | 标准缓动（所有交互过渡） |
| `--dsh-ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` | 弹性出场（launcher 面板、canvas 进入） |
| `--dsh-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | 快速进入（launcher 退出动画） |
| `--dsh-ease-linear` | `linear` | 旋转动画（spinner） |

### 11.3 进入/退出动画

| 动画名称 | 时长 | 缓动 | 变换 | 说明 |
|---|---|---|---|---|
| modal 进入 | 160ms | ease-in-out | `opacity: 0→1, translateY(10px)→0` | 弹窗 slide-up |
| modal fade | 160ms | ease-in-out | `opacity: 0→1` | 蒙版淡入 |
| launcher slide-up | 260ms | ease-out-quint | `opacity: 0→1, translateY(8px)→0` | launcher 面板进入 |
| launcher fade-in | 180ms | ease-out-quint | `opacity: 0→1` | launcher 蒙版淡入 |
| launcher fade-out | 160ms | ease-out-quint | `opacity: 1→0` | launcher 蒙版淡出 |
| launcher panel-out | 200ms | ease-in | `opacity: 0, translateY(10px)` | launcher 面板退出 |
| canvas 进入 | 340ms | ease-out-quint | `opacity: 0→1, scale(1.02)→1` | canvas 放大进入 |
| canvas 退出 | 200ms | ease-in | `opacity: 0, scale(0.985)` | canvas 缩小退出 |
| menu 进入 | 380ms | ease-out-quint | `opacity: 0→1, translateX(-12px)→0` | 菜单左滑进入 |
| menu item 进入 | 320~340ms | ease-out-quint | `opacity: 0→1, translateX(-8px)→0` | 菜单项级联进入（staggered） |
| content 进入 | 460ms | ease-out-quint | `opacity: 0→1, translateY(14px)→0` | 内容区上升进入 |
| tab item 进入 | — | — | `opacity: 0→1, translateY(-8px)→0` | H5 tab 下降进入 |
| spinner | 1s | linear | `rotate(0→360deg)` | 加载旋转 |
| skeleton shimmer | 1.4s | linear | `background-position: 200%→-200%` | 骨架屏微光 |
| breathe | 1.6s | ease-in-out | `opacity: 1→0.45→1` | 状态点呼吸 |
| pulse | 1.6s | ease-in-out | `opacity: 1→0.5→1` | skeleton 脉冲 |
| drawer | 220ms | ease | `inset-inline-start: -100%→0` | 抽屉滑入 |

### 11.4 减弱动效

| 条件 | 规则 |
|---|---|
| `prefers-reduced-motion: reduce` | 所有 `animation: none !important`、所有 `transition: none !important`、所有 `transform: none`、spinner 停止 |

**来源依据：**
- 120ms 统一过渡：所有插件的 hover/active transition 均为 `120ms var(--ds-ease-in-out, ease)`
- 160ms 弹窗动画：`.dshmcp-modalUp { animation: 160ms }`、`.dshm-modalUp { animation: 160ms }`
- ease-out-quint：`cubic-bezier(0.22, 1, 0.36, 1)` 定义为 `--dsh-launcher-ease`
- reduced-motion：所有插件末尾均有 `@media (prefers-reduced-motion: reduce)` 段

---

## 快速参考卡 (Quick Reference)

最常用令牌一览表，开发时快速查找。

### 表面与边框

| 用途 | 配方 |
|---|---|
| 分组背景 | `var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.03))` |
| 分组边框 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent)` |
| 行间分隔 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent)` |
| 输入框背景 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 3%, transparent)` |
| 输入框边框 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 10%, transparent)` |
| 图标底座 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent)` |
| 卡片背景 | `linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 2%, transparent))` |
| 卡片边框 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent)` |
| 卡片阴影 | `inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 6%, transparent), 0 4px 16px rgba(0, 0, 0, 0.18)` |

### 交互

| 用途 | 配方 |
|---|---|
| hover 背景 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 4%, transparent)` |
| hover 背景（按钮） | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 5%, transparent)` |
| 选中/活跃背景 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 12%, transparent)` |
| 按下反馈 | `transform: scale(0.97)` |
| 过渡 | `120ms var(--ds-ease-in-out, ease)` |

### 主按钮

| 属性 | 值 |
|---|---|
| 背景 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 9~10%, transparent)` |
| 边框 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 24%, transparent)` |
| 阴影 | `inset 0 1px 0 color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8~14%, transparent)` |
| hover 背景 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 13~14%, transparent)` |
| hover 边框 | `color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 28%, transparent)` |

### 尺寸

| 元素 | PC | H5 |
|---|---|---|
| 标准按钮高度 | 28px | 36px |
| 小按钮高度 | 26px | 36px |
| 图标按钮 | 28px x 28px | 36px x 36px |
| 输入框高度 | 30~32px | 38px |
| 搜索框高度 | 34px | 38px |
| 开关 | 30 x 18px | 36 x 20px |
| 列表行高 | 44~48px | 44~48px |
| 分组圆角 | 12px | 12px |
| 按钮圆角 | 6~8px | 6~8px |
| 卡片 padding | 18px | 12~14px |
| 分组 padding | 6px | 6~8px |
| 弹窗 padding | 14px | 12~14px |
| 内容区 padding | 28px | 16px |

### 弹窗

| 属性 | 值 |
|---|---|
| 蒙版 | `rgba(0, 0, 0, 0.45)` + `blur(4px)` |
| 圆角 | 12px |
| 背景 | `var(--dsw-alias-bg-layer-1, #1c1c1f)`（不透明） |
| 进入动画 | 160ms ease, translateY(10px) → 0 |
| H5 padding | 12px |
| H5 宽度 | 100% |

### 字号速查

| 角色 | 字号 | 字重 |
|---|---|---|
| section label | 11px | 500 + 0.05em spacing |
| meta / 辅助 | 11px | 400 |
| 描述 / 按钮 | 12~12.5px | 400 |
| 行名称 | 13px | 600 |
| 卡片名称 | 14px | 600 |
| section 标题 | 16px (H5: 15px) | 600 |
| hero 数字 | 17px | 620 |

### 颜色变量引用

| 角色 | 变量 |
|---|---|
| 主文字 | `var(--dsw-alias-label-primary, #f4f4f5)` |
| 次文字 | `var(--dsw-alias-label-secondary, #b3b3b8)` |
| 辅助文字 | `var(--dsw-alias-label-tertiary, #8a8a8e)` |
| 主强调 | `var(--dsw-alias-state-business-primary, #6ea8fe)` |
| 成功 | `var(--dsw-alias-state-success-primary, #4caf50)` |
| 警告 | `var(--dsw-alias-state-warning-primary, #d97706)` |
| 错误 | `var(--dsw-alias-state-error-primary, #ef5350)` |
| 分层背景 L1 | `var(--dsw-alias-bg-layer-1, #1c1c1f)` |
| 分层背景 L2 | `var(--dsw-alias-bg-layer-2, rgba(255,255,255,0.03))` |
| 分层背景 L3 | `var(--dsw-alias-bg-layer-3, #232327)` |
| 平台背景 | `var(--dsw-alias-bg-module-platform, #0f0f12)` |

---

## 附录：跨插件一致性对照

以下是各插件中相同语义组件的数值对比，确认统一后的标准值。

### 按钮高度

| 插件 | 主按钮 | 小按钮 | 图标按钮 |
|---|---|---|---|
| dsh-skill-manager | 28px | 26px (mkt) | 28px |
| dsh-mcp-manager | 28px | 26px (mkt) | 28px |
| dsh-archive-manager | 28px | 26px (--sm) | 24px → 统一为 26px |
| dsh-agent-rules | 28px | — | — |
| dsh-usage | 28px | — | — |
| dsh-remote-access | 26px → 统一为 28px | — | 26px |
| **统一值** | **28px** | **26px** | **28px** |

### 分组容器

| 插件 | 背景 | 边框 | 圆角 | padding |
|---|---|---|---|---|
| dsh-skill-manager | bg-layer-2 | label-primary 8% | 12px | 6px |
| dsh-mcp-manager | bg-layer-2 | label-primary 8% | 12px | 6px |
| dsh-archive-manager | bg-layer-2 | label-primary 8% | 12px | 6px |
| dsh-remote-access | bg-layer-2 | label-primary 8% | 12px | 6px |
| dsh-agent-rules | label-primary 3% | label-primary 8% | 12px | 8px |
| dsh-usage | label-primary 3% | label-primary 8% | 12px | 12~14px |
| **统一值** | **bg-layer-2** | **label-primary 8%** | **12px** | **6px** |

### 弹窗蒙版

| 插件 | 背景 | 模糊 |
|---|---|---|
| dsh-skill-manager | rgba(0,0,0,0.45) | blur(4px) |
| dsh-mcp-manager | rgba(0,0,0,0.45) | blur(4px) |
| dsh-usage | rgba(0,0,0,0.45) | 无 |
| **统一值** | **rgba(0,0,0,0.45)** | **blur(4px)** |

### 过渡时长

| 插件 | 标准过渡 |
|---|---|
| dsh-skill-manager | 120ms ease |
| dsh-mcp-manager | 120ms ease |
| dsh-archive-manager | 120ms ease |
| dsh-remote-access | 120ms ease |
| dsh-agent-rules | 120ms ease |
| dsh-usage | 120ms ease |
| dsh-launcher | 120ms ease |
| **统一值** | **120ms var(--ds-ease-in-out, ease)** |
