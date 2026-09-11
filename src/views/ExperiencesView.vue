<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createExperience,
  transitionExperience,
  deleteExperience,
} from '@/api/experiences'
import { useExperienceStore } from '@/stores/experience'
import { useAuthStore } from '@/stores/auth'
import type { Experience } from '@/types/api'
import ExperienceTraceTab from '@/components/ExperienceTraceTab.vue'
import OCRImportModal from '@/components/OCRImportModal.vue'

const store = useExperienceStore()
const auth = useAuthStore()

const searchQuery = ref('')
const showCreateDialog = ref(false)
const newTitle = ref('')
const newSummary = ref('')

// OCR 导入
const showOCRImport = ref(false)

// 经验引用追溯抽屉
const showTraceDrawer = ref(false)
const traceExpId = ref('')
const traceExpTitle = ref('')

async function onSearch() {
  await store.search(searchQuery.value)
}

async function onCreate() {
  if (!newTitle.value.trim() || !newSummary.value.trim()) return
  try {
    await createExperience({ title: newTitle.value, summary: newSummary.value })
    showCreateDialog.value = false
    newTitle.value = ''
    newSummary.value = ''
    ElMessage.success('经验创建成功')
    await store.fetch()
  } catch {
    ElMessage.error('创建失败')
  }
}

async function onTransition(exp: Experience, targetStatus: string) {
  try {
    await transitionExperience(exp.id, { target_status: targetStatus })
    ElMessage.success('状态流转成功')
    await store.fetch()
  } catch {
    ElMessage.error('状态流转失败')
  }
}

async function onDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这条经验吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteExperience(id)
    ElMessage.success('删除成功')
    await store.fetch()
  } catch {
    // 用户取消或删除失败
  }
}

const availableTransitions = (status: string) => {
  const map: Record<string, string[]> = {
    draft: ['pending'],
    pending: ['published', 'rejected'],
    published: [],
    rejected: ['draft'],
  }
  return map[status] || []
}

const statusTagType: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'info',
  pending: 'warning',
  published: 'success',
  rejected: 'danger',
}

const statusLabels: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  rejected: '已拒绝',
}

const transitionBtnType: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  published: 'success',
  rejected: 'danger',
  draft: 'info',
}

function onOpenTrace(exp: Experience) {
  traceExpId.value = exp.id
  traceExpTitle.value = exp.title
  showTraceDrawer.value = true
}

function onOCRSuccess() {
  store.fetch()
}

onMounted(() => {
  store.fetch()
  store.bindWsRefresh()
})
</script>

<template>
  <div class="experiences-page">
    <header class="page-header">
      <h2>经验库</h2>
      <div class="header-actions">
        <el-button @click="showOCRImport = true">
          <el-icon><UploadFilled /></el-icon>OCR 导入
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>新建经验
        </el-button>
      </div>
    </header>

    <!-- 搜索栏 -->
    <el-input
      v-model="searchQuery"
      placeholder="搜索经验内容..."
      clearable
      class="search-input"
      @keyup.enter="onSearch"
    >
      <template #append>
        <el-button @click="onSearch">
          <el-icon><Search /></el-icon>
        </el-button>
      </template>
    </el-input>

    <!-- 创建对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建经验" width="480px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="newTitle" placeholder="经验标题" />
        </el-form-item>
        <el-form-item label="摘要" required>
          <el-input v-model="newSummary" type="textarea" placeholder="经验摘要（L1级）" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="onCreate" :disabled="!newTitle.trim() || !newSummary.trim()">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 经验引用追溯抽屉 -->
    <el-drawer
      v-model="showTraceDrawer"
      :title="`📎 引用追溯 · ${traceExpTitle}`"
      size="520px"
      destroy-on-close
    >
      <ExperienceTraceTab
        v-if="traceExpId"
        :experience-id="traceExpId"
      />
    </el-drawer>

    <!-- 列表 -->
    <el-table v-loading="store.loading" :data="store.items" stripe style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="200">
        <template #default="{ row }">
          <span class="exp-title">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="summary" label="摘要" min-width="280">
        <template #default="{ row }">
          <span class="exp-summary">{{ row.summary }}</span>
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
      <el-table-column label="操作" width="260" align="center" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button
              v-for="target in availableTransitions(row.status)"
              :key="target"
              :type="transitionBtnType[target]"
              size="small"
              text
              @click="onTransition(row, target)"
            >
              {{ statusLabels[target] || target }}
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              type="danger"
              size="small"
              text
              @click="onDelete(row.id)"
            >
              删除
            </el-button>
            <el-button
              type="warning"
              size="small"
              text
              @click="onOpenTrace(row)"
            >
              📎 引用追溯
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

    <!-- OCR 导入弹窗 -->
    <OCRImportModal v-model="showOCRImport" @success="onOCRSuccess" />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-heading, #111111);
  margin: 0;
}

.search-input {
  margin-bottom: 20px;
  max-width: 400px;
}

.exp-title {
  font-weight: 500;
  color: var(--text-heading, #111111);
}

.exp-summary {
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
</style>
