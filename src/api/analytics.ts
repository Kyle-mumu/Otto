import http from './http'

// 概览指标
export function getAnalyticsOverview(params?: { days?: number }) {
  return http.get('/analytics/overview', { params })
}

// 趋势数据
export function getAnalyticsTrends(params?: { days?: number }) {
  return http.get('/analytics/trends', { params })
}

// 成员排行
export function getAnalyticsMembers() {
  return http.get('/analytics/members')
}

// 搜索分析
export function getAnalyticsSearch(params?: { days?: number }) {
  return http.get('/analytics/search', { params })
}

// 导出 CSV（返回 blob）
export function exportAnalytics(type: string) {
  return http.get('/analytics/export', { params: { type }, responseType: 'blob' })
}

// 行为追踪
export function trackAnalyticsEvent(event: string) {
  return http.post('/analytics/track', null, { params: { event } })
}
