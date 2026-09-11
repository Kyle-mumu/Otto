<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import NetworkStatusBadge from '@/components/NetworkStatusBadge.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const auth = useAuthStore()
const wsStore = useWebSocketStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

let cleanupWs: (() => void) | undefined

// 启动全局 WebSocket 连接
onMounted(() => {
  cleanupWs = wsStore.start()
})

// 组件卸载时清理 WS 连接和监听器
onUnmounted(() => {
  cleanupWs?.()
})

// ========== 左侧栏双Tab ==========
type SidebarTab = 'workspace' | 'tasks'
const activeSidebarTab = ref<SidebarTab>('workspace')

// 当前激活菜单项（基于路由路径）
const activeMenu = computed(() => route.path)

// 面包屑映射
const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/dashboard/experiences': 'nav.experiences',
  '/dashboard/tasks': 'nav.tasks',
  '/dashboard/models': 'nav.models',
  '/dashboard/quotas': 'nav.quotas',
  '/dashboard/usage': 'nav.usage',
  '/dashboard/team': 'nav.team',
  '/dashboard/settings': 'nav.settings',
  '/dashboard/scheduled-tasks': 'nav.scheduledTasks',
  '/dashboard/rules': 'nav.rules',
  '/dashboard/notifications': 'nav.notifications',
}
const currentBreadcrumb = computed(() => t(breadcrumbMap[route.path] || 'nav.dashboard'))

function handleMenuClick(path: string) {
  router.push(path)
}

function switchSidebarTab(tab: SidebarTab) {
  activeSidebarTab.value = tab
  if (tab === 'workspace') {
    router.push('/dashboard')
  } else {
    router.push('/dashboard/tasks')
  }
}

// ========== 侧边栏会话/任务列表数据（静态mock，后续接API） ==========
const sessionItems = ref([
  { id: 's1', title: '企业知识库新人入职培训', meta: '3分钟前', active: true },
  { id: 's2', title: '评估执行与搜索链路', meta: '21分钟前', active: false },
  { id: 's3', title: '查找GitHub微信MCP', meta: '2小时前', active: false },
  { id: 's4', title: '本地部署Qwen3.8性价比评估', meta: '1天前', active: false },
])

const teamSessionItems = ref([
  { id: 'ts1', title: '处理发货订单Excel文件', meta: '37分钟前', active: false },
  { id: 'ts2', title: '任务完成时间步骤与难点', meta: '4小时前', active: false },
  { id: 'ts3', title: '查找热门电商工具技能', meta: '4小时前', active: false },
  { id: 'ts4', title: '介绍公司与助手能力', meta: '1天前', active: false },
])

const taskItems = ref([
  { id: 't1', title: '详情页任务', meta: 'boss · content · 刚才', status: 'common.pending', statusColor: 'var(--status-pending, #F59E0B)' },
  { id: 't2', title: '未命名报告', meta: 'boss · content · 刚才', status: 'common.pending', statusColor: 'var(--status-pending, #F59E0B)' },
  { id: 't3', title: '明远项目落地', meta: 'boss · content · 刚才', status: 'common.pending', statusColor: 'var(--status-pending, #F59E0B)' },
  { id: 't4', title: '数据整理', meta: 'quan · content · 10分钟前', status: 'common.completed', statusColor: 'var(--success, #10B981)' },
  { id: 't5', title: '商品详情页制作', meta: 'zhangzhang · content · 1小时前', status: 'common.processing', statusColor: 'var(--status-in-progress, #3B82F6)' },
  { id: 't6', title: '客户反馈汇总', meta: 'emp-a · content · 3小时前', status: 'common.cancelled', statusColor: 'var(--status-archived, #6B7280)' },
])

// 管理页面快捷入口
const managementItems = [
  { icon: '⏰', label: 'nav.scheduledTasks', path: '/dashboard/scheduled-tasks' },
  { icon: '⚡', label: 'nav.rules', path: '/dashboard/rules' },
  { icon: '🔔', label: 'nav.notifications', path: '/dashboard/notifications' },
  { icon: '🔐', label: 'settings.network', path: '/dashboard/settings?tab=network' },
  { icon: '👥', label: 'settings.team', path: '/dashboard/team' },
  { icon: '🤖', label: 'settings.models', path: '/dashboard/models' },
  { icon: '📊', label: 'nav.quotas', path: '/dashboard/quotas' },
  { icon: '📈', label: 'nav.analytics', path: '/dashboard/analytics' },
  { icon: '📉', label: 'nav.usage', path: '/dashboard/usage' },
  { icon: '📚', label: 'nav.experiences', path: '/dashboard/experiences' },
]
</script>

<template>
  <el-container class="layout">
    <!-- 左侧栏 (240px, 白色, The Diva 风格) -->
    <el-aside class="sidebar">
      <!-- 品牌区 -->
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <span class="logo">ARKHAM</span>
          <span class="ws-indicator" :class="{ online: wsStore.connected }">
            {{ wsStore.connected ? '● ' + t('nav.online') : '○ ' + t('nav.offline') }}
          </span>
        </div>

        <!-- 图标工具栏 (The Diva 风格) -->
        <div class="sidebar-icons">
          <button
            class="icon-btn"
            :class="{ active: activeMenu === '/dashboard/experiences' }"
            :title="t('nav.experiences')"
            @click="handleMenuClick('/dashboard/experiences')"
          >🔍</button>
          <button
            class="icon-btn"
            :class="{ active: activeMenu === '/dashboard' }"
            :title="t('nav.dashboard')"
            @click="handleMenuClick('/dashboard')"
          >⊞</button>
          <button
            class="icon-btn"
            :class="{ active: activeMenu.startsWith('/dashboard/tasks') }"
            :title="t('nav.tasks')"
            @click="handleMenuClick('/dashboard/tasks')"
          >📄</button>
          <button
            class="icon-btn"
            :class="{ active: activeMenu === '/dashboard/scheduled-tasks' }"
            :title="t('nav.scheduledTasks')"
            @click="handleMenuClick('/dashboard/scheduled-tasks')"
          >⏰</button>
          <button
            class="icon-btn"
            :class="{ active: activeMenu === '/dashboard/rules' }"
            :title="t('nav.rules')"
            @click="handleMenuClick('/dashboard/rules')"
          >⚡</button>
          <button
            class="icon-btn"
            :class="{ active: activeMenu === '/dashboard/notifications' }"
            :title="t('nav.notifications')"
            @click="handleMenuClick('/dashboard/notifications')"
          >🔔</button>
          <button
            class="icon-btn"
            :class="{ active: activeMenu === '/dashboard/analytics' }"
            :title="t('nav.analytics')"
            @click="handleMenuClick('/dashboard/analytics')"
          >📊</button>
          <span style="flex:1"></span>
          <button
            class="icon-btn"
            :title="t('nav.settings')"
            @click="handleMenuClick('/dashboard/settings')"
          >⚙</button>
        </div>

        <!-- 双Tab切换: [会话] [任务] -->
        <div class="sidebar-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeSidebarTab === 'workspace' }"
            @click="switchSidebarTab('workspace')"
          >{{ t('nav.workspace') }}</button>
          <button
            class="tab-btn"
            :class="{ active: activeSidebarTab === 'tasks' }"
            @click="switchSidebarTab('tasks')"
          >{{ t('nav.tasks') }}</button>
        </div>
      </div>

      <!-- Tab内容区 -->
      <div class="sidebar-items">
        <!-- 会话Tab -->
        <template v-if="activeSidebarTab === 'workspace'">
          <!-- 个人 -->
          <div class="section-title">{{ t('nav.personal') }}</div>
          <div
            v-for="(item, idx) in sessionItems"
            :key="'s-' + idx"
            class="sidebar-item"
            :class="{ active: item.active }"
            @click="router.push(`/dashboard/session/${item.id}`)"
          >
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta"><span>{{ item.meta }}</span></div>
          </div>

          <!-- 团队 -->
          <div class="section-title" style="margin-top: 16px;">{{ t('nav.team') }}</div>
          <div
            v-for="(item, idx) in teamSessionItems"
            :key="'ts-' + idx"
            class="sidebar-item"
            @click="router.push(`/dashboard/session/${item.id}`)"
          >
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta"><span>{{ item.meta }}</span></div>
          </div>

          <!-- 管理快捷入口 -->
          <div class="section-title" style="margin-top: 16px;">{{ t('nav.manage') }}</div>
          <div
            v-for="mgmt in managementItems"
            :key="mgmt.path"
            class="sidebar-item"
            :class="{ active: activeMenu === mgmt.path }"
            @click="handleMenuClick(mgmt.path)"
          >
            <div class="item-title">{{ mgmt.icon }} {{ t(mgmt.label) }}</div>
          </div>
        </template>

        <!-- 任务Tab -->
        <template v-else>
          <div
            v-for="(item, idx) in taskItems"
            :key="'t-' + idx"
            class="sidebar-item"
            :class="{ active: idx === 0 }"
            @click="router.push(`/dashboard/task/${item.id}`)"
          >
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span class="status-dot" :style="{ background: item.statusColor }"></span>
              <span>{{ item.meta }} · {{ t(item.status) }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- 底部: 用户信息 -->
      <div class="sidebar-footer" v-if="auth.user">
        <div class="user-info">
          <div class="user-avatar">{{ auth.user.username.charAt(0).toUpperCase() }}</div>
          <div class="user-detail">
            <span class="user-name">{{ auth.user.username }}</span>
            <span class="user-role">{{ auth.user.role }}</span>
          </div>
          <button class="btn-logout" @click="auth.logout()">{{ t('nav.logout') }}</button>
        </div>
      </div>
    </el-aside>

    <!-- 中间面板 (内容区) -->
    <div class="center-panel">
      <!-- 面包屑 (左对齐, The Diva 风格) -->
      <div class="breadcrumb">
        <span class="breadcrumb-item" @click="router.push('/dashboard')">ARKHAM</span>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-item current">{{ currentBreadcrumb }}</span>
        <NetworkStatusBadge />
        <span style="flex: 1"></span>
        <LanguageSwitcher />
      </div>
      <!-- 页面内容 -->
      <div class="center-content">
        <RouterView />
      </div>
    </div>

    <!-- 右侧 Chat Panel (360px, 会话框模式) -->
    <ChatPanel />
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
  min-width: 860px;
}

/* ========== 左侧栏 (240px 默认, 弹性缩放) ========== */
.sidebar {
  background: var(--bg-sidebar, #FFFFFF);
  border-right: 1px solid var(--border-light, #E8E8E8);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 240px;
  flex-shrink: 1;
  min-width: 180px;
}

.sidebar-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border-light, #E8E8E8);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--arkham-primary, #E85A3D);
  margin: 0;
}

.ws-indicator {
  font-size: 10px;
  color: var(--text-muted, #888);
}

.ws-indicator.online {
  color: var(--success, #10B981);
}

/* 图标工具栏 */
.sidebar-icons {
  display: flex;
  gap: 4px;
  padding: 4px 0;
  margin-bottom: 8px;
  align-items: center;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted, #888);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
  color: var(--text-heading, #111);
}

.icon-btn.active {
  background: var(--bg-sidebar-active, #FEF2EE);
  color: var(--arkham-primary, #E85A3D);
}

/* 双Tab切换 */
.sidebar-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: var(--text-sidebar, #6B6B6B);
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  text-align: center;
  font-family: var(--font-primary);
  transition: all 0.15s;
}

.tab-btn:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
  color: var(--text-heading, #111);
}

.tab-btn.active {
  background: var(--bg-sidebar-active, #FEF2EE);
  color: var(--arkham-primary, #E85A3D);
  font-weight: 600;
}

/* 侧边栏内容列表 */
.sidebar-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted, #888);
  padding: 8px 12px 4px;
  margin-bottom: 2px;
}

.sidebar-item {
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}

.sidebar-item:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
}

.sidebar-item.active {
  background: var(--bg-sidebar-active, #FEF2EE);
}

.item-title {
  color: var(--text-heading, #111);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: 11px;
  color: var(--text-muted, #888);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

/* 侧边栏底部 */
.sidebar-footer {
  border-top: 1px solid var(--border-light, #E8E8E8);
  padding: 8px 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--arkham-primary, #E85A3D);
  color: white;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-detail {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-heading, #111);
}

.user-role {
  font-size: 10px;
  color: var(--text-muted, #888);
}

.btn-logout {
  font-size: 11px;
  color: var(--text-muted, #888);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.btn-logout:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
  color: var(--error, #EF4444);
}

/* ========== 中间面板 ========== */
.center-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  background: var(--bg-page, #FAFAFA);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  font-size: 12px;
  color: var(--text-muted, #888);
  border-bottom: 1px solid var(--border-light, #E8E8E8);
  background: var(--bg-white, #FFFFFF);
  flex-shrink: 0;
}

.breadcrumb-item {
  cursor: pointer;
  transition: color 0.15s;
}

.breadcrumb-item:hover {
  color: var(--arkham-primary, #E85A3D);
}

.breadcrumb-item.current {
  color: var(--text-heading, #111);
  font-weight: 500;
}

.breadcrumb-sep {
  margin: 0 4px;
}

/* ========== 右侧 Chat Panel ========== */
.center-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* ========== 滚动条美化 ========== */
.sidebar-items::-webkit-scrollbar,
.center-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-items::-webkit-scrollbar-thumb,
.center-content::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
}

.sidebar-items:hover::-webkit-scrollbar-thumb,
.center-content:hover::-webkit-scrollbar-thumb {
  background: var(--border-light, #E8E8E8);
}

.sidebar-items::-webkit-scrollbar-track,
.center-content::-webkit-scrollbar-track {
  background: transparent;
}
</style>
