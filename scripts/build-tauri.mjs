#!/usr/bin/env node
/**
 * Tauri 构建专用：先清除构建期环境残留，再在同一进程内 spawn vite。
 *
 * 为什么不能用 `node -e "delete process.env.X" && vite build`：
 *   `node -e` 是一次性子进程，它的 env 改动不回流到父 shell，
 *   随后的 vite 进程继承的仍是父 shell 原样环境 —— 清理无效。
 *   （0.1.24 的 dmg 白屏 bug 之一即由此类残留引起：
 *     shell 里遗留的 VITE_API_BASE_URL=/绝对地址 被 vite.config.ts:44 判为
 *     env-override，把 Mac 产物固化成了 Windows 公网地址。）
 *
 * 本脚本在同进程内删除变量后再 spawn，保证清理对 vite 生效。
 */
import { spawn } from 'node:child_process'

const LEAKY_VARS = ['VITE_API_BASE_URL', 'VITE_WS_BASE_URL']

for (const key of LEAKY_VARS) {
  if (process.env[key] !== undefined) {
    console.log(`[otto-build] 清除构建期残留环境变量 ${key}=${process.env[key]}`)
    delete process.env[key]
  }
}

const child = spawn('vite', ['build', '--mode', 'tauri'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
})

child.on('exit', (code) => process.exit(code ?? 1))
child.on('error', (err) => {
  console.error('[otto-build] 启动 vite 失败：', err)
  process.exit(1)
})
