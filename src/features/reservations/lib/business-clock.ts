import { DEFAULT_TIMEZONE } from '@/features/sale-pricing/lib/pricing'

/** An instant as the business clock shows it. */
export type WallClock = {
  /** "yyyy-MM-dd" */
  day: string
  /** "HH:mm" */
  time: string
  /** Minutes on the business clock, comparable with `wallMinutes`. */
  minutes: number
}

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(timeZone: string) {
  let found = formatters.get(timeZone)
  if (!found) {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }
    try {
      found = new Intl.DateTimeFormat('en-CA', { ...options, timeZone })
    } catch {
      // The server ignores an unknown zone in settings too.
      found = new Intl.DateTimeFormat('en-CA', {
        ...options,
        timeZone: DEFAULT_TIMEZONE,
      })
    }
    formatters.set(timeZone, found)
  }
  return found
}

/** A day and time read on the business clock, as minutes. */
export function wallMinutes(day: string, time: string) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  const t = /^(\d{2}):(\d{2})$/.exec(time)
  if (!d || !t) return null
  return Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]) / 60_000
}

/**
 * Where an instant falls on the business clock. The server places booking
 * times on this clock, so the console shows and compares them on it too,
 * whatever zone the browser runs in.
 */
export function wallClock(
  at: string | Date,
  timeZone: string
): WallClock | null {
  const date = typeof at === 'string' ? new Date(at) : at
  if (!Number.isFinite(date.getTime())) return null
  const parts = Object.fromEntries(
    formatter(timeZone)
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  )
  const day = `${parts.year}-${parts.month}-${parts.day}`
  const time = `${parts.hour}:${parts.minute}`
  return { day, time, minutes: wallMinutes(day, time) ?? 0 }
}

/** The calendar day a "yyyy-MM-dd" names, as a local date for date pickers. */
export function dayDate(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}
