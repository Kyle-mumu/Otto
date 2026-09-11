<script setup lang="ts">
import { computed, ref } from 'vue'

// ========== 模式定义 ==========
type ComposeMode = 'chat' | 'task'
const mode = ref<ComposeMode>('chat')

// ========== 表单数据 ==========
const composeText = ref('')
const selectedTeam = ref('default')
const selectedModel = ref('Arkham v1 High')
const selectedModeLevel = ref('standard')

// ========== 上下文标签（仅任务模式显示） ==========
const contextTags = ref(['📄 AGENTS.md', '📄 skill-catalog', '📄 knowledge-base'])

// ========== 动态 Placeholder ==========
const placeholder = computed(() =>
  mode.value === 'chat'
    ? '问智能体任何问题...（闲聊模式：直接对话，无需上下文）'
    : '描述你想要构建的内容...（任务模式：自动注入上下文，Agent 按指令执行）'
)

// ========== 消息列表 ==========
interface ChatMessage {
  type: 'user' | 'agent'
  content: string
  time: string
  sender?: string
}

const messages = ref<ChatMessage[]>([
  {
    type: 'agent',
    content: '你好！我是 Arkham，你的 AI 助手。有什么我可以帮你的？无论是问答、讨论还是任务执行，我都可以协助你。',
    time: '10:30',
    sender: 'Arkham',
  },
])

// ========== Typing 指示器 ==========
const isTyping = ref(false)

// ========== 发送处理 ==========
function handleSend() {
  if (!composeText.value.trim()) return
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  messages.value.push({
    type: 'user',
    content: composeText.value,
    time: timeStr,
  })
  composeText.value = ''

  // 模拟 Agent 回复 + Typing 指示器
  isTyping.value = true
  setTimeout(() => {
    isTyping.value = false
    messages.value.push({
      type: 'agent',
      content: '收到你的消息！这是演示回复，V1.1 将接入真实 LLM API。',
      time: timeStr,
      sender: 'Arkham',
    })
  }, 1500)
  // TODO: V1.1 接入后端 LLM API + WebSocket
}

// ========== 键盘事件：Enter 发送，Shift+Enter 换行 ==========
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// ========== 切换模式 ==========
function switchMode(m: ComposeMode) {
  mode.value = m
}
</script>

<template>
  <div class="chat-panel">
    <!-- Chat Header -->
    <div class="chat-header">
      <div class="chat-header-left">
        <div class="chat-header-avatar">A</div>
        <div class="chat-header-info">
          <h4>Arkham Agent</h4>
          <div class="status"><span class="dot"></span> {{ mode === 'task' ? '任务模式' : '在线' }}</div>
        </div>
      </div>
      <div class="chat-header-actions">
        <button class="chat-header-btn" title="历史">🕐</button>
        <button class="chat-header-btn" title="更多">⋯</button>
      </div>
    </div>

    <!-- Mode Tabs -->
    <div class="chat-mode-tabs">
      <button
        class="chat-mode-tab"
        :class="{ active: mode === 'chat' }"
        @click="switchMode('chat')"
      >
        <span>💬</span> 闲聊
      </button>
      <button
        class="chat-mode-tab"
        :class="{ active: mode === 'task' }"
        @click="switchMode('task')"
      >
        <span>🎯</span> 任务
      </button>
    </div>

    <!-- Context Bar (仅任务模式显示) -->
    <div v-if="mode === 'task'" class="chat-context-bar">
      <span class="context-label">上下文注入</span>
      <div class="context-tags">
        <span
          v-for="(tag, idx) in contextTags"
          :key="idx"
          class="context-tag"
        >{{ tag }}</span>
      </div>
    </div>

    <!-- Chat Messages -->
    <div class="chat-messages">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="msg-row"
        :class="msg.type"
      >
        <!-- Agent 消息带头像 -->
        <template v-if="msg.type === 'agent'">
          <div class="msg-avatar">A</div>
          <div class="msg-content-wrap">
            <div class="msg-bubble">{{ msg.content }}</div>
            <div class="msg-meta">
              <span class="sender">{{ msg.sender }}</span>
              <span class="time">{{ msg.time }}</span>
            </div>
          </div>
        </template>
        <!-- User 消息 -->
        <template v-else>
          <div class="msg-bubble">{{ msg.content }}</div>
          <div class="msg-meta">
            <span class="time">{{ msg.time }}</span>
          </div>
        </template>
      </div>

      <!-- Typing Indicator -->
      <div v-if="isTyping" class="msg-row agent typing-row">
        <div class="msg-avatar">A</div>
        <div class="msg-content-wrap">
          <div class="msg-bubble typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Input Area -->
    <div class="chat-input-area">
      <div class="chat-input-box">
        <textarea
          v-model="composeText"
          class="chat-textarea"
          :placeholder="placeholder"
          @keydown="handleKeydown"
        ></textarea>
        <div class="chat-toolbar">
          <!-- Left: Actions -->
          <div class="toolbar-left">
            <button class="chat-tool-btn" title="添加上下文">＋</button>
            <select v-model="selectedTeam" class="chat-select-compact" title="个人/团队">
              <option value="default">👤 个人</option>
              <option value="team">👥 团队</option>
            </select>
            <select v-model="selectedModeLevel" class="chat-select-compact" title="模式等级">
              <option value="standard">▢ 标准</option>
              <option value="deep">▣ 深度</option>
            </select>
            <button class="chat-tool-btn" title="上传文件">📎</button>
          </div>
          <!-- Right: Model + Send -->
          <div class="toolbar-right">
            <div class="model-chip" title="模型选择">
              <span class="model-dot"></span>
              <select v-model="selectedModel" class="model-select">
                <option value="Arkham v1 High">Arkham v1 High</option>
                <option value="Arkham v1 Standard">Arkham v1 Standard</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                <option value="DeepSeek-V3">DeepSeek-V3</option>
              </select>
              <span class="arrow">▾</span>
            </div>
            <button
              class="chat-send-btn"
              title="发送"
              :disabled="!composeText.trim()"
              @click="handleSend"
            >↑</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========================================
   CHAT PANEL — Right-side chat box
   ======================================== */

.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 360px;
  flex-shrink: 0;
  background: var(--bg-white, #FFFFFF);
}

/* Chat Header */
.chat-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light, #E8E8E8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-header-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--arkham-primary, #E85A3D);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.chat-header-info h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-heading, #111);
}

.chat-header-info .status {
  font-size: 11px;
  color: var(--success, #10B981);
  display: flex;
  align-items: center;
  gap: 4px;
}

.chat-header-info .status .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--success, #10B981);
}

.chat-header-actions {
  display: flex;
  gap: 4px;
}

.chat-header-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted, #888);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.chat-header-btn:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
  color: var(--text-heading, #111);
}

/* Mode Tabs */
.chat-mode-tabs {
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  border-bottom: 1px solid var(--border-light, #E8E8E8);
  background: var(--bg-page, #FAFAFA);
  flex-shrink: 0;
}

.chat-mode-tab {
  flex: 1;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-muted, #888);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
  font-family: var(--font-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.chat-mode-tab:hover {
  color: var(--text-body, #4A4A4A);
}

.chat-mode-tab.active {
  background: var(--bg-white, #FFFFFF);
  color: var(--arkham-primary, #E85A3D);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

/* Context Bar */
.chat-context-bar {
  padding: 8px 12px;
  background: var(--arkham-primary-50, #FEF2EE);
  border-bottom: 1px solid var(--arkham-primary-100, #FDE0D8);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.chat-context-bar .context-label {
  font-size: 11px;
  color: var(--arkham-primary, #E85A3D);
  font-weight: 500;
  white-space: nowrap;
}

.chat-context-bar .context-tags {
  display: flex;
  gap: 4px;
  overflow-x: auto;
}

.chat-context-bar .context-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-white, #FFFFFF);
  border: 1px solid var(--arkham-primary-100, #FDE0D8);
  color: var(--arkham-primary, #E85A3D);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}

/* Chat Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.msg-row {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.msg-row.user {
  align-self: flex-end;
  align-items: flex-end;
}

.msg-row.agent {
  align-self: stretch;
  align-items: flex-start;
  flex-direction: row;
  gap: 8px;
  max-width: 100%;
}

/* Message Bubble */
.msg-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  word-wrap: break-word;
}

.msg-row.user .msg-bubble {
  background: var(--arkham-primary, #E85A3D);
  color: white;
  border-bottom-right-radius: 4px;
}

.msg-row.agent .msg-bubble {
  background: #F5F5F5;
  color: var(--text-body, #4A4A4A);
  border-bottom-left-radius: 4px;
  margin-top: 2px;
}

/* Message Meta */
.msg-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding: 0 4px;
}

.msg-meta .time {
  font-size: 10px;
  color: var(--text-muted, #888);
}

.msg-meta .sender {
  font-size: 10px;
  color: var(--text-muted, #888);
  font-weight: 500;
}

/* Avatar in message */
.msg-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.msg-row.agent .msg-avatar {
  background: var(--arkham-primary, #E85A3D);
  color: white;
}

.msg-row.agent .msg-content-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* Chat Input Area */
.chat-input-area {
  border-top: 1px solid var(--border-light, #E8E8E8);
  background: var(--bg-white, #FFFFFF);
  padding: 8px 12px;
  flex-shrink: 0;
}

.chat-input-box {
  border: 1px solid var(--border-light, #E8E8E8);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.chat-input-box:focus-within {
  border-color: var(--arkham-primary, #E85A3D);
  box-shadow: 0 0 0 3px var(--arkham-primary-50, #FEF2EE);
}

.chat-textarea {
  width: 100%;
  border: none;
  padding: 12px 12px 8px;
  font-size: 13px;
  font-family: var(--font-primary);
  color: var(--text-body, #4A4A4A);
  background: transparent;
  resize: none;
  outline: none;
  min-height: 40px;
  max-height: 120px;
  line-height: 1.5;
}

.chat-textarea::placeholder {
  color: var(--text-muted, #888);
}

/* Toolbar - Single Row */
.chat-toolbar {
  display: flex;
  align-items: center;
  padding: 2px 8px 6px;
  gap: 4px;
}

/* Left group: action buttons */
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

/* Right group: model + send */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}

/* Icon buttons (+, 📎) */
.chat-tool-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted, #888);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.chat-tool-btn:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
  color: var(--text-heading, #111);
}

/* Compact Selectors (个人/标准) */
.chat-select-compact {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 6px;
  border: 1px solid var(--border-light, #E8E8E8);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-body, #4A4A4A);
  background: var(--bg-white, #FFFFFF);
  cursor: pointer;
  font-family: var(--font-primary);
  transition: all 0.15s;
  white-space: nowrap;
  height: 26px;
}

.chat-select-compact:hover {
  border-color: var(--border-medium, #D0D0D0);
  background: var(--bg-sidebar-hover, #F5F3F1);
}

.chat-select-compact:focus {
  outline: none;
  border-color: var(--arkham-primary, #E85A3D);
  box-shadow: 0 0 0 2px var(--arkham-primary-50, #FEF2EE);
}

/* Model Selector Chip */
.model-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 8px;
  border: 1px solid var(--border-light, #E8E8E8);
  border-radius: 6px;
  background: var(--bg-white, #FFFFFF);
  cursor: pointer;
  font-family: var(--font-primary);
  transition: all 0.15s;
  height: 26px;
  position: relative;
}

.model-chip:hover {
  border-color: var(--arkham-primary-200, #FBB8A8);
  background: var(--arkham-primary-50, #FEF2EE);
}

.model-chip:hover .model-select {
  color: var(--arkham-primary, #E85A3D);
}

.model-chip .model-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--success, #10B981);
  flex-shrink: 0;
}

.model-chip .arrow {
  font-size: 8px;
  color: var(--text-muted, #888);
  flex-shrink: 0;
}

.model-chip .model-select {
  border: none;
  background: transparent;
  font-size: 11px;
  color: var(--text-body, #4A4A4A);
  cursor: pointer;
  font-family: var(--font-primary);
  outline: none;
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
  max-width: 110px;
}

/* Send Button */
.chat-send-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--arkham-primary, #E85A3D);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.chat-send-btn:hover:not(:disabled) {
  background: var(--arkham-primary-dark, #C4412A);
  transform: scale(1.08);
  box-shadow: 0 2px 8px rgba(232, 90, 61, 0.3);
}

.chat-send-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.chat-send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #D0D0D0;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #B0B0B0;
}

/* Typing Indicator Animation */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted, #888);
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.typing-row {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
