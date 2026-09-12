<template>
  <div class="analytics-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ $t('analytics.title') }}</h2>
      <el-dropdown @command="handleExport">
        <el-button type="primary" size="small">
          <el-icon><Download /></el-icon>
          {{ $t('analytics.exportCSV') }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="experiences">{{ $t('analytics.experiences') }}</el-dropdown-item>
            <el-dropdown-item command="tasks">{{ $t('analytics.tasks') }}</el-dropdown-item>
            <el-dropdown-item command="search_logs">{{ $t('analytics.searchLogs') }}</el-dropdown-item>
            <el-dropdown-item command="activities">{{ $t('analytics.activities') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 概览卡片 -->
    <div class="metrics-grid">
      <MetricCard
        :label="$t('analytics.activeUsers')"
        :value="overview.active_users"
        icon="User"
        color="#6366f1"
      />
      <MetricCard
        :label="$t('analytics.totalExperiences')"
        :value="overview.total_experiences"
        icon="Document"
        color="#10b981"
      />
      <MetricCard
        :label="$t('analytics.newExperiences')"
        :value="overview.new_experiences"
        icon="Plus"
        color="#f59e0b"
      />
      <MetricCard
        :label="$t('analytics.completedTasks')"
        :value="overview.completed_tasks"
        icon="Check"
        color="#3b82f6"
      />
      <MetricCard
        :label="$t('analytics.avgCompletionTime')"
        :value="`${overview.avg_task_completion_hours}h`"
        icon="Timer"
        color="#8b5cf6"
      />
      <MetricCard
        :label="$t('analytics.searchCount')"
        :value="overview.search_count"
        icon="Search"
        color="#ec4899"
      />
    </div>

    <!-- 趋势图表 + 搜索模式分布 -->
    <div class="charts-row">
      <div class="chart-card">
        <h3 class="chart-title">{{ $t('analytics.trends') }}</h3>
        <VChart class="trend-chart" :option="trendOption" autoresize />
      </div>
      <div class="chart-card">
        <h3 class="chart-title">{{ $t('analytics.searchModeDistribution') }}</h3>
        <VChart class="pie-chart" :option="modeDistributionOption" autoresize />
      </div>
    </div>

    <!-- 热门搜索词 -->
    <div class="chart-card">
      <h3 class="chart-title">{{ $t('analytics.topKeywords') }}</h3>
      <div v-if="searchData.top_keywords?.length" class="keywords-list">
        <div
          v-for="(item, index) in searchData.top_keywords"
          :key="item.query"
          class="keyword-item"
        >
          <span class="keyword-rank">{{ index + 1 }}</span>
          <span class="keyword-text">{{ item.query }}</span>
          <span class="keyword-count">{{ item.count }} {{ $t('analytics.times') }}</span>
          <span class="keyword-avg">{{ item.avg_results }} {{ $t('analytics.avgResults') }}</span>
        </div>
      </div>
      <el-empty v-else :description="$t('analytics.noData')" />
    </div>

    <!-- 成员贡献排行 -->
    <div class="chart-card">
      <h3 class="chart-title">{{ $t('analytics.memberRanking') }}</h3>
      <el-table v-if="members.length" :data="members" stripe size="small">
        <el-table-column prop="name" :label="$t('analytics.member')" />
        <el-table-column prop="experiences_created" :label="$t('analytics.experiencesCreated')" width="120" align="center" />
        <el-table-column prop="tasks_completed" :label="$t('analytics.tasksCompleted')" width="120" align="center" />
        <el-table-column prop="searches" :label="$t('analytics.searches')" width="100" align="center" />
        <el-table-column prop="last_active" :label="$t('analytics.lastActive')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.last_active) }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else :description="$t('analytics.noData')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
// H-10：`<script setup>` 作用域内没有全局注入的 `$t`（`globalInjection` 只对模板生效），
// 原先直接使用 `$t(...)` 会在运行时抛 `ReferenceError: $t is not defined` → 页面白屏。
// 现显式 import 并把解构出的 `t` 别名为 `$t`，与模板中的 `$t` 保持同一写法。
import { useI18n } from 'vue-i18n'
import MetricCard from '@/components/MetricCard.vue'
import {
  getAnalyticsOverview,
  getAnalyticsTrends,
  getAnalyticsMembers,
  getAnalyticsSearch,
  exportAnalytics,
} from '@/api/analytics'

const { t: $t } = useI18n()

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const overview = ref<any>({
  active_users: 0,
  total_experiences: 0,
  new_experiences: 0,
  completed_tasks: 0,
  avg_task_completion_hours: 0,
  search_count: 0,
  search_zero_result_rate: 0,
})
const trends = ref<any>({ dates: [], experiences_created: [], tasks_completed: [], searches: [] })
const members = ref<any[]>([])
const searchData = ref<any>({ top_keywords: [], mode_distribution: {} })

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: [$t('analytics.experiences'), $t('analytics.searches')] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: trends.value.dates },
  yAxis: { type: 'value' },
  series: [
    {
      name: $t('analytics.experiences'),
      type: 'line',
      smooth: true,
      data: trends.value.experiences_created || [],
      itemStyle: { color: '#10b981' },
    },
    {
      name: $t('analytics.searches'),
      type: 'line',
      smooth: true,
      data: trends.value.searches || [],
      itemStyle: { color: '#ec4899' },
    },
  ],
}))

const modeDistributionOption = computed(() => {
  const dist = searchData.value.mode_distribution || {}
  const data = Object.entries(dist).map(([name, value]) => ({ name, value }))
  return {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data,
      },
    ],
  }
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleExport(type: string) {
  try {
    const res: any = await exportAnalytics(type)
    const blob = new Blob([res.data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `otto_${type}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

onMounted(async () => {
  try {
    const [overviewRes, trendsRes, membersRes, searchRes] = await Promise.all([
      getAnalyticsOverview({ days: 30 }),
      getAnalyticsTrends({ days: 30 }),
      getAnalyticsMembers(),
      getAnalyticsSearch({ days: 30 }),
    ])
    overview.value = overviewRes.data
    trends.value = trendsRes.data
    members.value = membersRes.data.members || []
    searchData.value = searchRes.data
  } catch {
    ElMessage.error('数据加载失败')
  }
})
</script>

<style scoped>
.analytics-dashboard {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.trend-chart {
  height: 280px;
}

.pie-chart {
  height: 280px;
}

.keywords-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.keyword-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f9fafb;
}

.keyword-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.keyword-text {
  flex: 1;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.keyword-count {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

.keyword-avg {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
