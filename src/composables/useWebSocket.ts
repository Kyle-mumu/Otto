/**
 * WebSocket Composable（独立页面使用）
 *
 * 安全改进 (M3-T2R):
 * - C-05: token 不再通过 URL 传递，改为连接后首条消息认证
 * - C-07: 自动检测协议，生产环境使用 wss://
 */
import { ref, onMounted, onUnmounted } from 'vue'
import type { WsEvent } from '@/types/api'
import { getToken } from '@/utils/token'

export function useWebSocket(path: string = '/ws') {
  const connected = ref(false)
  const lastEvent = ref<WsEvent | null>(null)
  const events = ref<WsEvent[]>([])

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  const reconnectDelay = 3000
  let authenticated = false

  /**
   * H-08（同源缺陷，本 composable 目前无调用方 —— 一并修正，避免日后被启用时复发）：
   * 注入值为相对路径时不得原样返回；Tauri 兜底亦不再硬编 localhost:8000。
   */
  function getWsBaseUrl(): string {
    const injected = __WS_BASE_URL__
    if (/^wss?:\/\//.test(injected)) return injected
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const path = injected && injected.startsWith('/') ? injected : '/api/v1'
    return `${proto}://${window.location.host}${path}`
  }

  function sendAuth(token: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'auth', token }))
  }

  function connect() {
    const token = getToken()
    if (!token) return

    authenticated = false
    const url = `${getWsBaseUrl()}${path}`
    ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('[WS] Connected, sending auth...')
      sendAuth(token)
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WsEvent = JSON.parse(event.data)

        // 处理认证结果
        if (data.type === 'auth_failed') {
          console.error('[WS] Auth failed:', data.message)
          ws?.close()
          return
        }
        if (data.type === 'connection_established') {
          authenticated = true
          connected.value = true
          console.log('[WS] Authenticated')
          return
        }

        if (!authenticated) return

        lastEvent.value = data
        events.value.push(data)
        // 保留最近 100 条
        if (events.value.length > 100) {
          events.value = events.value.slice(-100)
        }
      } catch {
        console.warn('[WS] Failed to parse message:', event.data)
      }
    }

    ws.onclose = (ev) => {
      connected.value = false
      authenticated = false
      ws = null
      console.log('[WS] Disconnected, reconnecting...')
      if (ev.code !== 4001 && ev.code !== 4003) {
        scheduleReconnect()
      }
    }

    ws.onerror = (err) => {
      console.error('[WS] Error:', err)
      ws?.close()
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connect, reconnectDelay)
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
  }

  onMounted(connect)
  onUnmounted(disconnect)

  return { connected, lastEvent, events, connect, disconnect }
}
