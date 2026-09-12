import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// ============================================================
// 平台专属 API / WS 地址 —— 构建期在 Node 侧解析并固化进产物
// ------------------------------------------------------------
// 背景：Vite 的 .env 文件分层（.env / .env.tauri / .env.tauri.local）无法按平台区分。
//       旧方案靠「未入库的本地文件 .env.tauri.local」给 Mac 注入隧道地址，一旦换机或
//       重新 clone，该文件缺失 → Windows 的公网地址被静默注入 Mac 产物。
// 现方案：由 process.platform 在构建期直接决定默认值 → Mac 换机 clone 后行为确定，
//       不依赖任何本地文件；同时保留「绝对地址环境变量」显式覆盖能力（CI / 临时调试）。
//
// 覆盖优先级：
//   1. 绝对地址的 VITE_API_BASE_URL / VITE_WS_BASE_URL（进程环境变量或 .env*.local）
//   2. 平台默认值（仅桌面端 mode=tauri）
//   3. 相对路径 /api/v1（浏览器：走 Vite proxy 或同源）
// ============================================================
const PLATFORM_DEFAULTS: Record<string, { api: string; ws: string }> = {
  // Mac 桌面端：本机 SSH 隧道 / 本地转发 → ECS API
  // 必须用 127.0.0.1，不能用 localhost（WKWebView 会优先解析 IPv6 ::1 而连接失败）
  darwin: { api: 'http://127.0.0.1:8080/api/v1', ws: 'ws://127.0.0.1:8080/api/v1' },
  // Windows 桌面端：直连阿里云 ECS 公网 IP（演示环境，无需隧道）
  win32: { api: 'http://121.43.110.135:8000/api/v1', ws: 'ws://121.43.110.135:8000/api/v1' },
}

// 浏览器（开发 / Web 生产）默认走相对路径
const BROWSER_DEFAULTS = { api: '/api/v1', ws: '/api/v1' }

const isAbsoluteUrl = (v?: string) => /^https?:\/\//.test(v ?? '')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isTauri = mode === 'tauri'

  // 平台判定。OTTO_API_PLATFORM 仅用于在非目标平台上验证另一平台的注入分支（QA 用），
  // 例：OTTO_API_PLATFORM=win32 pnpm build:tauri  → 产物应含 Windows 地址
  const platform = process.env.OTTO_API_PLATFORM || process.platform

  // 显式覆盖：只接受绝对地址，避免 .env 里的相对路径 /api/v1 短路平台默认值
  const apiOverride = isAbsoluteUrl(env.VITE_API_BASE_URL) ? env.VITE_API_BASE_URL : undefined
  const wsOverride = isAbsoluteUrl(env.VITE_WS_BASE_URL) ? env.VITE_WS_BASE_URL : undefined

  const fallback = isTauri ? (PLATFORM_DEFAULTS[platform] ?? BROWSER_DEFAULTS) : BROWSER_DEFAULTS
  const apiBaseUrl = apiOverride ?? fallback.api
  const wsBaseUrl = wsOverride ?? fallback.ws
  const source = `${apiOverride ? 'env-override' : 'platform-default'}:${platform}:${isTauri ? 'tauri' : 'browser'}`

  // 构建期打印：CI / 本地可直接核对注入结果（QA 可据此断言）
  console.log(`[otto-build] mode=${mode} platform=${platform}`)
  console.log(`[otto-build] __API_BASE_URL__ = ${apiBaseUrl}  (${source})`)
  console.log(`[otto-build] __WS_BASE_URL__  = ${wsBaseUrl}  (${source})`)

  return {
    // Tauri 生产环境通过自定义协议（macOS: tauri://localhost / Windows: http://tauri.localhost）加载前端，
    // 绝对路径 /assets/... 会解析到协议根目录并 404 → 白屏。必须使用相对路径。
    base: './',
    define: {
      __IS_TAURI__: isTauri,
      __BUILD_VERSION__: JSON.stringify(new Date().toISOString()),
      // 构建期固化，运行时不再读 import.meta.env（消除 .env 分层带来的不确定性）
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
      __WS_BASE_URL__: JSON.stringify(wsBaseUrl),
      __API_BASE_SOURCE__: JSON.stringify(source),
    },
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          ws: true,
        },
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
        },
      },
    },
  }
})
