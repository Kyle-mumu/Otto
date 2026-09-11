/**
 * V1.1-B6 网络管理前端类型定义
 * 与后端 app/schemas/network.py 一一对应
 */

/** 连接模式（前端扩展，非后端Schema） */
export type ConnectionMode = 'local' | 'tailscale' | 'remote' | 'unknown'

/** 网络状态响应 — GET /api/v1/network/status */
export interface NetworkStatus {
  tailscale_connected: boolean
  server_tailscale_ip: string[]
  hostname: string
  network_name: string
  derp_region: string
  uptime_seconds: number
}

/** 网络节点信息 */
export interface NetworkPeer {
  id: string
  hostname: string
  tailscale_ip: string[]
  os: string
  online: boolean
  last_seen: string | null
}

/** 节点列表响应 — GET /api/v1/network/peers */
export interface NetworkPeersResponse {
  peers: NetworkPeer[]
  total: number
}

/** 生成 Auth Key 请求 — POST /api/v1/network/auth-key */
export interface AuthKeyRequest {
  expiry_hours?: number   // 1-720, default 24
  usage_limit?: number    // 1-100, default 1
  tags?: string[]
}

/** Auth Key 响应 */
export interface AuthKeyResponse {
  key: string
  expires_at: string
  usage_limit: number
}

/** 移除节点响应 — DELETE /api/v1/network/peers/{peer_id} */
export interface PeerRemoveResponse {
  success: boolean
  message: string
}
