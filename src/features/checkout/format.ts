import i18n from '@/i18n'

function locale() {
  return (i18n.resolvedLanguage ?? i18n.language ?? 'id').startsWith('id')
    ? 'id-ID'
    : 'en-GB'
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(locale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat(locale(), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
