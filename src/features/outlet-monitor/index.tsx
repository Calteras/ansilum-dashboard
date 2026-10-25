import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { DataFreshness } from '@/components/data-display/data-freshness'
import { DataPanel, SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import { MapPin } from '@/components/icons'
import { PageHeader } from '@/components/layout/page-header'
import { useOutletMonitorQuery } from './api/outlet-monitor.queries'
import { HourlyOrdersChart } from './components/hourly-orders-chart'
import { InflowTrendChart } from './components/inflow-trend-chart'
import { MonitorMetrics } from './components/monitor-metrics'
import { OutletCashflowTable } from './components/outlet-cashflow-table'
import { OutletMap, OutletMapLegend } from './components/outlet-map'
import { RegionBreakdown } from './components/region-breakdown'
import { isPlaced, locateOutlet, type LocatedOutlet } from './lib/geo'

interface OutletMonitorProps {
  /** Drill into one outlet's sales. */
  onOpenOutlet: (outletId: string) => void
}

/**
 * Every outlet of the business today: headline numbers and per-outlet cashflow
 * beside a hex map of where the money is coming in, then the day by hour.
 */
export function OutletMonitor({ onOpenOutlet }: OutletMonitorProps) {
  const copy = useCopy()
  const query = useOutletMonitorQuery()
  const monitor = query.data?.data
  const [activeId, setActiveId] = useState<string | null>(null)

  const located = useMemo<LocatedOutlet[]>(
    () =>
      (monitor?.outlets ?? []).map((outlet) => ({
        outlet,
        location: locateOutlet(outlet),
      })),
    [monitor?.outlets]
  )
  const unplaced = located.filter((item) => !isPlaced(item)).length
  const approximate = located.filter(
    (item) => isPlaced(item) && item.location?.precision === 'approximate'
  ).length
  const liveWindowMinutes = monitor?.period.liveWindowMinutes ?? 30
  const currentHour = monitor
    ? monitor.hours.filter((h) => h.available).length - 1
    : -1

  const header = (
    <PageHeader
      title={copy('Semua outlet', 'All outlets')}
      meta={
        <>
          {monitor && (
            <>
              <span className='text-fg-secondary'>
                {copy(
                  `${monitor.outlets.length} outlet`,
                  `${monitor.outlets.length} outlet${monitor.outlets.length === 1 ? '' : 's'}`
                )}
              </span>
              <span aria-hidden>·</span>
              <span className='tabular-nums'>
                {copy('Hari ini', 'Today')},{' '}
                {format(
                  new Date(`${monitor.period.date}T00:00:00`),
                  'EEE d MMM'
                )}
              </span>
            </>
          )}
          {query.dataUpdatedAt > 0 && (
            <>
              <span aria-hidden>·</span>
              <DataFreshness
                updatedAt={query.dataUpdatedAt}
                isFetching={query.isFetching}
                onRefresh={() => void query.refetch()}
                staleAfterMs={5 * 60_000}
              />
            </>
          )}
        </>
      }
    />
  )

  if (query.isError && !monitor) {
    return (
      <>
        {header}
        <DataPanel>
          <ErrorState
            title={copy(
              'Pemantauan outlet gagal dimuat.',
              'Unable to load the outlet monitor.'
            )}
            description={query.error.message}
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        </DataPanel>
      </>
    )
  }

  if (monitor && monitor.outlets.length === 0) {
    return (
      <>
        {header}
        <DataPanel>
          <EmptyState
            title={copy('Belum ada outlet aktif.', 'No active outlets yet.')}
            description={copy(
              'Tambahkan outlet untuk mulai memantau arus kas.',
              'Add an outlet to start monitoring cashflow.'
            )}
            action={
              <Button
                asChild
                variant='outline'
                size='sm'
                className='h-8 px-3 text-[13px]'
              >
                <Link to='/outlets'>
                  {copy('Kelola outlet', 'Manage outlets')}
                </Link>
              </Button>
            }
          />
        </DataPanel>
      </>
    )
  }

  return (
    <>
      {header}

      {query.isError && (
        <p
          role='alert'
          className='border-divider bg-surface-subtle text-fg-secondary flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-2 text-[13px]'
        >
          {copy(
            `Gagal memperbarui. Menampilkan data pukul ${format(query.dataUpdatedAt, 'HH:mm')}.`,
            `Couldn't refresh. Showing data last updated at ${format(query.dataUpdatedAt, 'HH:mm')}.`
          )}
          <Button
            variant='ghost'
            size='sm'
            className='h-7 px-2 text-[13px]'
            onClick={() => void query.refetch()}
          >
            {copy('Coba lagi', 'Retry')}
          </Button>
        </p>
      )}

      <div className='grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2'>
        <DataPanel className='flex flex-col overflow-hidden'>
          <MonitorMetrics
            totals={monitor?.totals}
            outletCount={monitor?.outlets.length ?? 0}
            liveWindowMinutes={liveWindowMinutes}
            isLoading={query.isLoading}
          />
          <OutletCashflowTable
            outlets={located}
            activeId={activeId}
            onActiveChange={setActiveId}
            onOpenOutlet={onOpenOutlet}
            liveWindowMinutes={liveWindowMinutes}
            isLoading={query.isLoading}
          />
        </DataPanel>

        <DataPanel
          aria-labelledby='outlet-map-title'
          className='flex flex-col gap-4 p-4 sm:p-5'
        >
          <SectionHeader
            id='outlet-map-title'
            title={copy('Peta outlet', 'Outlet map')}
            description={copy(
              'Arahkan ke titik untuk melihat arus kasnya hari ini',
              "Point at a node to see today's cashflow"
            )}
          />
          <div className='flex flex-1 flex-col justify-center'>
            <OutletMap
              outlets={located}
              activeId={activeId}
              onActiveChange={setActiveId}
              onOpenOutlet={onOpenOutlet}
              liveWindowMinutes={liveWindowMinutes}
              currentHour={currentHour}
              isLoading={query.isLoading}
            />
          </div>
          <OutletMapLegend liveWindowMinutes={liveWindowMinutes} />
          {(unplaced > 0 || approximate > 0) && (
            <p className='text-fg-secondary bg-surface-subtle border-divider flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border px-3 py-2 text-xs'>
              <MapPin className='text-fg-muted size-3.5 shrink-0' aria-hidden />
              <span>
                {[
                  unplaced > 0 &&
                    copy(
                      `${unplaced} outlet belum tampil di peta`,
                      `${unplaced} outlet${unplaced > 1 ? 's' : ''} not on the map`
                    ),
                  approximate > 0 &&
                    copy(
                      `${approximate} lokasi diperkirakan dari alamat`,
                      `${approximate} placed from the address`
                    ),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              <Link
                to='/outlets'
                className='text-foreground font-medium underline underline-offset-4'
              >
                {copy('Atur lokasi', 'Set locations')}
              </Link>
            </p>
          )}
          <RegionBreakdown
            outlets={located}
            className='border-divider border-t pt-4'
          />
        </DataPanel>
      </div>

      <DataPanel className='grid grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'>
        <HourlyOrdersChart
          hours={monitor?.hours ?? []}
          totals={monitor?.totals}
        />
        <InflowTrendChart
          hours={monitor?.hours ?? []}
          totals={monitor?.totals}
          className='border-divider border-t lg:border-t-0 lg:border-l'
        />
      </DataPanel>
    </>
  )
}
