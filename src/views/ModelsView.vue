<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getModels, createModel, updateModel, deleteModel, testModel } from '@/api/models'

// 模型数据
const models = ref<any[]>([])
const loading = ref(true)
const showAddDialog = ref(false)
const editingId = ref<string | null>(null)   // 第 1 条：编辑态（null = 新增）
const testingId = ref<string | null>(null)   // 正在测试的模型 id

// 新增/编辑模型表单
const form = ref({
  name: '',
  provider: 'openai',
  model_id: '',
  api_base: '',
  api_key: '',          // 第 1 条：明文入参；编辑态留空 = 不改 Key
  is_active: true,
})

onMounted(async () => {
  await loadModels()
})

async function loadModels() {
  loading.value = true
  try {
    const res = await getModels()
    models.value = res.data.items || res.data || []
  } catch {
    models.value = []
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editingId.value = null
  form.value = { name: '', provider: 'openai', model_id: '', api_base: '', api_key: '', is_active: true }
  showAddDialog.value = true
}

// 第 1 条：编辑 —— 不预填 api_key（服务端只回打码值，明文不可取回）
function openEdit(row: any) {
  editingId.value = row.id
  form.value = {
    name: row.name,
    provider: row.provider,
    model_id: row.model_id,
    api_base: row.api_base || '',
    api_key: '',
    is_active: row.is_active,
  }
  showAddDialog.value = true
}

async function handleSubmit() {
  try {
    const payload: any = { ...form.value }
    // 编辑态且 api_key 留空 ⇒ 删掉该字段，服务端走 exclude_unset 不覆盖
    if (editingId.value && !payload.api_key) {
      delete payload.api_key
    }
    delete payload.is_active
    payload.is_active = form.value.is_active

    if (editingId.value) {
      await updateModel(editingId.value, payload)
      ElMessage.success('模型已更新')
    } else {
      await createModel(payload)
      ElMessage.success('模型添加成功')
    }
    showAddDialog.value = false
    await loadModels()
  } catch {
    ElMessage.error(editingId.value ? '更新失败' : '添加失败')
  }
}

async function toggleActive(model: any) {
  try {
    await updateModel(model.id, { is_active: !model.is_active })
    model.is_active = !model.is_active
    ElMessage.success(model.is_active ? '已启用' : '已停用')
  } catch {
    ElMessage.error('操作失败')
  }
}

// 第 1 条：连通性测试
async function handleTest(row: any) {
  testingId.value = row.id
  try {
    const res = await testModel(row.id)
    const d = res.data
    if (d.ok) {
      ElMessage.success(`连通正常（${d.latency_ms ?? '-'} ms）`)
    } else {
      ElMessage.error(`连通失败：${d.error || '未知错误'}`)
    }
    await loadModels()   // 刷新 last_tested_at
  } catch (e: any) {
    // 400 = 未配置 Key；其余按失败处理
    const detail = e?.response?.data?.detail
    ElMessage.error(detail || '测试请求失败')
  } finally {
    testingId.value = null
  }
}

async function handleDelete(model: any) {
  try {
    await deleteModel(model.id)
    ElMessage.success('已删除')
    await loadModels()
  } catch {
    ElMessage.error('删除失败')
  }
}
</script>

<template>
  <div class="models-page">
    <header class="page-header">
      <h2>模型管理</h2>
      <el-button type="primary" @click="openAdd">
        <el-icon><Plus /></el-icon>
        添加模型
      </el-button>
    </header>

    <el-card shadow="never" class="content-card">
      <el-table :data="models" v-loading="loading" stripe>
        <el-table-column prop="name" label="模型名称" min-width="140" />
        <el-table-column prop="provider" label="提供商" width="110" />
        <el-table-column prop="model_id" label="模型ID" min-width="140" />
        <el-table-column prop="api_base" label="API端点" min-width="180" show-overflow-tooltip />
        <!-- 第 1 条：Key 只显示打码值，明文/密文都不出现在响应里 -->
        <el-table-column label="API Key" width="130">
          <template #default="{ row }">
            <span v-if="row.api_key_masked" class="key-masked">{{ row.api_key_masked }}</span>
            <el-tag v-else type="warning" size="small">未配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近测试" width="160">
          <template #default="{ row }">
            <span v-if="row.last_tested_at">{{ new Date(row.last_tested_at).toLocaleString() }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch v-model="row.is_active" @change="toggleActive(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary" text size="small"
              :loading="testingId === row.id"
              @click="handleTest(row)"
            >测试</el-button>
            <el-button type="primary" text size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && models.length === 0" description="暂无模型配置，点击上方按钮添加" />
    </el-card>

    <!-- 新增/编辑模型弹窗 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingId ? '编辑模型' : '添加模型'"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="模型名称">
          <el-input v-model="form.name" placeholder="如: GPT-4o" />
        </el-form-item>
        <el-form-item label="提供商">
          <el-select v-model="form.provider" style="width: 100%">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型ID">
          <el-input v-model="form.model_id" placeholder="如: gpt-4o" />
        </el-form-item>
        <el-form-item label="API端点">
          <el-input v-model="form.api_base" placeholder="如: https://api.openai.com/v1" />
        </el-form-item>
        <!-- 第 1 条：Key 输入（编辑态留空表示不修改） -->
        <el-form-item label="API Key">
          <el-input
            v-model="form.api_key"
            type="password"
            show-password
            :placeholder="editingId
              ? '留空则不修改现有 Key'
              : 'sk-...（明文提交，服务端加密存储）'"
          />
          <div class="form-hint">提交后仅以打码形式回显，明文不会被读取</div>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ editingId ? '保存' : '确认添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.models-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.key-masked {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text-secondary, #666666);
}

.muted {
  color: var(--text-secondary, #999999);
}

.form-hint {
  font-size: 12px;
  color: var(--text-secondary, #999999);
  line-height: 1.4;
  margin-top: 4px;
}
</style>
