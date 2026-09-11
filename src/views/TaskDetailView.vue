<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const taskId = computed(() => route.params.id as string)

// 模拟任务详情数据（后续接API）
const taskDetail = computed(() => ({
  id: taskId.value,
  title: '详情页任务',
  status: '待审批',
  statusColor: 'var(--status-pending, #F59E0B)',
  assigner: 'boss',
  assignee: 'kyle',
  createdAt: '2026-09-07 10:30',
  description: '需要完成详情页的开发工作，包括：\n\n1. 响应式布局适配\n2. 交互逻辑实现\n3. 数据对接\n4. 单元测试编写',
  timeline: [
    { action: '创建任务', operator: 'boss', time: '2026-09-07 10:30' },
    { action: '开始执行', operator: 'kyle', time: '2026-09-07 11:00' },
    { action: '提交审核', operator: 'kyle', time: '2026-09-07 15:30' },
  ],
}))

const statusActions: Record<string, { label: string; next: string }> = {
  '待审批': { label: '批准', next: '进行中' },
  '待提交': { label: '提交', next: '待审批' },
  '进行中': { label: '完成', next: '已通过' },
}

function goBack() {
  router.push('/dashboard/tasks')
}

function handleStatusAction() {
  const action = statusActions[taskDetail.value.status]
  if (action) {
    taskDetail.value.status = action.next
    taskDetail.value.timeline.push({
      action: action.label,
      operator: 'kyle',
      time: new Date().toLocaleString('zh-CN'),
    })
  }
}
</script>

<template>
  <div class="detail-view">
    <div class="detail-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h2>{{ taskDetail.title }}</h2>
      <span class="status-badge" :style="{ background: taskDetail.statusColor }">
        {{ taskDetail.status }}
      </span>
    </div>

    <div class="detail-meta">
      <span>📅 {{ taskDetail.createdAt }}</span>
      <span>👤 {{ taskDetail.assigner }} → {{ taskDetail.assignee }}</span>
      <span>🆔 任务 #{{ taskId }}</span>
    </div>

    <div class="detail-content">
      <section class="detail-section">
        <h3>任务描述</h3>
        <p class="description">{{ taskDetail.description }}</p>
      </section>

      <section class="detail-section">
        <h3>执行时间线</h3>
        <div class="timeline">
          <div
            v-for="(event, idx) in taskDetail.timeline"
            :key="idx"
            class="timeline-item"
          >
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <span class="timeline-action">{{ event.action }}</span>
              <span class="timeline-operator">by {{ event.operator }}</span>
              <span class="timeline-time">{{ event.time }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="detail-section" v-if="statusActions[taskDetail.status]">
        <button class="action-btn" @click="handleStatusAction">
          {{ statusActions[taskDetail.status].label }}
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.detail-view {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-light, #E8E8E8);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.back-btn:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
}

.detail-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-heading, #111);
  margin: 0;
}

.status-badge {
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.detail-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-muted, #888);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light, #E8E8E8);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-heading, #111);
  margin: 0 0 12px 0;
}

.description {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-body, #333);
  white-space: pre-wrap;
  background: var(--bg-sidebar-hover, #F5F3F1);
  padding: 16px;
  border-radius: 8px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-left: 8px;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--otto-primary, #E85A3D);
  margin-top: 5px;
  flex-shrink: 0;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-action {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-heading, #111);
}

.timeline-operator {
  font-size: 12px;
  color: var(--text-muted, #888);
}

.timeline-time {
  font-size: 11px;
  color: var(--text-muted, #888);
}

.action-btn {
  padding: 10px 24px;
  background: var(--otto-primary, #E85A3D);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.action-btn:hover {
  opacity: 0.9;
}
</style>
