'use client'

import { useTranslation } from 'react-i18next'

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
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function formatCompact(value: number): string {
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')} Jt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

export function CostBreakdownChart({ movements }: CostBreakdownChartProps) {
  const { t } = useTranslation()

  // Group by ingredient and sum costs
  const ingredientCosts = movements.reduce(
    (acc, m) => {
      const name = m.ingredient.name
      if (!acc[name]) acc[name] = 0
      acc[name] += Math.abs(Number(m.totalCost))
      return acc
    },
    {} as Record<string, number>
  )

  const data = Object.entries(ingredientCosts)
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const totalCost = data.reduce((acc, item) => acc + item.value, 0)

  return (
    <div className='flex w-full flex-col gap-5 overflow-hidden rounded-xl border bg-card p-4 sm:p-6 xl:w-[410px]'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <p className='text-xs font-semibold tracking-wide text-foreground uppercase'>
          {t('dashboard.costBreakdown.title')}
        </p>
        <span className='font-sans tabular-nums text-xs text-muted-foreground'>
          Rp{formatCompact(totalCost)}
        </span>
      </div>

      {data.length === 0 ? (
        <div className='flex h-48 items-center justify-center'>
          <p className='font-sans tabular-nums text-xs text-muted-foreground'>
            {t('dashboard.costBreakdown.noData')}
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {data.map((item) => {
            const pct =
              totalCost > 0 ? (item.value / totalCost) * 100 : 0

            return (
              <div key={item.name} className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <span className='truncate text-xs font-medium'>
                    {item.name}
                  </span>
                  <div className='flex items-center gap-2'>
                    <span className='font-sans tabular-nums text-xs text-muted-foreground'>
                      {pct.toFixed(1)}%
                    </span>
                    <span className='font-sans tabular-nums text-xs tabular-nums'>
                      Rp{formatCompact(item.value)}
                    </span>
                  </div>
                </div>
                {/* Horizontal bar */}
                <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted/60'>
                  <div
                    className='h-full rounded-full transition-colors duration-500'
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className='font-sans tabular-nums text-xs tracking-[0.12em] text-muted-foreground uppercase'>
        {t('dashboard.costBreakdown.footer')}
      </p>
    </div>
  )
}
