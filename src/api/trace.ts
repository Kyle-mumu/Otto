import http from './http'
import type {
  ExecutionLog,
  ExecutionLogDetail,
  ExecutionStep,
  ExecutionLogListResponse,
  TraceResponse,
  ExperienceTraceResponse,
  ExecutionLogDiffResponse,
} from '@/types/api'

/** A4: 获取任务的执行日志列表 */
export function getExecutionLogs(
  taskId: string,
  params?: { page?: number; page_size?: number }
) {
  return http.get<ExecutionLogListResponse>(
    `/tasks/${taskId}/execution-log`,
    { params }
  )
}

/** A5: 获取单条执行日志详情（含步骤） */
export function getExecutionLogDetail(taskId: string, logId: string) {
  return http.get<ExecutionLogDetail>(
    `/tasks/${taskId}/execution-log/${logId}`
  )
}

/** A6: 智能溯源问答 */
export function traceTask(taskId: string, question: string) {
  return http.post<TraceResponse>(`/tasks/${taskId}/trace`, { question })
}

/** A7: 经验引用追溯 */
export function traceExperience(
  expId: string,
  params?: { page?: number; page_size?: number }
) {
  return http.get<ExperienceTraceResponse>(
    `/experiences/${expId}/trace`,
    { params }
  )
}

/** A8: 版本Diff对比 */
export function diffExecutionLogs(
  taskId: string,
  logA: string,
  logB: string
) {
  return http.get<ExecutionLogDiffResponse>(
    `/tasks/${taskId}/execution-log-diff`,
    { params: { log_a: logA, log_b: logB } }
  )
}

/** 获取日志的步骤列表（辅助端点） */
export function getExecutionSteps(taskId: string, logId: string) {
  return http.get<ExecutionStep[]>(
    `/tasks/${taskId}/execution-log/${logId}/steps`
  )
}
