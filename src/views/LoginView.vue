<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { Message, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const auth = useAuthStore()
const { t } = useI18n()

// 版本号和 API 地址（用于调试）
const appVersion = ref(import.meta.env.VITE_APP_VERSION || '0.1.11')
const apiBaseURL = ref(import.meta.env.VITE_API_BASE_URL || (__IS_TAURI__ ? 'http://localhost:8080/api/v1' : '/api/v1'))

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

async function onSubmit() {
  error.value = ''

  // 手动空值检查（Element Plus validate() 对未触碰字段会跳过）
  if (!form.email?.trim()) {
    error.value = t('auth.emailInvalid')
    return
  }
  if (!form.password) {
    error.value = t('auth.passwordError')
    return
  }

  if (!formRef.value) {
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  try {
    await auth.login({ email: form.email, password: form.password })
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string }, status?: number }, request?: unknown, message?: string }
    if (err.response) {
      // 服务器返回了错误响应
      error.value = `[${err.response.status}] ${err.response.data?.detail || t('auth.loginFailed')}`
    } else if (err.request) {
      // 请求发出但没有收到响应（网络错误 / CORS / 连接被拒）
      error.value = `网络错误：无法连接到 ${apiBaseURL.value}，请检查网络或安全组`
    } else {
      // 其他错误
      error.value = err.message || t('auth.loginFailed')
    }
    console.error('[LoginError]', err)
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

      <!-- 调试信息：版本号 + API 地址 -->
      <div class="debug-info">
        <span class="debug-version">v{{ appVersion }}</span>
        <span class="debug-url" :title="apiBaseURL">{{ apiBaseURL }}</span>
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
</style>
