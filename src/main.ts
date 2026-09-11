import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus, { ElNotification } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import enUs from 'element-plus/es/locale/lang/en'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'
import { i18n, getLocale } from './i18n'
import './styles/element-theme.css'
import './style.css'

// 版本检查：每次构建自动生成新版本号，与 localStorage 对比
const BUILD_VERSION = __BUILD_VERSION__
const storedVersion = localStorage.getItem('harness_build_version')
if (storedVersion && storedVersion !== BUILD_VERSION) {
  // 版本变了，延迟显示 Toast（等 app 挂载后）
  setTimeout(() => {
    ElNotification({
      title: '已更新到新版本',
      message: `构建时间: ${new Date(BUILD_VERSION).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
      type: 'success',
      duration: 5000,
      position: 'top-right',
    })
  }, 1000)
}
localStorage.setItem('harness_build_version', BUILD_VERSION)

const app = createApp(App)

// Element Plus 全局注册（含动态语言包 + 图标）
// auto-import 插件处理组件按需加载，此处仅配置全局选项
const elementPlusLocales: Record<string, any> = {
  'zh-CN': zhCn,
  'en-US': enUs,
}

app.use(ElementPlus, {
  locale: elementPlusLocales[getLocale()] || zhCn,
  size: 'default',
})

// 全局注册常用图标组件
const usedIcons = ['Plus', 'Search', 'List', 'Lightning', 'Document', 'DataLine', 'Paperclip', 'ArrowRight']
for (const name of usedIcons) {
  if (ElementPlusIconsVue[name]) {
    app.component(name, ElementPlusIconsVue[name])
  }
}

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
