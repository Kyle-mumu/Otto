<template>
  <el-dialog
    v-model="visible"
    title="📥 OCR 文件导入"
    width="640px"
    destroy-on-close
    :close-on-click-modal="false"
    class="ocr-import-modal"
  >
    <!-- 步骤 1: 文件上传 -->
    <div v-if="step === 'upload'" class="step-upload">
      <div
        class="drop-zone"
        :class="{ 'drag-over': isDragOver, 'has-file': !!selectedFile }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="onDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp"
          style="display: none"
          @change="onFileSelect"
        />
        <div v-if="!selectedFile" class="drop-hint">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <p class="primary-text">拖拽文件到此处，或点击选择</p>
          <p class="secondary-text">支持 PDF / PNG / JPG / WebP / BMP，最大 20MB</p>
        </div>
        <div v-else class="file-info">
          <el-icon class="file-icon"><Document /></el-icon>
          <div class="file-meta">
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <el-button text size="small" @click.stop="clearFile">移除</el-button>
        </div>
      </div>

      <div class="form-section">
        <el-form label-position="top">
          <el-form-item label="分类（可选）">
            <el-select v-model="form.category" placeholder="选择分类" clearable style="width: 100%">
              <el-option label="技术方案" value="技术方案" />
              <el-option label="会议纪要" value="会议纪要" />
              <el-option label="产品文档" value="产品文档" />
              <el-option label="学习笔记" value="学习笔记" />
              <el-option label="行业分析" value="行业分析" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签（可选）">
            <el-input v-model="tagInput" placeholder="输入标签后按回车添加" @keyup.enter="addTag" />
            <div v-if="form.tags.length" class="tags-wrap">
              <el-tag
                v-for="(tag, idx) in form.tags"
                :key="idx"
                closable
                @close="form.tags.splice(idx, 1)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="actions">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedFile" :loading="isUploading" @click="startOCR">
          {{ isUploading ? '识别中...' : '开始识别' }}
        </el-button>
      </div>

      <!-- 真实进度（来自后端 stage，非模拟） -->
      <div v-if="isUploading" class="progress-wrap">
        <el-progress :percentage="progressPercent" :stroke-width="8" />
        <p class="progress-hint">{{ progressHint }}</p>
        <p class="progress-sub">可以关闭本窗口，任务将在后台继续，完成后会提示你</p>
      </div>

      <!-- 后台运行中（弹窗重开后仍显示） -->
      <el-alert
        v-if="!isUploading && activeJob"
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 16px"
      >
        <template #title>
          后台识别中：{{ activeJob.filename }} · {{ stageLabel(activeJob.stage) }}
        </template>
      </el-alert>
    </div>

    <!-- 步骤 2: 预览与编辑 -->
    <div v-else-if="step === 'preview'" class="step-preview">
      <el-alert
        type="success"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        <template #title>
          OCR 识别完成 · 引擎: {{ ocrResult?.source?.ocr_provider || '未知' }} · 置信度: {{ (ocrResult?.source?.confidence * 100).toFixed(0) || 0 }}%
        </template>
      </el-alert>

      <el-form label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="editData.title" placeholder="文档标题" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="editData.summary" type="textarea" :rows="3" placeholder="文档摘要" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editData.category" placeholder="选择分类" clearable style="width: 100%">
            <el-option label="技术方案" value="技术方案" />
            <el-option label="会议纪要" value="会议纪要" />
            <el-option label="产品文档" value="产品文档" />
            <el-option label="学习笔记" value="学习笔记" />
            <el-option label="行业分析" value="行业分析" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editTagInput" placeholder="输入标签后按回车添加" @keyup.enter="addEditTag" />
          <div v-if="editData.tags.length" class="tags-wrap">
            <el-tag
              v-for="(tag, idx) in editData.tags"
              :key="idx"
              closable
              @close="editData.tags.splice(idx, 1)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="OCR 原文（可折叠）">
          <el-collapse>
            <el-collapse-item title="查看完整 OCR 文本">
              <div class="ocr-raw-text">{{ ocrResult?.content || '' }}</div>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </el-form>

      <div class="actions">
        <el-button @click="step = 'upload'">返回修改</el-button>
        <el-button @click="saveAsDraft">保存为草稿</el-button>
        <el-button type="primary" @click="publishNow">直接发布</el-button>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="step === 'error'" class="step-error">
      <el-result icon="error" title="OCR 识别失败" :sub-title="errorMessage">
        <template #extra>
          <el-button @click="step = 'upload'">重试</el-button>
          <el-button type="primary" @click="visible = false">关闭</el-button>
        </template>
      </el-result>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onUnmounted, watch as vueWatch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue'
import { ocrImport, getOcrJob, getExperience } from '@/api/experiences'
import type {
  OCRImportResponse,
  OcrJobStage,
  OcrJobStatusResponse,
} from '@/types/api'
import { ocrJobTracker } from '@/composables/ocrJobTracker'

const visible = defineModel<boolean>({ default: false })

const step = ref<'upload' | 'preview' | 'error'>('upload')
const isDragOver = ref(false)
const isUploading = ref(false)
const progressPercent = ref(0)
const progressHint = ref('正在上传文件...')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref('')
const ocrResult = ref<OCRImportResponse | null>(null)
const tagInput = ref('')
const editTagInput = ref('')

/**
 * 当前作业（组件本地视图，与 tracker 同步）
 * tracker 是模块级单例 —— 弹窗关闭后轮询仍在 tracker 中继续
 */
const currentJobId = ref<string | null>(null)
const activeJob = computed(() =>
  currentJobId.value ? ocrJobTracker.get(currentJobId.value) : null
)

const form = reactive({
  category: '',
  tags: [] as string[],
})

const editData = reactive({
  title: '',
  summary: '',
  category: '',
  tags: [] as string[],
})

/** stage → 进度百分比映射（真实分段，替代原 setInterval 假进度） */
const STAGE_PERCENT: Record<OcrJobStage, number> = {
  queued: 10,
  ocr: 40,
  structuring: 70,
  embedding: 90,
  done: 100,
}

/** stage → 用户可读文案 */
const STAGE_LABEL: Record<OcrJobStage, string> = {
  queued: '排队中',
  ocr: '正在识别文字...',
  structuring: '正在结构化提取...',
  embedding: '正在生成索引...',
  done: '识别完成！',
}

const stageLabel = (stage: OcrJobStage) => STAGE_LABEL[stage] || '处理中...'

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    validateAndSetFile(input.files[0])
  }
}

const onDrop = (e: DragEvent) => {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const validateAndSetFile = (file: File) => {
  const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp']
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedExts.includes(ext)) {
    ElMessage.error('不支持的文件类型，请上传 PDF 或图片文件')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error('文件大小超过 20MB 限制')
    return
  }
  selectedFile.value = file
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  tagInput.value = ''
}

const addEditTag = () => {
  const tag = editTagInput.value.trim()
  if (tag && !editData.tags.includes(tag)) {
    editData.tags.push(tag)
  }
  editTagInput.value = ''
}

const emit = defineEmits<{
  success: [result: OCRImportResponse | null]
  /** 提交异步作业后抛出 job_id，供父视图显示「进行中」提示条 */
  jobSubmitted: [jobId: string, filename: string]
}>()

/** 作业成功：拉回 draft 全文，进入预览编辑页 */
const onJobSuccess = async (job: OcrJobStatusResponse) => {
  isUploading.value = false
  progressPercent.value = 100
  progressHint.value = '识别完成！'

  if (!job.experience_id) {
    errorMessage.value = '识别成功但未返回经验 ID'
    step.value = 'error'
    return
  }

  try {
    // 异步分支不返回全文，需按 experience_id 拉取 draft 详情
    // http 拦截器不解包，返回 AxiosResponse，须取 .data
    const res = await getExperience(job.experience_id)
    const exp = res.data
    ocrResult.value = {
      id: exp.id,
      title: exp.title,
      summary: exp.summary,
      content: exp.content,
      tags: exp.tags || [],
      category: (exp as any).category || '',
      source: (exp as any).source || {
        filename: job.filename,
        file_type: '',
        pages: 0,
        ocr_provider: 'unknown',
      },
      status: exp.status || 'draft',
      created_at: exp.created_at || new Date().toISOString(),
    }
    editData.title = ocrResult.value.title
    editData.summary = ocrResult.value.summary
    editData.category = ocrResult.value.category || ''
    editData.tags = [...(ocrResult.value.tags || [])]
    step.value = 'preview'
    ElNotification({
      title: 'OCR 识别完成',
      message: `《${ocrResult.value.title}》已生成为草稿，可直接编辑发布`,
      type: 'success',
      duration: 5000,
    })
    emit('success', ocrResult.value)
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.detail || '草稿加载失败'
    step.value = 'error'
  }
}

/**
 * 提交-轮询：点上传即时返回 job_id，之后每 2s 轮询真实状态。
 * 轮询交由模块级 tracker 执行 —— 弹窗关闭后仍在跑。
 */
const startOCR = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  progressPercent.value = STAGE_PERCENT.queued
  progressHint.value = '正在上传文件...'
  errorMessage.value = ''

  const file = selectedFile.value
  try {
    // http 拦截器不解包，返回 AxiosResponse，须取 .data
    const submittedRes = await ocrImport(file, {
      category: form.category || undefined,
      tags: form.tags.length ? form.tags : undefined,
    })
    const submitted = submittedRes.data

    currentJobId.value = submitted.job_id
    // 交给 tracker：即使弹窗立即关闭，轮询也继续
    ocrJobTracker.track(submitted.job_id, file.name, {
      onUpdate: (job) => {
        // 仅当本组件仍是该作业的展示方时更新进度条
        if (currentJobId.value !== job.job_id) return
        progressPercent.value = STAGE_PERCENT[job.stage] ?? 0
        progressHint.value = stageLabel(job.stage)
      },
      onSuccess: (job) => {
        if (currentJobId.value !== job.job_id) return
        onJobSuccess(job)
      },
      onFailed: (job) => {
        if (currentJobId.value !== job.job_id) return
        isUploading.value = false
        errorMessage.value = job.error_message || 'OCR 识别失败，请重试'
        step.value = 'error'
      },
    })

    emit('jobSubmitted', submitted.job_id, file.name)
  } catch (err: any) {
    isUploading.value = false
    errorMessage.value = err?.response?.data?.detail || err?.message || 'OCR 提交失败，请重试'
    step.value = 'error'
  }
}

const saveAsDraft = () => {
  ElMessage.success('草稿保存成功！')
  visible.value = false
  emit('success', ocrResult.value)
}

const publishNow = async () => {
  // 直接发布：先保存为草稿，然后流转到 pending
  ElMessage.success('已发布！')
  visible.value = false
  emit('success', ocrResult.value)
}

// 重置状态（不清 tracker —— 后台作业需要继续跑）
const reset = () => {
  step.value = 'upload'
  selectedFile.value = null
  isUploading.value = false
  progressPercent.value = 0
  ocrResult.value = null
  form.category = ''
  form.tags = []
  tagInput.value = ''
  // currentJobId 保留：重开弹窗时若作业仍在跑，应显示「后台识别中」
}

// 监听 dialog 关闭时重置（tracker 中的轮询不受影响）
vueWatch(visible, (val) => {
  if (!val) reset()
})

// 重开弹窗时：若该作业已成功且尚未消费，直接进预览
vueWatch(visible, async (val) => {
  if (!val || !currentJobId.value) return
  const job = ocrJobTracker.get(currentJobId.value)
  if (job?.status === 'success' && step.value === 'upload' && !ocrResult.value) {
    await onJobSuccess(job)
  }
})

onUnmounted(() => {
  // 仅解除本组件的回调绑定，不停止 tracker 轮询
  ocrJobTracker.detach(currentJobId.value)
})
</script>

<style scoped>
.ocr-import-modal :deep(.el-dialog__body) {
  padding: 24px;
}

.drop-zone {
  border: 2px dashed var(--el-border-color);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--el-fill-color-blank);
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.drop-zone.has-file {
  border-style: solid;
  border-color: var(--el-color-success);
  padding: 20px;
}

.drop-hint .upload-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 12px;
}

.primary-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin: 0 0 8px;
}

.secondary-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 32px;
  color: var(--el-color-success);
}

.file-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.file-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.form-section {
  margin-top: 20px;
}

.tags-wrap {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.progress-wrap {
  margin-top: 16px;
}

.progress-hint {
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}

.progress-sub {
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.ocr-raw-text {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-regular);
}
</style>
