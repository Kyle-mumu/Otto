import http from './http'

// 获取用量统计
export function getUsageStats(params?: { period?: 'day' | 'week' | 'month' }) {
  return http.get('/usage/stats', { params })
}

// 获取用量明细
export function getUsageDetails(params?: {
  user_id?: string
  model_id?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}) {
  return http.get('/usage/details', { params })
}
