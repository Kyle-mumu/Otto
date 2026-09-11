<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, VideoPlay, VideoPause, MagicStick, Document } from '@element-plus/icons-vue'
import {
  getRules,
  createRule,
  updateRule,
  pauseRule,
  resumeRule,
  deleteRule,
  getRuleExecutions,
  getRuleTemplates,
  createRuleFromTemplate,
  type Rule,
  type RuleExecution,
  type RuleTemplate,
} from '@/api/rules'

const rules = ref<Rule[]>([])
const templates = ref<RuleTemplate[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showTemplateDialog = ref(false)
const showExecutionsDialog = ref(false)
const selectedRuleId = ref<string | null>(null)
const executions = ref<RuleExecution[]>([])
const executionsLoading = ref(false)

// Form
const form = ref({
  name: '',
  description: '',
  event_type: '',
  conditions: '{}',
  actions: '[]',
  cron_expr: '',
  max_executions_per_hour: 60,
})

const editingId = ref<string | null>(null)

async function fetchRules() {
  loading.value = true
  try {
    const res = await getRules()
    rules.value = res.data.items
  } catch {
    ElMessage.error('获取规则列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchTemplates() {
  try {
    const res = await getRuleTemplates()
    templates.value = res.data
  } catch {
    // templates optional
  }
}

async function onSubmit() {
  if (!form.value.name.trim() || !form.value.event_type) {
    ElMessage.warning('名称和事件类型必填')
    return
  }
  try {
    const data = {
      ...form.value,
      conditions: JSON.parse(form.value.conditions || '{}'),
      actions: JSON.parse(form.value.actions || '[]'),
    }
    if (editingId.value) {
      await updateRule(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createRule(data)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetForm()
    await fetchRules()
  } catch {
    ElMessage.error('保存失败')
  }
}

function resetForm() {
  form.value = {
    name: '',
    description: '',
    event_type: '',
    conditions: '{}',
    actions: '[]',
    cron_expr: '',
    max_executions_per_hour: 60,
  }
  editingId.value = null
}

function onEdit(rule: Rule) {
  form.value = {
    name: rule.name,
    description: rule.description || '',
    event_type: rule.event_type,
    conditions: JSON.stringify(rule.conditions, null, 2),
    actions: JSON.stringify(rule.actions, null, 2),
    cron_expr: rule.cron_expr || '',
    max_executions_per_hour: rule.max_executions_per_hour,
  }
  editingId.value = rule.id
  showCreateDialog.value = true
}

async function onPause(rule: Rule) {
  try {
    await pauseRule(rule.id)
    ElMessage.success('已暂停')
    await fetchRules()
  } catch {
    ElMessage.error('暂停失败')
  }
}

async function onResume(rule: Rule) {
  try {
    await resumeRule(rule.id)
    ElMessage.success('已恢复')
    await fetchRules()
  } catch {
    ElMessage.error('恢复失败')
  }
}

async function onDelete(rule: Rule) {
  await ElMessageBox.confirm(`确定删除规则「${rule.name}」？`, '确认删除', { type: 'warning' })
  try {
    await deleteRule(rule.id)
    ElMessage.success('删除成功')
    await fetchRules()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function onViewExecutions(rule: Rule) {
  selectedRuleId.value = rule.id
  showExecutionsDialog.value = true
  executionsLoading.value = true
  try {
    const res = await getRuleExecutions(rule.id)
    executions.value = res.data.items
  } catch {
    ElMessage.error('获取执行日志失败')
  } finally {
    executionsLoading.value = false
  }
}

async function onCreateFromTemplate(template: RuleTemplate) {
  try {
    await createRuleFromTemplate(template.id)
    ElMessage.success('从模板创建成功')
    showTemplateDialog.value = false
    await fetchRules()
  } catch {
    ElMessage.error('创建失败')
  }
}

const statusTagType: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  paused: 'warning',
  draft: 'info',
}

const statusLabels: Record<string, string> = {
  active: '运行中',
  paused: '已暂停',
  draft: '草稿',
}

const eventTypeLabels: Record<string, string> = {
  'task.created': '任务创建',
  'task.completed': '任务完成',
  'task.overdue': '任务逾期',
  'task.commented': '任务评论',
  'experience.published': '经验发布',
  'experience.cited': '经验引用',
  'schedule.daily_digest': '每日摘要',
}

onMounted(() => {
  fetchRules()
  fetchTemplates()
})
</script>

<template>
  <div class="rules-page">
    <header class="page-header">
      <h2>规则引擎</h2>
      <div class="header-actions">
        <el-button @click="showTemplateDialog = true" :icon="Document">从模板创建</el-button>
      <div class="spacer"></div>
        <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">新建规则</el-button>
      </div>
    </header>

    <!-- Template Dialog -->
    <el-dialog v-model="showTemplateDialog" title="选择规则模板" width="640px" destroy-on-close>
      <el-empty v-if="templates.length === 0" description="暂无可用模板" :image-size="60" />
      <div v-else class="template-grid">
        <el-card
          v-for="tmpl in templates"
          :key="tmpl.id"
          shadow="hover"
          class="template-card"
          @click="onCreateFromTemplate(tmpl)"
        >
          <div class="template-icon">{{ tmpl.icon || '📋' }}</div>
          <div class="template-name">{{ tmpl.name }}</div>
          <div class="template-desc">{{ tmpl.description }}</div>
          <el-tag size="small" type="info">{{ eventTypeLabels[tmpl.event_type] || tmpl.event_type }}</el-tag>
        </el-card>
      </div>
    </el-dialog>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingId ? '编辑规则' : '新建规则'"
      width="640px"
      destroy-on-close
      @close="resetForm"
    >
      <el-form label-position="top">
        <el-form-item label="规则名称" required>
          <el-input v-model="form.name" placeholder="规则名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="规则描述（可选）" />
        </el-form-item>
        <el-form-item label="触发事件" required>
          <el-select v-model="form.event_type" style="width: 100%" placeholder="选择触发事件">
            <el-option label="任务创建" value="task.created" />
            <el-option label="任务完成" value="task.completed" />
            <el-option label="任务逾期" value="task.overdue" />
            <el-option label="任务评论" value="task.commented" />
            <el-option label="经验发布" value="experience.published" />
            <el-option label="经验引用" value="experience.cited" />
            <el-option label="每日摘要" value="schedule.daily_digest" />
          </el-select>
        </el-form-item>
        <el-form-item label="条件配置 (JSON)">
          <el-input v-model="form.conditions" type="textarea" :rows="3" placeholder='{"all": [{"field": "priority", "op": "eq", "value": "high"}]}' />
        </el-form-item>
        <el-form-item label="动作链 (JSON)">
          <el-input v-model="form.actions" type="textarea" :rows="3" placeholder='[{"type": "notify", "config": {...}}]' />
        </el-form-item>
        <el-form-item label="Cron 表达式（可选）">
          <el-input v-model="form.cron_expr" placeholder="留空表示仅事件触发，例如：0 9 * * 1-5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">{{ editingId ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- Executions Dialog -->
    <el-dialog v-model="showExecutionsDialog" title="执行日志" width="700px" destroy-on-close>
      <div v-loading="executionsLoading">
        <el-empty v-if="executions.length === 0" description="暂无执行记录" :image-size="60" />
        <el-timeline v-else>
          <el-timeline-item
            v-for="exec in executions"
            :key="exec.id"
            :timestamp="new Date(exec.created_at).toLocaleString()"
            placement="top"
            :color="exec.success ? 'var(--el-color-success)' : 'var(--el-color-danger)'"
          >
            <el-card shadow="never">
              <div class="exec-header">
                <el-tag :type="exec.success ? 'success' : 'danger'" size="small">
                  {{ exec.success ? '成功' : '失败' }}
                </el-tag>
                <span class="exec-duration">{{ exec.duration_ms }}ms</span>
              </div>
              <div class="exec-detail">
                <div>条件匹配：{{ exec.conditions_matched ? '是' : '否' }}</div>
                <div>触发类型：{{ exec.trigger_type }}</div>
                <div v-if="exec.error_message" class="exec-error">{{ exec.error_message }}</div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <!-- List -->
    <div v-loading="loading" class="rule-list">
      <el-empty v-if="rules.length === 0 && !loading" description="暂无规则" :image-size="80" />
      <el-card v-for="rule in rules" :key="rule.id" shadow="hover" class="rule-card">
        <div class="rule-header">
          <div class="rule-title">{{ rule.name }}</div>
          <el-tag :type="statusTagType[rule.status]" size="small">{{ statusLabels[rule.status] || rule.status }}</el-tag>
        </div>
        <div class="rule-meta">
          <span class="meta-item">事件：{{ eventTypeLabels[rule.event_type] || rule.event_type }}</span>
          <span class="meta-item">执行次数：{{ rule.execution_count }}</span>
          <span v-if="rule.last_executed_at" class="meta-item">
            最后执行：{{ new Date(rule.last_executed_at).toLocaleString() }}
          </span>
        </div>
        <div class="rule-actions">
          <el-button v-if="rule.status === 'active'" size="small" @click="onPause(rule)" :icon="VideoPause">暂停</el-button>
          <el-button v-if="rule.status === 'paused'" size="small" type="success" @click="onResume(rule)" :icon="VideoPlay">恢复</el-button>
          <el-button size="small" @click="onViewExecutions(rule)">执行日志</el-button>
          <el-button size="small" @click="onEdit(rule)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(rule)">删除</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.rules-page {
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
.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.template-card {
  cursor: pointer;
  border-radius: 8px;
  transition: transform 0.2s;
}
.template-card:hover {
  transform: translateY(-2px);
}
.template-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
.template-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}
.template-desc {
  font-size: 12px;
  color: var(--el-color-info, #909399);
  margin-bottom: 8px;
}
.rule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rule-card {
  border-radius: 8px;
}
.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.rule-title {
  font-weight: 600;
  font-size: 15px;
}
.rule-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-color-info, #909399);
}
.rule-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.exec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.exec-duration {
  font-size: 12px;
  color: var(--el-color-info, #909399);
}
.exec-detail {
  font-size: 13px;
}
.exec-error {
  color: var(--el-color-danger, #f56c6c);
  margin-top: 4px;
}
</style>
