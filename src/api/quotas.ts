import http from './http'

// 获取配额列表
export function getQuotas(params?: { page?: number; page_size?: number }) {
  return http.get('/quotas', { params })
}

// 获取单个配额
export function getQuota(id: string) {
  return http.get(`/quotas/${id}`)
}

// 创建配额
export function createQuota(data: {
  user_id: string
  model_id: string
  daily_limit?: number
  monthly_limit?: number
}) {
  return http.post('/quotas', data)
}

// 更新配额
export function updateQuota(id: string, data: Partial<{
  daily_limit: number
  monthly_limit: number
}>) {
  return http.put(`/quotas/${id}`, data)
}

// 删除配额
export function deleteQuota(id: string) {
  return http.delete(`/quotas/${id}`)
}
