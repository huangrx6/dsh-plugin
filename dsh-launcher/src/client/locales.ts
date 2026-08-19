/**
 * Locale dictionary for the launcher — Chinese + English.
 *
 * The keys are intentionally flat so they can be consumed both by the
 * launcher panel (short, action-style) and the workspace (section headings
 * and marketplace labels). The launcher namespace is the same regardless of
 * which subpanel renders; deeper per-panel namespaces would bloat the
 * registry for no benefit.
 */
export const LAUNCHER_NS = "dsh-launcher";

export type LauncherLocaleKey =
 | "launcher"
 | "launcherHint"
 | "personalEntry"
 | "personalEntryHint"
 | "systemEntry"
 | "systemEntryHint"
 | "close"
 | "workspace"
 | "workspaceHint"
 | "workspaceClose"
 | "menuSection"
 | "menuGroupManage"
 | "menuGroupTools"
 | "menuGroupAppearance"
 | "workspaceIdentityHint"
 | "menuSkills"
 | "menuSkillsSubtitle"
 | "menuMcp"
 | "menuMcpSubtitle"
 | "menuRemote"
 | "menuRemoteSubtitle"
 | "menuArchive"
 | "menuArchiveSubtitle"
 | "menuLayout"
 | "menuLayoutSubtitle"
 | "menuAgentRules"
 | "menuAgentRulesSubtitle"
 | "marketTitle"
 | "marketSources"
 | "marketAddSource"
 | "marketSourceName"
 | "marketSourceUrl"
 | "marketSourceBuiltIn"
 | "marketSourceDefault"
 | "marketRefresh"
 | "marketRefreshing"
 | "marketSearch"
 | "marketEmpty"
 | "marketViewAll"
 | "marketViewSource"
 | "marketInstalled"
 | "marketInstall"
 | "marketInstalling"
 | "marketRemove"
 | "marketRemoving"
 | "marketFailed"
 | "marketSourceUp"
 | "marketSourceDown"
 | "marketSourceInvalid"
 | "marketBuiltInLabel"
 | "marketEmptySearch"
 | "marketBuiltInReserve";

export const zhCN: Record<LauncherLocaleKey, string> = {
 launcher: "功能",
 launcherHint: "个人插件 · 系统设置",
 personalEntry: "个人插件",
 personalEntryHint: "个人工作空间（覆盖整个视图）",
 systemEntry: "系统设置",
 systemEntryHint: "打开原生设置弹框",
 close: "关闭",
 workspace: "个人空间",
 workspaceHint: "点击左侧菜单切换视图",
 workspaceClose: "退出空间",
 menuSection: "菜单",
 menuGroupManage: "管理",
 menuGroupTools: "工具",
 menuGroupAppearance: "外观",
 workspaceIdentityHint: "插件与工作区",
 menuSkills: "Skill 管理",
 menuSkillsSubtitle:
  "Skill 列表 + Skill 市场，支持多源数据源、名称模糊筛选与一键安装/卸载。",
 menuMcp: "MCP 管理",
 menuMcpSubtitle:
  "MCP 服务器列表 + MCP 市场，支持多源数据源、一键安装与卡片化查看。",
 menuRemote: "远程访问",
 menuRemoteSubtitle: "Tailscale Serve + 二维码扫码访问本机 dsh。",
 menuArchive: "归档管理",
 menuArchiveSubtitle: "恢复工作区、导出 zip / Markdown。",
 menuLayout: "页面布局",
 menuLayoutSubtitle: "页面材质、阅读宽度、收笔、气泡、轨迹、统计。",
 menuAgentRules: "Agent 全局指令",
 menuAgentRulesSubtitle: "编辑 ~/.dsh/AGENTS.md，注入每个会话的全局 Agent 指令。",
 marketTitle: "市场",
 marketSources: "数据源",
 marketAddSource: "新增数据源",
 marketSourceName: "数据源名称",
 marketSourceUrl: "清单 URL",
 marketSourceBuiltIn: "内置",
 marketSourceDefault: "默认",
 marketRefresh: "刷新市场",
 marketRefreshing: "正在刷新…",
 marketSearch: "按名称或描述筛选",
 marketEmpty: "市场暂无可安装项",
 marketViewAll: "全部",
 marketViewSource: "切换数据源",
 marketInstalled: "已安装",
 marketInstall: "安装",
 marketInstalling: "安装中…",
 marketRemove: "卸载",
 marketRemoving: "卸载中…",
 marketFailed: "操作失败",
 marketSourceUp: "在线",
 marketSourceDown: "离线",
 marketSourceInvalid: "清单无效",
 marketBuiltInLabel: "内置",
 marketEmptySearch: "没有匹配的项",
 marketBuiltInReserve: "内置",
};

export const enUS: Record<LauncherLocaleKey, string> = {
 launcher: "Features",
 launcherHint: "Personal plugins · System settings",
 personalEntry: "Personal workspace",
 personalEntryHint: "Full-screen workspace over the page",
 systemEntry: "System settings",
 systemEntryHint: "Open the native settings panel",
 close: "Close",
 workspace: "Personal workspace",
 workspaceHint: "Pick a section on the left to dive in",
 workspaceClose: "Leave workspace",
 menuSection: "Sections",
 menuGroupManage: "Manage",
 menuGroupTools: "Tools",
 menuGroupAppearance: "Appearance",
 workspaceIdentityHint: "Plugins & workspace",
 menuSkills: "Skills",
 menuSkillsSubtitle:
  "Skill list + Skill marketplace: multi-source feeds, fuzzy name filter, one-click install/remove.",
 menuMcp: "MCPs",
 menuMcpSubtitle:
  "MCP server list + MCP marketplace: multi-source feeds, one-click install, card-based inspection.",
 menuRemote: "Remote access",
 menuRemoteSubtitle: "Tailscale Serve + QR-code access to your local dsh.",
 menuArchive: "Archive",
 menuArchiveSubtitle: "Restore workspaces, export zip or Markdown.",
 menuLayout: "Layout",
 menuLayoutSubtitle:
  "Page material, reading width, scroll end, bubbles, trace, stats.",
 menuAgentRules: "Agent rules",
 menuAgentRulesSubtitle:
  "Edit ~/.dsh/AGENTS.md, the global instructions injected into every session.",
 marketTitle: "Marketplace",
 marketSources: "Sources",
 marketAddSource: "Add source",
 marketSourceName: "Source name",
 marketSourceUrl: "Manifest URL",
 marketSourceBuiltIn: "Built-in",
 marketSourceDefault: "Default",
 marketRefresh: "Refresh",
 marketRefreshing: "Refreshing…",
 marketSearch: "Filter by name or description",
 marketEmpty: "Nothing to install yet",
 marketViewAll: "All",
 marketViewSource: "Switch source",
 marketInstalled: "Installed",
 marketInstall: "Install",
 marketInstalling: "Installing…",
 marketRemove: "Remove",
 marketRemoving: "Removing…",
 marketFailed: "Failed",
 marketSourceUp: "Online",
 marketSourceDown: "Offline",
 marketSourceInvalid: "Invalid manifest",
 marketBuiltInLabel: "Built-in",
 marketEmptySearch: "No matches",
 marketBuiltInReserve: "Built-in",
};
