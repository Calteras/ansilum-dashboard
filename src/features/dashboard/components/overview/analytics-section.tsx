/** Live analytics for Full; a clear upgrade panel for other plans. */
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { Lock } from '@/components/icons'
import type { DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAnalyticsSummaryQuery } from '@/features/analytics/api/analytics.queries'
import type {
  AnalyticsSummaryKpis,
  AnalyticsTopProduct,
  AnalyticsPeakHour,
} from '@/features/analytics/api/analytics.types'
import { AnalyticsKpiStrip } from '@/features/analytics/components/analytics-kpi-strip'
import { AnalyticsPeakHours } from '@/features/analytics/components/analytics-peak-hours'
import { AnalyticsTopProducts } from '@/features/analytics/components/analytics-top-products'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'

// ─── Shared content layout ────────────────────────────────────────────────────

interface ContentProps {
  kpis: AnalyticsSummaryKpis | null
  products: AnalyticsTopProduct[]
  peakHours: AnalyticsPeakHour[]
  isLoading: boolean
}

function AnalyticsContent({
  kpis,
  products,
  peakHours,
  isLoading,
}: ContentProps) {
  return (
    <div className='flex flex-col gap-4 sm:gap-6'>
      <AnalyticsKpiStrip kpis={kpis} isLoading={isLoading} />

      <div className='flex flex-col gap-4 sm:gap-6 xl:flex-row'>
        <AnalyticsTopProducts products={products} isLoading={isLoading} />
        <AnalyticsPeakHours peakHours={peakHours} isLoading={isLoading} />
      </div>

    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface AnalyticsDashboardSectionProps {
  dateRange: DateRange
  outletId: string
}

export function AnalyticsDashboardSection({
  dateRange,
  outletId,
}: AnalyticsDashboardSectionProps) {
  const { t } = useTranslation()
  const { data: subData } = useCurrentSubscriptionQuery()
  const tier = subData?.data?.tier ?? 'BASIC'
  const isFullTier = tier === 'FULL'

  const analyticsParams = {
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
    outletId: outletId || undefined,
  }

  const { data: analyticsData, isLoading } = useAnalyticsSummaryQuery({
    ...analyticsParams,
    // Only fetch when FULL tier and dates are present
    startDate: isFullTier ? analyticsParams.startDate : '',
    endDate: isFullTier ? analyticsParams.endDate : '',
  })

  const summary = analyticsData?.data ?? null

  // ── FULL tier: live data ──────────────────────────────────────────────────
  if (isFullTier) {
    return (
      <AnalyticsContent
        kpis={summary?.kpis ?? null}
        products={summary?.topProducts ?? []}
        peakHours={summary?.peakHours ?? []}
        isLoading={isLoading}
      />
    )
  }

  return (
    <div className='flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/40 p-6'>
      <div className='flex items-start gap-3'>
        <Lock className='text-muted-foreground mt-1 size-5 shrink-0' />
        <div className='space-y-1'>
          <h3 className='text-base font-bold'>{t('dashboard.analytics.lockTitle')}</h3>
          <p className='text-muted-foreground max-w-xl text-sm'>{t('dashboard.analytics.lockDesc')} {t('dashboard.analytics.lockPlan')} {t('dashboard.analytics.lockDescFull')}</p>
        </div>
      </div>
      <Button asChild variant='outline'><Link to='/settings/subscription'>{t('dashboard.analytics.upgradeNow')}</Link></Button>
    </div>
  )
}
