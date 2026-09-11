<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWebSocketStore } from '@/stores/websocket'
import { getExperiences } from '@/api/experiences'
import { getTasks } from '@/api/tasks'
import type { Experience, Task } from '@/types/api'

const auth = useAuthStore()
const wsStore = useWebSocketStore()

const recentExperiences = ref<Experience[]>([])
const recentTasks = ref<Task[]>([])
const loading = ref(true)

async function loadDashboard() {
  try {
    const [expRes, taskRes] = await Promise.all([
      getExperiences({ page: 1, page_size: 5 }),
      getTasks({ page: 1, page_size: 5 }),
    ])
    recentExperiences.value = expRes.data.items
    recentTasks.value = taskRes.data.items
  } catch {
    // 静默处理
  } finally {
    loading.value = false
  }
}

// WS 事件触发自动刷新
watch(() => wsStore.experienceRefresh, () => {
  getExperiences({ page: 1, page_size: 5 }).then(res => {
    recentExperiences.value = res.data.items
  }).catch(() => {})
})

watch(() => wsStore.taskRefresh, () => {
  getTasks({ page: 1, page_size: 5 }).then(res => {
    recentTasks.value = res.data.items
  }).catch(() => {})
})

// 状态 → Element Plus Tag 类型映射
const statusTagType: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'info',
  pending: 'warning',
  published: 'success',
  rejected: 'danger',
  assigned: '',
  in_progress: '',
  delivered: '',
  reviewing: 'warning',
  completed: 'success',
  archived: 'info',
}

const statusLabel: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  rejected: '已拒绝',
  assigned: '已分配',
  in_progress: '进行中',
  delivered: '已交付',
  reviewing: '审核中',
  completed: '已完成',
  archived: '已归档',
}

onMounted(loadDashboard)
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <h2>仪表盘</h2>
      <p class="welcome">欢迎回来，{{ auth.user?.username }}</p>
    </header>

    <!-- 概览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="最近经验" :value="recentExperiences.length">
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="活跃任务" :value="recentTasks.length">
            <template #prefix>
              <el-icon><List /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="实时事件" :value="wsStore.events.length">
            <template #prefix>
              <el-icon><Lightning /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="4" animated />
    </div>

    <el-row v-else :gutter="24" class="dashboard-row">
      <!-- 最近经验 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="section-header">
              <span>最近经验</span>
              <RouterLink to="/dashboard/experiences" class="link">查看全部 →</RouterLink>
            </div>
          </template>
          <el-empty v-if="recentExperiences.length === 0" description="暂无经验数据" :image-size="60" />
          <div v-else class="item-list">
            <div v-for="exp in recentExperiences" :key="exp.id" class="list-item">
              <div class="item-main">
                <span class="item-title">{{ exp.title }}</span>
                <span class="item-meta">{{ exp.summary }}</span>
              </div>
              <el-tag :type="statusTagType[exp.status]" size="small" effect="dark">
                {{ statusLabel[exp.status] || exp.status }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 最近任务 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="section-header">
              <span>最近任务</span>
              <RouterLink to="/dashboard/tasks" class="link">查看全部 →</RouterLink>
            </div>
          </template>
          <el-empty v-if="recentTasks.length === 0" description="暂无任务数据" :image-size="60" />
          <div v-else class="item-list">
            <div v-for="task in recentTasks" :key="task.id" class="list-item">
              <div class="item-main">
                <span class="item-title">{{ task.title }}</span>
                <span class="item-meta">{{ task.priority }}</span>
              </div>
              <el-tag :type="statusTagType[task.status]" size="small" effect="dark">
                {{ statusLabel[task.status] || task.status }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 实时事件 -->
      <el-col :span="24" class="events-col">
        <el-card shadow="hover">
          <template #header>
            <span>实时事件流</span>
          </template>
          <el-empty v-if="wsStore.events.length === 0" description="暂无实时事件，等待 WebSocket 推送..." :image-size="60" />
          <div v-else class="event-list">
            <div v-for="(evt, idx) in wsStore.events.slice(-10).reverse()" :key="idx" class="event-item">
              <el-tag type="primary" size="small" effect="plain">{{ evt.event }}</el-tag>
              <span class="event-time">{{ new Date(evt.timestamp).toLocaleTimeString() }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-heading, #111111);
  margin: 0;
}

.welcome {
  color: var(--text-muted, #888);
  margin: 4px 0 0;
  font-size: 15px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.loading {
  padding: 40px 0;
}

.dashboard-row {
  margin-top: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.link {
  color: var(--arkham-primary, #E85A3D);
  text-decoration: none;
  font-size: 13px;
}

.link:hover {
  text-decoration: underline;
}

.item-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  align-items: start;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: var(--bg-page, #FAFAFA);
  min-width: 0;
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-heading, #111111);
}

.item-meta {
  font-size: 12px;
  color: var(--text-muted, #888);
  max-width: 280px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.events-col {
  margin-top: 24px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-page, #FAFAFA);
  border-radius: 6px;
  font-size: 13px;
}

.event-time {
  color: var(--text-muted, #888);
}
</style>
