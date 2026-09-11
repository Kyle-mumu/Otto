import http from './http'
import type { PaginatedResponse } from '@/types/api'

export interface Rule {
  id: string
  team_id: string
  name: string
  description?: string
  event_type: string
  conditions: Record<string, any>
  actions: Record<string, any>[]
  cron_expr?: string
  max_executions_per_hour: number
  last_executed_at?: string
  execution_count: number
  status: string
  is_template: boolean
  creator_id: string
  created_at: string
  updated_at: string
}

export interface RuleExecution {
  id: string
  rule_id: string
  trigger_event: Record<string, any>
  trigger_type: string
  conditions_matched: boolean
  actions_executed: Record<string, any>[]
  success: boolean
  error_message?: string
  duration_ms: number
  created_at: string
}

export interface RuleTemplate {
  id: string
  name: string
  description?: string
  category: string
  event_type: string
  conditions: Record<string, any>
  actions: Record<string, any>[]
  icon?: string
  sort_order: number
  is_builtin: boolean
  usage_count: number
}

export function getRules(params?: { page?: number; page_size?: number; status?: string; event_type?: string }) {
  return http.get<Rule[]>('/rules', { params })
}

export function getRule(id: string) {
  return http.get<Rule>(`/rules/${id}`)
}

export function createRule(data: Partial<Rule>) {
  return http.post<Rule>('/rules', data)
}

export function updateRule(id: string, data: Partial<Rule>) {
  return http.put<Rule>(`/rules/${id}`, data)
}

export function deleteRule(id: string) {
  return http.delete(`/rules/${id}`)
}

export function pauseRule(id: string) {
  return http.post<Rule>(`/rules/${id}/pause`)
}

export function resumeRule(id: string) {
  return http.post<Rule>(`/rules/${id}/resume`)
}

export function testRule(id: string, event_data?: Record<string, any>) {
  return http.post<RuleExecution>(`/rules/${id}/test`, { event_data })
}

export function getRuleExecutions(id: string, params?: { page?: number; page_size?: number }) {
  return http.get<RuleExecution[]>(`/rules/${id}/executions`, { params })
}

export function getRuleTemplates() {
  return http.get<RuleTemplate[]>('/rules/templates')
}

export function createRuleFromTemplate(template_id: string) {
  return http.post<Rule>('/rules/from-template', { template_id })
}

/** 获取可用事件类型列表 */
export function getEventTypes() {
  return http.get<{ event_type: string; label: string; description: string }[]>('/rules/event-types')
}

/** 获取可用动作类型列表 */
export function getActionTypes() {
  return http.get<{ action_type: string; label: string; config_schema: Record<string, any> }[]>('/rules/action-types')
}
