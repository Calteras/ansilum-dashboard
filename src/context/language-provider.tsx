import { createContext, useContext, useEffect, useState } from 'react'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import {
  SUPPORTED_LANGUAGES,
  type Language,
  LANGUAGE_LABELS,
} from '@/i18n'
import i18n from '@/i18n'

const LANGUAGE_COOKIE_NAME = 'lang'
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type LanguageContextType = {
  language: Language
  supportedLanguages: readonly Language[]
  languageLabels: Record<Language, string>
  setLanguage: (lang: Language) => void
  resetLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, _setLanguage] = useState<Language>(() => {
    const saved = getCookie(LANGUAGE_COOKIE_NAME) as Language | undefined
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved
    return 'id'
  })

  useEffect(() => { document.documentElement.lang = language }, [language])

  const setLanguage = (lang: Language) => {
    setCookie(LANGUAGE_COOKIE_NAME, lang, LANGUAGE_COOKIE_MAX_AGE)
    _setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const resetLanguage = () => {
    removeCookie(LANGUAGE_COOKIE_NAME)
    const detected: Language = 'id'
    _setLanguage(detected)
    i18n.changeLanguage(detected)
  }

  return (
    <LanguageContext
      value={{
        language,
        supportedLanguages: SUPPORTED_LANGUAGES,
        languageLabels: LANGUAGE_LABELS,
        setLanguage,
        resetLanguage,
      }}
    >
      {children}
    </LanguageContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
