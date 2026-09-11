<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getQuotas, updateQuota } from '@/api/quotas'

const quotas = ref<any[]>([])
const loading = ref(true)
const showEditDialog = ref(false)
const editingQuota = ref<any>(null)

const editForm = ref({
  daily_limit: 1000,
  monthly_limit: 30000,
})

onMounted(async () => {
  await loadQuotas()
})

async function loadQuotas() {
  loading.value = true
  try {
    const res = await getQuotas()
    quotas.value = res.data.items || res.data || []
  } catch {
    quotas.value = []
  } finally {
    loading.value = false
  }
}

function openEdit(quota: any) {
  editingQuota.value = quota
  editForm.value = {
    daily_limit: quota.daily_limit || 1000,
    monthly_limit: quota.monthly_limit || 30000,
  }
  showEditDialog.value = true
}

async function handleSave() {
  if (!editingQuota.value) return
  try {
    await updateQuota(editingQuota.value.id, editForm.value)
    ElMessage.success('配额已更新')
    showEditDialog.value = false
    await loadQuotas()
  } catch {
    ElMessage.error('更新失败')
  }
}
</script>

<template>
  <div class="quotas-page">
    <header class="page-header">
      <h2>配额管理</h2>
    </header>

    <el-card shadow="never" class="content-card">
      <el-table :data="quotas" v-loading="loading" stripe>
        <el-table-column prop="user_id" label="用户ID" width="200" show-overflow-tooltip />
        <el-table-column prop="model_name" label="模型" width="150" />
        <el-table-column prop="daily_limit" label="日限额" width="120" />
        <el-table-column prop="monthly_limit" label="月限额" width="120" />
        <el-table-column prop="current_usage" label="当前用量" width="120">
          <template #default="{ row }">
            <span>{{ row.current_usage || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && quotas.length === 0" description="暂无配额配置" />
    </el-card>

    <!-- 编辑配额弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑配额" width="400px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="日限额">
          <el-input-number v-model="editForm.daily_limit" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="月限额">
          <el-input-number v-model="editForm.monthly_limit" :min="0" :step="1000" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.quotas-page {
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
