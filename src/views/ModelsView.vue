<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getModels, createModel, updateModel, deleteModel } from '@/api/models'

// 模型数据
const models = ref<any[]>([])
const loading = ref(true)
const showAddDialog = ref(false)

// 新增模型表单
const form = ref({
  name: '',
  provider: 'openai',
  model_id: '',
  api_base: '',
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

async function handleAdd() {
  try {
    await createModel(form.value)
    ElMessage.success('模型添加成功')
    showAddDialog.value = false
    await loadModels()
  } catch {
    ElMessage.error('添加失败')
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
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加模型
      </el-button>
    </header>

    <el-card shadow="never" class="content-card">
      <el-table :data="models" v-loading="loading" stripe>
        <el-table-column prop="name" label="模型名称" min-width="150" />
        <el-table-column prop="provider" label="提供商" width="120" />
        <el-table-column prop="model_id" label="模型ID" min-width="150" />
        <el-table-column prop="api_base" label="API端点" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.is_active" @change="toggleActive(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && models.length === 0" description="暂无模型配置，点击上方按钮添加" />
    </el-card>

    <!-- 添加模型弹窗 -->
    <el-dialog v-model="showAddDialog" title="添加模型" width="500px">
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
        <el-form-item label="启用">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确认添加</el-button>
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
</style>
