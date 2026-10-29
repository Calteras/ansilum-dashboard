import { format } from 'date-fns'
import i18n from '@/i18n'
import { formatMoney } from '@/lib/format'
import { formatCount } from '@/lib/metrics'
import type {
  Decimal,
  PaymentMethod,
  PricingSettings,
  Promotion,
  PromotionRequest,
  PromotionRules,
  PromotionType,
  PromotionUseGroup,
  ServiceCharge,
  TaxConfig,
  TaxRequest,
  TaxRules,
} from '../api/pricing.types'

type Copy = (id: string, en: string) => string
type Json = Record<string, unknown>

export const DEFAULT_TIMEZONE = 'Asia/Jakarta'

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Percent with up to two decimals in the UI language: "11,5%" / "11.5%". */
export function formatRate(value: Decimal) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  const language = i18n.resolvedLanguage ?? i18n.language ?? 'id'
  return `${new Intl.NumberFormat(language.startsWith('id') ? 'id-ID' : 'en-US', { maximumFractionDigits: 2 }).format(n)}%`
}

/** Basis points as the server stores rates: 11.5% → 1150. */
const basisPoints = (value: Decimal) => Math.round(Number(value) * 100)

// ─── Settings ─────────────────────────────────────────────────────────────────

/** The pricing parts of a tenant configuration, with the server's defaults. */
export function readPricingSettings(config: unknown): PricingSettings {
  const settings =
    isObject(config) && isObject(config.customSettings)
      ? config.customSettings
      : {}
  const controls = isObject(settings.pricingControls)
    ? settings.pricingControls
    : {}
  const percent = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return {
    controls: {
      maxManualPercent: percent(controls.maxManualPercent) ?? 100,
      allowPriceOverride:
        typeof controls.allowPriceOverride === 'boolean'
          ? controls.allowPriceOverride
          : true,
      requireReason:
        typeof controls.requireReason === 'boolean'
          ? controls.requireReason
          : false,
    },
    registerTaxPercent: percent(settings.taxPercentage),
    registerServicePercent: percent(settings.serviceChargePercentage),
    timezone:
      typeof settings.timezone === 'string' && settings.timezone
        ? settings.timezone
        : DEFAULT_TIMEZONE,
  }
}

// ─── Dates ────────────────────────────────────────────────────────────────────

const toDateInput = (iso: string) => format(new Date(iso), 'yyyy-MM-dd')

/**
 * A date field as an instant: the start or the end of that local day. An
 * untouched field keeps the stored instant, so editing other fields of a
 * record created with a time of day does not move its window.
 */
export function dateToIso(
  date: string,
  edge: 'start' | 'end',
  original?: string | null
) {
  if (!date) return null
  if (original && toDateInput(original) === date) return original
  return new Date(
    `${date}T${edge === 'start' ? '00:00:00' : '23:59:59'}`
  ).toISOString()
}

const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** "HH:mm" to minutes; "00:00" as an end time means midnight, 1440. */
export function timeToMinutes(time: string, edge: 'start' | 'end') {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  const minutes = Number(match[1]) * 60 + Number(match[2])
  return edge === 'end' && minutes === 0 ? 1440 : minutes
}

/** Monday first, as Indonesian calendars show it. Values are JS weekdays. */
export const WEEK = [1, 2, 3, 4, 5, 6, 0]

export function weekdayLabel(day: number, copy: Copy) {
  return copy(
    ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][day],
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
  )
}

/** "Every day", "Mon–Fri" or "Mon, Wed, Sat". */
export function weekdaysLabel(days: number[], copy: Copy) {
  const ordered = WEEK.filter((d) => days.includes(d))
  if (ordered.length === 7) return copy('Setiap hari', 'Every day')
  const positions = ordered.map((d) => WEEK.indexOf(d))
  const contiguous = positions.every(
    (p, i) => i === 0 || p === positions[i - 1] + 1
  )
  if (contiguous && ordered.length >= 3)
    return `${weekdayLabel(ordered[0], copy)}–${weekdayLabel(ordered[ordered.length - 1], copy)}`
  return ordered.map((d) => weekdayLabel(d, copy)).join(', ')
}

function scheduleLabel(schedule: PromotionRules['schedule'], copy: Copy) {
  if (!schedule) return null
  return `${weekdaysLabel(schedule.weekdays, copy)} · ${minutesToTime(schedule.startMinute)}–${minutesToTime(schedule.endMinute)}`
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export function promotionTypeLabel(type: PromotionType, copy: Copy) {
  return {
    PERCENTAGE: copy('Persen', 'Percent off'),
    FIXED_AMOUNT: copy('Potongan harga', 'Amount off'),
    BUY_X_GET_Y: copy('Beli X gratis Y', 'Buy X get Y'),
    BUNDLE_PRICE: copy('Harga paket', 'Bundle price'),
  }[type]
}

export function paymentMethodLabel(method: PaymentMethod, copy: Copy) {
  return {
    CASH: copy('Tunai', 'Cash'),
    QRIS: 'QRIS',
    DEBIT_CARD: copy('Kartu debit', 'Debit card'),
    CREDIT_CARD: copy('Kartu kredit', 'Credit card'),
    E_WALLET: 'E-wallet',
    BANK_TRANSFER: copy('Transfer bank', 'Bank transfer'),
    OTHER: copy('Lainnya', 'Other'),
  }[method]
}

/** What the customer gets, in one line: "10% · maks. Rp20.000". */
export function promotionBenefit(promotion: Promotion, copy: Copy) {
  const value = Number(promotion.value)
  const rules = promotion.rules ?? {}
  switch (promotion.discountType) {
    case 'PERCENTAGE':
      return promotion.maxDiscount != null
        ? copy(
            `${formatRate(value)} · maks. ${formatMoney(promotion.maxDiscount)}`,
            `${formatRate(value)} · up to ${formatMoney(promotion.maxDiscount)}`
          )
        : formatRate(value)
    case 'FIXED_AMOUNT':
      return copy(`Potongan ${formatMoney(value)}`, `${formatMoney(value)} off`)
    case 'BUY_X_GET_Y':
      return value >= 100
        ? copy(
            `Beli ${rules.buyQuantity} gratis ${rules.getQuantity}`,
            `Buy ${rules.buyQuantity}, get ${rules.getQuantity} free`
          )
        : copy(
            `Beli ${rules.buyQuantity}, ${rules.getQuantity} berikutnya diskon ${formatRate(value)}`,
            `Buy ${rules.buyQuantity}, get ${rules.getQuantity} at ${formatRate(value)} off`
          )
    case 'BUNDLE_PRICE':
      return copy(
        `${rules.bundleQuantity} item ${formatMoney(value)}`,
        `${rules.bundleQuantity} for ${formatMoney(value)}`
      )
  }
}

/** Conditions worth reading in a list row, most important first. */
export function promotionConditions(promotion: Promotion, copy: Copy) {
  const rules = promotion.rules ?? {}
  const parts: string[] = [
    rules.automatic
      ? copy('Otomatis', 'Automatic')
      : copy(`Kode ${promotion.code}`, `Code ${promotion.code}`),
  ]
  if (promotion.minPurchase != null && Number(promotion.minPurchase) > 0)
    parts.push(
      copy(
        `min. ${formatMoney(promotion.minPurchase)}`,
        `min. ${formatMoney(promotion.minPurchase)}`
      )
    )
  const schedule = scheduleLabel(rules.schedule, copy)
  if (schedule) parts.push(schedule)
  if (rules.firstPurchaseOnly)
    parts.push(copy('Pembelian pertama', 'First purchase'))
  if (rules.paymentMethods?.length) {
    const methods = rules.paymentMethods
      .map((m) => paymentMethodLabel(m, copy))
      .join(', ')
    parts.push(copy(`Bayar ${methods}`, `Paid by ${methods}`))
  }
  const targets = [
    rules.outletIds?.length &&
      copy(
        `${rules.outletIds.length} gerai`,
        `${rules.outletIds.length} outlets`
      ),
    rules.categoryIds?.length &&
      copy(
        `${rules.categoryIds.length} kategori`,
        `${rules.categoryIds.length} categories`
      ),
    rules.productIds?.length &&
      copy(
        `${rules.productIds.length} produk`,
        `${rules.productIds.length} products`
      ),
  ].filter(Boolean)
  if (targets.length) parts.push(targets.join(', '))
  if (rules.stackable === false)
    parts.push(copy('Tidak digabung', 'Not combined'))
  return parts.join(' · ')
}

export type PromotionState =
  | 'running'
  | 'scheduled'
  | 'ended'
  | 'usedUp'
  | 'inactive'

/** Whether a sale could receive the promotion now, before its conditions. */
export function promotionState(
  promotion: Pick<
    Promotion,
    'isActive' | 'validFrom' | 'validUntil' | 'usageLimit' | 'usedCount'
  >,
  now = Date.now()
): PromotionState {
  if (!promotion.isActive) return 'inactive'
  if (Date.parse(promotion.validFrom) > now) return 'scheduled'
  if (promotion.validUntil && Date.parse(promotion.validUntil) < now)
    return 'ended'
  if (
    promotion.usageLimit !== null &&
    promotion.usedCount >= promotion.usageLimit
  )
    return 'usedUp'
  return 'running'
}

export function promotionStateLabel(state: PromotionState, copy: Copy) {
  return {
    running: copy('Berjalan', 'Running'),
    scheduled: copy('Terjadwal', 'Scheduled'),
    ended: copy('Berakhir', 'Ended'),
    usedUp: copy('Kuota habis', 'Used up'),
    inactive: copy('Nonaktif', 'Inactive'),
  }[state]
}

/** Upper-case letters and digits from a name, as a starting code. */
export function suggestCode(name: string) {
  return name
    .normalize('NFKD')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
}

/** The form edits a fixed set of rule keys; the rest are kept as stored. */
const KEPT_PROMOTION_RULES = [
  'customerIds',
  'customerTags',
  'channels',
] as const

export interface PromotionFormValues {
  name: string
  code: string
  description: string
  type: PromotionType
  /** Percent, rupiah or bundle price, by type. */
  value: string
  buyQuantity: string
  getQuantity: string
  bundleQuantity: string
  maxDiscount: string
  minPurchase: string
  validFrom: string
  validUntil: string
  scheduled: boolean
  weekdays: number[]
  startTime: string
  endTime: string
  usageLimit: string
  perCustomerLimit: string
  budgetAmount: string
  outletIds: string[]
  categoryIds: string[]
  productIds: string[]
  automatic: boolean
  stackable: boolean
  priority: string
  firstPurchaseOnly: boolean
  restoreOnRefund: boolean
  paymentMethods: PaymentMethod[]
}

const text = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)

export function promotionFormDefaults(
  promotion: Promotion | undefined,
  today: string
): PromotionFormValues {
  const rules = promotion?.rules ?? {}
  return {
    name: promotion?.name ?? '',
    code: promotion?.code ?? '',
    description: promotion?.description ?? '',
    type: promotion?.discountType ?? 'PERCENTAGE',
    value: promotion ? String(Number(promotion.value)) : '',
    buyQuantity: text(rules.buyQuantity),
    getQuantity: text(rules.getQuantity),
    bundleQuantity: text(rules.bundleQuantity),
    maxDiscount:
      promotion?.maxDiscount != null
        ? String(Number(promotion.maxDiscount))
        : '',
    minPurchase:
      promotion?.minPurchase != null
        ? String(Number(promotion.minPurchase))
        : '',
    validFrom: promotion ? toDateInput(promotion.validFrom) : today,
    validUntil: promotion?.validUntil ? toDateInput(promotion.validUntil) : '',
    scheduled: !!rules.schedule,
    weekdays: rules.schedule?.weekdays ?? [1, 2, 3, 4, 5],
    startTime: rules.schedule
      ? minutesToTime(rules.schedule.startMinute)
      : '14:00',
    endTime: rules.schedule
      ? minutesToTime(rules.schedule.endMinute % 1440)
      : '17:00',
    usageLimit: text(promotion?.usageLimit),
    perCustomerLimit: text(rules.perCustomerLimit),
    budgetAmount: text(rules.budgetAmount),
    outletIds: rules.outletIds ?? [],
    categoryIds: rules.categoryIds ?? [],
    productIds: rules.productIds ?? [],
    automatic: rules.automatic ?? false,
    stackable: rules.stackable ?? true,
    priority: text(rules.priority),
    firstPurchaseOnly: rules.firstPurchaseOnly ?? false,
    restoreOnRefund: rules.restoreOnRefund ?? false,
    paymentMethods: rules.paymentMethods ?? [],
  }
}

/** "12,5" and "12.5" are both twelve and a half. */
export const parseDecimal = (value: string) => Number(value.replace(',', '.'))
const optionalNumber = (value: string) => (value === '' ? null : Number(value))
const optionalInteger = (value: string) =>
  value === '' ? undefined : Number(value)

/** The request body for a create or a full edit. */
export function promotionRequest(
  values: PromotionFormValues,
  original: Promotion | undefined,
  timezone: string
): PromotionRequest {
  const stored = original?.rules ?? {}
  const rules: PromotionRules = {}
  for (const key of KEPT_PROMOTION_RULES)
    if (stored[key] !== undefined) Object.assign(rules, { [key]: stored[key] })
  if (values.outletIds.length) rules.outletIds = values.outletIds
  if (values.categoryIds.length) rules.categoryIds = values.categoryIds
  if (values.productIds.length) rules.productIds = values.productIds
  if (values.automatic) {
    rules.automatic = true
    rules.priority = optionalInteger(values.priority)
  }
  if (!values.stackable) rules.stackable = false
  if (values.firstPurchaseOnly) rules.firstPurchaseOnly = true
  if (values.restoreOnRefund) rules.restoreOnRefund = true
  if (values.paymentMethods.length) rules.paymentMethods = values.paymentMethods
  rules.perCustomerLimit = optionalInteger(values.perCustomerLimit)
  if (values.budgetAmount !== '')
    rules.budgetAmount = Number(values.budgetAmount)
  if (values.type === 'BUY_X_GET_Y') {
    rules.buyQuantity = Number(values.buyQuantity)
    rules.getQuantity = Number(values.getQuantity)
  }
  if (values.type === 'BUNDLE_PRICE')
    rules.bundleQuantity = Number(values.bundleQuantity)
  if (values.scheduled)
    rules.schedule = {
      timezone: stored.schedule?.timezone ?? timezone,
      weekdays: WEEK.filter((d) => values.weekdays.includes(d)),
      startMinute: timeToMinutes(values.startTime, 'start')!,
      endMinute: timeToMinutes(values.endTime, 'end')!,
    }
  // Unset keys mean "no condition" to the server; drop undefined ones.
  for (const key of Object.keys(rules) as (keyof PromotionRules)[])
    if (rules[key] === undefined) delete rules[key]

  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    description: values.description.trim() || null,
    discountType: values.type,
    value: parseDecimal(values.value),
    minPurchase: optionalNumber(values.minPurchase),
    maxDiscount:
      values.type === 'PERCENTAGE' ? optionalNumber(values.maxDiscount) : null,
    validFrom: dateToIso(values.validFrom, 'start', original?.validFrom)!,
    validUntil: dateToIso(values.validUntil, 'end', original?.validUntil),
    usageLimit: optionalNumber(values.usageLimit),
    rules,
  }
}

interface UsageSummary {
  redeemed: { count: number; amount: number }
  reserved: { count: number; amount: number }
  released: number
  /** Older uses whose discount amount was never recorded. */
  unknownBenefit: number
  /** What counts against a budget: redeemed plus reserved amounts. */
  committed: number
}

export function usageSummary(uses: PromotionUseGroup[]): UsageSummary {
  const of = (status: PromotionUseGroup['status']) =>
    uses.filter((u) => u.status === status)
  const count = (rows: PromotionUseGroup[]) =>
    rows.reduce((sum, u) => sum + u._count._all, 0)
  const amount = (rows: PromotionUseGroup[]) =>
    rows
      .filter((u) => !u.benefitUnknown)
      .reduce((sum, u) => sum + Number(u._sum.amount ?? 0), 0)
  const redeemed = {
    count: count(of('REDEEMED')),
    amount: amount(of('REDEEMED')),
  }
  const reserved = {
    count: count(of('RESERVED')),
    amount: amount(of('RESERVED')),
  }
  return {
    redeemed,
    reserved,
    released: count(of('RELEASED')),
    unknownBenefit: count(
      uses.filter((u) => u.benefitUnknown && u.status !== 'RELEASED')
    ),
    committed: redeemed.amount + reserved.amount,
  }
}

export const formatUses = (count: number) => formatCount(count)

// ─── Taxes ────────────────────────────────────────────────────────────────────

export type ChargeState = 'active' | 'scheduled' | 'ended' | 'inactive'

export function taxState(tax: TaxConfig, now = Date.now()): ChargeState {
  if (!tax.isActive) return 'inactive'
  const rules = tax.rules ?? {}
  if (rules.validFrom && Date.parse(rules.validFrom) > now) return 'scheduled'
  if (rules.validUntil && Date.parse(rules.validUntil) < now) return 'ended'
  return 'active'
}

export function chargeStateLabel(state: ChargeState, copy: Copy) {
  return {
    active: copy('Aktif', 'Active'),
    scheduled: copy('Terjadwal', 'Scheduled'),
    ended: copy('Berakhir', 'Ended'),
    inactive: copy('Nonaktif', 'Inactive'),
  }[state]
}

/** Limited to some outlets, products or categories, or to a date range. */
function isScopedTax(tax: TaxConfig) {
  const r = tax.rules ?? {}
  return !!(
    r.outletIds?.length ||
    r.productIds?.length ||
    r.categoryIds?.length ||
    r.exemptProductIds?.length ||
    r.validFrom ||
    r.validUntil
  )
}

export interface TaxFormValues {
  name: string
  rate: string
  inclusive: boolean
  taxService: boolean
  outletIds: string[]
  categoryIds: string[]
  productIds: string[]
  exemptProductIds: string[]
  validFrom: string
  validUntil: string
}

export function taxFormDefaults(tax?: TaxConfig): TaxFormValues {
  const rules = tax?.rules ?? {}
  return {
    name: tax?.name ?? '',
    rate: tax ? String(Number(tax.rate)) : '',
    inclusive: tax?.isInclusive ?? false,
    taxService: rules.taxService ?? false,
    outletIds: rules.outletIds ?? [],
    categoryIds: rules.categoryIds ?? [],
    productIds: rules.productIds ?? [],
    exemptProductIds: rules.exemptProductIds ?? [],
    validFrom: rules.validFrom ? toDateInput(rules.validFrom) : '',
    validUntil: rules.validUntil ? toDateInput(rules.validUntil) : '',
  }
}

export function taxRequest(
  values: TaxFormValues,
  original?: TaxConfig
): TaxRequest {
  const stored = original?.rules ?? {}
  const rules: TaxRules = {}
  if (values.outletIds.length) rules.outletIds = values.outletIds
  if (values.categoryIds.length) rules.categoryIds = values.categoryIds
  if (values.productIds.length) rules.productIds = values.productIds
  if (values.exemptProductIds.length)
    rules.exemptProductIds = values.exemptProductIds
  const from = dateToIso(values.validFrom, 'start', stored.validFrom)
  const until = dateToIso(values.validUntil, 'end', stored.validUntil)
  if (from) rules.validFrom = from
  if (until) rules.validUntil = until
  // An included tax cannot also be charged on an added service charge.
  if (values.taxService && !values.inclusive) rules.taxService = true
  return {
    name: values.name.trim(),
    rate: parseDecimal(values.rate),
    isInclusive: values.inclusive,
    rules,
  }
}

// ─── Worked example ───────────────────────────────────────────────────────────

/** Half-up integer ratio, as the server's money.ratio. */
function ratio(amount: number, numerator: number, denominator: number) {
  return Number(
    (BigInt(amount) * BigInt(numerator) * 2n + BigInt(denominator)) /
      (BigInt(denominator) * 2n)
  )
}
const share = (amount: number, rate: number) => ratio(amount, rate, 10000)

/** Largest remainder allocation; input order breaks ties, as on the server. */
export function allocate(amount: number, weights: number[]) {
  const total = weights.reduce((a, b) => a + BigInt(b), 0n)
  if (total === 0n) return weights.map(() => 0)
  const rows = weights.map((w, i) => ({
    i,
    value: Number((BigInt(amount) * BigInt(w)) / total),
    remainder: (BigInt(amount) * BigInt(w)) % total,
  }))
  let left = amount - rows.reduce((s, r) => s + r.value, 0)
  for (const row of [...rows].sort((a, b) =>
    a.remainder === b.remainder ? a.i - b.i : a.remainder > b.remainder ? -1 : 1
  )) {
    if (left <= 0) break
    row.value++
    left--
  }
  return rows.map((r) => r.value)
}

interface PolicyTax {
  id: string
  name: string
  /** Basis points. */
  rate: number
  inclusive: boolean
  taxService: boolean
}
interface PolicyCharge {
  id: string
  name: string
  rate: number
}

interface PreviewPolicy {
  taxes: PolicyTax[]
  services: PolicyCharge[]
  /** Active here but limited to some products or categories: not in the example. */
  productTaxes: TaxConfig[]
  /** The older single rates apply because no named rows exist yet. */
  legacyTax: boolean
  legacyService: boolean
}

/**
 * What a sale at this outlet uses now, as the server's loadPolicy: active
 * named rows in their window and outlets, or the older single rates when no
 * row of that kind exists at all.
 */
export function previewPolicy({
  taxes,
  services,
  settings,
  outletId,
  now = Date.now(),
}: {
  taxes: TaxConfig[]
  services: ServiceCharge[]
  settings: PricingSettings | undefined
  outletId: string | null
  now?: number
}): PreviewPolicy {
  const inForce = taxes.filter((t) => {
    const r = t.rules ?? {}
    return (
      taxState(t, now) === 'active' &&
      (!r.outletIds?.length ||
        (outletId !== null && r.outletIds.includes(outletId)))
    )
  })
  const general = inForce.filter(
    (t) => !t.rules?.productIds?.length && !t.rules?.categoryIds?.length
  )
  const policy: PreviewPolicy = {
    taxes: general.map((t) => ({
      id: t.id,
      name: t.name,
      rate: basisPoints(t.rate),
      inclusive: t.isInclusive,
      taxService: !!t.rules?.taxService,
    })),
    services: services
      .filter((s) => s.isActive)
      .map((s) => ({ id: s.id, name: s.name, rate: basisPoints(s.rate) })),
    productTaxes: inForce.filter((t) => !general.includes(t)),
    legacyTax: false,
    legacyService: false,
  }
  if (!taxes.length && settings?.registerTaxPercent != null) {
    policy.legacyTax = true
    policy.taxes.push({
      id: 'legacy-tax',
      name: 'Pajak',
      rate: basisPoints(settings.registerTaxPercent),
      inclusive: false,
      taxService: false,
    })
  }
  if (!services.length && settings?.registerServicePercent != null) {
    policy.legacyService = true
    policy.services.push({
      id: 'legacy-service',
      name: 'Biaya layanan',
      rate: basisPoints(settings.registerServicePercent),
    })
  }
  return policy
}

interface BillPreview {
  /** Menu price total; included tax is inside it. */
  subtotal: number
  includedTax: { id: string; name: string; rate: number; amount: number }[]
  services: { id: string; name: string; rate: number; amount: number }[]
  addedTax: { id: string; name: string; rate: number; amount: number }[]
  total: number
}

/** One undiscounted line priced like the server's engine (pricing v2). */
export function billPreview(
  policy: PreviewPolicy,
  subtotal: number
): BillPreview {
  const gross = Math.round(subtotal * 100)
  const inclusive = policy.taxes.filter((t) => t.inclusive)
  const inclusiveRate = inclusive.reduce((s, t) => s + t.rate, 0)
  const included = ratio(gross, inclusiveRate, 10000 + inclusiveRate)
  const includedParts = allocate(
    included,
    inclusive.map((t) => t.rate)
  )
  const net = gross - included
  const services = policy.services.map((s) => ({
    ...s,
    amount: share(net, s.rate),
  }))
  const service = services.reduce((s, x) => s + x.amount, 0)
  const added = policy.taxes
    .filter((t) => !t.inclusive)
    .map((t) => ({
      ...t,
      amount: share(net + (t.taxService ? service : 0), t.rate),
    }))
  const major = (minor: number) => minor / 100
  return {
    subtotal: major(gross),
    includedTax: inclusive.map((t, i) => ({
      id: t.id,
      name: t.name,
      rate: t.rate,
      amount: major(includedParts[i]),
    })),
    services: services.map((s) => ({ ...s, amount: major(s.amount) })),
    addedTax: added.map((t) => ({
      id: t.id,
      name: t.name,
      rate: t.rate,
      amount: major(t.amount),
    })),
    total: major(gross + service + added.reduce((s, t) => s + t.amount, 0)),
  }
}

/**
 * What a register on the current app charges: one added tax and one service
 * rate, from the settings the server keeps equal to the named rows.
 */
export function registerRates(settings: PricingSettings | undefined) {
  return {
    tax: settings?.registerTaxPercent ?? 0,
    service: settings?.registerServicePercent ?? 0,
  }
}

/**
 * A register on the current app adds one tax rate to every item, always, so
 * only active added taxes with no outlet, product, category or date limits
 * reach it (the server's registerRate). Included tax is already in prices.
 */
export const reachesRegister = (tax: TaxConfig) =>
  tax.isActive && !tax.isInclusive && !isScopedTax(tax)

/** The same undiscounted line on a current register: both rates on the price. */
export function registerBill(
  subtotal: number,
  rates: { tax: number; service: number }
) {
  const gross = Math.round(subtotal * 100)
  const tax = share(gross, basisPoints(rates.tax))
  const service = share(gross, basisPoints(rates.service))
  return {
    tax: tax / 100,
    service: service / 100,
    total: (gross + tax + service) / 100,
  }
}

/** The sums the server mirrors to registers (see registerRates). */
export function namedRegisterRates(
  taxes: TaxConfig[],
  services: ServiceCharge[]
) {
  const sum = (rates: Decimal[]) =>
    rates.reduce<number>((s, r) => s + basisPoints(r), 0) / 100
  return {
    tax: taxes.length
      ? sum(taxes.filter(reachesRegister).map((t) => t.rate))
      : null,
    service: services.length
      ? sum(services.filter((s) => s.isActive).map((s) => s.rate))
      : null,
  }
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/** Server messages in the UI language; unknown ones pass through. */
export function pricingErrorMessage(message: string, copy: Copy) {
  const known: [RegExp, string, string][] = [
    [
      /Promotion code already exists/,
      'Kode ini sudah dipakai promo lain.',
      'Another promotion already uses this code.',
    ],
    [
      /Invalid promotion code|Code must be uppercase/,
      'Kode 3–20 karakter: huruf, angka, tanda - atau _.',
      'Codes are 3–20 letters, digits, - or _.',
    ],
    [
      /Limit is below reserved and redeemed uses/,
      'Kuota tidak boleh lebih kecil dari pemakaian yang sudah terjadi atau sedang ditahan.',
      'The limit cannot be below uses already redeemed or on hold.',
    ],
    [
      /Reconcile legacy campaign benefits/,
      'Promo ini punya pemakaian lama tanpa catatan nilai potongan, jadi anggaran belum bisa dipasang.',
      'This promotion has older uses with no recorded discount amount, so a budget cannot be set yet.',
    ],
    [
      /Budget is below existing commitments/,
      'Anggaran lebih kecil dari potongan yang sudah diberikan atau sedang ditahan.',
      'The budget is below discounts already given or on hold.',
    ],
    [
      /Invalid validity interval/,
      'Tanggal selesai harus sesudah tanggal mulai.',
      'The end date must be after the start date.',
    ],
    [
      /Invalid tenant-scoped/,
      'Sebagian gerai, kategori, atau produk yang dipilih sudah tidak ada.',
      'Some selected outlets, categories or products no longer exist.',
    ],
    [
      /Tax name already exists/,
      'Sudah ada pajak dengan nama ini.',
      'A tax with this name already exists.',
    ],
    [
      /Service charge name already exists/,
      'Sudah ada biaya layanan dengan nama ini.',
      'A service charge with this name already exists.',
    ],
    [
      /Combined tax rate exceeds 100%/,
      'Jumlah tarif pajak aktif tidak boleh lebih dari 100%.',
      'Active tax rates cannot add up to more than 100%.',
    ],
    [
      /Combined service rate exceeds 100%/,
      'Jumlah tarif biaya layanan aktif tidak boleh lebih dari 100%.',
      'Active service charge rates cannot add up to more than 100%.',
    ],
    [
      /Included tax cannot also tax an added service charge/,
      'Pajak yang sudah termasuk harga tidak bisa dikenakan pada biaya layanan.',
      'A tax included in prices cannot also be charged on the service charge.',
    ],
    [
      /Percentage cannot exceed 100/,
      'Persentase paling besar 100.',
      'Percentages cannot exceed 100.',
    ],
    [
      /at most two decimals/,
      'Gunakan paling banyak dua angka desimal.',
      'Use at most two decimal places.',
    ],
  ]
  const match = known.find(([pattern]) => pattern.test(message))
  return match ? copy(match[1], match[2]) : message
}
