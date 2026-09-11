<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { traceTask } from '@/api/trace'
import type { TraceReference } from '@/types/api'

const props = defineProps<{ taskId: string }>()

const question = ref('')
const loading = ref(false)
const answer = ref('')
const references = ref<TraceReference[]>([])
const confidence = ref<'high' | 'medium' | 'low'>('medium')
const hasResult = ref(false)

// LLM降级标识
const isFallback = ref(false)

const confidenceConfig: Record<string, { color: string; label: string }> = {
  high: { color: '#10B981', label: '高置信' },
  medium: { color: '#F59E0B', label: '中置信' },
  low: { color: '#9CA3AF', label: '低置信/降级' },
}

const suggestedQuestions = [
  '这个任务执行了哪些步骤？',
  '哪一步耗时最长？',
  '执行过程中遇到了什么错误？',
  '引用了哪些经验？',
]

async function onAsk() {
  if (!question.value.trim() || !props.taskId) return
  loading.value = true
  hasResult.value = false
  isFallback.value = false
  try {
    const res = await traceTask(props.taskId, question.value.trim())
    answer.value = res.data.answer
    references.value = res.data.references
    confidence.value = res.data.confidence
    hasResult.value = true
    // 降级检测：confidence=low 且 references 为空 → 降级
    isFallback.value = res.data.confidence === 'low' && res.data.references.length === 0
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
    if (msg === '任务不存在') {
      ElMessage.warning('任务不存在')
    } else {
      ElMessage.error('溯源问答失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

function onSuggestion(q: string) {
  question.value = q
  onAsk()
}
</script>

<template>
  <div class="trace-tab">
    <!-- 输入区 -->
    <div class="trace-input">
      <el-input
        v-model="question"
        type="textarea"
        :rows="2"
        placeholder="输入关于任务执行过程的问题，例如：这个任务执行了哪些步骤？"
        resize="none"
        @keydown.enter.ctrl.prevent="onAsk"
      />
      <div class="input-actions">
        <span class="hint">Ctrl+Enter 发送</span>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!question.trim()"
          @click="onAsk"
        >
          🔍 溯源问答
        </el-button>
      </div>
    </div>

    <!-- 推荐问题 -->
    <div v-if="!hasResult" class="suggestions">
      <span class="suggestions-label">快速提问：</span>
      <el-button
        v-for="q in suggestedQuestions"
        :key="q"
        size="small"
        text
        @click="onSuggestion(q)"
      >
        {{ q }}
      </el-button>
    </div>

    <!-- 结果区 -->
    <div v-if="hasResult" class="trace-result">
      <!-- 置信度 -->
      <div class="confidence-bar">
        <el-tag
          :color="confidenceConfig[confidence]?.color"
          effect="dark"
          size="small"
          round
        >
          {{ confidenceConfig[confidence]?.label }}
        </el-tag>
        <el-tag v-if="isFallback" type="warning" size="small" effect="plain">
          LLM不可用，已降级为纯文本摘要
        </el-tag>
      </div>

      <!-- 回答 -->
      <div class="answer-card">
        <div class="answer-text" v-html="formatAnswer(answer)" />
      </div>

      <!-- 引用步骤 -->
      <div v-if="references.length > 0" class="references">
        <div class="ref-header">📎 引用步骤</div>
        <div class="ref-list">
          <div v-for="ref in references" :key="ref.step_id" class="ref-item">
            <span class="ref-step">#{{ ref.step_number }}</span>
            <span class="ref-action">{{ ref.action }}</span>
            <el-tag
              v-if="ref.experience_title"
              size="small"
              effect="plain"
              type="primary"
            >
              💡 {{ ref.experience_title }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!hasResult && !loading" class="empty-hint">
      <p>💡 智能溯源问答可以回答关于任务执行过程的自然语言问题</p>
      <p class="small">基于执行日志和步骤数据，AI 将给出结构化回答并标注引用来源</p>
    </div>
  </div>
</template>

<script lang="ts">
/** 简单格式化：换行 → <br>，步骤编号高亮 */
function formatAnswer(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/(步骤\s*\d+)/g, '<strong style="color:#E85A3D">$1</strong>')
}
</script>

<style scoped>
.trace-tab {
  padding: 4px 0;
}

.trace-input {
  margin-bottom: 12px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
}

.suggestions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.suggestions-label {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

.trace-result {
  margin-top: 8px;
}

.confidence-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.answer-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.answer-text {
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
}

.references {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.ref-header {
  background: #f9fafb;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.ref-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ref-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #fafafa;
  font-size: 13px;
}

.ref-step {
  font-weight: 700;
  color: #E85A3D;
  min-width: 28px;
}

.ref-action {
  flex: 1;
  color: #374151;
}

.empty-hint {
  text-align: center;
  padding: 32px 16px;
  color: #9ca3af;
}

.empty-hint p {
  margin: 4px 0;
}

.empty-hint .small {
  font-size: 12px;
}
</style>
