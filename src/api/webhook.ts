import http from './http'

// ========== 类型定义（对齐后端 app/schemas/webhook.py） ==========

export type WebhookPlatform = 'feishu' | 'wecom'
export type WebhookStatus = 'active' | 'inactive' | 'error'

/** 触发事件合法集合（与后端 VALID_TRIGGER_EVENTS 一致） */
export const WEBHOOK_TRIGGER_EVENTS = ['task_created', 'task_transition', 'task_assigned'] as const
export type WebhookTriggerEvent = typeof WEBHOOK_TRIGGER_EVENTS[number]

export const WEBHOOK_PLATFORM_LABELS: Record<WebhookPlatform, string> = {
  feishu: '飞书',
  wecom: '企业微信',
}

export const WEBHOOK_STATUS_LABELS: Record<WebhookStatus, string> = {
  active: '启用',
  inactive: '停用',
  error: '异常',
}

export const WEBHOOK_TRIGGER_LABELS: Record<WebhookTriggerEvent, string> = {
  task_created: '任务创建',
  task_transition: '任务流转',
  task_assigned: '任务指派',
}

/** 创建 Webhook 的请求体（secret 明文输入，后端落库） */
export interface WebhookCreatePayload {
  platform: WebhookPlatform
  webhook_url: string
  secret?: string
  trigger_events: WebhookTriggerEvent[]
}

/** Webhook 配置输出
 *  注意：后端 WebhookOut 含 secret 字段（当前为原样回显），
 *  前端一律不渲染该值 —— 见批 2 施工单红线。 */
export interface WebhookConfig {
  id: string
  team_id: string
  platform: WebhookPlatform
  webhook_url: string
  secret?: string | null
  trigger_events: WebhookTriggerEvent[] | null
  status: WebhookStatus
  last_triggered_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface WebhookTestResult {
  success: boolean
  status_code?: number | null
  message: string
}

// ========== CRUD + 测试推送 ==========

/** 创建 Webhook 配置（admin）。后端路由为 /webhooks/（带尾斜杠），此处显式带尾斜杠避免 307 */
export function createWebhook(data: WebhookCreatePayload) {
  return http.post('/webhooks/', data)
}

/** 列出当前团队的 Webhook 配置。后端返回裸数组（非 {items:[...]}） */
export function getWebhooks() {
  return http.get('/webhooks/')
}

/** 获取单条配置 */
export function getWebhook(id: string) {
  return http.get(`/webhooks/${id}`)
}

/** 更新配置（admin） */
export function updateWebhook(id: string, data: Partial<WebhookCreatePayload>) {
  return http.put(`/webhooks/${id}`, data)
}

/** 删除配置（admin） */
export function deleteWebhook(id: string) {
  return http.delete(`/webhooks/${id}`)
}

/** 测试推送（admin） */
export function testWebhook(id: string) {
  return http.post(`/webhooks/${id}/test`)
}
