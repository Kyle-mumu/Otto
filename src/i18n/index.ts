import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

const savedLang = localStorage.getItem('otto_lang') || 'zh-CN'

export const i18n = createI18n({
  legacy: false,
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
