<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { genBindCode, getMyBindings, unbindMe, IM_PLATFORM_LABELS, type ImBinding, type ImPlatform } from '@/api/imBot'

const bindings = ref<ImBinding[]>([])
const loading = ref(true)
const generating = ref(false)

// 绑定码展示
const showCodeDialog = ref(false)
const bindCode = ref('')
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

async function loadMyBindings() {
  loading.value = true
  try {
    const res = await getMyBindings()
    bindings.value = res.data.bindings ?? []
  } finally {
    loading.value = false
  }
}

async function handleGenCode() {
  generating.value = true
  try {
    const res = await genBindCode()
    const data = res.data
    bindCode.value = data.code
    countdown.value = data.expires_in
    showCodeDialog.value = true
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        if (timer) clearInterval(timer)
        timer = null
        bindCode.value = ''
      }
    }, 1000)
  } finally {
    generating.value = false
  }
}

function formatCountdown(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function handleUnbind(row: ImBinding) {
  try {
    await ElMessageBox.confirm(
      `确定解除 ${IM_PLATFORM_LABELS[row.platform as ImPlatform]} 的绑定（${row.open_id}）？`,
      '解除绑定',
      { type: 'warning', confirmButtonText: '解绑', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  await unbindMe(row.platform as ImPlatform)
  ElMessage.success('已解除绑定')
  await loadMyBindings()
}

onMounted(loadMyBindings)
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="tab-content">
    <el-alert type="info" :closable="false" class="bind-alert" show-icon>
      <template #title>
        绑定后即可在飞书 / 企业微信中私聊 Bot 发送 <code>我的任务</code>、<code>bind &lt;码&gt;</code> 等命令操作任务。
      </template>
    </el-alert>

    <div class="tab-header">
      <el-button type="primary" size="small" :loading="generating" @click="handleGenCode">
        生成绑定码
      </el-button>
      <span class="tab-tip">绑定码 6 位、30 分钟内有效，私聊 Bot 发送「bind 码」完成绑定（需管理员已配置对应平台 Bot）。</span>
    </div>

    <el-table :data="bindings" v-loading="loading" stripe size="small">
      <el-table-column label="平台" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="row.platform === 'feishu' ? 'primary' : 'success'">
            {{ IM_PLATFORM_LABELS[row.platform as ImPlatform] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="open_id" label="IM 账号 (open_id)" min-width="180" show-overflow-tooltip />
      <el-table-column prop="username" label="绑定账号" min-width="110">
        <template #default="{ row }">{{ row.username ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="绑定方式" width="100">
        <template #default="{ row }">
          {{ row.bound_by === 'admin' ? '管理员代绑' : '绑定码' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small">
            {{ row.status === 'ACTIVE' ? '已绑定' : '已解绑' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="绑定时间" width="170">
        <template #default="{ row }">
          {{ new Date(row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'ACTIVE'"
            size="small" text type="danger"
            @click="handleUnbind(row)"
          >解绑</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && bindings.length === 0" description="尚未绑定任何 IM 账号，点击上方生成绑定码" :image-size="60" />
  </div>

  <!-- 绑定码弹窗 -->
  <el-dialog v-model="showCodeDialog" title="绑定码" width="380px" :close-on-click-modal="false" @closed="bindCode = ''">
    <div class="code-box">
      <template v-if="bindCode">
        <div class="code-text">{{ bindCode }}</div>
        <div class="code-countdown" :class="{ danger: countdown < 60 }">
          有效期剩余 {{ formatCountdown(countdown) }}
        </div>
      </template>
      <template v-else>
        <div class="code-expired">绑定码已过期，请重新生成</div>
      </template>
      <el-divider />
      <ol class="code-steps">
        <li>打开飞书 / 企业微信，找到对应 Bot</li>
        <li>私聊发送 <code>bind {{ bindCode || '&lt;码&gt;' }}</code></li>
        <li>收到「绑定成功：{用户名}」即完成</li>
      </ol>
    </div>
    <template #footer>
      <el-button type="primary" @click="showCodeDialog = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.bind-alert {
  margin-bottom: 12px;
}

.bind-alert code {
  background: #f0f2f5;
  border-radius: 3px;
  padding: 1px 5px;
  font-weight: 600;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tab-tip {
  color: #909399;
  font-size: 12px;
}

.code-box {
  text-align: center;
}

.code-text {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 8px;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  padding: 8px 0;
}

.code-countdown {
  color: #e6a23c;
  font-size: 13px;
}

.code-countdown.danger {
  color: #f56c6c;
  font-weight: 600;
}

.code-expired {
  color: #909399;
  font-size: 15px;
  padding: 14px 0;
}

.code-steps {
  text-align: left;
  padding-left: 20px;
  color: #606266;
  font-size: 13px;
  line-height: 1.9;
}

.code-steps code {
  background: #f0f2f5;
  border-radius: 3px;
  padding: 1px 5px;
}
</style>
