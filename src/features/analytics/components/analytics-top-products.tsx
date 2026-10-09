import { useCopy } from '@/hooks/use-copy'
import { formatCompactMoney } from '@/lib/format'
import { Star } from '@/components/icons'
import type { AnalyticsTopProduct } from '../api/analytics.types'

const fmtRevenue = formatCompactMoney

interface AnalyticsTopProductsProps {
  products: AnalyticsTopProduct[]
  isLoading: boolean
}

export function AnalyticsTopProducts({ products, isLoading }: AnalyticsTopProductsProps) {
  const copy = useCopy()
  const rankedProducts = [...products].sort((a, b) => b.revenue - a.revenue)
  const maxRevenue = Math.max(...products.map((p) => p.revenue), 1)

  return (
    <div className='bg-card flex w-full flex-col gap-4 rounded-xl border p-4 sm:p-5 xl:w-105'>
      <div className='flex items-center gap-2'>
        <div className='bg-chart-1/10 rounded-md p-1.5'>
          <Star className='text-muted-foreground size-4' />
        </div>
        <span className='text-sm font-medium'>{copy('Produk terlaris', 'Top products')}</span>
        <span className='text-muted-foreground ml-auto text-xs'>
          {copy('dari penjualan', 'by revenue')}
        </span>
      </div>

      {isLoading ? (
        <div className='flex flex-col gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='space-y-1.5'>
              <div className='bg-muted h-3 w-3/4 animate-pulse rounded' />
              <div className='bg-muted h-2.5 w-full animate-pulse rounded-full' />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className='text-muted-foreground py-8 text-center text-sm'>
          {copy('Belum ada penjualan produk pada periode ini.', 'No product sales for this period.')}
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {rankedProducts.map((p, idx) => (
            <div key={p.productId} className='flex items-center gap-3'>
              {/* Rank */}
              <span
                className={`w-4 shrink-0 text-xs font-bold tabular-nums ${
                  idx === 0 ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}
              >
                {idx + 1}
              </span>

              {/* Info + bar */}
              <div className='flex min-w-0 flex-1 flex-col gap-1'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='truncate text-xs font-medium'>{p.name}</span>
                  <span className='text-xs font-semibold tabular-nums'>
                    {fmtRevenue(p.revenue)}
                  </span>
                </div>
                {/* Relative bar */}
                <div className='bg-muted h-2.5 w-full overflow-hidden rounded-full'>
                  <div
                    className={`h-full rounded-full ${idx === 0 ? 'bg-brand' : 'bg-steel'}`}
                    style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className='text-muted-foreground text-xs'>
                  {p.quantity.toLocaleString('id-ID')} {copy('terjual', 'sold')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
