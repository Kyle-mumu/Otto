import http from './http'

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

// BUG-V13B2-011-c：分页/筛选语汇对齐后端（实现侧为契约权威）。
// 后端 POST/GET 列表签名 = status_filter / limit / offset（app/api/v1/scheduled_tasks.py:50-54），
// 旧声明 { page, page_size, status } 与之不符 ⇒ 前端改、后端零动作、不加别名。
export function getScheduledTasks(params?: { status_filter?: string; limit?: number; offset?: number }) {
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

// BUG-V13B2-011-b（D-2）：后端补 POST /scheduled-tasks/{id}/trigger（此前后端不存在 ⇒ 必然 404）。
// 路由复用 APScheduler 回调本体 execute_scheduled_task 的实例生成核心，返回新实例 id。
export interface ScheduledTaskTriggerResult {
  triggered: boolean
  scheduled_task_id: string
  task_instance_id?: string
  next_triggered_at?: string
}

export function triggerScheduledTask(id: string) {
  return http.post<ScheduledTaskTriggerResult>(`/scheduled-tasks/${id}/trigger`)
}

// BUG-V13B2-011-b（D-4）：后端补 GET /scheduled-tasks/{id}/instances。
// 口径（PM 核可附条件 (a)）：实例 = tasks.task_template_id 轻量视图，**非 PRD §5 完整口径**
// —— 归档 / 默认不展示 / 导出 CSV·JSON / is_pinned 属 011-d 登记项、本批零动作。
// 分页语汇与裁 3 统一：limit / offset（同 GET /scheduled-tasks）。
// 返回项只读；前端不提供编辑 / 删除入口（附条件 (c)）。
export interface ScheduledTaskInstance {
  id: string
  title: string
  status: string
  priority: string
  assignee_id?: string
  reviewer_id?: string
  deadline?: string
  completed_at?: string
  created_at: string
}

export function getScheduledTaskInstances(id: string, params?: { limit?: number; offset?: number }) {
  return http.get<ScheduledTaskInstance[]>(`/scheduled-tasks/${id}/instances`, { params })
}

/** NL parse — convert natural language to cron expression */
export function nlParse(text: string) {
  // BUG-V13B2-011-a（D-3）：后端挂载点为 POST /api/v1/nl-parse；
  // 旧目标 '/scheduled-tasks/nl-parse' 被 GET /scheduled-tasks/{task_id} 路径遮蔽（405）。
  return http.post<{ cron_expr: string; cron_human: string; confidence: number }>('/nl-parse', { text })
}
