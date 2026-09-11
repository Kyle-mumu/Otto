<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createTask,
  updateTask,
  transitionTask,
  getTaskVersions,
} from '@/api/tasks'
import { useTaskStore } from '@/stores/task'
import { useAuthStore } from '@/stores/auth'
import type { Task, TaskVersion } from '@/types/api'
import ExecutionLogTab from '@/components/ExecutionLogTab.vue'
import TraceTimelineTab from '@/components/TraceTimelineTab.vue'

const store = useTaskStore()
const auth = useAuthStore()

const showCreateDialog = ref(false)
const showVersionsDialog = ref(false)
const selectedVersions = ref<TaskVersion[]>([])

// 溯源抽屉
const showTraceDrawer = ref(false)
const traceTaskId = ref('')
const traceTaskTitle = ref('')
const activeTraceTab = ref('log')

const newTitle = ref('')
const newDescription = ref('')
const newPriority = ref('medium')

async function onCreate() {
  if (!newTitle.value.trim()) return
  try {
    await createTask({
      title: newTitle.value,
      description: newDescription.value,
      priority: newPriority.value,
    })
    showCreateDialog.value = false
    newTitle.value = ''
    newDescription.value = ''
    newPriority.value = 'medium'
    ElMessage.success('任务创建成功')
    await store.fetch()
  } catch {
    ElMessage.error('创建失败')
  }
}

async function onAssign(task: Task) {
  try {
    await updateTask(task.id, { assignee_id: auth.user?.id })
    await transitionTask(task.id, { target_status: 'assigned' })
    ElMessage.success('指派成功')
    await store.fetch()
  } catch {
    ElMessage.error('指派失败')
  }
}

async function onTransition(task: Task, targetStatus: string) {
  try {
    await transitionTask(task.id, { target_status: targetStatus })
    ElMessage.success('状态流转成功')
    await store.fetch()
  } catch {
    ElMessage.error('状态流转失败')
  }
}

async function onViewVersions(task: Task) {
  try {
    const res = await getTaskVersions(task.id)
    selectedVersions.value = res.data
    showVersionsDialog.value = true
  } catch {
    ElMessage.error('获取版本历史失败')
  }
}

const availableTransitions = (status: string) => {
  const map: Record<string, { target: string; label: string }[]> = {
    draft: [{ target: 'assigned', label: '指派' }],
    assigned: [{ target: 'in_progress', label: '开始执行' }],
    in_progress: [{ target: 'delivered', label: '交付' }],
    delivered: [{ target: 'reviewing', label: '提交评审' }],
    reviewing: [
      { target: 'completed', label: '通过' },
      { target: 'in_progress', label: '打回' },
    ],
    completed: [{ target: 'archived', label: '归档' }],
    archived: [],
  }
  return map[status] || []
}

const statusTagType: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'info',
  assigned: '',
  in_progress: '',
  delivered: '',
  reviewing: 'warning',
  completed: 'success',
  archived: 'info',
}

const statusLabels: Record<string, string> = {
  draft: '草稿',
  assigned: '已指派',
  in_progress: '执行中',
  delivered: '已交付',
  reviewing: '评审中',
  completed: '已完成',
  archived: '已归档',
}

const priorityTagType: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  low: 'info',
  medium: '',
  high: 'warning',
  urgent: 'danger',
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

function onOpenTrace(task: Task) {
  traceTaskId.value = task.id
  traceTaskTitle.value = task.title
  activeTraceTab.value = 'log'
  showTraceDrawer.value = true
}

onMounted(() => {
  store.fetch()
  store.bindWsRefresh()
})
</script>

<template>
  <div class="tasks-page">
    <header class="page-header">
      <h2>任务卡</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>新建任务
      </el-button>
    </header>

    <!-- 创建对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建任务" width="480px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="newTitle" placeholder="任务标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newDescription" type="textarea" placeholder="任务描述（可选）" :rows="3" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="newPriority" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="onCreate" :disabled="!newTitle.trim()">创建</el-button>
      </template>
    </el-dialog>

    <!-- 版本历史对话框 -->
    <el-dialog v-model="showVersionsDialog" title="版本历史" width="640px" destroy-on-close>
      <el-empty v-if="selectedVersions.length === 0" description="暂无版本记录" :image-size="60" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="v in selectedVersions"
          :key="v.id"
          :timestamp="new Date(v.created_at).toLocaleString()"
          placement="top"
          color="var(--el-color-primary, #E85A3D)"
        >
          <el-card shadow="never">
            <template #header>
              <div class="version-header">
                <el-tag type="primary" size="small">v{{ v.version_number }}</el-tag>
              </div>
            </template>
            <div class="version-changes">
              <div v-for="(val, key) in v.changes" :key="key" class="change-row">
                <span class="change-field">{{ key }}</span>
                <el-tag type="danger" size="small" effect="plain">{{ val.old }}</el-tag>
                <span class="change-arrow">→</span>
                <el-tag type="success" size="small" effect="plain">{{ val.new }}</el-tag>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <template #footer>
        <el-button @click="showVersionsDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 溯源抽屉 -->
    <el-drawer
      v-model="showTraceDrawer"
      :title="`🔍 溯源 · ${traceTaskTitle}`"
      size="520px"
      destroy-on-close
    >
      <el-tabs v-model="activeTraceTab">
        <el-tab-pane label="📋 执行日志" name="log">
          <ExecutionLogTab
            v-if="traceTaskId"
            :task-id="traceTaskId"
          />
        </el-tab-pane>
        <el-tab-pane label="🤖 溯源问答" name="trace">
          <TraceTimelineTab
            v-if="traceTaskId"
            :task-id="traceTaskId"
          />
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <!-- 任务列表 -->
    <el-table v-loading="store.loading" :data="store.items" stripe style="width: 100%">
      <el-table-column label="优先级" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="priorityTagType[row.priority]" size="small" effect="dark">
            {{ priorityLabels[row.priority] || row.priority }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="200">
        <template #default="{ row }">
          <div class="task-title-cell">
            <span class="task-title">{{ row.title }}</span>
            <el-tag v-if="row.is_overdue" type="danger" size="small" effect="plain" class="overdue-tag">
              超时
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200">
        <template #default="{ row }">
          <span class="task-desc">{{ row.description || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType[row.status]" effect="dark" size="small">
            {{ statusLabels[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="140" align="center">
        <template #default="{ row }">
          <span class="meta-text">{{ new Date(row.created_at).toLocaleDateString() }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" align="center" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button
              v-if="row.status === 'draft'"
              type="primary"
              size="small"
              text
              @click="onAssign(row)"
            >
              指派给自己
            </el-button>
            <el-button
              v-for="t in availableTransitions(row.status)"
              :key="t.target"
              type="primary"
              size="small"
              text
              @click="onTransition(row, t.target)"
            >
              {{ t.label }}
            </el-button>
            <el-button type="info" size="small" text @click="onViewVersions(row)">
              版本历史
            </el-button>
            <el-button type="warning" size="small" text @click="onOpenTrace(row)">
              🔍 溯源
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div v-if="store.total > store.pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="store.page"
        :page-size="store.pageSize"
        :total="store.total"
        layout="prev, pager, next, total"
        @current-change="store.setPage"
      />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-heading, #111111);
  margin: 0;
}

.task-title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-title {
  font-weight: 500;
  color: var(--text-heading, #111111);
}

.overdue-tag {
  flex-shrink: 0;
}

.task-desc {
  font-size: 13px;
  color: var(--text-muted, #888);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-text {
  font-size: 13px;
  color: var(--text-muted, #888);
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 版本历史 */
.version-header {
  display: flex;
  align-items: center;
}

.version-changes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.change-field {
  font-weight: 500;
  color: #374151;
  min-width: 80px;
}

.change-arrow {
  color: var(--text-muted, #888);
}
</style>
