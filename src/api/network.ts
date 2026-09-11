/**
 * V1.1-B6 网络管理 API 封装
 * 对应后端 4 个端点：status / peers / auth-key / peers/{id}
 */

import http from './http'
import type {
  NetworkStatus,
  NetworkPeersResponse,
  AuthKeyRequest,
  AuthKeyResponse,
  PeerRemoveResponse,
} from '@/types/network'

/** 获取当前服务端网络状态（所有已认证用户） */
export function getNetworkStatus() {
  return http.get<NetworkStatus>('/network/status')
}

/** 获取已连接节点列表（仅管理员） */
export function getNetworkPeers() {
  return http.get<NetworkPeersResponse>('/network/peers')
}

/** 生成 Tailscale Auth Key（仅管理员） */
export function generateAuthKey(data?: AuthKeyRequest) {
  return http.post<AuthKeyResponse>('/network/auth-key', data ?? {})
}

/** 移除指定节点（仅管理员） */
export function removePeer(peerId: string) {
  return http.delete<PeerRemoveResponse>(`/network/peers/${peerId}`)
}
