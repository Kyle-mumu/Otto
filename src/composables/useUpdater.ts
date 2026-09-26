import { ref } from 'vue'

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'

// ============================================================
// 模块级单例 ref —— 所有 useUpdater() 调用者共享同一份状态
// 修复 P1 Bug：此前 ref() 在函数体内创建，每次调用独立实例，
// 导致 MainLayout 的 checkForUpdate() 设 status 后，
// UpdateDialog 读到的是另一个实例的 status（仍为 idle）→ 弹窗永不显示
// ============================================================
const status = ref<UpdateStatus>('idle')
const updateVersion = ref('')
const updateNotes = ref('')
const downloadProgress = ref(0)
const errorMsg = ref('')
const currentVersion = ref(import.meta.env.VITE_APP_VERSION || '未知')
const lastCheckedAt = ref('')

/** 检查更新（启动时调用，静默失败） */
async function checkForUpdate() {
  status.value = 'checking'
  try {
    // 动态导入：浏览器 dev 模式下不会报错（try-catch 兜底）
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()

    if (update?.available) {
      status.value = 'available'
      updateVersion.value = update.version
      updateNotes.value = update.body || ''
      lastCheckedAt.value = new Date().toLocaleString()
      console.debug(`[Updater] 发现新版本: ${update.version}`)
    } else {
      status.value = 'idle'
      lastCheckedAt.value = new Date().toLocaleString()
      console.debug('[Updater] 当前已是最新版本')
    }
  } catch (e: any) {
    status.value = 'error'
    errorMsg.value = e?.message || String(e)
    console.debug('[Updater] 检查更新失败（可能非 Tauri 环境）:', e)
    // 3 秒后重置，避免卡在 error 状态
    setTimeout(() => {
      if (status.value === 'error') status.value = 'idle'
    }, 3000)
  }
}

/** 下载更新 */
async function downloadUpdate() {
  if (status.value !== 'available') return
  status.value = 'downloading'
  downloadProgress.value = 0

  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()

    if (!update?.available) {
      status.value = 'idle'
      return
    }

    let total = 0
    let downloaded = 0
    await update.downloadAndInstall((event: any) => {
      if (event.event === 'Started') {
        total = event.data.contentLength || 0
      } else if (event.event === 'Progress') {
        downloaded += event.data.chunkLength || 0
        downloadProgress.value = total > 0
          ? Math.round((downloaded / total) * 100)
          : 0
      } else if (event.event === 'Finished') {
        downloadProgress.value = 100
      }
    })

    // downloadAndInstall 完成后，macOS 会在下次重启时应用
    status.value = 'downloaded'
    console.debug('[Updater] 下载完成，等待重启')
  } catch (e: any) {
    status.value = 'error'
    errorMsg.value = e?.message || String(e)
    console.error('[Updater] 下载失败:', e)
  }
}

/** 立即重启以应用更新 */
async function relaunchApp() {
  try {
    const { relaunch } = await import('@tauri-apps/plugin-process')
    await relaunch()
  } catch (e: any) {
    console.error('[Updater] 重启失败:', e)
  }
}

/** 关闭更新弹窗（稍后/取消） */
function dismiss() {
  status.value = 'idle'
}

/** 返回共享单例状态的访问器（所有调用者拿到同一份 ref） */
export function useUpdater() {
  return {
    status,
    updateVersion,
    updateNotes,
    downloadProgress,
    errorMsg,
    currentVersion,
    lastCheckedAt,
    checkForUpdate,
    downloadUpdate,
    relaunchApp,
    dismiss,
  }
}
