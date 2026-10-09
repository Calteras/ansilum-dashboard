import i18n from '@/i18n'

type Amount = number | string
function numberLocale(language = i18n.resolvedLanguage ?? i18n.language ?? 'id') {
  return language.startsWith('id') ? 'id-ID' : 'en-US'
}

export function formatMoney(amount: Amount, language?: string): string {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  const number = new Intl.NumberFormat(numberLocale(language), { maximumFractionDigits: 0 }).format(Math.abs(value))
  return `${value < 0 ? '−' : ''}Rp${number}`
}

export function formatCompactMoney(amount: Amount, language = i18n.resolvedLanguage ?? i18n.language ?? 'id'): string {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  const id = language.startsWith('id')
  const absolute = Math.abs(value)
  const units: [number, string][] = [[1e9, id ? ' miliar' : 'B'], [1e6, id ? ' jt' : 'M'], [1e3, id ? ' rb' : 'K']]
  const unit = units.find(([threshold]) => absolute >= threshold)
  if (!unit) return formatMoney(value, language)
  const number = new Intl.NumberFormat(numberLocale(language), { maximumFractionDigits: 1 }).format(absolute / unit[0])
  return `${value < 0 ? '−' : ''}Rp${number}${unit[1]}`
}

export function formatMoneyChange(amount: number, language?: string): string {
  if (amount === 0) return (language ?? i18n.language ?? 'id').startsWith('id') ? 'Tetap' : 'Same'
  return `${amount > 0 ? '+' : ''}${formatMoney(amount, language)}`
}
