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

  /** C-07: WS 基址由构建期注入（见 Build-5，按平台固化）；浏览器下回退按页面协议自动选择 ws/wss */
  function getWsBaseUrl(): string {
    if (__WS_BASE_URL__) return __WS_BASE_URL__
    if (window.__TAURI_INTERNALS__) return 'ws://localhost:8000/api/v1'
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://localhost:8000/api/v1`
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
