/** Live analytics for Full; a quiet upgrade notice for other plans. */
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { DateSpan } from '@/lib/date-range'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { DataPanel, SectionHeader } from '@/components/data-display/data-panel'
import { Lock } from '@/components/icons'
import { useAnalyticsSummaryQuery } from '@/features/analytics/api/analytics.queries'
import { AnalyticsKpiStrip } from '@/features/analytics/components/analytics-kpi-strip'
import { AnalyticsPeakHours } from '@/features/analytics/components/analytics-peak-hours'
import { AnalyticsTopProducts } from '@/features/analytics/components/analytics-top-products'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'

interface AnalyticsDashboardSectionProps {
  span: DateSpan
  outletId: string
}

export function AnalyticsDashboardSection({
  span,
  outletId,
}: AnalyticsDashboardSectionProps) {
  const { t } = useTranslation()
  const copy = useCopy()
  const { data: subData } = useCurrentSubscriptionQuery()
  const isFullTier = (subData?.data?.tier ?? 'BASIC') === 'FULL'

  const { data: analyticsData, isLoading } = useAnalyticsSummaryQuery({
    // Only fetch on the Full plan
    startDate: isFullTier ? format(span.from, 'yyyy-MM-dd') : '',
    endDate: isFullTier ? format(span.to, 'yyyy-MM-dd') : '',
    outletId: outletId || undefined,
  })
  const summary = analyticsData?.data ?? null

  const header = (
    <SectionHeader
      id='profit-customers-title'
      title={copy('Laba & pelanggan', 'Profit & customers')}
      description={copy(
        'HPP, produk, dan aktivitas pelanggan pada periode yang dipilih',
        'Cost of goods, products and customer activity for the selected period'
      )}
    />
  )

  if (!isFullTier) {
    return (
      <section
        aria-labelledby='profit-customers-title'
        className='flex flex-col gap-3'
      >
        {header}
        <DataPanel className='bg-surface-subtle flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-5'>
          <div className='flex min-w-0 items-start gap-3'>
            <Lock
              className='text-fg-muted mt-0.5 size-4 shrink-0'
              aria-hidden
            />
            <p className='text-fg-secondary text-[13px] leading-5'>
              {t('dashboard.analytics.lockDesc')}{' '}
              <span className='text-foreground font-medium'>
                {t('dashboard.analytics.lockPlan')}
              </span>{' '}
              {t('dashboard.analytics.lockDescFull')}
            </p>
          </div>
          <Button
            asChild
            variant='outline'
            size='sm'
            className='h-8 px-3 text-[13px]'
          >
            <Link to='/settings/subscription'>
              {t('dashboard.analytics.upgradeNow')}
            </Link>
          </Button>
        </DataPanel>
      </section>
    )
  }

  return (
    <section
      aria-labelledby='profit-customers-title'
      className='flex flex-col gap-3'
    >
      {header}
      <DataPanel className='overflow-hidden'>
        <AnalyticsKpiStrip
          kpis={summary?.kpis ?? null}
          isLoading={isLoading}
          showRevenue={false}
          className='border-divider border-b'
        />
        <div className='grid xl:grid-cols-2'>
          <AnalyticsTopProducts
            products={summary?.topProducts ?? []}
            isLoading={isLoading}
          />
          <AnalyticsPeakHours
            peakHours={summary?.peakHours ?? []}
            isLoading={isLoading}
            className='border-divider border-t xl:border-t-0 xl:border-l'
          />
        </div>
      </DataPanel>
    </section>
  )
}
