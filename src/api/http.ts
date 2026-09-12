import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, setToken, removeToken, isTokenExpired, getRefreshToken, setRefreshToken, removeRefreshToken } from '@/utils/token'
import router from '@/router'

// API 基址解析（三档优先级）：
//   1. 绝对地址（http/https 开头）→ 直接使用。来源：进程环境变量 > .env.tauri.local > .env.tauri
//   2. Tauri 桌面端 + 相对/缺失地址 → 回退到本机隧道地址 http://127.0.0.1:8080/api/v1
//      （必须用 127.0.0.1，不能用 localhost：WKWebView 会优先解析 IPv6 ::1 而连接失败）
//   3. 浏览器（开发/生产）→ /api/v1（走 Vite proxy 或同源）
// 说明：Vite 会把 .env 中的 `/api/v1` 原样注入 import.meta.env，相对路径在桌面端
//       （tauri:// 自定义协议）下无 origin 可解析，因此这里显式判定绝对地址，避免回退逻辑被短路。
const ENV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const IS_ABSOLUTE_URL = /^https?:\/\//.test(ENV_API_BASE_URL || '')
const API_BASE_URL = IS_ABSOLUTE_URL
  ? ENV_API_BASE_URL
  : (__IS_TAURI__ ? 'http://127.0.0.1:8080/api/v1' : '/api/v1')

const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ===== Token 刷新队列（防止并发刷新） =====
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token!)
    }
  })
  failedQueue = []
}

// ===== 请求拦截：自动附加 JWT =====
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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

// ===== 响应拦截：401 自动刷新 token + 重试 =====
http.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response) {
      const { status, data } = error.response
      const message = data?.detail || data?.message || '请求失败'

      // ==== 401 自动刷新 token ====
      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // 正在刷新中，加入队列等待
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return http(originalRequest)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          processQueue(new Error('No refresh token'))
          removeToken()
          removeRefreshToken()
          router.push({ name: 'login' })
          return Promise.reject(error)
        }

        // 调用刷新端点
        return new Promise((resolve, reject) => {
          axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
            .then((response) => {
              const { access_token, refresh_token } = response.data
              setToken(access_token)
              setRefreshToken(refresh_token)
              processQueue(null, access_token)
              originalRequest.headers.Authorization = `Bearer ${access_token}`
              resolve(http(originalRequest))
            })
            .catch((refreshError) => {
              processQueue(refreshError)
              removeToken()
              removeRefreshToken()
              router.push({ name: 'login' })
              ElMessage.error('登录已过期，请重新登录')
              reject(refreshError)
            })
            .finally(() => {
              isRefreshing = false
            })
        })
      }

      // ==== 其他错误处理 ====
      // 注意：status === 401 的情况已在响应拦截器的刷新逻辑中处理（含 _retry 失败后清理）
      // 此处无需重复处理，避免与双令牌刷新机制冲突
      if (status === 403) {
        ElMessage.error('权限不足')
      } else if (status === 422) {
        // 校验错误，由调用方处理
      } else if (status === 429) {
        ElMessage.error('请求过于频繁，请稍后重试')
      } else if (status >= 500) {
        ElMessage.error('服务器错误，请稍后重试')
      } else {
        ElMessage.error(message)
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查后端服务是否运行')
    }
    return Promise.reject(error)
  }
)

export default http
