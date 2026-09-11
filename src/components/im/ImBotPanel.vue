<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import {
  createImBot, getImBots, updateImBot, deleteImBot, testImBot,
  IM_TRIGGER_EVENTS, IM_PLATFORM_LABELS, IM_TRIGGER_LABELS,
  type ImBotConfig, type BotConfigPayload, type ImPlatform, type ImTriggerEvent,
} from '@/api/imBot'

const auth = useAuthStore()

const bots = ref<ImBotConfig[]>([])
const loading = ref(true)
const showDialog = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const testingId = ref<string | null>(null)

// 平台字段提示文案
const PLATFORM_HINTS: Record<ImPlatform, { appId: string; agent: string; secret: string; chatId: string }> = {
  feishu: {
    appId: '飞书开放平台 App ID',
    agent: '',
    secret: 'App Secret（加密存储，不落明文）',
    chatId: '群 chat_id（格式 oc_xxx），Bot 拉入目标群后从飞书后台获取',
  },
  wecom: {
    appId: '企业微信 CorpID',
    agent: '企业微信 AgentId',
    secret: '企业微信 Secret（加密存储，不落明文）',
    chatId: '群 chat_id，Bot 拉入目标群后从企微 API 获取',
  },
}

const emptyForm = () => ({
  platform: 'feishu' as ImPlatform,
  name: '',
  app_id: '',
  agent_id: '',
  app_secret: '',
  encrypt_key: '',
  verification_token: '',
  bound_chat_ids: '',
  trigger_events: [...IM_TRIGGER_EVENTS] as ImTriggerEvent[],
})

const form = ref(emptyForm())
const platformHints = () => PLATFORM_HINTS[form.value.platform]

const isAdmin = () => auth.isAdmin

async function loadBots() {
  loading.value = true
  try {
    const res = await getImBots()
    bots.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  showDialog.value = true
}

function openEdit(row: ImBotConfig) {
  editingId.value = row.id
  form.value = {
    platform: row.platform,
    name: row.name,
    app_id: row.app_id,
    agent_id: row.agent_id ?? '',
    app_secret: '',   // 留空 = 不修改
    encrypt_key: '',  // 留空 = 不修改
    verification_token: '', // 留空 = 不修改
    bound_chat_ids: (row.bound_chat_ids ?? []).join('\n'),
    trigger_events: (row.trigger_events ?? [...IM_TRIGGER_EVENTS]) as ImTriggerEvent[],
  }
  showDialog.value = true
}

async function handleSave() {
  const f = form.value
  if (!f.name.trim() || !f.app_id.trim()) {
    ElMessage.warning('请填写名称与 App ID / CorpID')
    return
  }
  const boundChatIds = f.bound_chat_ids
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const payload: BotConfigPayload = {
    platform: f.platform,
    name: f.name.trim(),
    app_id: f.app_id.trim(),
    trigger_events: f.trigger_events,
    bound_chat_ids: boundChatIds,
  }
  if (f.agent_id.trim()) payload.agent_id = f.agent_id.trim()
  // 密钥：仅非空时提交（编辑态留空 = 不修改）
  if (f.app_secret.trim()) payload.app_secret = f.app_secret.trim()
  if (f.encrypt_key.trim()) payload.encrypt_key = f.encrypt_key.trim()
  if (f.verification_token.trim()) payload.verification_token = f.verification_token.trim()

  saving.value = true
  try {
    if (editingId.value) {
      await updateImBot(editingId.value, payload)
      ElMessage.success('配置已更新')
    } else {
      await createImBot(payload)
      ElMessage.success('Bot 配置创建成功')
    }
    showDialog.value = false
    await loadBots()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: ImBotConfig) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.name}」？删除后该 Bot 的推送与回调将立即失效。`,
      '删除 Bot 配置',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return // 用户取消
  }
  await deleteImBot(row.id)
  ElMessage.success('已删除')
  await loadBots()
}

async function handleToggleStatus(row: ImBotConfig) {
  await updateImBot(row.id, { status: row.status === 'active' ? 'inactive' : 'active' })
  ElMessage.success(row.status === 'active' ? '已停用' : '已启用')
  await loadBots()
}

async function handleTest(row: ImBotConfig) {
  testingId.value = row.id
  try {
    const res = await testImBot(row.id)
    const r = res.data
    if (r.success) {
      ElMessage.success(`连通性测试通过（${r.latency_ms ?? '-'}ms）：${r.message}`)
    } else {
      ElMessage.error(`测试失败：${r.message}`)
    }
  } finally {
    testingId.value = null
  }
}
</script>

<template>
  <div class="tab-content">
    <template v-if="isAdmin()">
      <div class="tab-header">
        <el-button type="primary" size="small" @click="openCreate">
          添加 Bot 配置
        </el-button>
        <span class="tab-tip">原生 IM Bot（替代 Webhook 兜底）。任务事件将推送到绑定群，成员可私聊 Bot 用命令操作任务。</span>
      </div>

      <el-table :data="bots" v-loading="loading" stripe size="small">
        <el-table-column prop="name" label="名称" min-width="110" />
        <el-table-column label="平台" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.platform === 'feishu' ? 'primary' : 'success'">
              {{ IM_PLATFORM_LABELS[row.platform as ImPlatform] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="app_id" label="App ID / CorpID" min-width="150" show-overflow-tooltip />
        <el-table-column label="密钥" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.has_secret ? 'success' : 'info'">
              {{ row.has_secret ? '已配置' : '缺失' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发事件" min-width="150">
          <template #default="{ row }">
            <el-tag v-for="ev in (row.trigger_events ?? [])" :key="ev" size="small" class="ev-tag" type="warning">
              {{ IM_TRIGGER_LABELS[ev as ImTriggerEvent] ?? ev }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="绑定群" width="80" align="center">
          <template #default="{ row }">
            {{ (row.bound_chat_ids ?? []).length }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'error' ? 'danger' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : row.status === 'error' ? '异常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" :loading="testingId === row.id" @click="handleTest(row)">测试</el-button>
            <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" text :type="row.status === 'active' ? 'warning' : 'success'" @click="handleToggleStatus(row)">
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && bots.length === 0" description="暂无 IM Bot 配置，点击右上角添加" :image-size="60" />
    </template>
    <el-empty v-else description="IM Bot 配置仅管理员可见" :image-size="60" />
  </div>

  <!-- 添加/编辑 Bot 配置弹窗 -->
  <el-dialog v-model="showDialog" :title="editingId ? '编辑 Bot 配置' : '添加 Bot 配置'" width="560px" :close-on-click-modal="false">
    <el-form :model="form" label-width="150px">
      <el-form-item label="平台">
        <el-radio-group v-model="form.platform">
          <el-radio-button value="feishu">飞书</el-radio-button>
          <el-radio-button value="wecom">企业微信</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="名称">
        <el-input v-model="form.name" placeholder="如: 研发群任务助手" maxlength="50" />
      </el-form-item>
      <el-form-item :label="platformHints().appId">
        <el-input v-model="form.app_id" :placeholder="platformHints().appId" />
      </el-form-item>
      <el-form-item v-if="platformHints().agent" label="AgentId">
        <el-input v-model="form.agent_id" placeholder="仅企业微信需要" />
      </el-form-item>
      <el-form-item label="App Secret">
        <el-input v-model="form.app_secret" type="password" show-password :placeholder="editingId ? '留空 = 不修改（已加密存储）' : platformHints().secret" />
      </el-form-item>
      <el-form-item label="Encrypt Key">
        <el-input v-model="form.encrypt_key" type="password" show-password :placeholder="editingId ? '留空 = 不修改' : '飞书 Encrypt Key / 企微 EncodingAESKey'" />
      </el-form-item>
      <el-form-item label="Verification Token">
        <el-input v-model="form.verification_token" type="password" show-password :placeholder="editingId ? '留空 = 不修改' : '飞书 Verification Token / 企微 Token'" />
      </el-form-item>
      <el-form-item label="触发事件">
        <el-checkbox-group v-model="form.trigger_events">
          <el-checkbox v-for="ev in IM_TRIGGER_EVENTS" :key="ev" :value="ev">
            {{ IM_TRIGGER_LABELS[ev] }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="绑定群 chat_id">
        <el-input v-model="form.bound_chat_ids" type="textarea" :rows="3" :placeholder="platformHints().chatId + '，多个群每行一个'" />
      </el-form-item>
      <el-form-item v-if="editingId">
        <el-alert type="info" :closable="false" show-icon title="密钥字段留空即保持原值；系统加密存储，界面不可回读。" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showDialog = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.tab-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tab-tip {
  color: #909399;
  font-size: 12px;
}

.ev-tag {
  margin-right: 4px;
}
</style>
