import { formatMoney } from '@/lib/format'
import { formatCount, formatPercent } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import type { LocatedOutlet } from '../lib/geo'

const MAX_ROWS = 5

/** Inflow per province, the map's numbers in reading order. */
export function RegionBreakdown({
  outlets,
  className,
}: {
  outlets: LocatedOutlet[]
  className?: string
}) {
  const copy = useCopy()
  const unplaced = copy('Tanpa lokasi', 'No location')
  const groups = new Map<string, { outlets: number; inflow: number }>()
  for (const { outlet, location } of outlets) {
    const key = location?.province ?? unplaced
    const group = groups.get(key) ?? { outlets: 0, inflow: 0 }
    group.outlets += 1
    group.inflow += outlet.inflow
    groups.set(key, group)
  }
  const rows = [...groups.entries()]
    .map(([province, group]) => ({ province, ...group }))
    .sort((a, b) => b.inflow - a.inflow || a.province.localeCompare(b.province))
  const total = rows.reduce((sum, r) => sum + r.inflow, 0)
  const shown = rows.slice(0, MAX_ROWS)

  if (!rows.length) return null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <h3 className='text-fg-secondary text-xs font-medium'>
        {copy('Arus masuk per provinsi', 'Inflow by province')}
      </h3>
      <ul className='flex flex-col gap-2'>
        {shown.map((row) => {
          const share = total > 0 ? row.inflow / total : 0
          return (
            <li
              key={row.province}
              className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-[13px]'
            >
              <span className='flex min-w-0 items-baseline gap-2'>
                <span
                  className={cn(
                    'truncate font-medium',
                    row.province === unplaced && 'text-fg-muted'
                  )}
                >
                  {row.province}
                </span>
                <span className='text-fg-muted shrink-0 text-xs'>
                  {copy(
                    `${formatCount(row.outlets)} outlet`,
                    `${formatCount(row.outlets)} outlet${row.outlets === 1 ? '' : 's'}`
                  )}
                </span>
              </span>
              <span className='font-medium tabular-nums'>
                {formatMoney(row.inflow)}
              </span>
              <span className='bg-surface-selected col-span-2 flex h-1.5 items-center overflow-hidden rounded-full'>
                <span
                  className='bg-series-primary h-full rounded-full'
                  style={{ width: `${share * 100}%` }}
                />
              </span>
              <span className='sr-only'>
                {formatPercent(share)} {copy('dari total', 'of total')}
              </span>
            </li>
          )
        })}
      </ul>
      {rows.length > MAX_ROWS && (
        <p className='text-fg-muted text-xs'>
          {copy(
            `+${rows.length - MAX_ROWS} provinsi lain`,
            `+${rows.length - MAX_ROWS} more provinces`
          )}
        </p>
      )}
    </div>
  )
}
