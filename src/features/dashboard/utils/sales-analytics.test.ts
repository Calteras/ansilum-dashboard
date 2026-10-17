import { format } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { formatSpan, normalizeSpan } from '@/lib/date-range'
import { deltaTone, percentChange } from '@/lib/metrics'
import {
  aggregateSales,
  buildBuckets,
  buildPaymentRows,
  getComparisonSpan,
  isComparisonAvailable,
  summarizeSeries,
} from './sales-analytics'

const day = (iso: string) => new Date(`${iso}T00:00:00`)
const ymd = (date: Date) => format(date, 'yyyy-MM-dd')
const october = normalizeSpan(day('2026-10-01'), day('2026-10-17'))

function tx(date: string, grandTotal: number, discountAmount = 0) {
  return {
    transactionDate: new Date(`${date}T12:00:00`).toISOString(),
    grandTotal: String(grandTotal),
    discountAmount: String(discountAmount),
  }
}

describe('getComparisonSpan', () => {
  it('uses the equally long range immediately before for previous period', () => {
    const previous = getComparisonSpan(october, 'previous-period')!
    expect(ymd(previous.from)).toBe('2026-09-14')
    expect(ymd(previous.to)).toBe('2026-09-30')
    expect(previous.to.getHours()).toBe(23)
  })

  it('shifts the same dates back for previous month and year', () => {
    const month = getComparisonSpan(october, 'previous-month')!
    expect([ymd(month.from), ymd(month.to)]).toEqual([
      '2026-09-01',
      '2026-09-17',
    ])
    const year = getComparisonSpan(october, 'previous-year')!
    expect([ymd(year.from), ymd(year.to)]).toEqual(['2025-10-01', '2025-10-17'])
    expect(getComparisonSpan(october, 'none')).toBeNull()
  })

  it('rejects baselines that overlap the current range', () => {
    const quarter = normalizeSpan(day('2026-08-01'), day('2026-10-17'))
    expect(isComparisonAvailable(quarter, 'previous-month')).toBe(false)
    expect(isComparisonAvailable(quarter, 'previous-period')).toBe(true)
    expect(isComparisonAvailable(quarter, 'none')).toBe(true)
  })
})

describe('buildBuckets', () => {
  it('creates one bucket per day, including days without sales', () => {
    expect(buildBuckets(october, 'daily')).toHaveLength(17)
  })

  it('clips weekly buckets to the selected range', () => {
    const weeks = buildBuckets(october, 'weekly')
    // 1 Oct 2026 is a Thursday; weeks start on Monday.
    expect(weeks.map((w) => ymd(w.start))).toEqual([
      '2026-10-01',
      '2026-10-05',
      '2026-10-12',
    ])
    expect(ymd(weeks[2].end)).toBe('2026-10-17')
  })
})

describe('aggregateSales', () => {
  it('sums sales, net sales and orders into the right bucket', () => {
    const points = aggregateSales(
      [
        tx('2026-10-03', 40000, 5000),
        tx('2026-10-03', 10000),
        tx('2026-10-09', 33000),
      ],
      october,
      'daily'
    )
    expect(points[2]).toMatchObject({
      sales: 50000,
      netSales: 45000,
      orders: 2,
    })
    expect(points[8]).toMatchObject({ sales: 33000, orders: 1 })
    expect(points[0]).toMatchObject({ sales: 0, orders: 0 })
  })

  it('ignores transactions outside the range', () => {
    const points = aggregateSales([tx('2026-09-30', 9000)], october, 'daily')
    expect(points.every((p) => p.orders === 0)).toBe(true)
  })
})

describe('summarizeSeries', () => {
  const points = aggregateSales(
    [
      tx('2026-10-03', 20000),
      tx('2026-10-09', 40000),
      tx('2026-10-16', 30000),
      tx('2026-10-17', 6000),
    ],
    october,
    'daily'
  )

  it('finds the peak bucket and the active bucket count', () => {
    const summary = summarizeSeries(points, 'sales', day('2026-10-17'))
    expect(ymd(summary.peak!.point.start)).toBe('2026-10-09')
    expect(summary.peak!.value).toBe(40000)
    expect(summary.activeBuckets).toBe(4)
    expect(summary.totalBuckets).toBe(17)
  })

  it('skips the bucket still in progress when reporting the latest change', () => {
    // Midday on 17 Oct: 17 Oct is incomplete, so 16 Oct is the latest full day.
    const summary = summarizeSeries(
      points,
      'sales',
      new Date('2026-10-17T12:00:00')
    )
    expect(ymd(summary.lastComplete!.point.start)).toBe('2026-10-16')
    // 15 Oct had no sales, so there is no meaningful percentage.
    expect(summary.lastComplete!.change).toBeNull()
  })

  it('reports the period average order value, not a mean of daily averages', () => {
    const summary = summarizeSeries(points, 'averageOrder', day('2026-10-18'))
    expect(summary.average).toBe(96000 / 4)
  })
})

describe('buildPaymentRows', () => {
  it('ranks used methods, counts orders and lists unused methods', () => {
    const result = buildPaymentRows({ CASH: 83000, QRIS: 0 }, [
      { payments: [{ paymentMethod: 'CASH' }] },
      { payments: [{ paymentMethod: 'CASH' }, { paymentMethod: 'CASH' }] },
    ] as never)
    expect(result.rows).toEqual([
      { method: 'CASH', amount: 83000, share: 1, orders: 2 },
    ])
    expect(result.unused).toContain('QRIS')
    expect(result.unused).not.toContain('OTHER')
  })

  it('leaves order counts empty when the order list is unavailable', () => {
    expect(buildPaymentRows({ CASH: 10 }, null).rows[0].orders).toBeNull()
  })
})

describe('metric helpers', () => {
  it('returns no percentage without a baseline', () => {
    expect(percentChange(83000, 0)).toBeNull()
    expect(percentChange(115, 100)).toBeCloseTo(0.15)
  })

  it('derives tone from metric meaning, not just sign', () => {
    expect(deltaTone(0.1, 'increase-is-good')).toBe('positive')
    expect(deltaTone(0.1, 'decrease-is-good')).toBe('negative')
    expect(deltaTone(-0.1, 'decrease-is-good')).toBe('positive')
    expect(deltaTone(null, 'increase-is-good')).toBe('neutral')
  })
})

describe('formatSpan', () => {
  it('collapses shared month and year', () => {
    expect(formatSpan(october)).toBe('01 – 17 Oct 2026')
    expect(
      formatSpan(normalizeSpan(day('2026-09-28'), day('2026-10-17')))
    ).toBe('28 Sep – 17 Oct 2026')
    expect(
      formatSpan(normalizeSpan(day('2025-12-15'), day('2026-01-10')))
    ).toBe('15 Dec 2025 – 10 Jan 2026')
  })
})
