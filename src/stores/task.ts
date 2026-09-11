/**
 * 任务卡 Pinia Store
 * 集中管理任务列表状态 + WS 事件自动刷新
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getTasks } from '@/api/tasks'
import { useWebSocketStore } from '@/stores/websocket'
import type { Task } from '@/types/api'

export const useTaskStore = defineStore('task', () => {
  const items = ref<Task[]>([])
  const total = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const pageSize = 20

  async function fetch() {
    loading.value = true
    try {
      const res = await getTasks({ page: page.value, page_size: pageSize })
      items.value = res.data.items
      total.value = res.data.total
    } catch {
      // 静默处理
    } finally {
      loading.value = false
    }
  }

  function setPage(newPage: number) {
    page.value = newPage
    fetch()
  }

  /** 自动绑定 WS 刷新事件（由页面调用一次） */
  function bindWsRefresh() {
    const wsStore = useWebSocketStore()
    watch(() => wsStore.taskRefresh, () => {
      fetch()
    })
  }

  return {
    items,
    total,
    loading,
    page,
    pageSize,
    fetch,
    setPage,
    bindWsRefresh,
  }
})
