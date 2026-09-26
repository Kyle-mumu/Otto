import { createRouter, createWebHashHistory } from 'vue-router'
import { getToken } from '@/utils/token'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // Landing Page — 无需认证
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { guest: true },
    },
    // 登录/注册 — 无需认证
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    // Dashboard 及子页面 — 需要认证
    {
      path: '/dashboard',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'experiences',
          name: 'experiences',
          component: () => import('@/views/ExperiencesView.vue'),
        },
        {
          path: 'tasks',
          name: 'tasks',
          component: () => import('@/views/TasksView.vue'),
        },
        {
          path: 'models',
          name: 'models',
          component: () => import('@/views/ModelsView.vue'),
          meta: { role: 'admin' },
        },
        {
          path: 'quotas',
          name: 'quotas',
          component: () => import('@/views/QuotasView.vue'),
        },
        {
          path: 'usage',
          name: 'usage',
          component: () => import('@/views/UsageStatsView.vue'),
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('@/views/AnalyticsDashboard.vue'),
        },
        {
          path: 'scheduled-tasks',
          name: 'scheduled-tasks',
          component: () => import('@/views/ScheduledTasksView.vue'),
        },
        {
          path: 'rules',
          name: 'rules',
          component: () => import('@/views/RulesView.vue'),
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: () => import('@/views/NotificationsView.vue'),
        },
        {
          // 第 2 条：AI 建议中心
          path: 'ai-suggestions',
          name: 'ai-suggestions',
          component: () => import('@/views/AISuggestionsView.vue'),
        },
        {
          path: 'team',
          name: 'team',
          component: () => import('@/views/TeamView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
        },
        // 会话详情页
        {
          path: 'session/:id',
          name: 'session-detail',
          component: () => import('@/views/SessionDetailView.vue'),
        },
        // 任务详情页
        {
          path: 'task/:id',
          name: 'task-detail',
          component: () => import('@/views/TaskDetailView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

// 路由守卫
router.beforeEach(async (to) => {
  const isAuth = !!getToken()

  if (to.meta.requiresAuth && !isAuth) {
    return { name: 'login' }
  }

  // 已登录用户访问 guest 页面（landing/login/register）→ 跳转 dashboard
  if (to.meta.guest && isAuth && to.name !== 'landing') {
    return { name: 'dashboard' }
  }

  // 角色门：把 MainLayout.vue 的菜单隐藏门（唯一已生效的 admin 门）复制到路由层，
  // 否则直接输入 /dashboard/models 这类直链可以绕过菜单门进入 admin-only 页面。
  const requiredRole = to.meta.role
  if (isAuth && requiredRole) {
    // auth.user 是异步态（仅由 fetchUser() 填充，init() 无调用点），
    // 刷新后直进受保护路由时 store 里还没有用户信息 —— 此处须等一次，否则会误踢真 admin。
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    if (!auth.user && !auth.loading) {
      try {
        await auth.fetchUser()
      } catch {
        // 兜底语义收敛：不得静默通过。fetchUser 失败（401 / 网络错）时
        // 会话已不可用，显式跳登录页由用户重新认证（不默认放行、不默认跳 dashboard）。
        return { name: 'login' }
      }
    }
    // fetchUser 成功但角色不满足（或用户信息仍缺失）→ 一律不通过
    if (auth.user?.role !== requiredRole) {
      return { name: 'dashboard' }
    }
  }
})

// 导航错误处理（调试用）
router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('[Router导航失败]', from.path, '->', to.path, failure)
  }
})

export default router
