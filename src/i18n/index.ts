import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import id from './locales/id'

export const SUPPORTED_LANGUAGES = ['en', 'id'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
}

function getInitialLanguage(): Language {
  const match = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/)
  if (match) {
    const lang = match[1] as Language
    if (SUPPORTED_LANGUAGES.includes(lang)) return lang
  }
  return 'id'
}

export const resources = {
  en: { translation: en },
  id: { translation: id },
} as const

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'id',
  interpolation: {
    escapeValue: false, // React already handles XSS
  },
  lng: getInitialLanguage(),
})

export default i18n
