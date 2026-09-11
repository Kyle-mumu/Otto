<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTeamMembers, addTeamMember, updateUserRole, deactivateUser } from '@/api/team'

const members = ref<any[]>([])
const loading = ref(true)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref()
const form = ref({
  username: '',
  email: '',
  password: '',
  role: 'member'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email' as const, message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' }
  ]
}

onMounted(async () => {
  await loadMembers()
})

async function loadMembers() {
  loading.value = true
  try {
    const res = await getTeamMembers()
    members.value = res.data.items || res.data || []
  } catch {
    members.value = []
  } finally {
    loading.value = false
  }
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: '管理员',
    director: '主管',
    employee: '成员',
    member: '成员',
  }
  return map[role] || role
}

function getRoleType(role: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    admin: 'danger',
    director: 'warning',
    employee: '',
    member: '',
  }
  return map[role] || 'info'
}

function isOnline(member: any): boolean {
  if (!member.last_active_at) return false
  const lastActive = new Date(member.last_active_at).getTime()
  return Date.now() - lastActive < 15 * 60 * 1000 // 15分钟内活跃视为在线
}

async function handleAddMember() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      await addTeamMember({
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
        role: form.value.role
      })
      ElMessage.success('同事添加成功')
      dialogVisible.value = false
      form.value = { username: '', email: '', password: '', role: 'member' }
      await loadMembers()
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '添加失败'
      ElMessage.error(msg)
    } finally {
      submitting.value = false
    }
  })
}

async function handleChangeRole(member: any, newRole: string) {
  try {
    await updateUserRole(member.id, newRole)
    ElMessage.success('角色已更新')
    await loadMembers()
  } catch {
    ElMessage.error('更新失败')
  }
}

async function handleDeactivate(member: any) {
  try {
    await ElMessageBox.confirm(`确定要停用 ${member.username} 吗？`, '确认停用', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deactivateUser(member.id)
    ElMessage.success('已停用')
    await loadMembers()
  } catch {
    // 取消操作或失败
  }
}
</script>

<template>
  <div class="team-page">
    <header class="page-header">
      <h2>团队管理</h2>
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon><Plus /></el-icon> 添加同事
      </el-button>
    </header>

    <el-card shadow="never" class="content-card">
      <el-table :data="members" v-loading="loading" stripe>
        <el-table-column label="状态" width="60">
          <template #default="{ row }">
            <span :class="['status-dot', { online: isOnline(row) }]">
              {{ isOnline(row) ? '🟢' : '⚪' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)" size="small">
              {{ getRoleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后活跃" width="160">
          <template #default="{ row }">
            <span class="last-active">
              {{ row.last_active_at ? new Date(row.last_active_at).toLocaleString() : '从未' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-select
              :model-value="row.role"
              size="small"
              style="width: 90px"
              @change="(val: string) => handleChangeRole(row, val)"
            >
              <el-option label="管理员" value="admin" />
              <el-option label="主管" value="director" />
              <el-option label="成员" value="member" />
            </el-select>
            <el-button
              type="danger"
              text
              size="small"
              :disabled="row.role === 'admin'"
              @click="handleDeactivate(row)"
            >
              停用
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && members.length === 0" description="暂无团队成员" />
    </el-card>

    <!-- 添加同事弹窗 -->
    <el-dialog v-model="dialogVisible" title="添加同事" width="480px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="至少8位"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="成员" value="member" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAddMember">
          确认添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.team-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-heading, #111111);
  margin: 0;
}

.content-card {
  border-radius: 12px;
}

.status-dot {
  font-size: 12px;
}

.last-active {
  font-size: 12px;
  color: var(--text-muted, #888);
}
</style>
