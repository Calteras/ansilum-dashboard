import { useMemo } from 'react'
import { formatMoney } from '@/lib/format'
import { formatCount, formatPercent } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { SectionHeader } from '@/components/data-display/data-panel'
import { EmptyState } from '@/components/data-display/data-states'
import type { Transaction } from '../../api/dashboard.types'
import { buildPaymentRows } from '../../utils/sales-analytics'
import { usePaymentMethodLabel } from './use-payment-method-label'

interface PaymentMethodsProps {
  breakdown: Record<string, number> | undefined
  /** Complete CLOSED order list for order counts; null when unavailable or capped. */
  transactions: Pick<Transaction, 'payments'>[] | null
  isLoading: boolean
  isStale: boolean
  className?: string
}

/**
 * A ranked table rather than a donut: exact amounts and order counts, with a
 * share bar per row. Reads equally well with one method or six.
 */
export function PaymentMethods({
  breakdown,
  transactions,
  isLoading,
  isStale,
  className,
}: PaymentMethodsProps) {
  const copy = useCopy()
  const methodLabel = usePaymentMethodLabel()
  const { rows, unused } = useMemo(
    () => buildPaymentRows(breakdown ?? {}, transactions),
    [breakdown, transactions]
  )

  return (
    <section
      aria-labelledby='payment-methods-title'
      className={cn('flex min-w-0 flex-col gap-3 p-4 sm:p-5', className)}
    >
      <SectionHeader
        id='payment-methods-title'
        title={copy('Metode pembayaran', 'Payment methods')}
        description={copy(
          'Porsi dari total pembayaran',
          'Share of payments received'
        )}
      />

      {isLoading ? (
        <div role='status' className='flex flex-col gap-3 py-1'>
          <span className='sr-only'>{copy('Memuat…', 'Loading…')}</span>
          {[0, 1].map((i) => (
            <span
              key={i}
              className='bg-surface-hover h-5 w-full animate-pulse rounded'
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={copy('Belum ada pembayaran.', 'No payments recorded.')}
          description={copy(
            'Pembayaran untuk pesanan selesai akan muncul di sini.',
            'Payments for closed orders will appear here.'
          )}
          className='py-6'
        />
      ) : (
        <table
          className={cn(
            'w-full text-[13px] tabular-nums transition-opacity',
            isStale && 'opacity-50'
          )}
        >
          <thead className='text-fg-muted text-xs'>
            <tr className='border-divider border-b'>
              <th scope='col' className='pb-2 text-left font-medium'>
                {copy('Metode', 'Method')}
              </th>
              <th scope='col' className='px-2 pb-2 text-right font-medium'>
                {copy('Pesanan', 'Orders')}
              </th>
              <th scope='col' className='px-2 pb-2 text-right font-medium'>
                {copy('Jumlah', 'Amount')}
              </th>
              <th scope='col' className='pb-2 text-right font-medium'>
                {copy('Porsi', 'Share')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.method}
                className='border-divider border-b last:border-0'
              >
                <th scope='row' className='py-2 text-left font-medium'>
                  {methodLabel(row.method)}
                </th>
                <td className='text-fg-secondary px-2 py-2 text-right'>
                  {row.orders == null ? '—' : formatCount(row.orders)}
                </td>
                <td className='px-2 py-2 text-right whitespace-nowrap'>
                  {formatMoney(row.amount)}
                </td>
                <td className='py-2'>
                  <div className='flex items-center justify-end gap-2'>
                    <span
                      aria-hidden
                      className='bg-surface-hover hidden h-1 w-8 overflow-hidden rounded-full sm:block'
                    >
                      <span
                        className='bg-series-primary block h-full rounded-full'
                        style={{ width: `${Math.max(row.share * 100, 2)}%` }}
                      />
                    </span>
                    <span className='w-12 text-right'>
                      {formatPercent(row.share)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isLoading && rows.length > 0 && unused.length > 0 && (
        <p className='text-fg-muted text-xs leading-5'>
          {copy('Tidak dipakai', 'Not used')}:{' '}
          {unused.map(methodLabel).join(', ')}
        </p>
      )}
    </section>
  )
}
