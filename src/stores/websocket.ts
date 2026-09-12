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

  /**
   * H-08：WS 基址解析（构建期注入 + 运行时兜底修正）
   *
   * 旧实现 `if (__WS_BASE_URL__) return __WS_BASE_URL__` 会把浏览器模式注入的
   * **相对路径** `/api/v1` 原样返回，拼成 `new WebSocket("/api/v1/ws")`；
   * Tauri 兜底还硬编了 `ws://localhost:8000`（IPv6 `::1` 解析与端口均不正确）。
   *
   * 现规则：
   * - 注入值为绝对地址（桌面端：ws://127.0.0.1:8080/api/v1 等）→ 直接采用；
   * - 注入值为相对路径或缺失（浏览器）→ 按「当前页面协议 + 当前 host」推导绝对地址，
   *   与 HTTP 基址同源，浏览器下由 Vite proxy（`/api`，ws: true）转发。
   */
  function getWsBaseUrl(): string {
    const injected = __WS_BASE_URL__
    if (/^wss?:\/\//.test(injected)) return injected
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const path = injected && injected.startsWith('/') ? injected : '/api/v1'
    return `${proto}://${window.location.host}${path}`
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
