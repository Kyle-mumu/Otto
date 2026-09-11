/**
 * Element Plus 全局配置
 * 主色: Otto (#E85A3D)
 * 配合 @element-plus/icons-vue 图标库
 */
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { App } from 'vue'

export function setupElementPlus(app: App) {
  // 注册 Element Plus（含中文语言包）
  app.use(ElementPlus, {
    locale: zhCn,
    size: 'default',
  })

  // 全局注册所有图标组件
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
}
