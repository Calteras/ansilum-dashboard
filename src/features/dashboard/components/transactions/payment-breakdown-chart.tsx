'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts'

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  OTHER: 'var(--muted-foreground)',
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
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} M`
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')} Jt`
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`
  }

  return value.toLocaleString('id-ID')
}

export function PaymentBreakdownChart({
  paymentBreakdown,
  isLoading,
}: PaymentBreakdownChartProps) {
  const { t } = useTranslation()

  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const data = useMemo(
    () =>
      Object.entries(paymentBreakdown)
        .map(([method, amount]) => ({
          key: method,
          name: LABEL_KEYS[method]
            ? (t(LABEL_KEYS[method] as any) as string)
            : method,
          value: amount,
          color: COLORS[method] || COLORS.OTHER,
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [paymentBreakdown, t]
  )

  const totalAmount = data.reduce((acc, item) => acc + item.value, 0)

  const activeItem = activeIndex !== null ? data[activeIndex] : null

  const topMethod = data[0]

  const activePercentage =
    activeItem && totalAmount > 0
      ? (activeItem.value / totalAmount) * 100
      : null

  const topPercentage =
    topMethod && totalAmount > 0 ? (topMethod.value / totalAmount) * 100 : 0

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
      <Sector
        cx={p.cx}
        cy={p.cy}
        innerRadius={p.innerRadius}
        outerRadius={p.outerRadius + 7}
        startAngle={p.startAngle}
        endAngle={p.endAngle}
        fill={p.fill}
      />
    )
  }

  return (
    <div className='bg-card flex w-full min-w-0 flex-col gap-5 rounded-2xl border p-5 shadow-[0_12px_40px_-32px_var(--brand-ink)] sm:p-6'>
      {/* Header */}
      <div>
        <p className='text-brand-ink text-[11px] font-bold tracking-[0.18em] uppercase'>
          {t('dashboard.paymentChart.title')}
        </p>

        {!isLoading && topMethod && (
          <div className='mt-2 flex items-center justify-between gap-3'>
            <span className='text-muted-foreground text-xs'>
              {t('dashboard.paymentChart.topMethod', 'Top payment method')}
            </span>

            <span className='truncate text-xs font-semibold'>
              {topMethod.name} · {topPercentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className='flex h-56 items-center justify-center'>
          <p className='text-muted-foreground text-xs'>
            {t('dashboard.paymentChart.loading')}
          </p>
        </div>
      ) : data.length === 0 ? (
        <div className='flex h-56 items-center justify-center'>
          <p className='text-muted-foreground text-xs'>
            {t('dashboard.paymentChart.noData')}
          </p>
        </div>
      ) : (
        <>
          {/* Donut */}
          <div className='relative mx-auto size-48'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={data}
                  cx='50%'
                  cy='50%'
                  innerRadius='52%'
                  outerRadius='72%'
                  paddingAngle={3}
                  dataKey='value'
                  strokeWidth={0}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centre */}
            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center'>
              <span className='text-lg leading-none font-bold tabular-nums'>
                Rp
                {formatCompact(activeItem?.value ?? totalAmount)}
              </span>

              <span className='text-muted-foreground mt-1 max-w-24 truncate text-[10px] tracking-wider uppercase'>
                {activeItem
                  ? activeItem.name
                  : t('dashboard.paymentChart.total')}
              </span>

              {activePercentage !== null && (
                <span className='text-muted-foreground mt-1 text-[10px] tabular-nums'>
                  {activePercentage.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Ranked payment methods */}
          <div className='space-y-3'>
            {data.map((item, index) => {
              const pct = totalAmount > 0 ? (item.value / totalAmount) * 100 : 0

              return (
                <div
                  key={item.key}
                  className={`cursor-pointer transition-opacity ${
                    activeIndex !== null && activeIndex !== index
                      ? 'opacity-40'
                      : ''
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className='mb-1.5 flex items-center gap-2'>
                    <div
                      className='h-2.5 w-2.5 shrink-0 rounded-sm'
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <span className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>
                      {item.name}
                    </span>

                    <span className='text-xs font-medium tabular-nums'>
                      Rp{formatCompact(item.value)}
                    </span>

                    <span className='text-muted-foreground w-11 text-right text-[11px] tabular-nums'>
                      {pct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Share bar */}
                  <div className='bg-muted h-1 overflow-hidden rounded-full'>
                    <div
                      className='h-full rounded-full transition-all duration-300'
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
        </>
      )}

      <p className='text-muted-foreground mt-auto text-[10px] tracking-[0.12em] uppercase'>
        {t('dashboard.paymentChart.footer')}
      </p>
    </div>
  )
}
