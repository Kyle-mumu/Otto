<script setup lang="ts">
import { useUpdater } from '@/composables/useUpdater'
import { toReadableError } from '@/utils/updaterError'

const { status, updateVersion, updateNotes, downloadProgress, errorMsg, downloadUpdate, relaunchApp, dismiss } = useUpdater()

// 格式化 release notes（简单 markdown -> 换行显示）
function formatNotes(notes: string): string {
  return notes || '优化体验，修复已知问题。'
}
</script>

<template>
  <!-- 更新可用弹窗 -->
  <div v-if="status === 'available'" class="update-overlay" @click.self="dismiss">
    <div class="update-dialog">
      <div class="update-header">
        <span class="update-icon">🔄</span>
        <h3>发现新版本</h3>
      </div>
      <div class="update-body">
        <p class="update-version">Otto v{{ updateVersion }}</p>
        <div class="update-notes">{{ formatNotes(updateNotes) }}</div>
      </div>
      <div class="update-footer">
        <button class="btn-secondary" @click="dismiss">稍后</button>
        <button class="btn-primary" @click="downloadUpdate">立即更新</button>
      </div>
    </div>
  </div>

  <!-- 下载进度弹窗 -->
  <div v-if="status === 'downloading'" class="update-overlay">
    <div class="update-dialog">
      <div class="update-header">
        <span class="update-icon">⬇️</span>
        <h3>正在下载更新</h3>
      </div>
      <div class="update-body">
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: downloadProgress + '%' }"></div>
        </div>
        <p class="progress-text">{{ downloadProgress }}%</p>
      </div>
    </div>
  </div>

  <!-- 下载完成弹窗 -->
  <div v-if="status === 'downloaded'" class="update-overlay">
    <div class="update-dialog">
      <div class="update-header">
        <span class="update-icon">✅</span>
        <h3>更新已就绪</h3>
      </div>
      <div class="update-body">
        <p>更新已下载完成，重启后即可使用新版本。</p>
      </div>
      <div class="update-footer">
        <button class="btn-secondary" @click="dismiss">稍后重启</button>
        <button class="btn-primary" @click="relaunchApp">立即重启</button>
      </div>
    </div>
  </div>

  <!-- 错误提示（静默，不打断用户） -->
  <div v-if="status === 'error' && errorMsg" class="update-error-toast">
    ⚠️ 检查更新失败：{{ toReadableError(errorMsg) }}
  </div>
</template>

<style scoped>
.update-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.update-dialog {
  background: var(--bg-card, #fff);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 420px;
  width: 90%;
  overflow: hidden;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.update-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px 8px;
}

.update-icon {
  font-size: 24px;
}

.update-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-heading, #111);
}

.update-body {
  padding: 8px 24px 20px;
}

.update-version {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--otto-primary, #E85A3D);
}

.update-notes {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-body, #555);
  white-space: pre-wrap;
}

.update-footer {
  display: flex;
  gap: 12px;
  padding: 0 24px 20px;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  font-family: var(--font-primary);
}

.btn-primary {
  background: var(--otto-primary, #E85A3D);
  color: #fff;
}

.btn-primary:hover {
  background: #d14a30;
}

.btn-secondary {
  background: transparent;
  color: var(--text-muted, #888);
  border: 1px solid var(--border-light, #E8E8E8);
}

.btn-secondary:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
  color: var(--text-heading, #111);
}

/* 下载进度 */
.progress-bar-container {
  width: 100%;
  height: 6px;
  background: var(--bg-sidebar-hover, #F0F0F0);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: var(--otto-primary, #E85A3D);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted, #888);
  margin: 0;
}

/* 错误 toast */
.update-error-toast {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.7);
  color: #cf1322;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  z-index: 9999;
  animation: fade-in 0.2s ease;
}
</style>
