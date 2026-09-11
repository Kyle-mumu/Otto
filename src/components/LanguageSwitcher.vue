<template>
  <el-dropdown @command="switchLanguage" trigger="click">
    <span class="lang-trigger">
      <span class="lang-icon">🌐</span>
      <span class="lang-label">{{ currentLang === 'zh-CN' ? '中文' : 'EN' }}</span>
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN" :disabled="currentLang === 'zh-CN'">
          <span class="lang-option">
            <span class="lang-flag">🇨🇳</span>
            <span>中文</span>
            <el-icon v-if="currentLang === 'zh-CN'" class="check-icon"><check /></el-icon>
          </span>
        </el-dropdown-item>
        <el-dropdown-item command="en-US" :disabled="currentLang === 'en-US'">
          <span class="lang-option">
            <span class="lang-flag">🇺🇸</span>
            <span>English</span>
            <el-icon v-if="currentLang === 'en-US'" class="check-icon"><check /></el-icon>
          </span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown, Check } from '@element-plus/icons-vue'
import { setLocale } from '@/i18n'

const { locale } = useI18n()
const currentLang = computed(() => locale.value as string)

function switchLanguage(lang: string) {
  setLocale(lang)
}
</script>

<style scoped>
.lang-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
  font-size: 13px;
  color: var(--arkham-text-primary, #1f2937);
}

.lang-trigger:hover {
  background-color: var(--arkham-bg-hover, #f3f4f6);
}

.lang-icon {
  font-size: 16px;
}

.lang-label {
  font-weight: 500;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.lang-flag {
  font-size: 18px;
}

.check-icon {
  margin-left: auto;
  color: var(--arkham-primary, #E85A3D);
}
</style>
