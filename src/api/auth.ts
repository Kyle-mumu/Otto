import http from './http'
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '@/types/api'

/** 注册 */
export function register(data: RegisterRequest) {
  return http.post<User>('/auth/register', data)
}

/** 登录 */
export function login(data: LoginRequest) {
  return http.post<LoginResponse>('/auth/login', data)
}

/** 刷新 token */
export function refreshToken(refreshToken: string) {
  return http.post<LoginResponse>('/auth/refresh', { refresh_token: refreshToken })
}

/** 获取当前用户信息 */
export function getCurrentUser() {
  return http.get<User>('/auth/me')
}
