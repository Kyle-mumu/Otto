<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { Message, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()

const auth = useAuthStore()
const { t } = useI18n()

// 版本号和 API 地址（用于调试）
const appVersion = ref(import.meta.env.VITE_APP_VERSION || '未知')
const apiBaseURL = ref(__API_BASE_URL__)
// 地址来源标记（platform-default:darwin:tauri 之类）属【内部构建信息】，
// 仅供开发期排障；生产产物不向最终用户暴露（PM 裁决：非必要不加）。
// 构建期来源仍由 vite.config.ts 的 [otto-build] 日志输出，QA 据此断言。
const apiBaseSource = import.meta.env.DEV ? ref(__API_BASE_SOURCE__) : ref('')

const formRef = ref<FormInstance>()
const emailInputRef = ref()
const passwordInputRef = ref()

const form = reactive({
  email: '',
  password: '',
})

const rules = reactive<FormRules>({
  email: [
    { required: true, message: t('auth.emailInvalid'), trigger: 'blur' },
    { type: 'email', message: t('auth.emailInvalid'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('auth.passwordError'), trigger: 'blur' },
    { min: 6, message: t('auth.passwordTooShort'), trigger: 'blur' },
  ],
})

const error = ref('')
const debugLog = ref('')

async function onSubmit() {
  error.value = ''
  debugLog.value = '⏳ 点击登录按钮...'

  // 手动空值检查（Element Plus validate() 对未触碰字段会跳过）
  if (!form.email?.trim()) {
    error.value = t('auth.emailInvalid')
    debugLog.value = '❌ 邮箱为空'
    return
  }
  if (!form.password) {
    error.value = t('auth.passwordError')
    debugLog.value = '❌ 密码为空'
    return
  }

  if (!formRef.value) {
    debugLog.value = '❌ formRef 未初始化'
    return
  }
  try {
    debugLog.value = '⏳ 表单验证中...'
    await formRef.value.validate()
    debugLog.value = '✅ 表单验证通过，正在发送请求...'
  } catch {
    debugLog.value = '❌ 表单验证失败'
    return
  }
  try {
    debugLog.value = `⏳ 正在连接 ${apiBaseURL.value}...`
    await auth.login({ email: form.email, password: form.password })
    debugLog.value = '✅ 登录成功！正在跳转...'
    // 双重保险：auth.store 内部已 router.push，这里再确认一次
    setTimeout(() => {
      if (window.location.pathname === '/login' || window.location.hash === '#/login') {
        debugLog.value = '⏳ 正在手动跳转 dashboard...'
        router.push({ name: 'dashboard' })
      }
    }, 100)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }, status?: number }, request?: unknown, message?: string }
    if (err.response) {
      // 服务器返回了错误响应
      error.value = `[${err.response.status}] ${err.response.data?.detail || t('auth.loginFailed')}`
      debugLog.value = `❌ 服务器返回错误: ${err.response.status} ${err.response.data?.detail || ''}`
    } else if (err.request) {
      // 请求发出但没有收到响应（网络错误 / CORS / 连接被拒）
      error.value = `网络错误：无法连接到 ${apiBaseURL.value}，请检查网络或安全组`
      debugLog.value = `❌ 网络错误: ${err.message || '连接超时'}`
    } else {
      // 其他错误
      error.value = err.message || t('auth.loginFailed')
      debugLog.value = `❌ 其他错误: ${err.message}`
    }
    // H-07：禁止把整个 axios error 打进控制台 ——
    // err.config.data 含明文邮箱+密码，err.config.headers 含 Bearer 令牌，
    // 任何一次登录失败都会把凭据写进浏览器/WebView 控制台。
    // 现只输出非敏感摘要（状态码 + 错误消息）。
    console.error('[LoginError]', { status: err.response?.status, message: err.message })
  }
}
</script>

<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="always">
      <h1 class="auth-title">Otto</h1>
      <p class="auth-subtitle">AI {{ t('team.title') }}</p>

      <el-form ref="formRef" :model="form" :rules="rules" class="auth-form">
        <el-form-item :label="t('auth.email')">
          <el-input
            ref="emailInputRef"
            v-model="form.email"
            type="email"
            :placeholder="t('auth.email')"
            size="large"
            :prefix-icon="Message"
            @keydown.enter="passwordInputRef?.focus()"
          />
        </el-form-item>

        <el-form-item :label="t('auth.password')">
          <el-input
            ref="passwordInputRef"
            v-model="form.password"
            type="password"
            :placeholder="t('auth.password')"
            size="large"
            show-password
            :prefix-icon="Lock"
            @keydown.enter="onSubmit"
          />
        </el-form-item>

        <el-alert
          v-if="error"
          :title="error"
          type="error"
          show-icon
          :closable="false"
        />

        <el-button
          type="primary"
          native-type="button"
          size="large"
          :loading="auth.loading"
          class="btn-submit"
          @click.prevent="onSubmit"
        >
          {{ t('auth.login') }}
        </el-button>
      </el-form>

      <p class="auth-footer">
        {{ t('auth.noAccount') }}？
        <RouterLink to="/register" class="link">{{ t('auth.register') }}</RouterLink>
      </p>

      <!-- 调试信息：版本号 + API 地址（Build-5 起地址在构建期固化，按平台自动选择） -->
      <!-- 地址来源标记只在开发期（import.meta.env.DEV）随 title 显示，生产产物不暴露内部构建信息 -->
      <div class="debug-info">
        <span class="debug-version">v{{ appVersion }}</span>
        <span class="debug-url" :title="apiBaseSource ? `${apiBaseURL}  ←  ${apiBaseSource}` : apiBaseURL">{{ apiBaseURL }}</span>
      </div>

      <!-- 登录状态调试 -->
      <div v-if="debugLog" class="debug-log">
        {{ debugLog }}
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page, #FAFAFA);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
}

.auth-card :deep(.el-card__body) {
  padding: 48px 40px;
}

.auth-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--otto-primary, #E85A3D);
  text-align: center;
  margin: 0 0 4px;
}

.auth-subtitle {
  text-align: center;
  color: #888;
  margin: 0 0 32px;
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-submit {
  width: 100%;
  margin-top: 8px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.link {
  color: var(--otto-primary, #E85A3D);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.debug-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #aaa;
  font-family: monospace;
}

.debug-version {
  font-weight: 600;
  color: #888;
}

.debug-url {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

.debug-log {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  color: #666;
  word-break: break-all;
}
</style>
