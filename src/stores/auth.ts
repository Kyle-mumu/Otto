import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, RegisterRequest } from '@/types/api'
import { login as apiLogin, register as apiRegister, getCurrentUser } from '@/api/auth'
import { setToken, removeToken, getToken, setRefreshToken, removeRefreshToken } from '@/utils/token'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!getToken() && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(data: LoginRequest) {
    loading.value = true
    try {
      const res = await apiLogin(data)
      setToken(res.data.access_token)
      setRefreshToken(res.data.refresh_token)
      await fetchUser()
      await router.push({ name: 'dashboard' })
    } catch (err: any) {
      logout()
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    loading.value = true
    try {
      await apiRegister(data)
      // 注册成功后自动登录
      await login({ email: data.email, password: data.password })
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    const res = await getCurrentUser()
    user.value = res.data
  }

  function logout() {
    user.value = null
    removeToken()
    removeRefreshToken()
    router.push({ name: 'login' })
  }

  // 初始化：有 token 就拉用户信息
  async function init() {
    if (getToken()) {
      try {
        await fetchUser()
      } catch {
        logout()
      }
    }
  }

  return { user, loading, isLoggedIn, isAdmin, login, register, fetchUser, logout, init }
})
