import http from './http'
import type {
  Task,
  TaskCreateRequest,
  TaskTransitionRequest,
  TaskVersion,
  PaginatedResponse,
} from '@/types/api'

/** 获取任务卡列表 */
export function getTasks(params?: { page?: number; page_size?: number }) {
  return http.get<PaginatedResponse<Task>>('/tasks', { params })
}

/** 获取任务卡详情 */
export function getTask(id: string) {
  return http.get<Task>(`/tasks/${id}`)
}

/** 创建任务卡 */
export function createTask(data: TaskCreateRequest) {
  return http.post<Task>('/tasks', data)
}

/** 更新任务卡 */
export function updateTask(id: string, data: Partial<TaskCreateRequest & { assignee_id?: string }>) {
  return http.put<Task>(`/tasks/${id}`, data)
}

/** 删除任务卡 */
export function deleteTask(id: string) {
  return http.delete(`/tasks/${id}`)
}

/** 任务卡状态流转 */
export function transitionTask(id: string, data: TaskTransitionRequest) {
  return http.post<Task>(`/tasks/${id}/transition`, data)
}

/** 获取任务版本历史 */
export function getTaskVersions(id: string) {
  return http.get<TaskVersion[]>(`/tasks/${id}/versions`)
}
