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

      <!-- 进度条 -->
      <div v-if="isUploading" class="progress-wrap">
        <el-progress :percentage="progressPercent" :stroke-width="8" />
        <p class="progress-hint">{{ progressHint }}</p>
      </div>
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
import { ref, reactive, watch as vueWatch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document } from '@element-plus/icons-vue'
import { ocrImport } from '@/api/experiences'
import type { OCRImportResponse } from '@/types/api'

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

const startOCR = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  progressPercent.value = 0
  progressHint.value = '正在上传文件...'

  // 模拟进度
  const progressTimer = setInterval(() => {
    if (progressPercent.value < 90) {
      progressPercent.value += Math.random() * 15
      if (progressPercent.value > 50 && progressHint.value === '正在上传文件...') {
        progressHint.value = '正在进行 OCR 识别...'
      }
      if (progressPercent.value > 80 && progressHint.value === '正在进行 OCR 识别...') {
        progressHint.value = '正在结构化提取...'
      }
    }
  }, 500)

  try {
    const result = await ocrImport(selectedFile.value, {
      category: form.category || undefined,
      tags: form.tags.length ? form.tags : undefined,
    })

    clearInterval(progressTimer)
    progressPercent.value = 100
    progressHint.value = '识别完成！'

    ocrResult.value = result
    editData.title = result.title
    editData.summary = result.summary
    editData.category = result.category || ''
    editData.tags = [...(result.tags || [])]

    setTimeout(() => {
      step.value = 'preview'
      isUploading.value = false
    }, 300)
  } catch (err: any) {
    clearInterval(progressTimer)
    isUploading.value = false
    errorMessage.value = err?.response?.data?.detail || err?.message || 'OCR 识别失败，请重试'
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

const emit = defineEmits<{
  success: [result: OCRImportResponse | null]
}>()

// 重置状态
const reset = () => {
  step.value = 'upload'
  selectedFile.value = null
  isUploading.value = false
  progressPercent.value = 0
  ocrResult.value = null
  form.category = ''
  form.tags = []
  tagInput.value = ''
}

// 监听 dialog 关闭时重置
vueWatch(visible, (val) => {
  if (!val) reset()
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
