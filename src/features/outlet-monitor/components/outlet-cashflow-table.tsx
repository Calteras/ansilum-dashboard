import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { formatMoney } from '@/lib/format'
import { formatCount, percentChange } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { SectionHeader } from '@/components/data-display/data-panel'
import { Delta } from '@/components/data-display/metric'
import { ChevronRight } from '@/components/icons'
import { ACTIVITY_DOT, useActivityCopy } from '../lib/activity'
import type { LocatedOutlet } from '../lib/geo'

interface OutletCashflowTableProps {
  outlets: LocatedOutlet[]
  activeId: string | null
  onActiveChange: Dispatch<SetStateAction<string | null>>
  onOpenOutlet: (id: string) => void
  liveWindowMinutes: number
  isLoading?: boolean
  className?: string
}

/** One row per outlet, label over value, ranked by today's inflow. */
export function OutletCashflowTable({
  outlets,
  activeId,
  onActiveChange,
  onOpenOutlet,
  liveWindowMinutes,
  isLoading,
  className,
}: OutletCashflowTableProps) {
  const copy = useCopy()
  const activityCopy = useActivityCopy(liveWindowMinutes)
  const columns = {
    outlet: copy('Outlet', 'Outlet'),
    inflow: copy('Masuk', 'In'),
    net: copy('Bersih', 'Net'),
    orders: copy('Pesanan', 'Orders'),
    change: copy('Penjualan vs kemarin', 'Sales vs yesterday'),
  }

  return (
    <section
      aria-labelledby='outlet-cashflow-title'
      className={cn('flex min-w-0 flex-col', className)}
    >
      <SectionHeader
        id='outlet-cashflow-title'
        title={copy('Arus kas per outlet', 'Cashflow by outlet')}
        description={copy(
          'Hari ini, urut dari arus masuk terbesar',
          'Today, largest inflow first'
        )}
        className='px-4 pt-4 pb-2 sm:px-5'
      />
      <div className='overflow-x-auto'>
        <table className='w-full text-[13px] tabular-nums'>
          <thead className='sr-only'>
            <tr>
              <th scope='col'>{columns.outlet}</th>
              <th scope='col'>{columns.inflow}</th>
              <th scope='col'>{columns.net}</th>
              <th scope='col'>{columns.orders}</th>
              <th scope='col'>{columns.change}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !outlets.length
              ? Array.from({ length: 3 }, (_, i) => (
                  <tr key={i} className='border-divider border-t'>
                    <td colSpan={5} className='px-4 py-3 sm:px-5'>
                      <span className='bg-surface-hover block h-9 animate-pulse rounded' />
                    </td>
                  </tr>
                ))
              : outlets.map(({ outlet, location }) => {
                  const activity = activityCopy(outlet.activity)
                  const change = (
                    <Delta
                      change={percentChange(
                        outlet.collected,
                        outlet.previousCollected
                      )}
                      baselineLabel={copy(
                        'penjualan kemarin di jam yang sama',
                        'sales by this time yesterday'
                      )}
                      className='text-xs'
                    />
                  )
                  return (
                    <tr
                      key={outlet.outletId}
                      onMouseEnter={() => onActiveChange(outlet.outletId)}
                      onMouseLeave={() =>
                        onActiveChange((current) =>
                          current === outlet.outletId ? null : current
                        )
                      }
                      className={cn(
                        'border-divider border-t transition-colors',
                        activeId === outlet.outletId && 'bg-surface-hover'
                      )}
                    >
                      <th
                        scope='row'
                        className='w-full max-w-0 py-2.5 pr-3 pl-4 text-left font-normal sm:pl-5'
                      >
                        <button
                          type='button'
                          onClick={() => onOpenOutlet(outlet.outletId)}
                          onFocus={() => onActiveChange(outlet.outletId)}
                          onBlur={() =>
                            onActiveChange((current) =>
                              current === outlet.outletId ? null : current
                            )
                          }
                          className='group focus-visible:outline-ring flex max-w-full items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2'
                        >
                          <span
                            title={`${activity.label}: ${activity.description}`}
                            className={cn(
                              'size-2 shrink-0 rounded-full',
                              ACTIVITY_DOT[outlet.activity]
                            )}
                          />
                          <span className='min-w-0'>
                            <span className='flex items-center gap-1 font-medium group-hover:underline'>
                              <span className='truncate'>{outlet.name}</span>
                              <ChevronRight
                                aria-hidden
                                className='text-fg-muted size-3.5 shrink-0'
                              />
                            </span>
                            <span className='text-fg-muted block truncate text-xs'>
                              <span className='sr-only'>
                                {activity.label}.{' '}
                              </span>
                              {location?.region ??
                                copy('Lokasi belum diatur', 'No location set')}
                            </span>
                          </span>
                        </button>
                      </th>
                      <Cell label={columns.inflow} className='pr-4 sm:pr-3'>
                        {formatMoney(outlet.inflow)}
                        {/* Phones have no room for the change column. */}
                        <span className='block sm:hidden'>{change}</span>
                      </Cell>
                      <Cell
                        label={columns.net}
                        className='hidden sm:table-cell'
                      >
                        {formatMoney(outlet.net)}
                      </Cell>
                      <Cell
                        label={columns.orders}
                        className='hidden md:table-cell'
                      >
                        {formatCount(outlet.transactions)}
                      </Cell>
                      <Cell
                        label={copy('vs kemarin', 'vs yesterday')}
                        className='hidden pr-4 sm:table-cell sm:pr-5'
                      >
                        {change}
                      </Cell>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Muse-style cell: a small label over the value, hidden from screen readers (the header carries it). */
function Cell({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <td className={cn('px-3 py-2.5 text-right whitespace-nowrap', className)}>
      <span aria-hidden className='text-fg-muted block text-xs leading-4'>
        {label}
      </span>
      <span className='block leading-5 font-medium'>{children}</span>
    </td>
  )
}
