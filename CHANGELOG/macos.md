# Otto 版本更新记录 — macOS

> 记录规则：每个版本倒序追加。**v0.2.1 为首次建版、记录全量功能**；此后每个版本**只需写「新增 / 修复」增量**，未变更的功能不再重述。

---

## v0.2.1 — 2026-09-26（首次建版 · 全量功能记录）

**基线**：远端 `main`（版本号四份文件统一升至 `0.2.1`：`src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `package.json` / `.env.tauri`）
**构建**：Tauri 2 本地构建（`pnpm tauri build`）· 产物 `Otto.app` / `Otto.app.tar.gz`
**升级基址**：`http://121.43.110.135:8000/updates/`（macOS 侧 `latest.json` 的 `darwin-x86_64` / `darwin-aarch64` 段，**双架构保留**）

> ⚠️ **平台差异（与 Windows 版不同）**：macOS 桌面端 API/WS 基址由 `vite.config.ts` 在**构建期**按平台决定，macOS 走 **`http://127.0.0.1:8080/api/v1`**（本机 SSH 隧道 / 本地转发），Windows 走 `121.43.110.135:8000` 直连。跨平台共用文件（`tauri.conf.json` / `productName` / `pubkey`）**禁单平台改动**。

### 一、账号与认证
- 登录 / 注册（`LoginView` / `RegisterView`），Token 持久化（`utils/token.ts`）
- 路由守卫：未认证跳登录；已认证访问 guest 页跳 Dashboard
- **管理员门（admin-only）**：`/dashboard/models` 路由级 + 菜单级双重校验（直链无法绕过）

### 二、工作台（Dashboard）
- 首页总览 `DashboardView`：指标卡（`MetricCard`）、网络状态徽标（`NetworkStatusBadge`）
- 主布局 `MainLayout`：侧边菜单 + 顶栏 + 内容区（**弹性收缩，支持半屏/窗口化**）

### 三、核心业务模块（15 条受保护路由）
| 路由 | 功能 |
|---|---|
| `/dashboard/experiences` | 经验库（经验卡片、经验轨迹 `ExperienceTraceTab`） |
| `/dashboard/tasks` | 任务列表 + 任务详情 `/dashboard/task/:id` |
| `/dashboard/models` | 模型管理（**admin only**） |
| `/dashboard/quotas` | 配额管理 |
| `/dashboard/usage` | 用量统计 |
| `/dashboard/analytics` | 数据分析看板 `AnalyticsDashboard` |
| `/dashboard/scheduled-tasks` | 定时任务 |
| `/dashboard/rules` | 规则引擎 |
| `/dashboard/notifications` | 通知中心 |
| `/dashboard/ai-suggestions` | AI 建议中心 |
| `/dashboard/team` | 团队管理 |
| `/dashboard/settings` | 系统设置 |
| `/dashboard/session/:id` | 会话详情（含执行日志 `ExecutionLogTab`、追踪时间线 `TraceTimelineTab`） |

### 四、AI 对话与协作
- 对话面板 `ChatPanel`：与后端 LLM 网关交互
- 追踪时间线 `TraceTimelineTab`：展示推理/工具调用链路
- 执行日志 `ExecutionLogTab`：任务执行过程日志
- WebSocket 实时通道（`stores/websocket.ts`）

### 五、IM 集成（飞书 / 企业微信）
- 机器人绑定面板 `im/ImBindingPanel`
- 机器人管理面板 `im/ImBotPanel`
- 接口层 `api/imBot.ts`

### 六、桌面端能力（Tauri 2）
- **应用内自动更新**：`tauri-plugin-updater` + `SystemUpdatePanel` / `UpdateDialog` / `composables/useUpdater.ts`
  - 更新源：`latest.json` 的 `darwin-x86_64` / `darwin-aarch64` 段
  - 更新流程：检查 → 下载 → 签名校验 → 安装重启
- 进程管理：`tauri-plugin-process`（更新后重启）
- 网络状态检测：`api/network.ts` + `SettingsNetworkView`

### 七、国际化
- 语言切换器 `LanguageSwitcher`（中英双语）

### 八、诊断与桥接
- `__bridge_log` 命令：劫持 `window.onerror` / `unhandledrejection` / `console.error`，前端报错落 Rust 侧日志
- 错误提示工具 `utils/updaterError.ts`：更新器错误码 → 中文可读文案

### 九、其他
- OCR 导入弹窗 `OCRImportModal`
- 404 兜底页 `NotFoundView`

### 已知问题
- GitHub Actions 提示 `Node.js 20 is deprecated`（平台侧强升 Node 24，**非阻断**）
- DMG 打包曾失败（未定论，现走 `.app.tar.gz` 更新路径）
- macOS ATS 限制：公网 HTTP 需 `NSAppTransportSecurity` 放行（本地走 127.0.0.1 不受影响）
