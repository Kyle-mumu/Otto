import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

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

// ------------------------------------------------------------
// 去除产物中的 crossorigin 属性 —— Tauri 自定义协议白屏修复（0.1.24）
// ------------------------------------------------------------
// 根因：Vite 的 modulePreload 机制会给入口 <script type="module"> 与 <link rel="stylesheet">
//       注入 crossorigin 属性。在 Tauri 的自定义协议（macOS: tauri://localhost）下，
//       origin 被判为 opaque/null，WKWebView 的 CORS 检查会静默拒绝执行该模块脚本
//       → Vue 从不挂载 → 只有窗口标题正常、内容全白、无 JS 报错、无 API 请求。
//       （运行时证据：javascript_gc_heap_capacity_mb: 0 —— JS 引擎未分配堆）
// 处理（两个钩子各管一半，缺一不可）：
//       ① build.modulePreload=false 从源头不注入；
//       ② transformIndexHtml 剥离 index.html 里注入的 crossorigin 属性；
//       ③ generateBundle 剥离 chunk 代码里「运行时」动态预取逻辑中的跨域属性。
//
// 为什么 ③ 必须在 generateBundle（而非 renderChunk / transformIndexHtml）：
//   modulePreload=false 只能关掉 html 注入，关不掉 Vite 生成在 JS 里的 __vitePreload
//   助手（预取路由懒加载 chunk 的分支），其形态为运行时赋值
//     link.crossOrigin = ""
//   该赋值既不在 html 字符串里（transformIndexHtml 够不到），也**晚于** renderChunk
//   钩子链才被写入 chunk —— 实测：enforce:'post' 的 renderChunk 里该处残留恒为 1 处、
//   钩子自身的 replaces 命中数为 0，即剥离点早于注入点，钩子「看着在干活实际不生效」。
//   因此必须落到 generateBundle（bundle 已定型、写盘前的最后一道口）逐个改写 chunk.code。
// 残留后果：首屏（html 直引）正常渲染 → 点「登录」触发动态 import → 预取带着 CORS 凭证
//   模式被 WKWebView 静默拒绝 → LoginView chunk 永不执行 → 路由已切但组件不挂载 → 整窗白。
//
// 严格区分大小写：只匹配 `crossOrigin=""`（大写 C、带 =""）。
// 绝不可用 /crossorigin/gi —— Element Plus 组件里存在 23 处小写 `crossorigin`
// prop 声明（如 crossorigin:{type:String}），误删会破坏 UI 库行为。
function stripCrossorigin() {
  return {
    name: 'otto-strip-crossorigin',
    enforce: 'post' as const,
    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string) {
        return html.replace(/\s+crossorigin(="[^"]*")?/g, '')
      },
    },
    // 剥离点必须落在这里：__vitePreload 的运行时赋值晚于 renderChunk 钩子链写入 chunk，
    // 在 renderChunk 阶段该残留尚不存在（实测命中数恒为 0）。generateBundle 是写盘前
    // 最后可改写 chunk.code 的钩子，bundle 在此已完全定型。
    generateBundle(_options: unknown, bundle: Record<string, any>) {
      for (const file of Object.values(bundle)) {
        if (file?.type !== 'chunk') continue
        if (!file.code.includes('crossOrigin=""')) continue
        // 必须「整段吃掉赋值语句」，绝不可只剥掉等号右边的值：
        //   原码   ...m.as="script"),m.crossOrigin="",m.href=d,...
        //   只剥值 → ...m.as="script"),m.,m.href=d,...   ← `m.` 是语法错误，
        //            整个入口 chunk 解析失败 ⇒ #app 永不挂载 ⇒ 整窗白（比点登录更早）
        //   整段吃 → ...m.as="script"),m.href=d,...      ← 语法自洽，语义等价
        // 匹配域严格限定为「赋值形态」：标识符/属性访问 + .crossOrigin="" + 尾随【逗号】。
        //   - 不碰 crossOrigin="anonymous"（值非空串，不等匹配）
        //   - 不碰 Element Plus 的 crossorigin:{...} prop 形态（小写 c，不等匹配）
        //   - 尾随必须是逗号：若该赋值是语句末尾（; 或 } 收尾），形态不同、不在此式，
        //     本项残留实测只有「逗号串联」一种（入口 chunk 唯一 1 处），故不留半截。
        file.code = file.code.replace(
          /([\w$.)\]]+)\.crossOrigin=""\s*,\s*/g,
          '',
        )
        // 兜底自检：若某种形态漏网，宁可整段报错也不产出破语法的 chunk
        if (file.code.includes('.crossOrigin=""')) {
          throw new Error(
            `[otto-strip-crossorigin] 仍有未剥离的 .crossOrigin="" 残留: ${file.fileName}`,
          )
        }
      }
    },
  }
}

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
    build: {
      // 关闭 modulePreload：避免 Vite 为 preload 复用而给入口脚本注入 crossorigin
      modulePreload: false,
    },
    define: {
      __IS_TAURI__: isTauri,
      // vue-i18n 9.x 的 JIT 运行时解析器（core-base 的 H0e）只在构建期 define
      // __INTLIFY_JIT_COMPILATION__ === true 时才会被挂载；缺此 define 则
      // 产物中该标识符原样残留（裸全局读取）→ 运行时仍走旧的「消息必须是已编译函数」
      // 解析路径 E2，而 unplugin-vue-i18n 预编译产物是 AST 对象 → 类型错配 →
      // 抛 SyntaxError（错误码超出 message 表 ⇒ 消息体为空）→ 渲染中断 → 白屏。
      // 与 jit:true（src/i18n/index.ts）配套，两者缺一不可。
      __INTLIFY_JIT_COMPILATION__: true,
      __BUILD_VERSION__: JSON.stringify(new Date().toISOString()),
      // 构建期固化，运行时不再读 import.meta.env（消除 .env 分层带来的不确定性）
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
      __WS_BASE_URL__: JSON.stringify(wsBaseUrl),
      __API_BASE_SOURCE__: JSON.stringify(source),
    },
    plugins: [
      vue(),
      // i18n 消息构建期预编译 —— 消除运行时 message compiler 的 new Function()
      // 根因：生产 CSP 为 script-src 'self'（无 'unsafe-eval'），而 vue-i18n 默认走
      //       运行时 compiler（@intlify/message-compiler）把消息字符串编译成函数，
      //       内部用 new Function("return <code>") → 被 CSP 拒 → EvalError →
      //       MainLayout（唯一大量 t() 的布局组件）渲染中断 → #app 有 DOM 但整窗白。
      // 处理：本插件在构建期把 locales/** 预编译为 AST 函数，配合 index.ts 的
      //       jit:true，运行时不再调用 new Function。
      // 范围：只处理 ./src/i18n/locales/**，与 stripCrossorigin() 正交互不影响。
      VueI18nPlugin({
        include: fileURLToPath(new URL('./src/i18n/locales/**', import.meta.url)),
      }),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
      stripCrossorigin(),
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
