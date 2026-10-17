import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  max,
  min,
  parseISO,
  startOfDay,
  subDays,
  subMonths,
  subYears,
} from 'date-fns'
import type { DateSpan } from '@/lib/date-range'
import { percentChange } from '@/lib/metrics'
import type { Transaction } from '../api/dashboard.types'

export type ComparisonMode =
  | 'previous-period'
  | 'previous-month'
  | 'previous-year'
  | 'none'
export type SalesInterval = 'daily' | 'weekly' | 'monthly'
export type SalesMeasure = 'sales' | 'orders' | 'averageOrder'

const WEEK_OPTIONS = { weekStartsOn: 1 } as const

// ─── Comparison ───────────────────────────────────────────────────────────────

export function getComparisonSpan(
  span: DateSpan,
  mode: ComparisonMode
): DateSpan | null {
  const from = startOfDay(span.from)
  const to = startOfDay(span.to)
  switch (mode) {
    case 'previous-period': {
      const days = differenceInCalendarDays(to, from) + 1
      const previousTo = subDays(from, 1)
      return { from: subDays(previousTo, days - 1), to: endOfDay(previousTo) }
    }
    case 'previous-month':
      return { from: subMonths(from, 1), to: endOfDay(subMonths(to, 1)) }
    case 'previous-year':
      return { from: subYears(from, 1), to: endOfDay(subYears(to, 1)) }
    case 'none':
      return null
  }
}

/** A baseline that overlaps the current range would compare data with itself. */
export function isComparisonAvailable(
  span: DateSpan,
  mode: ComparisonMode
): boolean {
  const comparison = getComparisonSpan(span, mode)
  return comparison === null || comparison.to < startOfDay(span.from)
}

// ─── Series ───────────────────────────────────────────────────────────────────

export interface SalesBucket {
  start: Date
  end: Date
}

export interface SalesPoint extends SalesBucket {
  sales: number
  netSales: number
  orders: number
}

type SeriesTransaction = Pick<
  Transaction,
  'transactionDate' | 'grandTotal' | 'discountAmount'
>

/** Every bucket in the range, so days without sales show as zero rather than vanish. */
export function buildBuckets(
  span: DateSpan,
  interval: SalesInterval
): SalesBucket[] {
  const from = startOfDay(span.from)
  const to = endOfDay(span.to)
  const range = { start: from, end: to }
  const starts =
    interval === 'daily'
      ? eachDayOfInterval(range)
      : interval === 'weekly'
        ? eachWeekOfInterval(range, WEEK_OPTIONS)
        : eachMonthOfInterval(range)

  return starts.map((start) => {
    const naturalEnd =
      interval === 'daily'
        ? endOfDay(start)
        : interval === 'weekly'
          ? endOfWeek(start, WEEK_OPTIONS)
          : endOfMonth(start)
    return { start: max([start, from]), end: min([naturalEnd, to]) }
  })
}

function bucketIndex(date: Date, from: Date, interval: SalesInterval) {
  if (interval === 'daily') return differenceInCalendarDays(date, from)
  if (interval === 'weekly') {
    return differenceInCalendarWeeks(date, from, WEEK_OPTIONS)
  }
  return differenceInCalendarMonths(date, from)
}

/**
 * Net sales mirror the summary endpoint: grand total less discounts. Pass only
 * CLOSED transactions so the series reconciles with the summary totals.
 */
export function aggregateSales(
  transactions: SeriesTransaction[],
  span: DateSpan,
  interval: SalesInterval
): SalesPoint[] {
  const from = startOfDay(span.from)
  const points: SalesPoint[] = buildBuckets(span, interval).map((bucket) => ({
    ...bucket,
    sales: 0,
    netSales: 0,
    orders: 0,
  }))

  for (const tx of transactions) {
    const date = parseISO(tx.transactionDate)
    if (Number.isNaN(date.getTime())) continue
    const point = points[bucketIndex(date, from, interval)]
    if (!point) continue
    const total = Number(tx.grandTotal) || 0
    point.sales += total
    point.netSales += total - (Number(tx.discountAmount) || 0)
    point.orders += 1
  }

  return points
}

export function measureValue(
  point: SalesPoint,
  measure: SalesMeasure
): number | null {
  if (measure === 'sales') return point.sales
  if (measure === 'orders') return point.orders
  return point.orders > 0 ? point.netSales / point.orders : null
}

export interface SeriesSummary {
  /** Mean per bucket for totals; the period's average order value for `averageOrder`. */
  average: number | null
  peak: { point: SalesPoint; value: number } | null
  /** The most recent bucket that has fully elapsed, against the one before it. */
  lastComplete: {
    point: SalesPoint
    value: number | null
    change: number | null
  } | null
  activeBuckets: number
  totalBuckets: number
}

export function summarizeSeries(
  points: SalesPoint[],
  measure: SalesMeasure,
  now = new Date()
): SeriesSummary {
  const totals = points.reduce(
    (acc, point) => ({
      sales: acc.sales + point.sales,
      netSales: acc.netSales + point.netSales,
      orders: acc.orders + point.orders,
    }),
    { sales: 0, netSales: 0, orders: 0 }
  )

  let average: number | null = null
  if (measure === 'averageOrder') {
    average = totals.orders > 0 ? totals.netSales / totals.orders : null
  } else if (points.length > 0) {
    average =
      (measure === 'sales' ? totals.sales : totals.orders) / points.length
  }

  let peak: SeriesSummary['peak'] = null
  for (const point of points) {
    const value = measureValue(point, measure)
    if (value != null && value > 0 && (!peak || value > peak.value)) {
      peak = { point, value }
    }
  }

  let lastComplete: SeriesSummary['lastComplete'] = null
  let completeIndex = points.length - 1
  while (completeIndex >= 0 && points[completeIndex].end > now) completeIndex--
  if (completeIndex >= 0) {
    const point = points[completeIndex]
    const value = measureValue(point, measure)
    const before = completeIndex > 0 ? points[completeIndex - 1] : null
    lastComplete = {
      point,
      value,
      change: before
        ? percentChange(value, measureValue(before, measure))
        : null,
    }
  }

  return {
    average,
    peak,
    lastComplete,
    activeBuckets: points.filter((point) => point.orders > 0).length,
    totalBuckets: points.length,
  }
}

// ─── Payment methods ──────────────────────────────────────────────────────────

/** Backend `PaymentMethod` enum, in the order unused methods are listed. */
export const PAYMENT_METHODS = [
  'CASH',
  'QRIS',
  'E_WALLET',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'BANK_TRANSFER',
  'OTHER',
] as const

export interface PaymentMethodRow {
  method: string
  amount: number
  share: number
  /** Orders that used the method at least once; null when the order list is incomplete. */
  orders: number | null
}

export function buildPaymentRows(
  breakdown: Record<string, number>,
  transactions: Pick<Transaction, 'payments'>[] | null
): { rows: PaymentMethodRow[]; unused: string[]; total: number } {
  const orderCounts = new Map<string, number>()
  for (const tx of transactions ?? []) {
    for (const method of new Set(tx.payments.map((p) => p.paymentMethod))) {
      orderCounts.set(method, (orderCounts.get(method) ?? 0) + 1)
    }
  }

  const entries = Object.entries(breakdown).filter(([, amount]) => amount > 0)
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0)
  const rows = entries
    .map(([method, amount]) => ({
      method,
      amount,
      share: total > 0 ? amount / total : 0,
      orders: transactions ? (orderCounts.get(method) ?? 0) : null,
    }))
    .sort((a, b) => b.amount - a.amount)

  const used = new Set(rows.map((row) => row.method))
  const unused = PAYMENT_METHODS.filter(
    (method) => method !== 'OTHER' && !used.has(method)
  )

  return { rows, unused, total }
}
