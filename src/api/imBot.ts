import http from './http'

// ========== 类型定义（对齐后端 app/schemas/im_bot.py） ==========

export type ImPlatform = 'feishu' | 'wecom'
export type ImBotStatus = 'active' | 'inactive' | 'error'

/** 触发事件合法集合（与后端 VALID_TRIGGER_EVENTS 一致） */
export const IM_TRIGGER_EVENTS = ['task_created', 'task_assigned', 'task_transition'] as const
export type ImTriggerEvent = typeof IM_TRIGGER_EVENTS[number]

export const IM_PLATFORM_LABELS: Record<ImPlatform, string> = {
  feishu: '飞书',
  wecom: '企业微信',
}

export const IM_TRIGGER_LABELS: Record<ImTriggerEvent, string> = {
  task_created: '任务创建',
  task_assigned: '任务指派',
  task_transition: '任务流转',
}

/** 新建/更新 Bot 配置的请求体（密钥明文输入，后端加密落库） */
export interface BotConfigPayload {
  platform: ImPlatform
  name: string
  app_id: string
  agent_id?: string
  app_secret?: string
  encrypt_key?: string
  verification_token?: string
  bound_chat_ids?: string[]
  trigger_events?: ImTriggerEvent[]
  status?: ImBotStatus
}

/** Bot 配置输出（密钥只回 masked 值，不可回读） */
export interface ImBotConfig {
  id: string
  team_id: string
  platform: ImPlatform
  name: string
  app_id: string
  agent_id: string | null
  app_secret_masked: string | null
  encrypt_key_masked: string | null
  verification_token_masked: string | null
  has_secret: boolean
  bound_chat_ids: string[] | null
  trigger_events: ImTriggerEvent[] | null
  status: ImBotStatus
  last_triggered_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface BotTestResult {
  success: boolean
  status_code?: number | null
  message: string
  latency_ms?: number | null
}

/** 单条绑定记录（B8/B11 共用） */
export interface ImBinding {
  id: string
  team_id: string
  platform: ImPlatform
  open_id: string
  user_id: string
  username?: string | null
  bound_by: string
  status: string
  created_at: string
  revoked_at?: string | null
}

// ========== B1-B6: Bot 配置管理（admin） ==========

/** B1: 创建 Bot 配置 */
export function createImBot(data: BotConfigPayload) {
  return http.post('/im-bots', data)
}

/** B2: 列表 */
export function getImBots() {
  return http.get('/im-bots')
}

/** B3/B4: 更新 Bot 配置（密钥留空 = 不修改） */
export function updateImBot(id: string, data: Partial<BotConfigPayload>) {
  return http.put(`/im-bots/${id}`, data)
}

/** B5: 删除 Bot 配置 */
export function deleteImBot(id: string) {
  return http.delete(`/im-bots/${id}`)
}

/** B5 配套: 连通性测试（真实调用平台接口验签） */
export function testImBot(id: string) {
  return http.post(`/im-bots/${id}/test`)
}

/** B6: 绑定群 chat_id（管理员把 Bot 拉入目标群后填写） */
export function bindImChat(id: string, chat_id: string) {
  return http.post(`/im-bots/${id}/bind-chat`, { chat_id })
}

// ========== B7-B11: IM 身份绑定 ==========

/** B7: 生成一次性绑定码（6 位，30 分钟有效，Redis 存储） */
export function genBindCode() {
  return http.post('/im-bindings/code')
}

/** B8: 查询我的绑定状态（各平台） */
export function getMyBindings() {
  return http.get('/im-bindings/me')
}

/** B9: 解除当前用户在指定平台的绑定 */
export function unbindMe(platform: ImPlatform) {
  return http.delete('/im-bindings/me', { data: { platform } })
}

/** B10: 管理员代绑 */
export function adminBind(data: {
  platform: ImPlatform
  open_id: string
  user_id: string
  replace?: boolean
}) {
  return http.post('/im-bindings/admin', data)
}

/** B11: 列出本团队全部绑定（admin，含审计信息） */
export function listBindings() {
  return http.get('/im-bindings')
}
