<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'
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
const webhooks = ref<any[]>([])
const webhookLoading = ref(true)
const showAddWebhook = ref(false)
const webhookForm = ref({
  name: '',
  url: '',
  type: 'feishu',
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
    const res = await http.get('/webhooks')
    webhooks.value = res.data.items || res.data || []
  } catch {
    // 静默处理
  } finally {
    webhookLoading.value = false
  }
}

async function handleAddWebhook() {
  try {
    await http.post('/webhooks', webhookForm.value)
    ElMessage.success('Webhook添加成功')
    showAddWebhook.value = false
    await loadWebhooks()
  } catch {
    ElMessage.error('添加失败')
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
              <el-table-column prop="name" label="名称" min-width="120" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="url" label="URL" min-width="200" show-overflow-tooltip />
              <el-table-column prop="is_active" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
                    {{ row.is_active ? '启用' : '停用' }}
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
    <el-dialog v-model="showAddWebhook" title="添加Webhook" width="450px">
      <el-form :model="webhookForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="webhookForm.name" placeholder="如: 飞书通知" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="webhookForm.type" style="width: 100%">
            <el-option label="飞书" value="feishu" />
            <el-option label="企业微信" value="wecom" />
            <el-option label="Slack" value="slack" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="webhookForm.url" placeholder="Webhook URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddWebhook = false">取消</el-button>
        <el-button type="primary" @click="handleAddWebhook">确认</el-button>
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

.settings-form {
  max-width: 500px;
}
</style>
