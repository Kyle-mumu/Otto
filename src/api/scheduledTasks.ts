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
  return http.get<PaginatedResponse<ScheduledTask>>('/scheduled-tasks', { params })
}

export function getScheduledTask(id: string) {
  return http.get<ScheduledTask>(`/scheduled-tasks/${id}`)
}

export function createScheduledTask(data: ScheduledTaskCreateRequest) {
  return http.post<ScheduledTask>('/scheduled-tasks', data)
}

export function updateScheduledTask(id: string, data: Partial<ScheduledTaskCreateRequest>) {
  return http.put<ScheduledTask>(`/scheduled-tasks/${id}`, data)
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
  return http.post<{ cron_expr: string; cron_human: string; confidence: number }>('/scheduled-tasks/nl-parse', { text })
}
