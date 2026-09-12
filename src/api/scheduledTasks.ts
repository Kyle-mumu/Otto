import http from './http'
import type { PaginatedResponse } from '@/types/api'

export interface ScheduledTask {
  id: string
  team_id: string
  title: string
  description?: string
  priority: string
  creator_id: string
  assignee_id?: string
  reviewer_id?: string
  cron_expr: string
  cron_human?: string
  start_date?: string
  end_date?: string
  deadline_offset_hours: number
  status: string
  last_triggered_at?: string
  next_triggered_at?: string
  instance_retention_days: number
  created_at: string
  updated_at: string
}

export interface ScheduledTaskCreateRequest {
  title: string
  description?: string
  priority?: string
  assignee_id?: string
  reviewer_id?: string
  cron_expr: string
  cron_human?: string
  start_date?: string
  end_date?: string
  deadline_offset_hours?: number
}

export function getScheduledTasks(params?: { page?: number; page_size?: number; status?: string }) {
  return http.get<ScheduledTask[]>('/scheduled-tasks', { params })
}

export function getScheduledTask(id: string) {
  return http.get<ScheduledTask>(`/scheduled-tasks/${id}`)
}

export function createScheduledTask(data: ScheduledTaskCreateRequest) {
  return http.post<ScheduledTask>('/scheduled-tasks', data)
}

export function updateScheduledTask(id: string, data: Partial<ScheduledTaskCreateRequest>) {
  // BUG-V13B2-011-a：后端唯一更新路由为 PATCH（GET /{id} 路径遮蔽了 PUT），
  // 两端择一改 —— 定稿为前端单点改，不新增后端路由。
  return http.patch<ScheduledTask>(`/scheduled-tasks/${id}`, data)
}

export function deleteScheduledTask(id: string) {
  return http.delete(`/scheduled-tasks/${id}`)
}

export function pauseScheduledTask(id: string) {
  return http.post<ScheduledTask>(`/scheduled-tasks/${id}/pause`)
}

export function resumeScheduledTask(id: string) {
  return http.post<ScheduledTask>(`/scheduled-tasks/${id}/resume`)
}

export function triggerScheduledTask(id: string) {
  return http.post<ScheduledTask>(`/scheduled-tasks/${id}/trigger`)
}

export function getScheduledTaskInstances(id: string, params?: { page?: number; page_size?: number }) {
  return http.get<PaginatedResponse<any>>(`/scheduled-tasks/${id}/instances`, { params })
}

/** NL parse — convert natural language to cron expression */
export function nlParse(text: string) {
  // BUG-V13B2-011-a（D-3）：后端挂载点为 POST /api/v1/nl-parse；
  // 旧目标 '/scheduled-tasks/nl-parse' 被 GET /scheduled-tasks/{task_id} 路径遮蔽（405）。
  return http.post<{ cron_expr: string; cron_human: string; confidence: number }>('/nl-parse', { text })
}
