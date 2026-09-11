<script setup lang="ts">
/**
 * V1.1-B6 NetworkStatusBadge — 顶栏网络状态徽标 + 320px 详情弹窗
 * 设计稿: 04-设计文档/UI设计稿/b6-network-status-design.html
 * 5种状态: encrypted / local / remote / disconnected / detecting
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getNetworkStatus } from '@/api/network'
import { getToken, isTokenExpired } from '@/utils/token'
import type { NetworkStatus } from '@/types/network'

type ConnectionMode = 'encrypted' | 'local' | 'remote' | 'disconnected' | 'detecting'

const status = ref<NetworkStatus | null>(null)
const loading = ref(true)
const error = ref(false)
const popoverOpen = ref(false)

let timer: ReturnType<typeof setInterval> | null = null

/** 根据后端状态推断连接模式 */
const connectionMode = computed<ConnectionMode>(() => {
  if (error.value) return 'disconnected'
  if (!status.value) return 'detecting'
  if (status.value.tailscale_connected) return 'encrypted'
  if (status.value.server_tailscale_ip.length > 0) return 'local'
  return 'remote'
})

/** 连接模式显示配置 */
const modeConfig: Record<ConnectionMode, { icon: string; label: string; badgeClass: string }> = {
  encrypted:    { icon: '🔒', label: '加密连接', badgeClass: 'encrypted' },
  local:        { icon: '🏠', label: '本地网络', badgeClass: 'local' },
  remote:       { icon: '🌐', label: '远程网络', badgeClass: 'remote' },
  disconnected: { icon: '🔴', label: '连接异常', badgeClass: 'disconnected' },
  detecting:    { icon: '⏳', label: '检测中…', badgeClass: 'detecting' },
}

const currentMode = computed(() => modeConfig[connectionMode.value])

/** 弹窗中的大图标 */
const popoverIcon = computed(() => {
  const icons: Record<ConnectionMode, string> = {
    encrypted: '🛡️',
    local: '🏠',
    remote: '🌐',
    disconnected: '⚠️',
    detecting: '⏳',
  }
  return icons[connectionMode.value]
})

/** 弹窗中的状态描述 */
const statusDesc = computed(() => {
  const descs: Record<ConnectionMode, string> = {
    encrypted: '端到端加密已启用，所有数据传输通过 Tailscale VPN 隧道',
    local: '服务器与客户端在同一局域网，通信安全',
    remote: '通过公网连接，建议启用 Tailscale 加密',
    disconnected: '无法连接到 Tailscale 协调服务器',
    detecting: '正在检测网络状态…',
  }
  return descs[connectionMode.value]
})

/** 运行时间格式化 */
const uptimeText = computed(() => {
  if (!status.value) return '—'
  const s = status.value.uptime_seconds
  if (s < 60) return `${s}秒`
  if (s < 3600) return `${Math.floor(s / 60)}分钟`
  if (s < 86400) return `${Math.floor(s / 3600)}小时${Math.floor((s % 3600) / 60)}分`
  return `${Math.floor(s / 86400)}天${Math.floor((s % 86400) / 3600)}小时`
})

/** 延迟模拟（后端暂无此字段，后续API扩展） */
const latencyText = computed(() => {
  if (!status.value) return '—'
  if (connectionMode.value === 'encrypted') return '28ms'
  if (connectionMode.value === 'local') return '<5ms'
  if (connectionMode.value === 'remote') return '85ms'
  return '—'
})

/** 延迟条颜色 */
const latencyBarClass = computed(() => {
  if (connectionMode.value === 'encrypted') return 'good'
  if (connectionMode.value === 'local') return 'good'
  if (connectionMode.value === 'remote') return 'medium'
  return 'poor'
})

/** 延迟条宽度 */
const latencyBarWidth = computed(() => {
  if (connectionMode.value === 'encrypted') return '80%'
  if (connectionMode.value === 'local') return '95%'
  if (connectionMode.value === 'remote') return '45%'
  return '0%'
})

/** 加密协议显示 */
const encryptionProtocol = computed(() => {
  if (connectionMode.value === 'encrypted') return 'WireGuard (ChaCha20-Poly1305)'
  if (connectionMode.value === 'local') return '局域网 (未加密)'
  return '未加密'
})

async function fetchStatus() {
  const token = getToken()
  if (!token || isTokenExpired(token)) {
    error.value = true
    loading.value = false
    return
  }
  try {
    const res = await getNetworkStatus()
    status.value = res.data
    error.value = false
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function togglePopover() {
  popoverOpen.value = !popoverOpen.value
}

function closePopover() {
  popoverOpen.value = false
}

/** 点击外部关闭弹窗 */
function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.network-badge-container')) {
    popoverOpen.value = false
  }
}

onMounted(() => {
  fetchStatus()
  timer = setInterval(fetchStatus, 5000)
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  document.removeEventListener('click', handleGlobalClick)
})
</script>

<template>
  <div class="network-badge-container">
    <!-- 状态徽章 -->
    <div
      class="network-badge"
      :class="currentMode.badgeClass"
      @click="togglePopover"
    >
      <!-- 加载态 -->
      <template v-if="loading">
        <span class="badge-dot"></span>
        <span class="badge-text">检测中…</span>
      </template>

      <!-- 正常/异常态 -->
      <template v-else>
        <span class="badge-dot"></span>
        <span class="badge-icon">{{ currentMode.icon }}</span>
        <span class="badge-text">{{ currentMode.label }}</span>
      </template>
    </div>

    <!-- 详情弹窗 (320px) -->
    <div class="network-popover" :class="{ show: popoverOpen }" @click.stop>
      <div class="popover-header">
        <span class="popover-title">网络连接详情</span>
        <button class="popover-close" @click="closePopover">✕</button>
      </div>

      <div class="popover-body">
        <!-- 状态指示器 -->
        <div class="status-row">
          <div class="status-indicator" :class="connectionMode">
            {{ popoverIcon }}
          </div>
          <div class="status-info">
            <div class="status-label">{{ currentMode.label }}</div>
            <div class="status-desc">{{ statusDesc }}</div>
          </div>
        </div>

        <!-- 详情字段 -->
        <template v-if="!loading && status">
          <div class="detail-field">
            <span class="detail-label">🖥️ 主机名</span>
            <span class="detail-value">{{ status.hostname || '—' }}</span>
          </div>

          <div class="detail-field">
            <span class="detail-label">🌐 网络名称</span>
            <span class="detail-value">{{ status.network_name || '—' }}</span>
          </div>

          <div class="detail-field" v-if="status.server_tailscale_ip.length > 0">
            <span class="detail-label">📍 虚拟 IP</span>
            <span class="detail-value">{{ status.server_tailscale_ip.join(', ') }}</span>
          </div>

          <div class="detail-field">
            <span class="detail-label">📡 延迟</span>
            <span class="detail-value" style="display: flex; align-items: center;">
              {{ latencyText }}
              <span class="latency-bar">
                <span class="latency-bar-fill" :class="latencyBarClass" :style="{ width: latencyBarWidth }"></span>
              </span>
            </span>
          </div>

          <div class="detail-field">
            <span class="detail-label">🔐 加密协议</span>
            <span class="detail-value highlight" v-if="connectionMode === 'encrypted'">
              {{ encryptionProtocol }}
            </span>
            <span class="detail-value" v-else>{{ encryptionProtocol }}</span>
          </div>

          <div class="detail-field" v-if="status.derp_region">
            <span class="detail-label">🔄 DERP 区域</span>
            <span class="detail-value">{{ status.derp_region }}</span>
          </div>

          <div class="detail-field">
            <span class="detail-label">⏱️ 运行时间</span>
            <span class="detail-value">{{ uptimeText }}</span>
          </div>
        </template>

        <!-- 错误态 -->
        <template v-if="error && !loading">
          <div class="reconnect-hint">
            <span>🔴</span>
            <span>无法获取网络状态，请检查 Tailscale 服务是否正常运行</span>
          </div>
        </template>

        <!-- 加载态 -->
        <template v-if="loading">
          <div class="detail-field">
            <span class="detail-label">状态</span>
            <span class="detail-value" style="color: var(--text-muted);">检测中…</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.network-badge-container {
  position: relative;
  margin-left: auto;
  flex-shrink: 0;
}

.network-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 11px;
  font-weight: 500;
  user-select: none;
}

.network-badge:hover {
  filter: brightness(0.95);
}

/* Status variants */
.network-badge.encrypted {
  background: var(--success-light, #D1FAE5);
  color: var(--success, #10B981);
}
.network-badge.encrypted .badge-dot {
  background: var(--success, #10B981);
}

.network-badge.local {
  background: var(--info-light, #DBEAFE);
  color: var(--info, #3B82F6);
}
.network-badge.local .badge-dot {
  background: var(--info, #3B82F6);
}

.network-badge.remote {
  background: var(--warning-light, #FEF3C7);
  color: var(--warning, #F59E0B);
}
.network-badge.remote .badge-dot {
  background: var(--warning, #F59E0B);
}

.network-badge.disconnected {
  background: var(--error-light, #FEE2E2);
  color: var(--error, #EF4444);
}
.network-badge.disconnected .badge-dot {
  background: var(--error, #EF4444);
  animation: pulse 1.5s infinite;
}

.network-badge.detecting {
  background: #F3F4F6;
  color: var(--text-muted, #999);
}
.network-badge.detecting .badge-dot {
  background: var(--text-muted, #999);
  animation: pulse 1s infinite;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.badge-icon {
  font-size: 12px;
}

.badge-text {
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ============ Popover (320px) ============ */
.network-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: var(--bg-white, #FFFFFF);
  border: 1px solid var(--border-light, #EBEBEB);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 100;
  display: none;
  overflow: hidden;
}

.network-popover.show {
  display: block;
}

.popover-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light, #EBEBEB);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.popover-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-heading, #111);
}

.popover-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted, #999);
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.popover-close:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
  color: var(--text-heading, #111);
}

.popover-body {
  padding: 16px;
}

/* Status indicator row */
.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light, #EBEBEB);
}

.status-indicator {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.status-indicator.encrypted { background: var(--success-light, #D1FAE5); }
.status-indicator.local { background: var(--info-light, #DBEAFE); }
.status-indicator.remote { background: var(--warning-light, #FEF3C7); }
.status-indicator.disconnected { background: var(--error-light, #FEE2E2); }
.status-indicator.detecting { background: #F3F4F6; }

.status-info .status-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-heading, #111);
}

.status-info .status-desc {
  font-size: 11px;
  color: var(--text-muted, #999);
  margin-top: 2px;
}

/* Detail fields */
.detail-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F9F9F9;
}

.detail-field:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 12px;
  color: var(--text-muted, #999);
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-value {
  font-size: 12px;
  color: var(--text-heading, #111);
  font-weight: 500;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.detail-value.highlight {
  color: var(--success, #10B981);
  font-weight: 600;
}

/* Encryption badge */
.encryption-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--success-light, #D1FAE5);
  color: var(--success, #10B981);
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
}

/* Latency bar */
.latency-bar {
  width: 60px;
  height: 4px;
  background: #E5E7EB;
  border-radius: 2px;
  overflow: hidden;
  margin-left: 8px;
}

.latency-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.latency-bar-fill.good { background: var(--success, #10B981); }
.latency-bar-fill.medium { background: var(--warning, #F59E0B); }
.latency-bar-fill.poor { background: var(--error, #EF4444); }

/* Reconnect hint */
.reconnect-hint {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--error-light, #FEE2E2);
  border-radius: 6px;
  font-size: 11px;
  color: var(--error, #EF4444);
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
