<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUpdater } from '@/composables/useUpdater'
import { toReadableError } from '@/utils/updaterError'

const { status, currentVersion, lastCheckedAt, updateVersion, checkForUpdate } = useUpdater()

// 面板本地检查结果：与启动静默检查分离，避免互相覆盖
const checkResult = ref<'idle' | 'checking' | 'latest' | 'available' | 'error'>('idle')
const localError = ref('')

const displayVersion = computed(() => currentVersion.value || '未知')
const displayCheckedAt = computed(() => lastCheckedAt.value || '未知')

async function handleCheck() {
  checkResult.value = 'checking'
  localError.value = ''
  try {
    await checkForUpdate()
    // 检查完成后按共享状态判定结果
    if (status.value === 'available') {
      checkResult.value = 'available'
    } else if (status.value === 'error') {
      checkResult.value = 'error'
      localError.value = toReadableError('检查更新失败')
    } else {
      checkResult.value = 'latest'
    }
  } catch {
    checkResult.value = 'error'
    localError.value = '未知原因'
  }
}
</script>

<template>
  <div class="system-update-panel">
    <div class="panel-row">
      <span class="panel-label">当前版本</span>
      <span class="panel-value">{{ displayVersion }}</span>
    </div>

    <div class="panel-row">
      <span class="panel-label">上次检查</span>
      <span class="panel-value">{{ displayCheckedAt }}</span>
    </div>

    <div class="panel-actions">
      <button
        class="btn-check"
        :disabled="checkResult === 'checking'"
        @click="handleCheck"
      >
        {{ checkResult === 'checking' ? '正在检查更新…' : '检查更新' }}
      </button>
    </div>

    <p v-if="checkResult === 'latest'" class="panel-hint">已是最新版本</p>
    <p v-else-if="checkResult === 'available'" class="panel-hint">发现新版本 v{{ updateVersion || '未知' }}</p>
    <p v-else-if="checkResult === 'error'" class="panel-error">
      检查更新失败：{{ localError }}
    </p>
  </div>
</template>

<style scoped>
.system-update-panel {
  padding: 16px 0;
}

.panel-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color, #ebeef5);
}

.panel-label {
  color: var(--text-muted, #888);
}

.panel-value {
  color: var(--text-primary, #303133);
}

.panel-actions {
  margin-top: 16px;
}

.btn-check {
  padding: 8px 20px;
  border: 1px solid var(--brand-color, #E85A3D);
  border-radius: 6px;
  background: transparent;
  color: var(--brand-color, #E85A3D);
  cursor: pointer;
  font-size: 14px;
}

.btn-check:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.panel-hint {
  margin-top: 12px;
  color: var(--text-muted, #888);
  font-size: 13px;
}

.panel-error {
  margin-top: 12px;
  color: #cf1322;
  font-size: 13px;
}
</style>
