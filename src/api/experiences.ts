import http from './http'
import type {
  Experience,
  ExperienceCreateRequest,
  ExperienceTransitionRequest,
  PaginatedResponse,
  OCRImportResponse,
  OCRProvidersResponse,
  OcrJobSubmitResponse,
  OcrJobStatusResponse,
} from '@/types/api'

/** 获取经验列表 */
export function getExperiences(params?: { page?: number; page_size?: number }) {
  return http.get<PaginatedResponse<Experience>>('/experiences', { params })
}

/** 获取经验详情 */
export function getExperience(id: string) {
  return http.get<Experience>(`/experiences/${id}`)
}

/** 创建经验 */
export function createExperience(data: ExperienceCreateRequest) {
  return http.post<Experience>('/experiences', data)
}

/** 更新经验 */
export function updateExperience(id: string, data: Partial<ExperienceCreateRequest>) {
  return http.put<Experience>(`/experiences/${id}`, data)
}

/** 删除经验 */
export function deleteExperience(id: string) {
  return http.delete(`/experiences/${id}`)
}

/** 经验状态流转 */
export function transitionExperience(id: string, data: ExperienceTransitionRequest) {
  return http.post<Experience>(`/experiences/${id}/transition`, data)
}

/** 全文搜索经验 */
export function searchExperiences(query: string) {
  return http.post<{ results: Experience[]; query: string; took_ms: number }>(
    '/experiences/search',
    { query }
  )
}

/** OCR 文件导入（异步提交，OCR_IMPORT_ASYNC=true） */
export function ocrImport(file: File, options?: {
  category?: string
  tags?: string[]
}) {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.category) formData.append('category', options.category)
  if (options?.tags) formData.append('tags', JSON.stringify(options.tags))

  // 异步提交：后端建 job 即返回 job_id，不在请求内跑 OCR
  // timeout 从 120s 降至 10s —— 只等「上传 + 建单」，不再等识别
  return http.post<OcrJobSubmitResponse>('/experiences/ocr-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 10000,
  })
}

/** 查询 OCR 异步作业状态 */
export function getOcrJob(jobId: string) {
  return http.get<OcrJobStatusResponse>(`/experiences/ocr-import/${jobId}`, {
    timeout: 5000,
  })
}

/** OCR 同步导入（OCR_IMPORT_ASYNC=false 时后端返回全文，兼容保留） */
export function ocrImportSync(file: File, options?: {
  category?: string
  tags?: string[]
}) {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.category) formData.append('category', options.category)
  if (options?.tags) formData.append('tags', JSON.stringify(options.tags))

  return http.post<OCRImportResponse>('/experiences/ocr-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
}

/** 获取 OCR 提供商状态（管理员） */
export function getOCRProviders() {
  return http.get<OCRProvidersResponse>('/experiences/ocr-providers')
}
