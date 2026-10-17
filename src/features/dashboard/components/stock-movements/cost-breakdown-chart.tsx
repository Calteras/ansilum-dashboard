import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/lib/format'
import { formatPercent } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState } from '@/components/data-display/data-states'

interface StockMovement {
  id: string
  movementType: string
  quantity: string
  totalCost: string
  ingredient: {
    id: string
    name: string
    code: string
    unit: string
  }
}

interface CostBreakdownChartProps {
  movements: StockMovement[]
  className?: string
}

/** Top ingredients by recorded cost. One series, so one color. */
export function CostBreakdownChart({
  movements,
  className,
}: CostBreakdownChartProps) {
  const { t } = useTranslation()
  const copy = useCopy()

  const costs = new Map<string, number>()
  for (const m of movements) {
    costs.set(
      m.ingredient.name,
      (costs.get(m.ingredient.name) ?? 0) + Math.abs(Number(m.totalCost))
    )
  }
  const totalCost = [...costs.values()].reduce((sum, value) => sum + value, 0)
  const data = [...costs.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return (
    <section
      aria-labelledby='cost-breakdown-title'
      className={cn('flex min-w-0 flex-col gap-3 p-4 sm:p-5', className)}
    >
      <SectionHeader
        id='cost-breakdown-title'
        title={t('dashboard.costBreakdown.title')}
        description={`${copy('8 bahan teratas dari', 'Top 8 ingredients of')} ${formatMoney(totalCost)}`}
      />

      {data.length === 0 ? (
        <EmptyState
          title={t('dashboard.costBreakdown.noData')}
          className='py-8'
        />
      ) : (
        <table className='w-full text-[13px] tabular-nums'>
          <thead className='sr-only'>
            <tr>
              <th scope='col'>{copy('Bahan', 'Ingredient')}</th>
              <th scope='col'>{copy('Biaya', 'Cost')}</th>
              <th scope='col'>{copy('Porsi', 'Share')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const share = totalCost > 0 ? item.value / totalCost : 0
              return (
                <tr
                  key={item.name}
                  className='border-divider border-b last:border-0'
                >
                  <th
                    scope='row'
                    className='w-full max-w-0 truncate py-2 pr-3 text-left font-medium'
                  >
                    {item.name}
                  </th>
                  <td className='py-2 pr-3 text-right whitespace-nowrap'>
                    {formatMoney(item.value)}
                  </td>
                  <td className='py-2'>
                    <div className='flex items-center justify-end gap-2'>
                      <span
                        aria-hidden
                        className='bg-surface-hover h-1 w-12 overflow-hidden rounded-full'
                      >
                        <span
                          className='bg-series-neutral block h-full rounded-full'
                          style={{ width: `${Math.max(share * 100, 2)}%` }}
                        />
                      </span>
                      <span className='text-fg-secondary w-12 text-right'>
                        {formatPercent(share)}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
