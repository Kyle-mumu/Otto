import http from './http'

// 第 1 条：出参新增 api_key_masked（打码值，永不回显明文/密文）
export interface ModelItem {
  id: string
  name: string
  provider: string
  model_id: string
  api_base?: string | null
  api_key_masked?: string | null
  last_tested_at?: string | null
  is_active: boolean
  created_at?: string
}

// 获取模型列表
export function getModels(params?: { page?: number; page_size?: number }) {
  return http.get('/models', { params })
}

// 获取单个模型
export function getModel(id: string) {
  return http.get(`/models/${id}`)
}

// 创建模型（api_key 为明文入参，服务端加密存储）
export function createModel(data: {
  name: string
  provider: string
  model_id: string
  api_base?: string
  api_key?: string
  is_active?: boolean
}) {
  return http.post('/models', data)
}

// 更新模型（不传 api_key 即"不改 Key"）
export function updateModel(id: string, data: Partial<{
  name: string
  provider: string
  model_id: string
  api_base: string
  api_key: string
  is_active: boolean
}>) {
  return http.put(`/models/${id}`, data)
}

// 删除模型
export function deleteModel(id: string) {
  return http.delete(`/models/${id}`)
}

// 第 1 条：连通性测试
export interface ModelTestResult {
  ok: boolean
  latency_ms?: number
  reply?: string
  error?: string
}

export function testModel(id: string) {
  return http.post<ModelTestResult>(`/models/${id}/test`)
}
