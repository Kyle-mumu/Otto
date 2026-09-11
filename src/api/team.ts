import http from './http'

// 获取团队成员列表
export function getTeamMembers(params?: { page?: number; page_size?: number }) {
  return http.get('/team/members', { params })
}

// 更新用户角色
export function updateUserRole(userId: string, role: string) {
  return http.put(`/users/${userId}/role`, { role })
}

// 停用用户
export function deactivateUser(userId: string) {
  return http.post(`/users/${userId}/deactivate`)
}

// 添加新同事（admin）
export function addTeamMember(data: { username: string; email: string; password: string; role?: string }) {
  return http.post('/team/members', data)
}
