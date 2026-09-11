import http from './http'
import type { PaginatedResponse } from '@/types/api'

export interface TaskNotification {
  id: string
  task_id: string
  recipient_id: string
  event_type: string
  channel: string
  content: string
  is_read: boolean
  created_at: string
}

export function getNotifications(params?: { page?: number; page_size?: number; unread_only?: boolean }) {
  return http.get<TaskNotification[]>('/notifications', { params })
}

export function getUnreadCount() {
  return http.get<{ count: number }>('/notifications/unread-count')
}

export function markAsRead(id: string) {
  return http.post<TaskNotification>(`/notifications/${id}/read`)
}

export function markAllAsRead() {
  return http.post<{ updated: number }>('/notifications/read-all')
}

export function deleteNotification(id: string) {
  return http.delete(`/notifications/${id}`)
}

export function clearAllNotifications() {
  return http.delete('/notifications/clear-all')
}
