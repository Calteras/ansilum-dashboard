import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ErrorState } from '@/components/data-display/data-states'
import { Metric, MetricGroup } from '@/components/data-display/metric'
import { usePromotionPerformanceQuery } from '../api/pricing.queries'
import type { Promotion } from '../api/pricing.types'
import { formatUses, promotionBenefit, usageSummary } from '../lib/pricing'

/** Uses, given discount and associated sales for one promotion. */
export function PromotionPerformanceSheet({
  promotion,
  onClose,
}: {
  promotion: Promotion | null
  onClose: () => void
}) {
  const copy = useCopy()
  const query = usePromotionPerformanceQuery(promotion?.id)
  const data = query.data
  const usage = data ? usageSummary(data.uses) : null
  const budget = promotion?.rules?.budgetAmount
  const loading = query.isLoading

  return (
    <Sheet open={!!promotion} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        className='w-full overflow-y-auto sm:max-w-md'
        // Focus the panel, not the first metric, so its definition tooltip stays shut.
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).focus()
        }}
      >
        <SheetHeader>
          <SheetTitle>{promotion?.name}</SheetTitle>
          <SheetDescription>
            {promotion && (
              <>
                <span className='font-mono'>{promotion.code}</span>
                {' · '}
                {promotionBenefit(promotion, copy)}
              </>
            )}
          </SheetDescription>
        </SheetHeader>
        <div className='grid gap-4 px-4 pb-6'>
          {query.isError ? (
            <ErrorState
              title={copy('Kinerja belum termuat', "Performance couldn't load")}
              description={query.error.message}
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          ) : (
            <>
              <MetricGroup className='border-divider grid-cols-2 rounded-lg border'>
                <Metric
                  label={copy('Dipakai', 'Redeemed')}
                  definition={copy(
                    'Transaksi yang sudah dibayar dengan promo ini.',
                    'Paid sales that received this promotion.'
                  )}
                  value={usage ? formatUses(usage.redeemed.count) : '—'}
                  footer={
                    usage &&
                    usage.reserved.count > 0 &&
                    copy(
                      `${formatUses(usage.reserved.count)} sedang ditahan`,
                      `${formatUses(usage.reserved.count)} on hold`
                    )
                  }
                  isLoading={loading}
                />
                <Metric
                  label={copy('Potongan diberikan', 'Discount given')}
                  definition={copy(
                    'Nilai potongan yang benar-benar dialokasikan ke transaksi yang sudah dibayar.',
                    'The discount actually allocated to paid sales.'
                  )}
                  value={usage ? formatMoney(usage.redeemed.amount) : '—'}
                  footer={
                    budget != null && usage
                      ? copy(
                          `${formatMoney(usage.committed)} dari anggaran ${formatMoney(budget)}`,
                          `${formatMoney(usage.committed)} of ${formatMoney(budget)} budget`
                        )
                      : undefined
                  }
                  isLoading={loading}
                />
                <Metric
                  label={copy('Penjualan terkait', 'Associated sales')}
                  definition={copy(
                    'Penjualan bersih (tanpa pajak dan biaya layanan) dari transaksi yang memakai promo ini, setelah refund. Satu transaksi bisa terhitung di beberapa promo.',
                    'Net sales (before tax and service) of sales using this promotion, after refunds. One sale can count toward several promotions.'
                  )}
                  value={data ? formatMoney(data.netSalesAfterRefunds) : '—'}
                  footer={
                    data &&
                    copy(
                      `${formatUses(data.paidSales)} transaksi`,
                      `${formatUses(data.paidSales)} sales`
                    )
                  }
                  isLoading={loading}
                />
                <Metric
                  label={copy('Laba kotor', 'Gross profit')}
                  definition={copy(
                    'Penjualan terkait dikurangi HPP item yang terjual, setelah refund.',
                    'Associated sales less the cost of items sold, after refunds.'
                  )}
                  value={
                    data
                      ? data.grossProfitAfterRefunds !== null
                        ? formatMoney(data.grossProfitAfterRefunds)
                        : '—'
                      : '—'
                  }
                  footer={
                    data &&
                    data.missingCostLines > 0 &&
                    copy(
                      `${formatUses(data.missingCostLines)} item tanpa HPP`,
                      `${formatUses(data.missingCostLines)} items without cost`
                    )
                  }
                  isLoading={loading}
                />
              </MetricGroup>
              {data && (
                <dl className='text-fg-secondary grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[13px]'>
                  <dt>{copy('Refund', 'Refunds')}</dt>
                  <dd className='text-end tabular-nums'>
                    {formatMoney(data.refundAmount)}
                  </dd>
                  <dt>{copy('Dilepas', 'Released')}</dt>
                  <dd className='text-end tabular-nums'>
                    {formatUses(usage!.released)}
                  </dd>
                </dl>
              )}
              {usage && usage.unknownBenefit > 0 && (
                <p className='text-fg-muted text-[13px]'>
                  {copy(
                    `${formatUses(usage.unknownBenefit)} pemakaian berasal dari sebelum pencatatan nilai potongan, jadi tidak ikut dalam potongan diberikan.`,
                    `${formatUses(usage.unknownBenefit)} uses predate recorded discount amounts and are not in Discount given.`
                  )}
                </p>
              )}
              <p className='text-fg-muted text-[13px]'>
                {copy(
                  'Dilepas: kuota yang kembali karena transaksi dibatalkan, kedaluwarsa, atau promonya dilepas saat diubah. Penjualan terkait bukan berarti disebabkan promo.',
                  'Released: uses returned because a sale was voided, expired or repriced without the promotion. Associated sales are not proof the promotion caused them.'
                )}
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
