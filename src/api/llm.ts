import axios from 'axios'
import { getToken, setToken, removeToken, isTokenExpired, getRefreshToken, setRefreshToken, removeRefreshToken } from '@/utils/token'
import router from '@/router'

// 方案 42 号：批次 1（B-1 非流式打通）
// 说明：本出口**不复用 `http` 实例**，原因有二 ——
//   1. `http.ts` 的 `timeout: 5000` 对长回复必超时（方案第 5 节列为本批最易踩的坑）；
//   2. LLM 端点返回结构化 `error_code`，不应触发 `http.ts` 的全局 ElMessage 弹窗。
// 故此处独立建实例 + 独立超时，鉴权/刷新逻辑与 `http.ts` 保持同等语义。

const API_BASE_URL: string =
  typeof __API_BASE_URL__ === 'string' && __API_BASE_URL__
    ? __API_BASE_URL__
    : '/api/v1'

// ===== 请求体（对齐后端 `app/schemas/llm.py::LlmChatRequest`）=====
export interface LlmChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmChatRequest {
  /** 必填：服务端据此查 `ai_models` 行并解密 key（不回落全局 key） */
  model_id: string
  messages: LlmChatMessage[]
  temperature?: number
  max_tokens?: number
  json_mode?: boolean
}

// ===== 响应体（对齐后端 `LlmChatResponse`）=====
// 注意：业务失败也返回 HTTP 200，以 `ok=false` + `error_code` 表达。
export interface LlmChatResponse {
  ok: boolean
  content?: string | null
  error_code?: string | null
  tokens_input?: number | null
  tokens_output?: number | null
  total_tokens?: number | null
  generated_at?: string | null
}

/** 方案第 3 节四个 error_code → 用户可读文案（不重试） */
export const LLM_ERROR_TEXT: Record<string, string> = {
  model_not_found: '未找到该模型配置，请到「模型管理」确认',
  model_key_missing: '该模型未配置密钥，请到「模型管理」补填',
  quota_exceeded: '本期额度已用尽，请联系管理员',
  upstream_error: '上游服务暂时不可用，请稍后重试',
}

// ===== 独立实例：仅 LLM 用，超时放宽到 60s =====
const llmHttp = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

llmHttp.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      if (isTokenExpired(token)) {
        removeToken()
        router.push({ name: 'login' })
        return Promise.reject(new Error('Token expired'))
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ===== 401 单次刷新后重试（与 `http.ts` 同语义，不做队列：LLM 调用串行）=====
llmHttp.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        removeToken()
        removeRefreshToken()
        router.push({ name: 'login' })
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
        setToken(data.access_token)
        setRefreshToken(data.refresh_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return llmHttp(originalRequest)
      } catch (refreshError) {
        removeToken()
        removeRefreshToken()
        router.push({ name: 'login' })
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

/**
 * 聊天补全（后端代理，Otto 侧零 key）。
 * 不抛业务异常：网络/HTTP 异常也归一为 `ok=false` 的响应，由调用方渲染错误态。
 */
export async function chatCompletion(payload: LlmChatRequest): Promise<LlmChatResponse> {
  try {
    const { data } = await llmHttp.post<LlmChatResponse>('/llm/chat', payload)
    return data
  } catch (e: any) {
    const status = e?.response?.status
    const detail = e?.response?.data?.detail
    return {
      ok: false,
      error_code: status === 403 ? 'forbidden' : status ? `http_${status}` : 'network_error',
      content: typeof detail === 'string' ? detail : '请求失败，请检查后端服务',
    }
  }
}
