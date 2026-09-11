<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const sessionId = computed(() => route.params.id as string)

// 模拟会话详情数据（后续接API）
const sessionDetail = computed(() => ({
  id: sessionId.value,
  title: '企业知识库新人入职培训',
  createdAt: '2026-09-07 10:30',
  participants: ['kyle', 'employee'],
  messages: [
    { sender: 'kyle', content: '请帮我整理一份新人入职培训材料', time: '10:30' },
    { sender: 'Arkham', content: '好的，我来帮你整理新人入职培训材料。包括以下几个部分：\n\n1. 公司文化介绍\n2. 系统使用指南\n3. 常见问题解答\n4. 联系方式汇总', time: '10:31' },
    { sender: 'kyle', content: '能把系统使用指南部分展开一下吗？', time: '10:32' },
    { sender: 'Arkham', content: '## 系统使用指南\n\n### 登录方式\n- 使用企业邮箱登录\n- 支持 SSO 单点登录\n\n### 核心功能\n- 知识库搜索\n- 任务管理\n- 团队协作', time: '10:33' },
  ],
}))

function goBack() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="detail-view">
    <div class="detail-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h2>{{ sessionDetail.title }}</h2>
      <span class="detail-id">会话 #{{ sessionId }}</span>
    </div>
    <div class="detail-meta">
      <span>📅 {{ sessionDetail.createdAt }}</span>
      <span>👥 {{ sessionDetail.participants.length }} 参与者</span>
    </div>
    <div class="detail-content">
      <div class="messages">
        <div
          v-for="(msg, idx) in sessionDetail.messages"
          :key="idx"
          class="msg-row"
          :class="msg.sender === 'kyle' ? 'user' : 'agent'"
        >
          <div class="msg-avatar">{{ msg.sender === 'kyle' ? 'K' : 'A' }}</div>
          <div class="msg-content">
            <div class="msg-bubble">{{ msg.content }}</div>
            <div class="msg-time">{{ msg.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-view {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-light, #E8E8E8);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.back-btn:hover {
  background: var(--bg-sidebar-hover, #F5F3F1);
}

.detail-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-heading, #111);
  margin: 0;
}

.detail-id {
  font-size: 12px;
  color: var(--text-muted, #888);
  background: var(--bg-sidebar-hover, #F5F3F1);
  padding: 2px 8px;
  border-radius: 4px;
}

.detail-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-muted, #888);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light, #E8E8E8);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.msg-row {
  display: flex;
  gap: 10px;
  max-width: 80%;
}

.msg-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--arkham-primary, #E85A3D);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.msg-row.user .msg-avatar {
  background: var(--success, #10B981);
}

.msg-bubble {
  background: var(--bg-sidebar-hover, #F5F3F1);
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-heading, #111);
  white-space: pre-wrap;
}

.msg-row.user .msg-bubble {
  background: var(--arkham-primary, #E85A3D);
  color: white;
}

.msg-time {
  font-size: 11px;
  color: var(--text-muted, #888);
  margin-top: 4px;
  text-align: right;
}
</style>
