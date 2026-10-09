'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
import { useTranslation } from 'react-i18next'

interface PaymentBreakdownChartProps {
  paymentBreakdown: Record<string, number>
  isLoading?: boolean
}

const COLORS: Record<string, string> = {
  CASH: 'var(--chart-4)',
  BANK_TRANSFER: 'var(--chart-5)',
  CREDIT_CARD: 'var(--chart-3)',
  DEBIT_CARD: 'var(--chart-2)',
  E_WALLET: 'var(--chart-1)',
  OTHER: 'var(--chart-5)',
}

const LABEL_KEYS: Record<string, string> = {
  CASH: 'dashboard.paymentMethods.cashFull',
  BANK_TRANSFER: 'dashboard.paymentMethods.bankTransferFull',
  CREDIT_CARD: 'dashboard.paymentMethods.creditCardFull',
  DEBIT_CARD: 'dashboard.paymentMethods.debitCardFull',
  E_WALLET: 'dashboard.paymentMethods.eWalletFull',
  OTHER: 'dashboard.paymentMethods.OTHER',
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')} Jt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

export function PaymentBreakdownChart({
  paymentBreakdown,
  isLoading,
}: PaymentBreakdownChartProps) {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const data = Object.entries(paymentBreakdown).map(([method, amount]) => ({
    name: LABEL_KEYS[method] ? t(LABEL_KEYS[method] as any) as string : method,
    value: amount,
    color: COLORS[method] || COLORS.OTHER,
  }))

  const totalAmount = data.reduce((acc, item) => acc + item.value, 0)

  const renderActiveShape = (props: unknown) => {
    const p = props as {
      cx: number
      cy: number
      innerRadius: number
      outerRadius: number
      startAngle: number
      endAngle: number
      fill: string
    }
    return (
      <g>
        <Sector
          cx={p.cx}
          cy={p.cy}
          innerRadius={p.innerRadius}
          outerRadius={p.outerRadius + 6}
          startAngle={p.startAngle}
          endAngle={p.endAngle}
          fill={p.fill}
        />
      </g>
    )
  }

  return (
    <div className='bg-card flex w-full flex-col gap-5 overflow-hidden rounded-xl border p-4 sm:p-6 xl:w-[410px]'>
      {/* Header */}
      <p className='text-foreground text-xs font-semibold tracking-wide uppercase'>
        {t('dashboard.paymentChart.title')}
      </p>

      {isLoading ? (
        <div className='flex h-52 items-center justify-center'>
          <p className='text-muted-foreground font-sans tabular-nums text-xs'>{t('dashboard.paymentChart.loading')}</p>
        </div>
      ) : data.length === 0 ? (
        <div className='flex h-52 items-center justify-center'>
          <p className='text-muted-foreground font-sans tabular-nums text-xs'>
            {t('dashboard.paymentChart.noData')}
          </p>
        </div>
      ) : (
        <div className='flex flex-col items-center gap-5 sm:flex-row'>
          {/* Donut */}
          <div className='relative size-52 shrink-0'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie isAnimationActive={false}
                  data={data}
                  cx='50%'
                  cy='50%'
                  innerRadius='44%'
                  outerRadius='68%'
                  paddingAngle={3}
                  dataKey='value'
                  strokeWidth={0}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Centre label */}
            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5'>
              <span className='font-sans font-bold text-xl leading-none'>
                Rp{formatCompact(totalAmount)}
              </span>
              <span className='text-muted-foreground font-sans tabular-nums text-xs tracking-widest uppercase'>
                {t('dashboard.paymentChart.total')}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className='w-full flex-1 space-y-2'>
            {data.map((item, index) => {
              const pct =
                totalAmount > 0
                  ? ((item.value / totalAmount) * 100).toFixed(1)
                  : '0'
              return (
                <div
                  key={item.name}
                  className={`group flex cursor-pointer items-center gap-2.5 transition-opacity ${
                    activeIndex !== null && activeIndex !== index
                      ? 'opacity-40'
                      : ''
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div
                    className='h-5 w-[3px] shrink-0 rounded-sm'
                    style={{ backgroundColor: item.color }}
                  />
                  <span className='text-muted-foreground flex-1 truncate text-xs'>
                    {item.name}
                  </span>
                  <span className='text-muted-foreground font-sans tabular-nums text-xs'>
                    {pct}%
                  </span>
                  <span className='font-sans tabular-nums text-xs font-medium tabular-nums'>
                    Rp{formatCompact(item.value)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className='text-muted-foreground font-sans tabular-nums text-xs tracking-[0.12em] uppercase'>
        {t('dashboard.paymentChart.footer')}
      </p>
    </div>
  )
}
