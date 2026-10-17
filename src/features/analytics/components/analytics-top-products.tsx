import { formatMoney } from '@/lib/format'
import { formatCount } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState } from '@/components/data-display/data-states'
import type { AnalyticsTopProduct } from '../api/analytics.types'

interface AnalyticsTopProductsProps {
  products: AnalyticsTopProduct[]
  isLoading: boolean
  className?: string
}

/** A region of a DataPanel; the parent provides the surface. */
export function AnalyticsTopProducts({
  products,
  isLoading,
  className,
}: AnalyticsTopProductsProps) {
  const copy = useCopy()
  const ranked = [...products].sort((a, b) => b.revenue - a.revenue)
  const maxRevenue = Math.max(...products.map((p) => p.revenue), 1)

  return (
    <section
      aria-labelledby='top-products-title'
      className={cn('flex min-w-0 flex-col gap-3 p-4 sm:p-5', className)}
    >
      <SectionHeader
        as='h3'
        id='top-products-title'
        title={copy('Produk terlaris', 'Top products')}
        description={copy('Diurutkan dari penjualan', 'Ranked by sales')}
      />

      {isLoading ? (
        <div role='status' className='flex flex-col gap-3 py-1'>
          <span className='sr-only'>{copy('Memuat…', 'Loading…')}</span>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className='bg-surface-hover h-5 w-full animate-pulse rounded'
            />
          ))}
        </div>
      ) : ranked.length === 0 ? (
        <EmptyState
          title={copy(
            'Belum ada penjualan produk.',
            'No product sales in this period.'
          )}
          className='py-8'
        />
      ) : (
        <table className='w-full text-[13px] tabular-nums'>
          <thead className='text-fg-muted text-xs'>
            <tr className='border-divider border-b'>
              <th scope='col' className='w-6 pb-2 text-left font-medium'>
                #
              </th>
              <th scope='col' className='pb-2 text-left font-medium'>
                {copy('Produk', 'Product')}
              </th>
              <th scope='col' className='px-2 pb-2 text-right font-medium'>
                {copy('Terjual', 'Sold')}
              </th>
              <th scope='col' className='pb-2 text-right font-medium'>
                {copy('Penjualan', 'Sales')}
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((product, index) => (
              <tr
                key={product.productId}
                className='border-divider border-b last:border-0'
              >
                <td className='text-fg-muted py-2'>{index + 1}</td>
                <th
                  scope='row'
                  className='w-full max-w-0 truncate py-2 pr-2 text-left font-medium'
                >
                  {product.name}
                </th>
                <td className='text-fg-secondary px-2 py-2 text-right'>
                  {formatCount(product.quantity)}
                </td>
                <td className='py-2'>
                  <div className='flex items-center justify-end gap-2'>
                    <span
                      aria-hidden
                      className='bg-surface-hover hidden h-1 w-12 overflow-hidden rounded-full sm:block'
                    >
                      <span
                        className='bg-series-primary block h-full rounded-full'
                        style={{
                          width: `${(product.revenue / maxRevenue) * 100}%`,
                        }}
                      />
                    </span>
                    <span className='whitespace-nowrap'>
                      {formatMoney(product.revenue)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
