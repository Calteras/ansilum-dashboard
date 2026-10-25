import { format, formatDistanceToNowStrict } from 'date-fns'
import { enUS, id as idLocale } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { useHasAnyRole } from '@/features/auth/hooks/use-auth'

/** Dates in the UI language: "25 Okt 2026" / "25 Oct 2026". */
export function useLoyaltyDates() {
  const { i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'id').startsWith(
    'id'
  )
    ? idLocale
    : enUS
  return {
    date: (iso: string) => format(new Date(iso), 'd MMM yyyy', { locale }),
    dateTime: (iso: string) =>
      format(new Date(iso), 'd MMM yyyy, HH:mm', { locale }),
    ago: (iso: string) =>
      formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale }),
  }
}

/** Who may do what; mirrors the API role matrix (docs 03-API §E). */
export function useCustomerPermissions() {
  return {
    canManage: useHasAnyRole(['OWNER', 'ADMIN']),
    canRestore: useHasAnyRole(['OWNER']),
  }
}
