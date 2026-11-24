import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Skeleton } from '@/components/ui/skeleton'
import type { Fees } from '../street-food.types'

/**
 * What the business owes the platform. It is added to the next automatic subscription payment,
 * so there is nothing to pay here: the point is that the charge is never a surprise.
 */
export function FeesCard({
  fees,
  loading,
  failed,
}: {
  fees: Fees | undefined
  loading: boolean
  failed: boolean
}) {
  const copy = useCopy()
  // The API counts in 1/100 rupiah.
  const rupiah = (minor: number) => formatMoney(minor / 100)

  return (
    <section
      className='bg-card shadow-surface rounded-lg border p-4'
      aria-label={copy('Biaya platform', 'Platform fees')}
    >
      <h2 className='text-base font-semibold'>
        {copy('Biaya platform', 'Platform fees')}
      </h2>
      {loading ? (
        <Skeleton className='mt-3 h-8 w-40' />
      ) : failed || !fees ? (
        <p className='text-fg-muted mt-1 text-sm'>
          {copy(
            'Belum bisa dimuat. Coba lagi nanti.',
            'Could not load yet. Try again later.'
          )}
        </p>
      ) : (
        <>
          <p className='mt-2 text-2xl font-semibold tabular-nums'>
            {rupiah(fees.totalMinor)}
          </p>
          <p className='text-fg-muted text-[13px]'>
            {fees.totalMinor === 0
              ? copy('Belum ada biaya terutang.', 'Nothing owed yet.')
              : copy(
                  'Ditambahkan ke pembayaran langganan otomatis berikutnya.',
                  'Added to your next automatic subscription payment.'
                )}
          </p>
          {fees.lines.length > 0 && (
            <ul className='mt-3 divide-y border-t text-sm'>
              {fees.lines.map((line) => (
                <li
                  key={line.code}
                  className='flex items-center justify-between gap-3 py-2'
                >
                  <span>
                    {line.label}
                    <span className='text-fg-muted'>
                      {' · '}
                      {copy(`${line.orders} pesanan`, `${line.orders} orders`)}
                    </span>
                  </span>
                  <span className='font-medium tabular-nums'>
                    {rupiah(line.amountMinor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
