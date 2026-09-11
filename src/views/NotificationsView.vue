<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Check, Delete } from '@element-plus/icons-vue'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  type TaskNotification,
} from '@/api/notifications'

const notifications = ref<TaskNotification[]>([])
const unreadCount = ref(0)
const loading = ref(false)
const filter = ref<'all' | 'unread'>('all')

async function fetchNotifications() {
  loading.value = true
  try {
    const res = await getNotifications({ unread_only: filter.value === 'unread' })
    notifications.value = res.data.items
  } catch {
    ElMessage.error('获取通知失败')
  } finally {
    loading.value = false
  }
}

async function fetchUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data.count
  } catch {
    // ignore
  }
}

async function onMarkAsRead(notif: TaskNotification) {
  try {
    await markAsRead(notif.id)
    notif.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {
    ElMessage.error('操作失败')
  }
}

async function onMarkAllRead() {
  try {
    await markAllAsRead()
    ElMessage.success('已全部标为已读')
    notifications.value.forEach(n => (n.is_read = true))
    unreadCount.value = 0
  } catch {
    ElMessage.error('操作失败')
  }
}

async function onDelete(notif: TaskNotification) {
  try {
    await deleteNotification(notif.id)
    notifications.value = notifications.value.filter(n => n.id !== notif.id)
    if (!notif.is_read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

async function onClearAll() {
  await ElMessageBox.confirm('确定清空所有通知？', '确认清空', { type: 'warning' })
  try {
    await clearAllNotifications()
    notifications.value = []
    unreadCount.value = 0
    ElMessage.success('已清空')
  } catch {
    ElMessage.error('清空失败')
  }
}

function onFilterChange() {
  fetchNotifications()
}

const eventTypeLabels: Record<string, string> = {
  'task.created': '任务创建',
  'task.completed': '任务完成',
  'task.overdue': '任务逾期',
  'task.assigned': '任务分配',
  'task.commented': '任务评论',
  'scheduled.triggered': '定时触发',
  'rule.executed': '规则执行',
}

const channelLabels: Record<string, string> = {
  websocket: 'WebSocket',
  im_bot: 'IM Bot',
  webhook: 'Webhook',
}

onMounted(() => {
  fetchNotifications()
  fetchUnreadCount()
})
</script>

<template>
  <div class="notifications-page">
    <header class="page-header">
      <h2>
        通知中心
        <el-badge v-if="unreadCount > 0" :value="unreadCount" class="unread-badge" />
      </h2>
      <div class="header-actions">
        <el-button @click="onMarkAllRead" :icon="Check" :disabled="unreadCount === 0">全部已读</el-button>
        <el-button @click="onClearAll" :icon="Delete" type="danger" plain>清空</el-button>
      </div>
    </header>

    <!-- Filter -->
    <div class="filter-bar">
      <el-radio-group v-model="filter" @change="onFilterChange" size="default">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="unread">未读</el-radio-button>
      </el-radio-group>
    </div>

    <!-- List -->
    <div v-loading="loading" class="notif-list">
      <el-empty v-if="notifications.length === 0 && !loading" description="暂无通知" :image-size="80" />
      <el-card
        v-for="notif in notifications"
        :key="notif.id"
        shadow="hover"
        class="notif-card"
        :class="{ unread: !notif.is_read }"
      >
        <div class="notif-header">
          <div class="notif-title">
            <el-icon v-if="!notif.is_read" class="unread-dot"><Bell /></el-icon>
            <span class="event-label">{{ eventTypeLabels[notif.event_type] || notif.event_type }}</span>
          </div>
          <span class="notif-time">{{ new Date(notif.created_at).toLocaleString() }}</span>
        </div>
        <div class="notif-content">{{ notif.content }}</div>
        <div class="notif-footer">
          <el-tag size="small" type="info" effect="plain">{{ channelLabels[notif.channel] || notif.channel }}</el-tag>
          <div class="notif-actions">
            <el-button v-if="!notif.is_read" size="small" @click="onMarkAsRead(notif)" :icon="Check">标为已读</el-button>
            <el-button size="small" type="danger" @click="onDelete(notif)" :icon="Delete">删除</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  padding: 0;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.unread-badge {
  margin-left: 4px;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.filter-bar {
  margin-bottom: 16px;
}
.notif-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notif-card {
  border-radius: 8px;
  transition: border-color 0.2s;
  border-left: 3px solid transparent;
}
.notif-card.unread {
  border-left-color: var(--el-color-primary, #e85a3d);
  background: var(--el-fill-color-light, #f5f7fa);
}
.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.notif-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
}
.unread-dot {
  color: var(--el-color-primary, #e85a3d);
}
.event-label {
  font-weight: 600;
}
.notif-time {
  font-size: 12px;
  color: var(--el-color-info, #909399);
}
.notif-content {
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
  margin-bottom: 10px;
  line-height: 1.5;
}
.notif-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.notif-actions {
  display: flex;
  gap: 6px;
}
</style>
