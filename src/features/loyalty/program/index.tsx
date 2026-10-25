import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { ContextToolbar } from '@/components/data-display/context-toolbar'
import { DataFreshness } from '@/components/data-display/data-freshness'
import { DataPanel, SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import { Metric, MetricGroup } from '@/components/data-display/metric'
import { ArrowRight } from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import {
  useLoyaltyConfigQuery,
  useLoyaltyOverviewQuery,
  useTopCustomersQuery,
} from '../api/loyalty.queries'
import { formatPoints } from '../lib/loyalty'
import { EarningRulesForm } from './earning-rules-form'

type Period = '7' | '30' | '90'

export function LoyaltyProgram() {
  const copy = useCopy()
  const [period, setPeriod] = useState<Period>('30')
  const days = Number(period)
  const overview = useLoyaltyOverviewQuery(days)
  const config = useLoyaltyConfigQuery()
  const data = overview.data
  const isStale = overview.isPlaceholderData
  const inPeriod = copy(`${days} hari terakhir`, `Last ${days} days`)

  return (
    <>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title={copy('Program poin', 'Loyalty program')}
          description={
            config.data &&
            (config.data.isEnabled
              ? copy(
                  'Aktif: pelanggan mendapat poin di setiap kasir',
                  'On: customers earn points at every register'
                )
              : copy(
                  'Dijeda: tidak ada poin baru yang didapat',
                  'Paused: no new points are being earned'
                ))
          }
          actions={
            <>
              <Button variant='outline' asChild>
                <Link to='/customers'>{copy('Pelanggan', 'Customers')}</Link>
              </Button>
              <Button variant='outline' asChild>
                <Link to='/rewards'>{copy('Hadiah', 'Rewards')}</Link>
              </Button>
            </>
          }
        />

        <ContextToolbar
          aria-label={copy('Periode', 'Period')}
          actions={
            <DataFreshness
              updatedAt={overview.dataUpdatedAt}
              isFetching={overview.isFetching}
              onRefresh={() => void overview.refetch()}
              className='text-fg-muted text-[13px]'
            />
          }
        >
          <SegmentedControl<Period>
            aria-label={copy('Periode', 'Period')}
            value={period}
            onValueChange={setPeriod}
            options={[
              { value: '7', label: copy('7 hari', '7 days') },
              { value: '30', label: copy('30 hari', '30 days') },
              { value: '90', label: copy('90 hari', '90 days') },
            ]}
          />
        </ContextToolbar>

        <DataPanel className='overflow-hidden'>
          {overview.isError ? (
            <ErrorState
              title={copy(
                'Ringkasan belum termuat',
                "The overview couldn't load"
              )}
              description={overview.error.message}
              onRetry={() => void overview.refetch()}
              isRetrying={overview.isFetching}
            />
          ) : (
            <MetricGroup className='grid-cols-2 md:grid-cols-4'>
              <Metric
                label={copy('Member', 'Members')}
                value={data ? formatPoints(data.members.total) : '—'}
                footer={
                  data &&
                  copy(
                    `+${formatPoints(data.members.newInPeriod)} baru · ${inPeriod}`,
                    `+${formatPoints(data.members.newInPeriod)} new · ${inPeriod}`
                  )
                }
                isLoading={overview.isLoading}
                isStale={isStale}
              />
              <Metric
                label={copy('Member aktif', 'Active members')}
                value={data ? formatPoints(data.members.active) : '—'}
                footer={
                  data &&
                  copy(
                    `${formatPoints(data.members.inactive)} nonaktif · ${formatPoints(data.members.banned)} diblokir`,
                    `${formatPoints(data.members.inactive)} inactive · ${formatPoints(data.members.banned)} banned`
                  )
                }
                isLoading={overview.isLoading}
                isStale={isStale}
              />
              <Metric
                label={copy('Poin beredar', 'Points outstanding')}
                definition={copy(
                  'Saldo poin member aktif yang bisa ditukar. Poin member nonaktif atau diblokir dibekukan.',
                  'Spendable balances of active members. Points of inactive or banned members are frozen.'
                )}
                value={data ? formatPoints(data.points.outstanding) : '—'}
                footer={
                  data &&
                  data.points.frozen > 0 &&
                  copy(
                    `${formatPoints(data.points.frozen)} dibekukan`,
                    `${formatPoints(data.points.frozen)} frozen`
                  )
                }
                isLoading={overview.isLoading}
                isStale={isStale}
              />
              <Metric
                label={copy('Hadiah ditukar', 'Rewards redeemed')}
                definition={copy(
                  'Penukaran hadiah yang diverifikasi online, tidak termasuk yang dibatalkan.',
                  'Reward redemptions verified online, excluding voided ones.'
                )}
                value={data ? formatPoints(data.redemptions.count) : '—'}
                footer={inPeriod}
                isLoading={overview.isLoading}
                isStale={isStale}
              />
              <Metric
                label={copy('Poin didapat', 'Points earned')}
                value={data ? formatPoints(data.points.earned) : '—'}
                footer={inPeriod}
                isLoading={overview.isLoading}
                isStale={isStale}
              />
              <Metric
                label={copy('Poin ditukar', 'Points redeemed')}
                value={data ? formatPoints(data.points.redeemed) : '—'}
                footer={inPeriod}
                isLoading={overview.isLoading}
                isStale={isStale}
              />
              <Metric
                label={copy('Penyesuaian bersih', 'Net adjustments')}
                definition={copy(
                  'Penambahan dikurangi pengurangan manual, termasuk poin yang dihanguskan dan poin yang dikembalikan karena transaksi dibatalkan.',
                  'Manual additions minus deductions, including forfeits and points restored by voided sales.'
                )}
                value={
                  data
                    ? `${data.points.adjusted > 0 ? '+' : data.points.adjusted < 0 ? '−' : ''}${formatPoints(Math.abs(data.points.adjusted))}`
                    : '—'
                }
                footer={inPeriod}
                isLoading={overview.isLoading}
                isStale={isStale}
              />
              <Metric
                label={copy('Rasio tukar', 'Redemption rate')}
                definition={copy(
                  'Poin ditukar dibanding poin didapat pada periode ini.',
                  'Points redeemed relative to points earned in this period.'
                )}
                value={
                  data && data.points.earned > 0
                    ? `${Math.round((data.points.redeemed / data.points.earned) * 100)}%`
                    : '—'
                }
                footer={inPeriod}
                isLoading={overview.isLoading}
                isStale={isStale}
              />
            </MetricGroup>
          )}
        </DataPanel>

        <div className='grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]'>
          <DataPanel className='p-4 sm:p-5'>
            <SectionHeader
              title={copy('Aturan mendapat poin', 'Earning rules')}
              description={copy(
                'Berlaku untuk setiap penjualan yang dikaitkan dengan pelanggan, di semua gerai.',
                'Applies to every sale linked to a customer, at every outlet.'
              )}
              className='mb-4'
            />
            {config.isError ? (
              <ErrorState
                title={copy('Aturan belum termuat', "Rules couldn't load")}
                description={config.error.message}
                onRetry={() => void config.refetch()}
              />
            ) : config.data ? (
              <EarningRulesForm
                key={config.data.updatedAt}
                config={config.data}
              />
            ) : (
              <div className='bg-surface-hover h-48 animate-pulse rounded' />
            )}
          </DataPanel>
          <TopCustomers />
        </div>
      </Main>
    </>
  )
}

function TopCustomers() {
  const copy = useCopy()
  const [sortBy, setSortBy] = useState<'totalSpent' | 'visitCount'>(
    'totalSpent'
  )
  const query = useTopCustomersQuery(sortBy)
  const rows = query.data ?? []

  return (
    <DataPanel className='flex flex-col p-4 sm:p-5'>
      <SectionHeader
        title={copy('Member teratas', 'Top members')}
        actions={
          <SegmentedControl<'totalSpent' | 'visitCount'>
            aria-label={copy('Urutkan', 'Rank by')}
            value={sortBy}
            onValueChange={setSortBy}
            options={[
              { value: 'totalSpent', label: copy('Belanja', 'Spend') },
              { value: 'visitCount', label: copy('Kunjungan', 'Visits') },
            ]}
          />
        }
        className='mb-2'
      />
      {query.isError ? (
        <ErrorState
          title={copy('Belum termuat', "Couldn't load")}
          onRetry={() => void query.refetch()}
        />
      ) : !query.isLoading && rows.length === 0 ? (
        <EmptyState title={copy('Belum ada member', 'No members yet')} />
      ) : (
        <ol
          className={cn(
            'divide-divider flex-1 divide-y',
            query.isFetching && 'opacity-60'
          )}
        >
          {rows.map((customer, index) => (
            <li key={customer.id} className='flex items-center gap-3 py-2.5'>
              <span className='text-fg-muted w-4 text-[13px] tabular-nums'>
                {index + 1}
              </span>
              <Link
                to='/customers/$customerId'
                params={{ customerId: customer.id }}
                className='min-w-0 flex-1 truncate font-medium hover:underline'
              >
                {customer.name}
              </Link>
              <span className='text-[13px] whitespace-nowrap tabular-nums'>
                {sortBy === 'totalSpent'
                  ? formatMoney(customer.totalSpent)
                  : copy(
                      `${formatPoints(customer.visitCount)} kunjungan`,
                      `${formatPoints(customer.visitCount)} visits`
                    )}
              </span>
            </li>
          ))}
        </ol>
      )}
      <Link
        to='/customers'
        search={{ sort: sortBy === 'totalSpent' ? 'spent' : 'visits' }}
        className='text-fg-secondary hover:text-foreground mt-3 inline-flex w-fit items-center gap-1 text-[13px] font-medium'
      >
        {copy('Lihat semua pelanggan', 'View all customers')}
        <ArrowRight className='size-3.5' aria-hidden />
      </Link>
    </DataPanel>
  )
}
