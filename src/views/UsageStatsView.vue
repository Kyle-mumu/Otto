<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUsageStats } from '@/api/usage'

const loading = ref(true)
const period = ref<'day' | 'week' | 'month'>('week')

// 统计数据
const stats = ref({
  total_calls: 0,
  total_tokens: 0,
  by_model: [] as { model_name: string; calls: number; tokens: number }[],
  by_user: [] as { username: string; calls: number; tokens: number }[],
  daily_trend: [] as { date: string; calls: number; tokens: number }[],
})

onMounted(async () => {
  await loadStats()
})

async function loadStats() {
  loading.value = true
  try {
    const res = await getUsageStats({ period: period.value })
    stats.value = { ...stats.value, ...res.data }
  } catch {
    // 静默处理
  } finally {
    loading.value = false
  }
}

function handlePeriodChange() {
  loadStats()
}
</script>

<template>
  <div class="usage-page">
    <header class="page-header">
      <h2>用量统计</h2>
      <el-radio-group v-model="period" @change="handlePeriodChange" size="small">
        <el-radio-button value="day">今日</el-radio-button>
        <el-radio-button value="week">本周</el-radio-button>
        <el-radio-button value="month">本月</el-radio-button>
      </el-radio-group>
    </header>

    <div v-loading="loading">
      <!-- 概览卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="12">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="总调用次数" :value="stats.total_calls">
              <template #prefix>
                <el-icon><Odometer /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="总Token用量" :value="stats.total_tokens">
              <template #prefix>
                <el-icon><Coin /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 按模型统计 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><span>按模型统计</span></template>
            <el-table :data="stats.by_model" stripe size="small">
              <el-table-column prop="model_name" label="模型" />
              <el-table-column prop="calls" label="调用次数" width="120" />
              <el-table-column prop="tokens" label="Token用量" width="120" />
            </el-table>
            <el-empty v-if="stats.by_model.length === 0" description="暂无数据" :image-size="60" />
          </el-card>
        </el-col>

        <!-- 按用户统计 -->
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><span>按用户统计</span></template>
            <el-table :data="stats.by_user" stripe size="small">
              <el-table-column prop="username" label="用户" />
              <el-table-column prop="calls" label="调用次数" width="120" />
              <el-table-column prop="tokens" label="Token用量" width="120" />
            </el-table>
            <el-empty v-if="stats.by_user.length === 0" description="暂无数据" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 趋势图（ECharts占位） -->
      <el-card shadow="never" class="trend-card">
        <template #header><span>调用趋势</span></template>
        <div class="chart-placeholder">
          <el-empty v-if="stats.daily_trend.length === 0" description="暂无趋势数据" :image-size="80" />
          <div v-else class="trend-list">
            <div v-for="item in stats.daily_trend" :key="item.date" class="trend-item">
              <span class="trend-date">{{ item.date }}</span>
              <el-progress :percentage="Math.min(100, item.calls / 10)" :stroke-width="8" />
              <span class="trend-value">{{ item.calls }}次 / {{ item.tokens }} tokens</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.usage-page {
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

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  border-radius: 12px;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-row :deep(.el-card) {
  border-radius: 12px;
}

.trend-card {
  border-radius: 12px;
}

.chart-placeholder {
  min-height: 200px;
}

.trend-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trend-date {
  font-size: 13px;
  color: var(--text-muted, #888);
  min-width: 80px;
}

.trend-value {
  font-size: 12px;
  color: var(--text-muted, #888);
  min-width: 140px;
  text-align: right;
}
</style>
