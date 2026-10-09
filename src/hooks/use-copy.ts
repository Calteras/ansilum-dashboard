import { useTranslation } from 'react-i18next'

/** For small, self-contained UI copy. Larger feature dictionaries live in i18n/locales. */
export function useCopy() {
  const { i18n } = useTranslation()
  const isIndonesian = (i18n.resolvedLanguage ?? i18n.language ?? 'id').startsWith('id')
  return (id: string, en: string) => isIndonesian ? id : en
}
