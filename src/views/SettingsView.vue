<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'
import {
  getWebhooks,
  createWebhook,
  WEBHOOK_TRIGGER_EVENTS,
  WEBHOOK_PLATFORM_LABELS,
  WEBHOOK_STATUS_LABELS,
  WEBHOOK_TRIGGER_LABELS,
  type WebhookConfig,
  type WebhookPlatform,
  type WebhookTriggerEvent,
} from '@/api/webhook'
import SettingsNetworkView from './SettingsNetworkView.vue'
import ImBotPanel from '@/components/im/ImBotPanel.vue'
import ImBindingPanel from '@/components/im/ImBindingPanel.vue'

const activeTab = ref('knowledge')

// ========== 知识库配置 ==========
const kbConfig = ref({
  personal_workspace: true,
  team_workspace: true,
  auto_collect: true,
  manual_upload: true,
})

// ========== Webhook配置 ==========
const webhooks = ref<WebhookConfig[]>([])
const webhookLoading = ref(true)
const showAddWebhook = ref(false)
const webhookSubmitting = ref(false)
const webhookForm = ref({
  platform: 'feishu' as WebhookPlatform,
  webhook_url: '',
  secret: '',
  trigger_events: [...WEBHOOK_TRIGGER_EVENTS] as WebhookTriggerEvent[],
})

// ========== 审计日志 ==========
const auditLogs = ref<any[]>([])
const auditLoading = ref(true)

onMounted(async () => {
  await Promise.all([loadWebhooks(), loadAuditLogs()])
})

async function loadWebhooks() {
  webhookLoading.value = true
  try {
    const res = await getWebhooks()
    // 后端返回裸数组（list[WebhookOut]），保留 items 兼容分支
    webhooks.value = res.data?.items || res.data || []
  } catch {
    // 静默处理
  } finally {
    webhookLoading.value = false
  }
}

/** 442 校验错误详情转可读文本 */
function formatErrorDetail(detail: any): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => `${(d.loc || []).slice(-1)[0] || ''}: ${d.msg || ''}`)
      .join('；')
  }
  return ''
}

async function handleAddWebhook() {
  if (!webhookForm.value.webhook_url) {
    ElMessage.warning('请填写 Webhook URL')
    return
  }
  if (!webhookForm.value.webhook_url.startsWith('https://')) {
    ElMessage.warning('Webhook URL 必须以 https:// 开头')
    return
  }
  if (webhookForm.value.trigger_events.length === 0) {
    ElMessage.warning('请至少选择一个触发事件')
    return
  }
  webhookSubmitting.value = true
  try {
    await createWebhook({
      platform: webhookForm.value.platform,
      webhook_url: webhookForm.value.webhook_url,
      // 密钥留空不提交（后端 Optional）
      ...(webhookForm.value.secret ? { secret: webhookForm.value.secret } : {}),
      trigger_events: webhookForm.value.trigger_events,
    })
    ElMessage.success('Webhook 添加成功')
    showAddWebhook.value = false
    resetWebhookForm()
    await loadWebhooks()
  } catch (err: any) {
    // 422 校验错误回显后端 detail
    const detail = formatErrorDetail(err?.response?.data?.detail)
    ElMessage.error(detail ? `添加失败：${detail}` : '添加失败')
  } finally {
    webhookSubmitting.value = false
  }
}

function resetWebhookForm() {
  webhookForm.value = {
    platform: 'feishu',
    webhook_url: '',
    secret: '',
    trigger_events: [...WEBHOOK_TRIGGER_EVENTS],
  }
}

async function loadAuditLogs() {
  auditLoading.value = true
  try {
    const res = await http.get('/config/audit-logs')
    auditLogs.value = res.data.items || res.data || []
  } catch {
    // 静默处理
  } finally {
    auditLoading.value = false
  }
}
</script>

<template>
  <div class="settings-page">
    <header class="page-header">
      <h2>设置</h2>
    </header>

    <el-card shadow="never" class="content-card">
      <el-tabs v-model="activeTab">
        <!-- 知识库配置 -->
        <el-tab-pane label="知识库配置" name="knowledge">
          <div class="tab-content">
            <el-form label-width="160px" class="settings-form">
              <el-divider content-position="left">个人空间</el-divider>
              <el-form-item label="启用个人知识库">
                <el-switch v-model="kbConfig.personal_workspace" />
              </el-form-item>
              <el-form-item label="自动收集经验">
                <el-switch v-model="kbConfig.auto_collect" />
              </el-form-item>

              <el-divider content-position="left">团队空间</el-divider>
              <el-form-item label="启用团队知识库">
                <el-switch v-model="kbConfig.team_workspace" />
              </el-form-item>
              <el-form-item label="允许手动上传">
                <el-switch v-model="kbConfig.manual_upload" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- Webhook配置 -->
        <el-tab-pane label="Webhook配置" name="webhook">
          <div class="tab-content">
            <div class="tab-header">
              <el-button type="primary" size="small" @click="showAddWebhook = true">
                添加Webhook
              </el-button>
            </div>

            <el-table :data="webhooks" v-loading="webhookLoading" stripe size="small">
              <el-table-column prop="platform" label="平台" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ WEBHOOK_PLATFORM_LABELS[row.platform] || row.platform }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="webhook_url" label="Webhook URL" min-width="220" show-overflow-tooltip />
              <el-table-column label="触发事件" min-width="200">
                <template #default="{ row }">
                  <el-tag
                    v-for="ev in (row.trigger_events || [])"
                    :key="ev"
                    size="small"
                    type="info"
                    class="event-tag"
                  >
                    {{ WEBHOOK_TRIGGER_LABELS[ev] || ev }}
                  </el-tag>
                  <span v-if="!row.trigger_events || row.trigger_events.length === 0">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : row.status === 'error' ? 'danger' : 'info'" size="small">
                    {{ WEBHOOK_STATUS_LABELS[row.status] || row.status }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!webhookLoading && webhooks.length === 0" description="暂无Webhook配置" :image-size="60" />
          </div>
        </el-tab-pane>

        <!-- IM Bot 配置（V1.1-B5，admin） -->
        <el-tab-pane label="IM Bot 配置" name="im-bot">
          <ImBotPanel />
        </el-tab-pane>

        <!-- IM 绑定（V1.1-B5，member） -->
        <el-tab-pane label="IM 绑定" name="im-bind">
          <ImBindingPanel />
        </el-tab-pane>

        <!-- 审计日志 -->
        <el-tab-pane label="审计日志" name="audit">
          <div class="tab-content">
            <el-table :data="auditLogs" v-loading="auditLoading" stripe size="small">
              <el-table-column prop="action" label="操作" width="150" />
              <el-table-column prop="resource_type" label="资源类型" width="120" />
              <el-table-column prop="resource_id" label="资源ID" width="200" show-overflow-tooltip />
              <el-table-column prop="user_id" label="操作人" width="120" />
              <el-table-column prop="created_at" label="时间" width="180">
                <template #default="{ row }">
                  {{ new Date(row.created_at).toLocaleString() }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!auditLoading && auditLogs.length === 0" description="暂无审计日志" :image-size="60" />
          </div>
        </el-tab-pane>

        <!-- 网络管理（V1.1-B6） -->
        <el-tab-pane label="网络管理" name="network">
          <div class="tab-content">
            <SettingsNetworkView />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 添加Webhook弹窗 -->
    <el-dialog v-model="showAddWebhook" title="添加Webhook" width="480px">
      <el-form :model="webhookForm" label-width="100px">
        <el-form-item label="平台">
          <el-select v-model="webhookForm.platform" style="width: 100%">
            <el-option label="飞书" value="feishu" />
            <el-option label="企业微信" value="wecom" />
          </el-select>
        </el-form-item>
        <el-form-item label="Webhook URL">
          <el-input v-model="webhookForm.webhook_url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="签名密钥">
          <el-input v-model="webhookForm.secret" placeholder="飞书签名校验密钥（可选）" show-password />
        </el-form-item>
        <el-form-item label="触发事件">
          <el-checkbox-group v-model="webhookForm.trigger_events">
            <el-checkbox value="task_created">任务创建</el-checkbox>
            <el-checkbox value="task_transition">任务流转</el-checkbox>
            <el-checkbox value="task_assigned">任务指派</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddWebhook = false">取消</el-button>
        <el-button type="primary" :loading="webhookSubmitting" @click="handleAddWebhook">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-heading, #111111);
  margin: 0;
}

.content-card {
  border-radius: 12px;
}

.tab-content {
  padding: 16px 0;
}

.tab-header {
  margin-bottom: 16px;
}

.event-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}

.settings-form {
  max-width: 500px;
}
</style>
