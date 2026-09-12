/**
 * WebSocket 全局 Pinia Store
 * 单例连接，页面通过 watch refreshTrigger 刷新数据
 *
 * 安全改进 (M3-T2R):
 * - C-05: token 不再通过 URL 传递，改为连接后首条消息认证
 * - C-07: 自动检测协议，生产环境使用 wss://
 * - 断线重连时重新发送认证消息
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { WsEvent } from '@/types/api'
import { getToken } from '@/utils/token'

export const useWebSocketStore = defineStore('websocket', () => {
  const connected = ref(false)
  const events = ref<WsEvent[]>([])
  const lastEvent = ref<WsEvent | null>(null)

  // 刷新触发器：页面 watch 这些值来触发数据重载
  const experienceRefresh = ref(0)
  const taskRefresh = ref(0)

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  const INITIAL_RECONNECT_DELAY = 1000  // 初始重连延迟1秒
  const MAX_RECONNECT_DELAY = 60000     // 最大重连延迟60秒
  let reconnectAttempt = 0              // 重连尝试次数
  let started = false
  let authenticated = false  // 认证状态标记

  /** C-07: WS 基址由构建期注入（见 Build-5，按平台固化）；浏览器下回退按页面协议自动选择 ws/wss */
  function getWsBaseUrl(): string {
    if (__WS_BASE_URL__) return __WS_BASE_URL__
    if (window.__TAURI_INTERNALS__) return 'ws://localhost:8000/api/v1'
    // 自动检测：https 页面用 wss，http 页面用 ws
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://localhost:8000/api/v1`
  }

  /** C-05: 发送认证消息 */
  function sendAuth(token: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'auth', token }))
  }

  function connect() {
    const token = getToken()
    if (!token || ws) return

    authenticated = false
    const url = `${getWsBaseUrl()}/ws`
    ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('[WS Store] Connected, sending auth...')
      // C-05: 连接建立后发送认证消息（非 URL 传递）
      sendAuth(token)
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WsEvent = JSON.parse(event.data)

        // 处理认证结果
        if (data.type === 'auth_failed') {
          console.error('[WS Store] Auth failed:', data.message)
          ws?.close()
          return
        }
        if (data.type === 'connection_established') {
          authenticated = true
          connected.value = true
          reconnectAttempt = 0  // 成功连接，重置重连计数
          console.log('[WS Store] Authenticated')
          return
        }

        // 仅认证后才处理业务消息
        if (!authenticated) {
          console.warn('[WS Store] Ignoring message before auth:', data.type)
          return
        }

        lastEvent.value = data
        events.value.push(data)
        if (events.value.length > 100) {
          events.value = events.value.slice(-100)
        }

        // 根据事件类型触发对应刷新
        const eventType = data.type || data.event  // 兼容 type 和 event 两种字段
        if (eventType?.startsWith('experience_')) {
          experienceRefresh.value++
        }
        if (eventType?.startsWith('task_')) {
          taskRefresh.value++
        }
      } catch {
        console.warn('[WS Store] Failed to parse message:', event.data)
      }
    }

    ws.onclose = (ev) => {
      connected.value = false
      authenticated = false
      ws = null
      console.log('[WS Store] Disconnected (code:', ev.code, '), reconnecting...')
      // 仅非主动断开时重连
      if (ev.code !== 4001 && ev.code !== 4003) {
        scheduleReconnect()
      }
    }

    ws.onerror = (err) => {
      console.error('[WS Store] Error:', err)
      ws?.close()
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    // 指数退避：1s → 2s → 4s → 8s → ... → 60s
    const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY)
    reconnectAttempt++
    console.log(`[WS Store] Reconnecting in ${delay}ms (attempt ${reconnectAttempt})...`)
    reconnectTimer = setTimeout(connect, delay)
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    connected.value = false
    authenticated = false
    started = false
    reconnectAttempt = 0  // 重置重连计数
  }

  /** 启动连接（由 MainLayout 调用一次） */
  function start() {
    if (started) return
    started = true
    connect()

    // 监听 token 变化（登出后断开，登录后重连）
    const stopTokenWatch = watch(() => getToken(), (newToken) => {
      if (newToken) {
        if (!ws) connect()
      } else {
        disconnect()
      }
    })

    // 返回清理函数，供组件 onUnmounted 调用
    return () => {
      stopTokenWatch()
      disconnect()
    }
  }

  return {
    connected,
    events,
    lastEvent,
    experienceRefresh,
    taskRefresh,
    start,
    connect,
    disconnect,
  }
})
