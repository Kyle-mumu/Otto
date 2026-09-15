import http from './http'

// 第 2 条 / PRD §6.1：AI 建议 API

export interface SuggestionItem {
  id: string
  team_id: string
  suggestion_type: string
  title: string
  content: string
  content_structured?: Record<string, any> | null
  related_task_id?: string | null
  status: string
  confidence?: number | null
  llm_model?: string | null
  fallback_used: boolean
  is_read: boolean
  delivered_at?: string | null
  adopted_at?: string | null
  ignored_at?: string | null
  created_at: string
}

export interface SuggestionListResult {
  items: SuggestionItem[]
  total: number
  unread_count: number
}

export interface SuggestionStats {
  total: number
  by_status: Record<string, number>
  by_type: Record<string, number>
  adopt_rate: number
}

// 建议列表（分页 + 筛选）
export function listSuggestions(params?: {
  page?: number
  page_size?: number
  suggestion_type?: string
  status?: string
  team_id?: string
}) {
  return http.get<SuggestionListResult>('/ai-suggestions', { params })
}

// 建议详情
export function getSuggestion(id: string) {
  return http.get<SuggestionItem>(`/ai-suggestions/${id}`)
}

// 采纳
export function adoptSuggestion(id: string) {
  return http.post<SuggestionItem>(`/ai-suggestions/${id}/adopt`)
}

// 忽略
export function ignoreSuggestion(id: string) {
  return http.post<SuggestionItem>(`/ai-suggestions/${id}/ignore`)
}

// 统计
export function getSuggestionStats(teamId?: string) {
  return http.get<SuggestionStats>('/ai-suggestions/stats/', {
    params: teamId ? { team_id: teamId } : undefined,
  })
}

// 手动触发生成（仅日报）
export function generateSuggestion(teamId: string, suggestionType = 'daily_report') {
  return http.post('/ai-suggestions/generate/', {
    team_id: teamId,
    suggestion_type: suggestionType,
  })
}
