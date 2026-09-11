<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getExecutionLogs, getExecutionLogDetail } from '@/api/trace'
import type { ExecutionLog, ExecutionLogDetail, ExecutionStep } from '@/types/api'

const props = defineProps<{ taskId: string }>()

const logs = ref<ExecutionLog[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)

// 详情展开
const expandedLogId = ref<string | null>(null)
const detailLoading = ref(false)
const detail = ref<ExecutionLogDetail | null>(null)

const statusConfig: Record<string, { icon: string; color: string; label: string }> = {
  running: { icon: '⏳', color: '#E85A3D', label: '运行中' },
  completed: { icon: '✅', color: '#10B981', label: '已完成' },
  failed: { icon: '❌', color: '#EF4444', label: '失败' },
  cancelled: { icon: '⏭️', color: '#9CA3AF', label: '已取消' },
}

const stepStatusConfig: Record<string, { icon: string; color: string }> = {
  completed: { icon: '✅', color: '#10B981' },
  failed: { icon: '❌', color: '#EF4444' },
  skipped: { icon: '⏭️', color: '#9CA3AF' },
}

async function fetchLogs() {
  if (!props.taskId) return
  loading.value = true
  try {
    const res = await getExecutionLogs(props.taskId, { page: page.value, page_size: 10 })
    logs.value = res.data.items
    total.value = res.data.total
  } catch {
    ElMessage.error('获取执行日志失败')
  } finally {
    loading.value = false
  }
}

async function toggleDetail(log: ExecutionLog) {
  if (expandedLogId.value === log.id) {
    expandedLogId.value = null
    detail.value = null
    return
  }
  expandedLogId.value = log.id
  detailLoading.value = true
  try {
    const res = await getExecutionLogDetail(props.taskId, log.id)
    detail.value = res.data
  } catch {
    ElMessage.error('获取日志详情失败')
    expandedLogId.value = null
  } finally {
    detailLoading.value = false
  }
}

function formatDuration(ms?: number | null): string {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

function formatTime(dt?: string | null): string {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

watch(() => props.taskId, () => {
  page.value = 1
  expandedLogId.value = null
  detail.value = null
  fetchLogs()
}, { immediate: true })
</script>

<template>
  <div class="exec-log-tab">
    <div v-if="logs.length === 0 && !loading" class="empty-state">
      <el-empty description="暂无执行记录" :image-size="48" />
    </div>

    <div v-loading="loading" class="log-list">
      <div
        v-for="log in logs"
        :key="log.id"
        class="log-card"
        :class="{ expanded: expandedLogId === log.id }"
      >
        <div class="log-header" @click="toggleDetail(log)">
          <div class="log-meta">
            <span class="status-icon">{{ statusConfig[log.status]?.icon || '❓' }}</span>
            <span class="agent-name">{{ log.agent_name }}</span>
            <el-tag
              :color="statusConfig[log.status]?.color"
              effect="dark"
              size="small"
              round
            >
              {{ statusConfig[log.status]?.label || log.status }}
            </el-tag>
          </div>
          <div class="log-stats">
            <span class="stat">{{ log.total_steps }}步</span>
            <span class="stat">{{ formatDuration(log.total_duration_ms) }}</span>
            <span class="stat">{{ formatTime(log.started_at) }}</span>
          </div>
          <el-icon class="expand-icon" :class="{ rotated: expandedLogId === log.id }">
            <ArrowDown />
          </el-icon>
        </div>

        <!-- 展开的步骤详情 -->
        <div v-if="expandedLogId === log.id" class="log-detail">
          <div v-if="detailLoading" class="detail-loading">
            <el-icon class="is-loading"><Loading /></el-icon> 加载中...
          </div>
          <div v-else-if="detail">
            <!-- 结果摘要 -->
            <div v-if="detail.result_summary" class="result-summary">
              <strong>结果：</strong>{{ detail.result_summary }}
            </div>
            <div v-if="detail.error_message" class="error-message">
              <strong>错误：</strong>{{ detail.error_message }}
            </div>

            <!-- 步骤列表 -->
            <div class="steps-list">
              <div
                v-for="step in detail.steps"
                :key="step.id"
                class="step-item"
                :class="`step-${step.status}`"
              >
                <div class="step-header">
                  <span class="step-num">#{{ step.step_number }}</span>
                  <span class="step-icon">{{ stepStatusConfig[step.status]?.icon || '❓' }}</span>
                  <span class="step-action">{{ step.action }}</span>
                  <span class="step-duration">{{ formatDuration(step.duration_ms) }}</span>
                </div>
                <div v-if="step.input_summary" class="step-io">
                  <span class="io-label">输入：</span>{{ step.input_summary }}
                </div>
                <div v-if="step.output_summary" class="step-io">
                  <span class="io-label">输出：</span>{{ step.output_summary }}
                </div>
                <div v-if="step.experience_ids?.length" class="step-exps">
                  <span class="io-label">引用经验：</span>
                  <el-tag v-for="eid in step.experience_ids" :key="eid" size="small" effect="plain">
                    {{ eid.slice(0, 8) }}...
                  </el-tag>
                </div>
                <div v-if="step.branch_reason" class="step-branch">
                  <span class="io-label">分支原因：</span>{{ step.branch_reason }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 10" class="pagination-wrap">
      <el-pagination
        v-model:current-page="page"
        :page-size="10"
        :total="total"
        layout="prev, pager, total"
        small
        @current-change="fetchLogs"
      />
    </div>
  </div>
</template>

<style scoped>
.exec-log-tab {
  padding: 4px 0;
}

.empty-state {
  padding: 24px 0;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.log-card.expanded {
  border-color: var(--el-color-primary, #E85A3D);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.log-header:hover {
  background: #f9fafb;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 16px;
}

.agent-name {
  font-weight: 600;
  color: #111;
  font-size: 14px;
}

.log-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
}

.stat {
  white-space: nowrap;
}

.expand-icon {
  transition: transform 0.2s;
  color: #9ca3af;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.log-detail {
  border-top: 1px solid #f3f4f6;
  padding: 16px;
  background: #fafafa;
}

.detail-loading {
  text-align: center;
  padding: 12px;
  color: #9ca3af;
  font-size: 13px;
}

.result-summary,
.error-message {
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.result-summary {
  background: #f0fdf4;
  color: #166534;
}

.error-message {
  background: #fef2f2;
  color: #991b1b;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-item {
  padding: 10px 12px;
  border-radius: 6px;
  background: white;
  border: 1px solid #e5e7eb;
  font-size: 13px;
}

.step-item.step-failed {
  border-color: #fecaca;
  background: #fff5f5;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-num {
  font-weight: 700;
  color: #6b7280;
  min-width: 28px;
}

.step-icon {
  font-size: 14px;
}

.step-action {
  font-weight: 500;
  color: #111;
  flex: 1;
}

.step-duration {
  color: #9ca3af;
  font-size: 12px;
  white-space: nowrap;
}

.step-io {
  margin-top: 6px;
  padding-left: 36px;
  color: #4b5563;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.io-label {
  font-weight: 600;
  color: #6b7280;
}

.step-exps {
  margin-top: 6px;
  padding-left: 36px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.step-branch {
  margin-top: 6px;
  padding-left: 36px;
  color: #7c3aed;
  font-size: 12px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
