<script setup lang="ts">
/**
 * AI 建议中心（第 2 条 / PRD §7.1）
 * 路由: /dashboard/ai-suggestions
 * 布局: 筛选栏 [类型/状态] + 建议列表 + 详情抽屉（采纳/忽略）
 */
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  listSuggestions, adoptSuggestion, ignoreSuggestion,
  type SuggestionItem,
} from '@/api/aiSuggestions'

const items = ref<SuggestionItem[]>([])
const total = ref(0)
const unreadCount = ref(0)
const loading = ref(false)

const page = ref(1)
const pageSize = ref(20)
const filterType = ref<string>('')
const filterStatus = ref<string>('')

const detailVisible = ref(false)
const current = ref<SuggestionItem | null>(null)

// PRD §5.2 建议类型
const TYPE_OPTIONS = [
  { value: 'daily_report', label: '团队日报' },
  { value: 'assignee_recommend', label: '执行人推荐' },
  { value: 'knowledge_gap', label: '知识缺口' },
  { value: 'task_risk', label: '任务风险' },
]

// PRD §5.2 状态
const STATUS_OPTIONS = [
  { value: 'pending', label: '待送达' },
  { value: 'delivered', label: '已送达' },
  { value: 'adopted', label: '已采纳' },
  { value: 'ignored', label: '已忽略' },
  { value: 'expired', label: '已过期' },
]

const STATUS_TAG: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
  pending: 'info',
  delivered: 'primary',
  adopted: 'success',
  ignored: 'info',
  expired: 'warning',
}

function typeLabel(v: string) {
  return TYPE_OPTIONS.find(o => o.value === v)?.label || v
}

function statusLabel(v: string) {
  return STATUS_OPTIONS.find(o => o.value === v)?.label || v
}

const canAct = computed(() =>
  current.value ? ['pending', 'delivered'].includes(current.value.status) : false
)

onMounted(load)

async function load() {
  loading.value = true
  try {
    const res = await listSuggestions({
      page: page.value,
      page_size: pageSize.value,
      suggestion_type: filterType.value || undefined,
      status: filterStatus.value || undefined,
    })
    const d = res.data
    items.value = d.items || []
    total.value = d.total || 0
    unreadCount.value = d.unread_count || 0
  } catch {
    items.value = []
    total.value = 0
    unreadCount.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilter() {
  page.value = 1
  load()
}

async function openDetail(row: SuggestionItem) {
  try {
    const res = await getDetail(row.id)
    current.value = res
    // 首次查看会标记已读，刷新未读数
    if (!row.is_read) await load()
  } catch {
    current.value = row
  }
  detailVisible.value = true
}

// 详情单独取（触发服务端"首次查看标记已读"）
async function getDetail(id: string): Promise<SuggestionItem> {
  const { getSuggestion } = await import('@/api/aiSuggestions')
  const res = await getSuggestion(id)
  return res.data
}

async function handleAdopt() {
  if (!current.value) return
  try {
    await adoptSuggestion(current.value.id)
    ElMessage.success('已采纳')
    detailVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '操作失败')
  }
}

async function handleIgnore() {
  if (!current.value) return
  try {
    await ignoreSuggestion(current.value.id)
    ElMessage.success('已忽略')
    detailVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '操作失败')
  }
}

function handleSizeChange(v: number) {
  pageSize.value = v
  page.value = 1
  load()
}
</script>

<template>
  <div class="suggestions-page">
    <header class="page-header">
      <div class="title-row">
        <h2>AI 智能建议</h2>
        <el-badge v-if="unreadCount > 0" :value="unreadCount" class="unread-badge">
          <span class="unread-label">未读</span>
        </el-badge>
      </div>
    </header>

    <el-card shadow="never" class="content-card">
      <!-- 筛选栏（PRD §7.1：类型 / 状态 / 时间范围） -->
      <div class="filter-bar">
        <el-select v-model="filterType" placeholder="全部类型" clearable style="width: 150px" @change="applyFilter">
          <el-option v-for="o in TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 150px" @change="applyFilter">
          <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-button @click="load">刷新</el-button>
      </div>

      <el-table :data="items" v-loading="loading" stripe @row-click="openDetail" class="clickable">
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ typeLabel(row.suggestion_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="content" label="内容摘要" min-width="260" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="STATUS_TAG[row.status] || 'info'">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.fallback_used" size="small" type="warning">降级</el-tag>
            <span v-else class="muted">LLM</span>
          </template>
        </el-table-column>
        <el-table-column label="未读" width="70">
          <template #default="{ row }">
            <span v-if="!row.is_read" class="dot" />
          </template>
        </el-table-column>
        <el-table-column label="生成时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50]"
          @current-change="load"
          @size-change="handleSizeChange"
        />
      </div>

      <el-empty v-if="!loading && items.length === 0" description="暂无建议" />
    </el-card>

    <!-- 详情抽屉（PRD §7.4） -->
    <el-drawer v-model="detailVisible" title="建议详情" size="480px">
      <template v-if="current">
        <div class="detail-row">
          <span class="detail-label">类型</span>
          <el-tag size="small" effect="plain">{{ typeLabel(current.suggestion_type) }}</el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <el-tag size="small" :type="STATUS_TAG[current.status] || 'info'">
            {{ statusLabel(current.status) }}
          </el-tag>
        </div>
        <h3 class="detail-title">{{ current.title }}</h3>
        <p class="detail-content">{{ current.content }}</p>

        <div v-if="current.content_structured" class="detail-structured">
          <div class="detail-label">结构化数据</div>
          <pre>{{ JSON.stringify(current.content_structured, null, 2) }}</pre>
        </div>

        <div class="detail-meta">
          <span>生成时间：{{ new Date(current.created_at).toLocaleString() }}</span>
          <span v-if="current.generation_duration_ms">
            耗时：{{ current.generation_duration_ms }} ms
          </span>
          <span v-if="current.fallback_used" class="fallback-note">
            ⚠️ LLM 不可用，内容为结构化降级
          </span>
        </div>

        <div class="detail-actions">
          <el-button type="primary" :disabled="!canAct" @click="handleAdopt">采纳</el-button>
          <el-button :disabled="!canAct" @click="handleIgnore">忽略</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.suggestions-page {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-heading, #111111);
  margin: 0;
}

.unread-badge {
  display: inline-flex;
  align-items: center;
}

.unread-label {
  font-size: 12px;
  color: var(--text-secondary, #666666);
}

.content-card {
  border-radius: 12px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.clickable :deep(.el-table__row) {
  cursor: pointer;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary, #E85A3D);
}

.muted {
  color: var(--text-secondary, #999999);
  font-size: 13px;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.detail-label {
  font-size: 13px;
  color: var(--text-secondary, #666666);
  min-width: 70px;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  margin: 12px 0 8px;
  color: var(--text-heading, #111111);
}

.detail-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-body, #333333);
  white-space: pre-wrap;
}

.detail-structured {
  margin-top: 16px;
}

.detail-structured pre {
  background: var(--bg-subtle, #f7f7f7);
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  overflow-x: auto;
}

.detail-meta {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary, #999999);
}

.fallback-note {
  color: var(--warning, #F59E0B);
}

.detail-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>
