import http from './http'

// 获取模型列表
export function getModels(params?: { page?: number; page_size?: number }) {
  return http.get('/models', { params })
}

// 获取单个模型
export function getModel(id: string) {
  return http.get(`/models/${id}`)
}

// 创建模型
export function createModel(data: {
  name: string
  provider: string
  model_id: string
  api_base?: string
  is_active?: boolean
}) {
  return http.post('/models', data)
}

// 更新模型
export function updateModel(id: string, data: Partial<{
  name: string
  provider: string
  model_id: string
  api_base: string
  is_active: boolean
}>) {
  return http.put(`/models/${id}`, data)
}

// 删除模型
export function deleteModel(id: string) {
  return http.delete(`/models/${id}`)
}
