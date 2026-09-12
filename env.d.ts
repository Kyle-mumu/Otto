/// <reference types="vite/client" />

// 本项目所有构建期注入常量的唯一声明位置（tsconfig.app.json 的 include 已包含本文件）。
// ⚠️ 不要再在 src/ 下重复声明这些常量：会被同一 compilation 加载两次并触发 TS2451。
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __TAURI_INTERNALS__?: object
}

declare const __IS_TAURI__: boolean
declare const __BUILD_VERSION__: string
/** 构建期固化的 API 基址（由 vite.config.ts 按平台解析，见 V1.3 批次1 Build-5） */
declare const __API_BASE_URL__: string
/** 构建期固化的 WebSocket 基址 */
declare const __WS_BASE_URL__: string
/** 基址来源标记，用于排障：env-override / platform-default:<platform>:<tauri|browser> */
declare const __API_BASE_SOURCE__: string
