<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, VideoPlay, VideoPause, Refresh, MagicStick } from '@element-plus/icons-vue'
import {
  getScheduledTasks,
  createScheduledTask,
  updateScheduledTask,
  pauseScheduledTask,
  resumeScheduledTask,
  triggerScheduledTask,
  deleteScheduledTask,
  nlParse,
  type ScheduledTask,
} from '@/api/scheduledTasks'

const tasks = ref<ScheduledTask[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showNLDialog = ref(false)
const nlText = ref('')
const nlLoading = ref(false)

// Form
const form = ref({
  title: '',
  description: '',
  priority: 'medium' as string,
  cron_expr: '',
  cron_human: '',
  assignee_id: '',
  reviewer_id: '',
  start_date: '',
  end_date: '',
  deadline_offset_hours: 24,
})

const editingId = ref<string | null>(null)

async function fetchTasks() {
  loading.value = true
  try {
    const res = await getScheduledTasks()
    tasks.value = res.data
  } catch {
    ElMessage.error('获取定时任务失败')
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (!form.value.title.trim() || !form.value.cron_expr) {
    ElMessage.warning('标题和 Cron 表达式必填')
    return
  }
  try {
    if (editingId.value) {
      await updateScheduledTask(editingId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await createScheduledTask(form.value)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetForm()
    await fetchTasks()
  } catch {
    ElMessage.error('保存失败')
  }
}

function resetForm() {
  form.value = {
    title: '',
    description: '',
    priority: 'medium',
    cron_expr: '',
    cron_human: '',
    assignee_id: '',
    reviewer_id: '',
    start_date: '',
    end_date: '',
    deadline_offset_hours: 24,
  }
  editingId.value = null
}

function onEdit(task: ScheduledTask) {
  form.value = {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    cron_expr: task.cron_expr,
    cron_human: task.cron_human || '',
    assignee_id: task.assignee_id || '',
    reviewer_id: task.reviewer_id || '',
    start_date: task.start_date || '',
    end_date: task.end_date || '',
    deadline_offset_hours: task.deadline_offset_hours,
  }
  editingId.value = task.id
  showCreateDialog.value = true
}

async function onPause(task: ScheduledTask) {
  try {
    await pauseScheduledTask(task.id)
    ElMessage.success('已暂停')
    await fetchTasks()
  } catch {
    ElMessage.error('暂停失败')
  }
}

async function onResume(task: ScheduledTask) {
  try {
    await resumeScheduledTask(task.id)
    ElMessage.success('已恢复')
    await fetchTasks()
  } catch {
    ElMessage.error('恢复失败')
  }
}

async function onTrigger(task: ScheduledTask) {
  try {
    await triggerScheduledTask(task.id)
    ElMessage.success('已手动触发')
    await fetchTasks()
  } catch {
    ElMessage.error('触发失败')
  }
}

async function onDelete(task: ScheduledTask) {
  await ElMessageBox.confirm(`确定删除定时任务「${task.title}」？`, '确认删除', { type: 'warning' })
  try {
    await deleteScheduledTask(task.id)
    ElMessage.success('删除成功')
    await fetchTasks()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function onNLParse() {
  if (!nlText.value.trim()) return
  nlLoading.value = true
  try {
    const res = await nlParse(nlText.value)
    form.value.cron_expr = res.data.cron_expr
    form.value.cron_human = res.data.cron_human
    ElMessage.success(`解析成功：${res.data.cron_human}`)
    showNLDialog.value = false
  } catch {
    ElMessage.error('解析失败，请重试')
  } finally {
    nlLoading.value = false
  }
}

const statusTagType: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  paused: 'warning',
  completed: 'info',
  archived: 'info',
}

const statusLabels: Record<string, string> = {
  active: '运行中',
  paused: '已暂停',
  completed: '已完成',
  archived: '已归档',
}

onMounted(() => {
  fetchTasks()
})
</script>

<template>
  <div class="scheduled-tasks-page">
    <header class="page-header">
      <h2>定时任务</h2>
      <div class="header-actions">
        <el-button @click="showNLDialog = true" :icon="MagicStick">智能解析</el-button>
      <div class="spacer"></div>
        <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">新建定时任务</el-button>
      </div>
    </header>

    <!-- NL Parse Dialog -->
    <el-dialog v-model="showNLDialog" title="智能解析（NL → Cron）" width="520px" destroy-on-close>
      <el-input
        v-model="nlText"
        type="textarea"
        :rows="3"
        placeholder="例如：每天早上9点提醒我写周报，或者每周五下午5点生成总结"
      />
      <template #footer>
        <el-button @click="showNLDialog = false">取消</el-button>
        <el-button type="primary" @click="onNLParse" :loading="nlLoading">解析</el-button>
      </template>
    </el-dialog>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? '编辑定时任务' : '新建定时任务'"
      width="560px"
      destroy-on-close
      @close="resetForm"
    >
      <el-form label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="任务标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="任务描述（可选）" />
        </el-form-item>
        <el-form-item label="Cron 表达式" required>
          <el-input v-model="form.cron_expr" placeholder="例如：0 9 * * 1-5">
            <template #append>
              <el-button @click="showNLDialog = true" :icon="MagicStick" title="智能解析" />
            </template>
          </el-input>
          <div v-if="form.cron_human" class="cron-human">释义：{{ form.cron_human }}</div>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="form.priority" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止时间偏移（小时）">
          <el-input-number v-model="form.deadline_offset_hours" :min="1" :max="720" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">{{ editingId ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- List -->
    <div v-loading="loading" class="task-list">
      <el-empty v-if="tasks.length === 0 && !loading" description="暂无定时任务" :image-size="80" />
      <el-card v-for="task in tasks" :key="task.id" shadow="hover" class="task-card">
        <div class="task-header">
          <div class="task-title">{{ task.title }}</div>
          <el-tag :type="statusTagType[task.status]" size="small">{{ statusLabels[task.status] || task.status }}</el-tag>
        </div>
        <div class="task-meta">
          <span class="meta-item">Cron: <code>{{ task.cron_expr }}</code></span>
          <span v-if="task.cron_human" class="meta-item">{{ task.cron_human }}</span>
          <span v-if="task.next_triggered_at" class="meta-item">
            下次：{{ new Date(task.next_triggered_at).toLocaleString() }}
          </span>
        </div>
        <div class="task-actions">
          <el-button v-if="task.status === 'active'" size="small" @click="onPause(task)" :icon="VideoPause">暂停</el-button>
          <el-button v-if="task.status === 'paused'" size="small" type="success" @click="onResume(task)" :icon="VideoPlay">恢复</el-button>
          <el-button size="small" @click="onTrigger(task)" :icon="Refresh">触发</el-button>
          <el-button size="small" @click="onEdit(task)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(task)">删除</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.scheduled-tasks-page {
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
}
.header-actions {
  display: flex;
  gap: 8px;
}
.spacer {
  flex: 1;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-card {
  border-radius: 8px;
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.task-title {
  font-weight: 600;
  font-size: 15px;
}
.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-color-info, #909399);
}
.meta-item code {
  background: var(--el-fill-color-light, #f5f7fa);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
}
.cron-human {
  font-size: 12px;
  color: var(--el-color-success, #67c23a);
  margin-top: 4px;
}
.task-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>
