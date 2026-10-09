'use client'

import { Coins, Package, Users, MessageCircle } from '@/components/icons'

const statsData = [
  {
    label: 'Product Revenue',
    value: '$10,312',
    delta: '+20%',
    isPositive: true,
    icon: Coins,
  },
  {
    label: 'Total Sales',
    value: '224',
    delta: '+20%',
    isPositive: true,
    icon: Package,
  },
  {
    label: 'Total Deals',
    value: '3,612',
    delta: '-15%',
    isPositive: false,
    icon: Users,
  },
  {
    label: 'Conv. Rate',
    value: '67%',
    delta: '-12%',
    isPositive: false,
    icon: MessageCircle,
  },
]

export function StatsCards() {
  return (
    <div className='grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border lg:grid-cols-4'>
      {statsData.map((stat) => (
        <div
          key={stat.label}
          className='flex flex-col gap-3 bg-card p-4 sm:p-5 lg:p-6'
        >
          <div
            className={`h-[2px] w-5 rounded-full ${
              stat.isPositive ? 'bg-primary' : 'bg-destructive/60'
            }`}
          />
          <p className='text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:text-xs'>
            {stat.label}
          </p>
          <p className='font-sans font-bold text-2xl leading-none tracking-tight sm:text-3xl lg:text-[32px]'>
            {stat.value}
          </p>
          <p
            className={`font-sans tabular-nums text-xs sm:text-xs ${
              stat.isPositive
                ? 'text-leaf '
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {stat.isPositive ? '↑' : '↓'} {stat.delta}{' '}
            <span className='text-muted-foreground'>vs last month</span>
          </p>
        </div>
      ))}
    </div>
  )
}
