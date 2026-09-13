import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

const savedLang = localStorage.getItem('otto_lang') || 'zh-CN'

export const i18n = createI18n({
  legacy: false,
  // jit:true —— 消息由 @intlify/unplugin-vue-i18n 在构建期预编译为 AST 函数，
  // 运行时不再走 message compiler 的 new Function()（生产 CSP 无 'unsafe-eval'，
  // 否则会被拒并导致 MainLayout 渲染中断 → 整窗白）。
  jit: true,
  locale: savedLang,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export function setLocale(lang: 'zh-CN' | 'en-US') {
  i18n.global.locale.value = lang
  localStorage.setItem('otto_lang', lang)
  document.querySelector('html')?.setAttribute('lang', lang)
}

export function getLocale(): 'zh-CN' | 'en-US' {
  return (i18n.global.locale.value as 'zh-CN' | 'en-US') || 'zh-CN'
}
