/** 通用 API 响应结构 */
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

/** 用户 */
export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  is_active: boolean
  created_at: string
}

/** 登录请求 */
export interface LoginRequest {
  email: string
  password: string
}

/** 注册请求 */
export interface RegisterRequest {
  username: string
  email: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

/** 经验 */
export interface Experience {
  id: string
  title: string
  summary: string
  content?: string
  status: 'draft' | 'pending' | 'published' | 'rejected'
  author_id: string
  category_id?: string
  created_at: string
  updated_at: string
}

/** 经验创建请求 */
export interface ExperienceCreateRequest {
  title: string
  summary: string
}

/** 经验状态流转请求 */
export interface ExperienceTransitionRequest {
  target_status: string
}

/** 任务卡 */
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id?: string
  creator_id: string
  is_overdue: boolean
  created_at: string
  updated_at: string
}

export type TaskStatus =
  | 'draft'
  | 'assigned'
  | 'in_progress'
  | 'delivered'
  | 'reviewing'
  | 'completed'
  | 'archived'

/** 任务卡创建请求 */
export interface TaskCreateRequest {
  title: string
  description?: string
  priority?: string
}

/** 任务卡状态流转请求 */
export interface TaskTransitionRequest {
  target_status: string
}

/** 任务版本 */
export interface TaskVersion {
  id: string
  task_id: string
  version_number: number
  changes: Record<string, { old: unknown; new: unknown }>
  created_by: string
  created_at: string
}

/** 分类 */
export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
}

// ========== V1.1-B3 执行日志 & 溯源 ==========

/** 执行状态 */
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled'

/** 步骤状态 */
export type StepStatus = 'completed' | 'failed' | 'skipped'

/** 执行日志（列表用，不含步骤） */
export interface ExecutionLog {
  id: string
  task_id: string
  user_id?: string
  agent_name: string
  started_at: string
  completed_at?: string
  total_duration_ms?: number
  total_steps: number
  status: ExecutionStatus
  result_summary?: string
  error_message?: string
  experiences_used?: string[]
  metadata_json?: Record<string, unknown>
  created_at: string
}

/** 执行日志详情（含步骤列表） */
export interface ExecutionLogDetail extends ExecutionLog {
  steps: ExecutionStep[]
}

/** 执行步骤 */
export interface ExecutionStep {
  id: string
  execution_log_id: string
  step_number: number
  agent_name: string
  action: string
  input_summary?: string
  output_summary?: string
  duration_ms?: number
  status: StepStatus
  experience_ids?: string[]
  error_message?: string
  parent_step_id?: string
  branch_reason?: string
  created_at: string
}

/** 执行日志列表响应 */
export interface ExecutionLogListResponse {
  items: ExecutionLog[]
  total: number
}

/** 溯源引用 */
export interface TraceReference {
  step_id: string
  step_number: number
  action: string
  experience_id?: string
  experience_title?: string
}

/** 溯源问答响应 */
export interface TraceResponse {
  answer: string
  references: TraceReference[]
  confidence: 'high' | 'medium' | 'low'
}

/** 经验引用追溯条目 */
export interface ExperienceTraceItem {
  task_id: string
  task_title: string
  executor?: string
  executed_at?: string
  step_count: number
  result: string
}

/** 经验引用追溯响应 */
export interface ExperienceTraceResponse {
  items: ExperienceTraceItem[]
  total: number
}

/** 版本Diff对比响应 */
export interface ExecutionLogDiffResponse {
  log_a: ExecutionLog
  log_b: ExecutionLog
  steps_a: ExecutionStep[]
  steps_b: ExecutionStep[]
  diff_summary: string
}

/** WebSocket 事件（兼容 type 和 event 两种字段名） */
export interface WsEvent {
  type?: string
  event?: string
  data?: Record<string, unknown>
  timestamp?: string
  message?: string
  user_id?: string
  channel?: string
}

// ========== V1.1-B4 OCR 导入 ==========

/** OCR 来源信息 */
export interface OCRSourceInfo {
  filename: string
  file_type: string
  pages: number
  ocr_provider: string
  confidence?: number
}

/** OCR 导入响应（同步分支返回：OCR_IMPORT_ASYNC=false） */
export interface OCRImportResponse {
  id: string
  title: string
  summary: string
  content: string
  tags: string[]
  category?: string
  source: OCRSourceInfo
  status: string
  created_at: string
}

// ========== OCR 异步作业（OCR_IMPORT_ASYNC=true）==========

/** 作业状态机 */
export type OcrJobStatus = 'pending' | 'running' | 'success' | 'failed'

/** 作业真实进度分段（后端写入，前端轮询读取） */
export type OcrJobStage = 'queued' | 'ocr' | 'structuring' | 'embedding' | 'done'

/** 异步提交响应 */
export interface OcrJobSubmitResponse {
  job_id: string
  status: OcrJobStatus
  stage: OcrJobStage
  created_at: string
}

/** 作业状态查询响应 */
export interface OcrJobStatusResponse {
  job_id: string
  status: OcrJobStatus
  stage: OcrJobStage
  filename: string
  experience_id?: string | null
  error_message?: string | null
  created_at: string
  finished_at?: string | null
}

/** OCR 提供商状态 */
export interface OCRProvider {
  name: string
  available: boolean
  reason?: string
  mode?: string
}

/** OCR 提供商列表响应 */
export interface OCRProvidersResponse {
  providers: OCRProvider[]
}
