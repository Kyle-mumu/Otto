<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { Message, Lock, User } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const auth = useAuthStore()
const { t } = useI18n()

const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const rules = reactive<FormRules>({
  username: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { min: 2, max: 32, message: t('validation.minLength', { min: 2 }) + '-32', trigger: 'blur' },
  ],
  email: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { type: 'email', message: t('validation.email'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    { min: 8, message: t('validation.minLength', { min: 8 }), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('validation.required'), trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (value !== form.password) {
          callback(new Error(t('validation.passwordMismatch')))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

const error = ref('')

async function onSubmit() {
  error.value = ''

  if (!form.username?.trim()) { error.value = t('validation.required'); return }
  if (!form.email?.trim()) { error.value = t('validation.required'); return }
  if (!form.password) { error.value = t('validation.required'); return }
  if (form.password.length < 8) { error.value = t('validation.minLength', { min: 8 }); return }
  if (form.password !== form.confirmPassword) { error.value = t('validation.passwordMismatch'); return }

  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    await auth.register({
      username: form.username,
      email: form.email,
      password: form.password,
    })
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail || t('auth.registerFailed')
  }
}
</script>

<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="always">
      <h1 class="auth-title">ARKHAM</h1>
      <p class="auth-subtitle">{{ t('auth.createAccount') }}</p>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="onSubmit" class="auth-form">
        <el-form-item :label="t('auth.username')" prop="username">
          <el-input
            v-model="form.username"
            :placeholder="t('auth.username')"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item :label="t('auth.email')" prop="email">
          <el-input
            v-model="form.email"
            type="email"
            :placeholder="t('auth.email')"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item :label="t('auth.password')" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="t('validation.minLength', { min: 8 })"
            size="large"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item :label="t('auth.confirmPassword')" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            :placeholder="t('auth.confirmPassword')"
            size="large"
            show-password
            :prefix-icon="Lock"
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
          {{ t('auth.register') }}
        </el-button>
      </el-form>

      <p class="auth-footer">
        {{ t('auth.hasAccount') }}？
        <RouterLink to="/login" class="link">{{ t('auth.login') }}</RouterLink>
      </p>
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
  color: var(--arkham-primary, #E85A3D);
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
  color: var(--arkham-primary, #E85A3D);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>
