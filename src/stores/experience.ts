/**
 * 经验库 Pinia Store
 * 集中管理经验列表状态 + WS 事件自动刷新
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getExperiences, searchExperiences } from '@/api/experiences'
import { useWebSocketStore } from '@/stores/websocket'
import type { Experience } from '@/types/api'

export const useExperienceStore = defineStore('experience', () => {
  const items = ref<Experience[]>([])
  const total = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const pageSize = 20

  async function fetch() {
    loading.value = true
    try {
      const res = await getExperiences({ page: page.value, page_size: pageSize })
      items.value = res.data.items
      total.value = res.data.total
    } catch (err: any) {
      console.error('[Experience Store] fetch failed:', err)
      ElMessage.error('加载经验列表失败，请检查网络连接')
    } finally {
      loading.value = false
    }
  }

  async function search(query: string) {
    if (!query.trim()) {
      await fetch()
      return
    }
    loading.value = true
    try {
      const res = await searchExperiences(query)
      items.value = res.data.results
    } catch (err: any) {
      console.error('[Experience Store] search failed:', err)
      ElMessage.error('搜索经验失败，请检查网络连接')
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
    watch(() => wsStore.experienceRefresh, () => {
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
    search,
    setPage,
    bindWsRefresh,
  }
})
