import {
  endOfDay,
  endOfMonth,
  format,
  isSameDay,
  isSameYear,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'

/** An inclusive calendar range: `from` at 00:00, `to` at 23:59:59.999. */
export interface DateSpan {
  from: Date
  to: Date
}

export type DatePresetId =
  | 'today'
  | 'yesterday'
  | 'last-7-days'
  | 'last-30-days'
  | 'this-month'
  | 'last-month'
  | 'last-90-days'

export const DATE_PRESET_IDS: DatePresetId[] = [
  'today',
  'yesterday',
  'last-7-days',
  'last-30-days',
  'this-month',
  'last-month',
  'last-90-days',
]

export function normalizeSpan(from: Date, to: Date): DateSpan {
  const [start, end] = from <= to ? [from, to] : [to, from]
  return { from: startOfDay(start), to: endOfDay(end) }
}

export function getPresetSpan(id: DatePresetId, now = new Date()): DateSpan {
  switch (id) {
    case 'today':
      return normalizeSpan(now, now)
    case 'yesterday':
      return normalizeSpan(subDays(now, 1), subDays(now, 1))
    case 'last-7-days':
      return normalizeSpan(subDays(now, 6), now)
    case 'last-30-days':
      return normalizeSpan(subDays(now, 29), now)
    case 'this-month':
      return normalizeSpan(startOfMonth(now), now)
    case 'last-month': {
      const lastMonth = subMonths(now, 1)
      return normalizeSpan(startOfMonth(lastMonth), endOfMonth(lastMonth))
    }
    case 'last-90-days':
      return normalizeSpan(subDays(now, 89), now)
  }
}

export function matchPreset(
  span: DateSpan,
  now = new Date()
): DatePresetId | null {
  return (
    DATE_PRESET_IDS.find((id) => {
      const preset = getPresetSpan(id, now)
      return isSameDay(preset.from, span.from) && isSameDay(preset.to, span.to)
    }) ?? null
  )
}

/** "17 Oct 2026", "01 – 17 Oct 2026", "28 Sep – 17 Oct 2026", "15 Dec 2025 – 10 Jan 2026". */
export function formatSpan(span: DateSpan): string {
  const { from, to } = span
  if (isSameDay(from, to)) return format(from, 'dd MMM yyyy')
  if (!isSameYear(from, to)) {
    return `${format(from, 'dd MMM yyyy')} – ${format(to, 'dd MMM yyyy')}`
  }
  if (from.getMonth() === to.getMonth()) {
    return `${format(from, 'dd')} – ${format(to, 'dd MMM yyyy')}`
  }
  return `${format(from, 'dd MMM')} – ${format(to, 'dd MMM yyyy')}`
}

/**
 * The exact instant, with its zone (`…Z`). A zone-less local time is read on
 * whatever clock the server runs (UTC in production), which pushed the browser's
 * "today" 7 hours late for a Jakarta outlet.
 */
export function toApiDateTime(date: Date): string {
  return date.toISOString()
}
