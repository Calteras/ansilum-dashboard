import type {
  HoursInterval,
  StreetFoodOutlet,
  StreetFoodOverview,
} from './street-food.types'

/** Where the business stands, in the order the owner meets it. */
export type ConnectionState =
  | 'not_connected'
  | 'needs_outlet'
  | 'sending'
  | 'waiting_registration'
  | 'unreachable'
  | 'platform_error'
  | 'delayed'
  | 'connected'

/**
 * Derives the state from what the POS knows: whether it is linked, whether any outlet is
 * published, and whether the platform has ever accepted what was sent. A business that is linked
 * but not yet registered at the platform shows as waiting, because every delivery is refused
 * with 401 until the platform operator registers it.
 */
export function connectionState(overview: StreetFoodOverview): ConnectionState {
  const { link, delivery, outlets } = overview
  if (!link || link.status !== 'ACTIVE') return 'not_connected'
  if (!outlets.some((outlet) => outlet.enabled)) return 'needs_outlet'
  if (delivery?.lastDeliveredAt)
    return delivery.pending > 0 && delivery.lastError ? 'delayed' : 'connected'
  const error = delivery?.lastError
  if (!error) return 'sending'
  if (error === 'HTTP_401') return 'waiting_registration'
  if (error === 'NETWORK' || error === 'TIMEOUT') return 'unreachable'
  return 'platform_error'
}

/** How soon to look again: states that resolve by themselves are watched closely. */
export function refreshInterval(state: ConnectionState): number | false {
  switch (state) {
    case 'sending':
    case 'waiting_registration':
    case 'unreachable':
    case 'platform_error':
      return 5_000
    case 'delayed':
      return 15_000
    default:
      return false
  }
}

type UrlProblem = 'empty' | 'invalid' | 'insecure'

/** The platform's address: https, or plain http only for this machine. */
export function platformUrlProblem(value: string): UrlProblem | null {
  const text = value.trim()
  if (!text) return 'empty'
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return 'invalid'
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'invalid'
  if (url.username || url.password) return 'invalid'
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  return url.protocol === 'http:' && !local ? 'insecure' : null
}

/** The address as the POS stores it: scheme and host only. */
export function normalizePlatformUrl(value: string): string {
  return new URL(value.trim()).origin
}

/** The POS's own address, which the platform calls back. Taken from the API address. */
export function defaultPosAddress(
  apiUrl: string | undefined,
  fallback: string
) {
  try {
    return apiUrl ? new URL(apiUrl).origin : fallback
  } catch {
    return fallback
  }
}

interface RegistrationDetails {
  name: string
  posTenantId: string
  keyId: string
  secret: string
  posBaseUrl: string
}

export function registrationDetails(input: {
  name: string
  tenantId: string
  keyId: string
  secret: string
  posBaseUrl: string
}): RegistrationDetails {
  return {
    name: input.name,
    posTenantId: input.tenantId,
    keyId: input.keyId,
    secret: input.secret,
    posBaseUrl: input.posBaseUrl.trim().replace(/\/+$/, ''),
  }
}

/** The details as JSON, ready to paste into the platform's operator tool. */
export const registrationJson = (details: RegistrationDetails) =>
  JSON.stringify(details, null, 2)

const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`

/** A command the platform operator can run. The operator token stays theirs. */
export function registrationCurl(
  details: RegistrationDetails,
  platformUrl: string
) {
  return [
    `curl -X POST ${shellQuote(`${platformUrl.replace(/\/+$/, '')}/v1/admin/merchants`)} \\`,
    `  -H "Authorization: Bearer $ADMIN_API_TOKEN" -H 'Content-Type: application/json' \\`,
    `  -d ${shellQuote(JSON.stringify(details))}`,
  ].join('\n')
}

export type IssueCode =
  | 'PRICING_INVALID'
  | 'NO_LOCATION'
  | 'NO_HOURS'
  | 'DAY_NOT_OPEN'

interface OutletIssue {
  code: IssueCode
  tone: 'danger' | 'warning' | 'info'
}

/**
 * What would stop customers from finding or ordering from an outlet, in the order the owner
 * should fix it. These are the things the platform would otherwise silently leave out.
 */
export function outletIssues(outlet: StreetFoodOutlet): OutletIssue[] {
  const issues: OutletIssue[] = []
  if (!outlet.pricingValid)
    issues.push({ code: 'PRICING_INVALID', tone: 'danger' })
  if (
    outlet.locationMode === 'FIXED' &&
    (outlet.latitude == null || outlet.longitude == null)
  )
    issues.push({ code: 'NO_LOCATION', tone: 'warning' })
  if (outlet.onlineStatus === 'AUTO' && outlet.hours.length === 0)
    issues.push({ code: 'NO_HOURS', tone: 'warning' })
  if (outlet.locationMode === 'MOBILE' && !outlet.dayOpen)
    issues.push({ code: 'DAY_NOT_OPEN', tone: 'info' })
  return issues
}

// ---- opening hours -------------------------------------------------------

/** Monday first, as a week is read in Indonesia. The API counts from Sunday = 0. */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

interface Span {
  opensAt: string
  closesAt: string
}

interface DayHours {
  open: boolean
  spans: Span[]
}

export type WeekHours = Record<number, DayHours>

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export const defaultSpan = (): Span => ({ opensAt: '08:00', closesAt: '17:00' })

export function toWeek(hours: HoursInterval[]): WeekHours {
  const week: WeekHours = {}
  for (const day of DAY_ORDER) {
    const spans = hours
      .filter((h) => h.dayOfWeek === day)
      .map(({ opensAt, closesAt }) => ({ opensAt, closesAt }))
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
    week[day] = { open: spans.length > 0, spans }
  }
  return week
}

export function toIntervals(week: WeekHours): HoursInterval[] {
  return DAY_ORDER.flatMap((day) =>
    week[day].open
      ? week[day].spans.map((span) => ({ dayOfWeek: day, ...span }))
      : []
  )
}

export type HoursProblem = 'TIME' | 'SAME' | 'DUPLICATE' | 'EMPTY_DAY'

/** The first mistake the server would refuse, found before asking it. */
export function hoursProblem(
  week: WeekHours
): { day: number; problem: HoursProblem } | null {
  for (const day of DAY_ORDER) {
    const { open, spans } = week[day]
    if (!open) continue
    if (spans.length === 0) return { day, problem: 'EMPTY_DAY' }
    const seen = new Set<string>()
    for (const span of spans) {
      if (!TIME.test(span.opensAt) || !TIME.test(span.closesAt))
        return { day, problem: 'TIME' }
      if (span.opensAt === span.closesAt) return { day, problem: 'SAME' }
      if (seen.has(span.opensAt)) return { day, problem: 'DUPLICATE' }
      seen.add(span.opensAt)
    }
  }
  return null
}

export function copyDayToAll(week: WeekHours, from: number): WeekHours {
  const next: WeekHours = {}
  for (const day of DAY_ORDER)
    next[day] = {
      open: week[from].open,
      spans: week[from].spans.map((span) => ({ ...span })),
    }
  return next
}

/** "Mon–Fri 08:00–17:00 · Sat 09:00–14:00", merging neighbouring days with the same hours. */
export function summarizeHours(
  hours: HoursInterval[],
  /** Index 0 = Sunday. */
  dayNames: readonly string[]
): string {
  const week = toWeek(hours)
  const signature = (day: number) =>
    week[day].spans.map((s) => `${s.opensAt}–${s.closesAt}`).join(', ')
  const order: readonly number[] = DAY_ORDER
  const runs: { from: number; to: number; text: string }[] = []
  for (const day of order) {
    const text = signature(day)
    if (!text) continue
    const last = runs[runs.length - 1] as (typeof runs)[number] | undefined
    if (
      last &&
      last.text === text &&
      order.indexOf(last.to) === order.indexOf(day) - 1
    )
      last.to = day
    else runs.push({ from: day, to: day, text })
  }
  return runs
    .map(({ from, to, text }) =>
      from === to
        ? `${dayNames[from]} ${text}`
        : `${dayNames[from]}–${dayNames[to]} ${text}`
    )
    .join(' · ')
}
