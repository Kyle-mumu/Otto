import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { getToken } from '@/utils/token'

const isTauri = !!window.__TAURI_INTERNALS__

const router = createRouter({
  history: isTauri ? createMemoryHistory() : createWebHistory(),
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
router.beforeEach((to) => {
  const isAuth = !!getToken()

  if (to.meta.requiresAuth && !isAuth) {
    return { name: 'login' }
  }

  // 已登录用户访问 guest 页面（landing/login/register）→ 跳转 dashboard
  if (to.meta.guest && isAuth && to.name !== 'landing') {
    return { name: 'dashboard' }
  }
})

export default router
