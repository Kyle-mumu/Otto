/**
 * OCR 异步作业跟踪器（模块级单例）
 *
 * 设计目的：弹窗可关闭、后台继续跑。
 * 轮询不能挂在组件上 —— 组件卸载（弹窗关闭）会连带清掉 setInterval，
 * 作业就此失联。因此把「作业态 + 轮询」提到模块级单例：
 *   - 组件只订阅回调，卸载时 detach，轮询不受影响；
 *   - 作业成功/失败后停轮询，并回调所有订阅者；
 *   - 任何页面重开后调 get() / subscribe() 都能拿回当前态。
 *
 * 进度来源：后端 OcrJobStatusResponse.status / stage（真实状态），
 * 不做任何本地模拟。
 */

import { reactive } from 'vue'
import { getOcrJob } from '@/api/experiences'
import type { OcrJobStatusResponse } from '@/types/api'

/** 轮询间隔（方案建议值：2s） */
const POLL_INTERVAL_MS = 2000

/** 单次轮询请求失败的最大容忍次数（网络抖动），超过即判定失联 */
const MAX_POLL_ERRORS = 3

type JobCallbacks = {
  onUpdate?: (job: OcrJobStatusResponse) => void
  onSuccess?: (job: OcrJobStatusResponse) => void
  onFailed?: (job: OcrJobStatusResponse) => void
}

type TrackedJob = {
  job: OcrJobStatusResponse
  filename: string
  callbacks: Set<JobCallbacks>
  timer: ReturnType<typeof setInterval> | null
  errorCount: number
  settled: boolean
}

/** 全局作业表：job_id → 跟踪项 */
const jobs = reactive(new Map<string, OcrJobStatusResponse>())
const tracked = new Map<string, TrackedJob>()

function stopPolling(entry: TrackedJob) {
  if (entry.timer !== null) {
    clearInterval(entry.timer)
    entry.timer = null
  }
  entry.settled = true
}

function notify(entry: TrackedJob, kind: keyof JobCallbacks) {
  entry.callbacks.forEach((cb) => {
    const fn = cb[kind]
    if (fn) {
      try {
        fn(entry.job)
      } catch (e) {
        // 单个订阅者异常不应影响其它订阅者与轮询
        console.error('[ocrJobTracker] 回调异常', e)
      }
    }
  })
}

async function poll(entry: TrackedJob, jobId: string) {
  try {
    // 注意：http 实例的拦截器不解包，返回 AxiosResponse，须取 .data
    const res = await getOcrJob(jobId)
    const latest = res.data
    entry.errorCount = 0
    entry.job = latest
    jobs.set(jobId, latest)

    notify(entry, 'onUpdate')

    if (latest.status === 'success') {
      stopPolling(entry)
      notify(entry, 'onSuccess')
    } else if (latest.status === 'failed') {
      stopPolling(entry)
      notify(entry, 'onFailed')
    }
  } catch (err) {
    entry.errorCount += 1
    // 容忍短暂网络抖动；持续失败则停轮询并回调失败
    if (entry.errorCount >= MAX_POLL_ERRORS) {
      stopPolling(entry)
      const failedJob: OcrJobStatusResponse = {
        ...entry.job,
        status: 'failed',
        error_message: entry.job.error_message || '网络异常，无法获取识别状态',
      }
      entry.job = failedJob
      jobs.set(jobId, failedJob)
      notify(entry, 'onFailed')
    }
    console.warn('[ocrJobTracker] 轮询失败', jobId, err)
  }
}

export const ocrJobTracker = {
  /** 读取作业当前态（无则 undefined） */
  get(jobId: string | null | undefined): OcrJobStatusResponse | undefined {
    if (!jobId) return undefined
    return jobs.get(jobId)
  },

  /** 列出所有未结束的作业（供视图层「进行中任务」提示条） */
  listActive(): OcrJobStatusResponse[] {
    return Array.from(jobs.values()).filter(
      (j) => j.status === 'pending' || j.status === 'running'
    )
  },

  /**
   * 开始跟踪一个作业。重复跟踪同一 job_id 时只追加回调，不重复起轮询。
   * 若作业已结束，立刻同步回调对应结果。
   */
  track(jobId: string, filename: string, callbacks: JobCallbacks) {
    let entry = tracked.get(jobId)

    if (!entry) {
      const seed: OcrJobStatusResponse = {
        job_id: jobId,
        status: 'pending',
        stage: 'queued',
        filename,
        experience_id: null,
        error_message: null,
        created_at: new Date().toISOString(),
        finished_at: null,
      }
      jobs.set(jobId, seed)
      entry = {
        job: seed,
        filename,
        callbacks: new Set(),
        timer: null,
        errorCount: 0,
        settled: false,
      }
      tracked.set(jobId, entry)
    }

    entry.callbacks.add(callbacks)

    // 已结束的作业：直接回放，不再轮询
    if (entry.settled || entry.job.status === 'success' || entry.job.status === 'failed') {
      entry.settled = true
      const kind = entry.job.status === 'success' ? 'onSuccess' : 'onFailed'
      callbacks[kind]?.(entry.job)
      callbacks.onUpdate?.(entry.job)
      return
    }

    // 首次跟踪才起轮询
    if (entry.timer === null) {
      entry.timer = setInterval(() => poll(entry!, jobId), POLL_INTERVAL_MS)
      // 立即拉一次，避免首屏空等一个间隔
      void poll(entry, jobId)
    }
  },

  /** 解除某个订阅者的回调绑定（组件卸载时调用），轮询继续 */
  detach(jobId: string | null | undefined, callbacks?: JobCallbacks) {
    if (!jobId) return
    const entry = tracked.get(jobId)
    if (!entry) return
    if (callbacks) {
      entry.callbacks.delete(callbacks)
    }
    // 无订阅者但作业仍在跑 ⇒ 保持轮询（后台继续），终态后自行停止
  },

  /** 手动停止某作业轮询（慎用，一般不调） */
  stop(jobId: string) {
    const entry = tracked.get(jobId)
    if (entry) stopPolling(entry)
  },
}

export type { JobCallbacks }
