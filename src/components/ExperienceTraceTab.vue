<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { traceExperience } from '@/api/trace'
import type { ExperienceTraceItem } from '@/types/api'

const props = defineProps<{ experienceId: string }>()

const items = ref<ExperienceTraceItem[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)

const resultConfig: Record<string, { icon: string; color: string; label: string }> = {
  completed: { icon: '✅', color: '#10B981', label: '已完成' },
  failed: { icon: '❌', color: '#EF4444', label: '失败' },
  running: { icon: '⏳', color: '#E85A3D', label: '运行中' },
  cancelled: { icon: '⏭️', color: '#9CA3AF', label: '已取消' },
}

async function fetchTrace() {
  if (!props.experienceId) return
  loading.value = true
  try {
    const res = await traceExperience(props.experienceId, { page: page.value, page_size: 10 })
    items.value = res.data.items
    total.value = res.data.total
  } catch {
    ElMessage.error('获取经验引用追溯失败')
  } finally {
    loading.value = false
  }
}

function formatTime(dt?: string | null): string {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

watch(() => props.experienceId, () => {
  page.value = 1
  fetchTrace()
}, { immediate: true })
</script>

<template>
  <div class="exp-trace-tab">
    <div class="trace-summary" v-if="total > 0">
      <span class="summary-text">共有 <strong>{{ total }}</strong> 个任务引用了此经验</span>
    </div>

    <div v-if="items.length === 0 && !loading" class="empty-state">
      <el-empty description="暂无任务引用此经验" :image-size="48" />
    </div>

    <div v-loading="loading" class="trace-list">
      <div v-for="item in items" :key="item.task_id" class="trace-card">
        <div class="trace-header">
          <span class="task-title">{{ item.task_title }}</span>
          <el-tag
            :color="resultConfig[item.result]?.color"
            effect="dark"
            size="small"
            round
          >
            {{ resultConfig[item.result]?.label || item.result }}
          </el-tag>
        </div>
        <div class="trace-meta">
          <span v-if="item.executor" class="meta-item">
            👤 {{ item.executor }}
          </span>
          <span class="meta-item">
            📊 {{ item.step_count }}步
          </span>
          <span class="meta-item">
            🕐 {{ formatTime(item.executed_at) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="total > 10" class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="10"
        :total="total"
        layout="prev, pager, total"
        small
        @current-change="fetchTrace"
      />
    </div>
  </div>
</template>

<style scoped>
.exp-trace-tab {
  padding: 4px 0;
}

.trace-summary {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  font-size: 13px;
  color: #166534;
}

.trace-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trace-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  transition: border-color 0.2s;
}

.trace-card:hover {
  border-color: var(--el-color-primary, #E85A3D);
}

.trace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-title {
  font-weight: 600;
  color: #111;
  font-size: 14px;
}

.trace-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
}

.meta-item {
  white-space: nowrap;
}

.empty-state {
  padding: 24px 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
