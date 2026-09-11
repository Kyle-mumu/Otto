<script setup lang="ts">
/**
 * V1.1-B6 SettingsNetworkView — 网络管理页
 * 3卡片布局：网络状态 / Auth Key管理 / 已连接节点
 * 设计稿: 04-设计文档/UI设计稿/b6-network-status-design.html
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  getNetworkStatus,
  getNetworkPeers,
  generateAuthKey,
  removePeer,
} from '@/api/network'
import type {
  NetworkStatus,
  NetworkPeer,
  AuthKeyRequest,
} from '@/types/network'

const authStore = useAuthStore()

// ========== 数据状态 ==========
const statusLoading = ref(true)
const networkStatus = ref<NetworkStatus | null>(null)

const peersLoading = ref(true)
const peers = ref<NetworkPeer[]>([])
const peersTotal = ref(0)

const authKeyLoading = ref(false)
const showAuthKeyDialog = ref(false)
const authKeyForm = ref<AuthKeyRequest>({
  expiry_hours: 24,
  usage_limit: 1,
  tags: [],
})
const generatedKey = ref<{ key: string; expires_at: string } | null>(null)

const removingPeerId = ref<string | null>(null)

// ========== 计算属性 ==========
const connectionMode = computed(() => {
  if (!networkStatus.value) return 'unknown'
  if (networkStatus.value.tailscale_connected) return 'tailscale'
  if (networkStatus.value.server_tailscale_ip.length > 0) return 'local'
  return 'remote'
})

const connectionModeLabel = computed(() => {
  const labels: Record<string, string> = {
    tailscale: 'Tailscale 加密',
    local: '本地网络',
    remote: '远程网络',
    unknown: '未知',
  }
  return labels[connectionMode.value] || '未知'
})

const latencyText = computed(() => {
  const latencies: Record<string, string> = {
    tailscale: '28ms',
    local: '<5ms',
    remote: '85ms',
    unknown: '—',
  }
  return latencies[connectionMode.value] || '—'
})

const latencyBarClass = computed(() => {
  if (connectionMode.value === 'tailscale') return 'good'
  if (connectionMode.value === 'local') return 'good'
  if (connectionMode.value === 'remote') return 'medium'
  return 'poor'
})

const latencyBarWidth = computed(() => {
  if (connectionMode.value === 'tailscale') return '80%'
  if (connectionMode.value === 'local') return '95%'
  if (connectionMode.value === 'remote') return '45%'
  return '0%'
})

const onlineCount = computed(() => peers.value.filter(p => p.online).length)

// ========== 格式化 ==========
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return '未知'
  const diff = Date.now() - new Date(lastSeen).getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`
  return `${Math.floor(diff / 86_400_000)}天前`
}

function osEmoji(os: string): string {
  const o = os.toLowerCase()
  if (o.includes('mac') || o.includes('darwin') || o.includes('ios')) return '🍎'
  if (o.includes('win')) return '🪟'
  if (o.includes('linux')) return '🐧'
  if (o.includes('android')) return '📱'
  return '💻'
}

function maskKey(key: string): string {
  if (key.length <= 20) return key
  return key.slice(0, 12) + '****' + key.slice(-8)
}

// ========== API ==========
async function loadStatus() {
  statusLoading.value = true
  try {
    const res = await getNetworkStatus()
    networkStatus.value = res.data
  } catch {
    // 静默降级
  } finally {
    statusLoading.value = false
  }
}

async function loadPeers() {
  if (!authStore.isAdmin) return
  peersLoading.value = true
  try {
    const res = await getNetworkPeers()
    peers.value = res.data.peers || []
    peersTotal.value = res.data.total || 0
  } catch {
    // 静默降级
  } finally {
    peersLoading.value = false
  }
}

async function handleGenerateKey() {
  authKeyLoading.value = true
  generatedKey.value = null
  try {
    const res = await generateAuthKey(authKeyForm.value)
    generatedKey.value = {
      key: res.data.key,
      expires_at: res.data.expires_at,
    }
  } catch {
    // 错误处理
  } finally {
    authKeyLoading.value = false
  }
}

function copyKey() {
  if (!generatedKey.value) return
  navigator.clipboard.writeText(generatedKey.value.key)
}

async function handleRemovePeer(peer: NetworkPeer) {
  removingPeerId.value = peer.id
  try {
    const res = await removePeer(peer.id)
    if (res.data.success) {
      await loadPeers()
    }
  } catch {
    // 静默处理
  } finally {
    removingPeerId.value = null
  }
}

function openAuthKeyDialog() {
  generatedKey.value = null
  authKeyForm.value = { expiry_hours: 24, usage_limit: 1, tags: [] }
  showAuthKeyDialog.value = true
}

function closeAuthKeyDialog() {
  showAuthKeyDialog.value = false
  generatedKey.value = null
}

// ========== 四态页面 ==========
const pageState = ref<'normal' | 'loading' | 'empty' | 'error'>('loading')

let peersTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await loadStatus()

  if (!networkStatus.value) {
    pageState.value = 'error'
  } else if (!networkStatus.value.tailscale_connected && networkStatus.value.server_tailscale_ip.length === 0) {
    pageState.value = 'empty'
  } else {
    pageState.value = 'normal'
  }

  if (authStore.isAdmin) {
    await loadPeers()
    peersTimer = setInterval(loadPeers, 30_000)
  }
})

onUnmounted(() => {
  if (peersTimer) {
    clearInterval(peersTimer)
    peersTimer = null
  }
})

/** 刷新所有数据 */
async function refreshAll() {
  pageState.value = 'loading'
  await loadStatus()
  if (authStore.isAdmin) await loadPeers()
  pageState.value = 'normal'
}
</script>

<template>
  <div class="network-page">
    <!-- ========== 正常态 ========== -->
    <template v-if="pageState === 'normal' || pageState === 'loading'">
      <!-- 卡片1：网络状态 -->
      <div class="net-card">
        <div class="net-card-header">
          <div class="net-card-title">
            <span style="font-size: 16px;">🛡️</span>
            网络状态
          </div>
          <span v-if="networkStatus?.tailscale_connected" class="encryption-badge">🔒 端到端加密</span>
        </div>
        <div class="net-card-body">
          <!-- 骨架屏 -->
          <template v-if="statusLoading">
            <div class="skeleton-grid">
              <div v-for="i in 6" :key="i" class="skeleton-item">
                <div class="skeleton-line" style="width: 40%;"></div>
                <div class="skeleton-line" style="width: 60%; height: 18px; margin-top: 6px;"></div>
              </div>
            </div>
          </template>

          <!-- 数据 -->
          <div v-else-if="networkStatus" class="net-status-grid">
            <div class="net-status-item">
              <div class="label">连接状态</div>
              <div class="value" style="color: var(--success); font-family: var(--font-primary);">● 已连接</div>
            </div>
            <div class="net-status-item">
              <div class="label">连接模式</div>
              <div class="value" style="font-family: var(--font-primary);">{{ connectionModeLabel }}</div>
            </div>
            <div class="net-status-item">
              <div class="label">延迟</div>
              <div class="value" style="font-family: var(--font-primary); display: flex; align-items: center;">
                {{ latencyText }}
                <span class="latency-bar"><span class="latency-bar-fill" :class="latencyBarClass" :style="{ width: latencyBarWidth }"></span></span>
              </div>
            </div>
            <div class="net-status-item" v-if="networkStatus.server_tailscale_ip.length > 0">
              <div class="label">虚拟 IP</div>
              <div class="value ip">{{ networkStatus.server_tailscale_ip[0] }}</div>
            </div>
            <div class="net-status-item">
              <div class="label">网络名称</div>
              <div class="value network-name">{{ networkStatus.network_name || '—' }}</div>
            </div>
            <div class="net-status-item">
              <div class="label">运行时间</div>
              <div class="uptime-display">
                <template v-if="networkStatus.uptime_seconds > 0">
                  <span class="number">{{ Math.floor(networkStatus.uptime_seconds / 3600) }}</span><span class="unit">h</span>
                  <span class="number">{{ Math.floor((networkStatus.uptime_seconds % 3600) / 60) }}</span><span class="unit">m</span>
                </template>
                <span v-else class="value">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 卡片2：Auth Key 管理（仅 admin） -->
      <div class="net-card" v-if="authStore.isAdmin">
        <div class="net-card-header">
          <div class="net-card-title">
            <span style="font-size: 16px;">🔑</span>
            Auth Key 管理
          </div>
        </div>
        <div class="net-card-body">
          <div class="authkey-form">
            <div class="form-group">
              <label>有效期</label>
              <select v-model.number="authKeyForm.expiry_hours" class="form-select">
                <option :value="24">24 小时</option>
                <option :value="168">7 天</option>
                <option :value="720">30 天</option>
              </select>
            </div>
            <div class="form-group">
              <label>使用次数</label>
              <input type="number" v-model.number="authKeyForm.usage_limit" class="form-input" min="1" max="100">
            </div>
            <div class="form-group">
              <label>标签</label>
              <input type="text" v-model="authKeyForm.tags![0]" class="form-input" style="width: 100px;" placeholder="arkham-member">
            </div>
            <button class="btn btn-primary" @click="openAuthKeyDialog" :disabled="authKeyLoading">
              ⚡ 生成新密钥
            </button>
          </div>
        </div>
      </div>

      <!-- 卡片3：已连接节点（仅 admin） -->
      <div class="net-card" v-if="authStore.isAdmin">
        <div class="net-card-header">
          <div class="net-card-title">
            <span style="font-size: 16px;">💻</span>
            已连接节点
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: var(--text-muted);">{{ peersTotal }} 台设备</span>
            <button class="btn btn-ghost btn-sm" @click="refreshAll" :disabled="peersLoading">🔄 刷新</button>
          </div>
        </div>
        <div class="net-card-body" style="padding: 0;">
          <!-- 加载中 -->
          <template v-if="peersLoading && peers.length === 0">
            <div style="padding: 40px; text-align: center; color: var(--text-muted);">加载中…</div>
          </template>

          <!-- 空状态 -->
          <div v-else-if="!peersLoading && peers.length === 0" class="peers-empty">
            <div class="empty-icon">🌐</div>
            <div style="font-size: 14px; font-weight: 600; color: var(--text-heading); margin-bottom: 4px;">暂无已连接节点</div>
            <div class="empty-text">团队成员可使用 Auth Key 加入 Tailscale 网络</div>
          </div>

          <!-- 数据表格 -->
          <table v-else class="peers-table">
            <thead>
              <tr>
                <th>主机名</th>
                <th>虚拟 IP</th>
                <th>系统</th>
                <th>状态</th>
                <th>最后活跃</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="peer in peers" :key="peer.id">
                <td><span class="peer-name">{{ peer.hostname }}</span></td>
                <td><span class="peer-ip">{{ peer.tailscale_ip?.[0] || '—' }}</span></td>
                <td><span class="peer-os">{{ osEmoji(peer.os) }} {{ peer.os || '—' }}</span></td>
                <td>
                  <span class="peer-status" :class="peer.online ? 'online' : 'offline'">
                    <span class="dot"></span>{{ peer.online ? '在线' : '离线' }}
                  </span>
                </td>
                <td style="font-size: 11px; color: var(--text-muted);">{{ formatLastSeen(peer.last_seen) }}</td>
                <td>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="handleRemovePeer(peer)"
                    :disabled="removingPeerId === peer.id"
                  >
                    {{ removingPeerId === peer.id ? '移除中…' : '移除' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ========== 空状态 ========== -->
    <template v-else-if="pageState === 'empty'">
      <div class="net-card">
        <div class="net-card-body">
          <div class="peers-empty">
            <div class="empty-icon">🌐</div>
            <div style="font-size: 14px; font-weight: 600; color: var(--text-heading); margin-bottom: 4px;">尚未配置加密网络</div>
            <div class="empty-text" style="margin-bottom: 16px;">当前服务器未接入 Tailscale 网络，所有通信通过公网传输，存在安全风险。</div>
            <button class="btn btn-primary">🚀 立即配置 Tailscale</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== 错误态 ========== -->
    <template v-else-if="pageState === 'error'">
      <div class="net-card" style="border-color: var(--error);">
        <div class="net-card-header" style="background: var(--error-light);">
          <div class="net-card-title" style="color: var(--error);">⚠️ 网络连接异常</div>
        </div>
        <div class="net-card-body">
          <div class="reconnect-hint" style="margin-top: 0;">
            <span>🔴</span>
            <span>无法连接到 Tailscale 协调服务器。请检查 Headscale 服务是否正常运行。</span>
          </div>
          <div style="margin-top: 16px; display: flex; gap: 8px;">
            <button class="btn btn-primary" @click="refreshAll">🔄 重试连接</button>
            <button class="btn btn-ghost">📋 查看日志</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== Auth Key 生成弹窗 ========== -->
    <div v-if="showAuthKeyDialog" class="modal-overlay" @click.self="closeAuthKeyDialog">
      <div class="modal-dialog">
        <div class="modal-header">
          <span class="modal-title">生成 Tailscale Auth Key</span>
          <button class="modal-close" @click="closeAuthKeyDialog">✕</button>
        </div>
        <div class="modal-body">
          <!-- 生成表单 -->
          <div v-if="!generatedKey" class="authkey-form-vertical">
            <div class="form-group">
              <label>有效期</label>
              <select v-model.number="authKeyForm.expiry_hours" class="form-select" style="width: 100%;">
                <option :value="24">24 小时</option>
                <option :value="168">7 天</option>
                <option :value="720">30 天</option>
              </select>
            </div>
            <div class="form-group">
              <label>使用次数上限 (1-100)</label>
              <input type="number" v-model.number="authKeyForm.usage_limit" class="form-input" style="width: 100%;" min="1" max="100">
            </div>
            <div class="form-group">
              <label>标签（可选）</label>
              <input type="text" v-model="authKeyForm.tags![0]" class="form-input" style="width: 100%;" placeholder="arkham-member">
            </div>
          </div>

          <!-- 生成结果 -->
          <div v-if="generatedKey" class="key-result">
            <div class="key-result-success">
              <span>✅ Key 已生成</span>
              <span style="color: var(--text-muted); font-size: 11px;">
                过期: {{ new Date(generatedKey.expires_at).toLocaleString() }}
              </span>
            </div>
            <div class="key-display">
              <span class="key-text">{{ maskKey(generatedKey.key) }}</span>
              <button class="btn btn-primary btn-sm" @click="copyKey">📋 复制</button>
            </div>
            <p class="key-warning">⚠️ 请立即复制保存，关闭弹窗后将无法再次查看。</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="closeAuthKeyDialog">
            {{ generatedKey ? '关闭' : '取消' }}
          </button>
          <button
            v-if="!generatedKey"
            class="btn btn-primary"
            @click="handleGenerateKey"
            :disabled="authKeyLoading"
          >
            {{ authKeyLoading ? '生成中…' : '⚡ 生成密钥' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========================================
   NETWORK MANAGEMENT PAGE — ARKHAM DESIGN
   ======================================== */

.network-page {
  padding: 0;
  font-family: var(--font-primary);
}

/* Section card */
.net-card {
  background: var(--bg-white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
  overflow: hidden;
}

.net-card-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.net-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-heading);
  display: flex;
  align-items: center;
  gap: 8px;
}

.net-card-body {
  padding: 16px;
}

/* Encryption badge */
.encryption-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--success-light);
  color: var(--success);
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 600;
}

/* Status grid (3 columns) */
.net-status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.net-status-item {
  padding: 12px;
  background: var(--bg-page);
  border-radius: var(--radius-md);
}

.net-status-item .label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.net-status-item .value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-heading);
  font-family: var(--font-mono);
}

.net-status-item .value.ip {
  font-size: 13px;
}

.net-status-item .value.network-name {
  font-family: var(--font-primary);
}

/* Uptime display */
.uptime-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.uptime-display .number {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-heading);
}

.uptime-display .unit {
  font-size: 12px;
  color: var(--text-muted);
  margin-right: 4px;
}

/* Auth Key form */
.authkey-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.form-select,
.form-input {
  padding: 8px 12px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-heading);
  background: var(--bg-white);
  font-family: var(--font-primary);
  outline: none;
  transition: border-color 0.15s;
}

.form-select:focus,
.form-input:focus {
  border-color: var(--arkham-primary);
}

.form-input {
  width: 60px;
  text-align: center;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  font-family: var(--font-primary);
  gap: 4px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--arkham-primary);
  color: white;
  border-color: var(--arkham-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--arkham-primary-dark);
}

.btn-danger {
  background: var(--bg-white);
  color: var(--error);
  border-color: var(--error);
}

.btn-danger:hover:not(:disabled) {
  background: var(--error-light);
}

.btn-ghost {
  background: transparent;
  color: var(--text-body);
  border-color: var(--border-medium);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-sidebar-hover);
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
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

.latency-bar-fill.good { background: var(--success); }
.latency-bar-fill.medium { background: var(--warning); }
.latency-bar-fill.poor { background: var(--error); }

/* Peers table */
.peers-table {
  width: 100%;
  border-collapse: collapse;
}

.peers-table th {
  text-align: left;
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-light);
}

.peers-table td {
  padding: 12px;
  font-size: 12px;
  color: var(--text-body);
  border-bottom: 1px solid #F9F9F9;
  vertical-align: middle;
}

.peers-table tr:last-child td {
  border-bottom: none;
}

.peer-name {
  font-weight: 500;
  color: var(--text-heading);
}

.peer-ip {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.peer-os {
  font-size: 11px;
  color: var(--text-muted);
}

.peer-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
}

.peer-status.online { color: var(--success); }
.peer-status.offline { color: var(--text-muted); }

.peer-status .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.peer-status.online .dot { background: var(--success); }
.peer-status.offline .dot { background: var(--status-archived); }

/* Empty state */
.peers-empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--text-muted);
}

.peers-empty .empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.peers-empty .empty-text {
  font-size: 12px;
}

/* Reconnect hint */
.reconnect-hint {
  padding: 8px 12px;
  background: var(--error-light);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--error);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Skeleton */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.skeleton-item {
  padding: 12px;
  background: var(--bg-page);
  border-radius: var(--radius-md);
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ========================================
   MODAL (Auth Key Dialog)
   ======================================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-dialog {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  width: 440px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-heading);
}

.modal-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
}

.modal-close:hover {
  background: var(--bg-sidebar-hover);
  color: var(--text-heading);
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.authkey-form-vertical {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Key result */
.key-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.key-result-success {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--success-light);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--success);
  font-weight: 500;
}

.key-display {
  display: flex;
  gap: 8px;
  align-items: center;
}

.key-text {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-page);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-heading);
  word-break: break-all;
}

.key-warning {
  font-size: 11px;
  color: var(--arkham-primary);
  margin: 0;
}

/* ========================================
   RESPONSIVE
   ======================================== */
@media (max-width: 1024px) {
  .net-status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .net-status-grid {
    grid-template-columns: 1fr;
  }
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
  .authkey-form {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
