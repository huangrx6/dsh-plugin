# dsh-launcher

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web 端的"个人空间"插件：把原生设置按钮的入口替换为 launcher 面板，把现有 dsh-* 插件的能力 + 各自的 **Skill 市场** / **MCP 市场** 收纳到一个覆盖整个可视区的全屏画布上。

## 一句话

侧栏底部多了一个"个人插件"按钮——点击弹出 launcher 面板（个人插件 / 系统设置）；点"个人插件"进入全屏工作区，左栏菜单 + 右边卡片式内容，右栏里每个 section 就是一个 dsh-* 插件的可视化（Skill 管理 / MCP 市场 / 远程访问 / 归档管理 / 页面布局）。

## 一图概览

```
侧栏底部设置按钮（原生保留）
  ↓ 点击
Launcher 面板（浮层，半屏偏左下）
  ├─ 个人插件  → 进入 shell.overlay 全屏画布
  └─ 系统设置  → 调用原生设置按钮（DOM click，不抢 trigger）
  ↓ 点"个人插件"
全屏画布（覆盖整个可视视图）
  ├─ 顶部条：标题 + 关闭按钮
  ├─ 左栏菜单：Skill 管理 / MCP 管理 / 远程访问 / 归档管理 / 页面布局
  └─ 右栏内容（卡片化）：
       ├─ Skill 管理：列表 + 详情 + 导入（沿用 dsh-skill-manager 现有功能）
       ├─ Skill 市场：多源数据源，支持切换、排序、模糊筛选
       ├─ MCP 管理：列表 + 详情 + 编辑（沿用 dsh-mcp-manager 现有功能）
       ├─ MCP 市场：同上
       ├─ 远程访问：沿用 dsh-remote-access 现有功能
       ├─ 归档管理：沿用 dsh-archive-manager 现有功能
       └─ 页面布局：沿用 dsh-layout 现有功能
```

## 数据源（市场）

每个市场（Skill / MCP）支持多个数据源，存储在 `localStorage`：

- **默认数据源**：内置一个以 `huangrx6/dsh-plugin` 仓库的 `dsh-launcher/market/builtin.json` 为清单的源
- **新增数据源**：UI 里点"新增数据源"按钮，输入名称 + 清单 URL 即可
- **排序**：数据源顺序 = 展示顺序，第一个 = 默认选中
- **删除**：右键数据源 chip（在自定义数据源上）可以删除（内置源不可删除）
- **筛选**：所有源并集后，再用名称 / 描述模糊筛选

清单协议：

```json
{
  "name": "DSH 内置",
  "description": "官方默认清单",
  "version": 1,
  "items": [
    {
      "id": "skill-write-doc",
      "name": "Write Doc",
      "description": "帮助用户写文档",
      "tags": ["writing", "docs"],
      "author": "huangrx6",
      "version": "0.1.0",
      "kind": "skill",
      "payload": {
        "url": "https://github.com/user/skill-repo",
        "destination": "user-dsh"
      }
    },
    {
      "id": "mcp-foo",
      "name": "Foo MCP",
      "description": "Foo MCP server",
      "tags": ["tools"],
      "kind": "mcp",
      "payload": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "foo-mcp"]
      }
    }
  ]
}
```

每个 item 的 `payload` 由所属插件解释——launcher 把它当不透明对象传给插件的 install/remove 回调。插件按自己的协议解读（Skill 看 `url` + `destination`，MCP 看 `transport` + `command` / `url`）。

## 安装

`dsh-launcher` 依赖 `dsh-skill-manager` 和 `dsh-mcp-manager` 来填充工作区的 Skill / MCP section（不装的话 section 显示占位）。如果你想用 launcher 但不想装 Skill / MCP 市场，`dsh-skill-manager` / `dsh-mcp-manager` 可以单独不装。

```bash
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/0.1.0/dsh-launcher.tgz
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/0.1.0/dsh-skill-manager.tgz
dsh plugin --profile web add https://github.com/huangrx6/dsh-plugin/releases/download/0.1.0/dsh-mcp-manager.tgz
```

路径里的版本号换成 [Releases 页](https://github.com/huangrx6/dsh-plugin/releases) 最新 tag（路径带版本号，文件名不带）。

### 本地开发

```bash
git clone git@github.com:huangrx6/dsh-plugin.git
cd dsh-plugin
for pkg in dsh-launcher dsh-skill-manager dsh-mcp-manager; do
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
    "dsh-skill-manager": "link:/绝对路径/dsh-plugin/dsh-skill-manager",
    "dsh-mcp-manager": "link:/绝对路径/dsh-plugin/dsh-mcp-manager"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-launcher",
        "dsh-skill-manager",
        "dsh-mcp-manager"
      ]
    }
  }
}
```

`cd ~/.dsh/profiles/web && pnpm install`，启动 `npx @deepseek-ai/dsh web --host 127.0.0.1 --port 3080`。

## 架构

`dsh-launcher` 是一个**纯客户端** 插件——宿主侧没有任何状态，全部逻辑在 `src/client/`。客户端打 3 个 bundle：

| Bundle | 作用 | 体积 |
| --- | --- | --- |
| `lib/client.js` | 主入口：侧栏按钮 + 浮层面板 + 工作区全屏画布 | 47.8 kB |
| `lib/client/workspace.js` | 工作区 chrome（导出给其他插件复用） | 18.0 kB |
| `lib/client/market.js` | 市场 shell 组件（导出给 dsh-skill-manager / dsh-mcp-manager 复用） | 30.8 kB |

**其他插件如何接入工作区**：

`dsh-skill-manager` / `dsh-mcp-manager` 在自己的 client `apply()` 里注册到 `dsh-launcher.workspace.section` slot（list, root scope）：

```ts
ctx.slots.inject('dsh-launcher.workspace.section', () => ctx.slots.register({
  name: 'dsh-launcher.workspace.section',
  id: 'skills', // 与 launcher 默认 section 同 id → 覆盖占位
  order: 50,
  label: () => t('marketTab'),
  locale: SKILL_MANAGER_NS,
  inject: () => ({ api, t, launcherT }),
}, SkillMarketSection))
```

`launcher` 通过 `ctx.slots.entries('dsh-launcher.workspace.section')` 拉到这些 section，按 id 覆盖默认的占位 section。装/不装 dsh-skill-manager / dsh-mcp-manager 互不影响：

- 装了 → 该 section 渲染对应 market 组件
- 没装 → 该 section 保持 launcher 的默认占位

## 快捷键

| 键 | 动作 |
| --- | --- |
| `Esc` | 关闭浮层面板 / 退出工作区 |
| `Enter` （在 launcher 按钮上） | 打开浮层面板 |

## 兼容性

- Node ≥ 24
- pnpm ≥ 10
- DSH CLI（`@deepseek-ai/dsh` 0.1.0-rc.6+）

## 测试

```bash
pnpm run test          # 19 个 vitest 用例（manifest 解析、源持久化、fetcher 缓存）
pnpm run typecheck     # tsc 严格类型
pnpm run build         # 4 个 bundle 全部产出
pnpm run check         # typecheck + test + build
```

## License

MIT
