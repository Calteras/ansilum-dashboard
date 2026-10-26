import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2 } from '@/components/icons'
import { formatDate } from '@/features/checkout/format'
import { STATUS_BADGE, cycleLabel, paymentMethodLabel } from '../billing-labels'
import { getInvoiceApi } from '../subscription.api'
import {
  subscriptionKeys,
  usePaymentHistoryQuery,
} from '../subscription.queries'
import type { PaymentHistoryItem } from '../subscription.types'
import { BillingSection } from './billing-section'

/** Claude-style text links: plain underlined text that lines up with the row. */
const LINK =
  'text-brand-ink hover:text-foreground inline-flex items-center gap-1 underline underline-offset-4 disabled:opacity-50'

export function PaymentHistory() {
  const copy = useCopy()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState<string | null>(null)
  const history = usePaymentHistoryQuery(page)
  const rows = history.data?.data ?? []
  const totalPages = history.data?.meta.totalPages ?? 1

  async function download(row: PaymentHistoryItem) {
    setDownloading(row.id)
    try {
      const [invoice, { downloadInvoicePdf }] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: [...subscriptionKeys.all, 'invoice', row.id],
          queryFn: () => getInvoiceApi(row.id),
          staleTime: Infinity,
        }),
        // jsPDF is large; load it only when an invoice is actually downloaded.
        import('../invoice-pdf'),
      ])
      downloadInvoicePdf(invoice.data, copy)
    } catch {
      toast.error(
        copy(
          'Invoice belum bisa diunduh. Coba lagi.',
          'Couldn’t download the invoice. Try again.'
        )
      )
    } finally {
      setDownloading(null)
    }
  }

  return (
    <BillingSection
      labelledBy='billing-history'
      title={copy('Riwayat pembayaran', 'Payment history')}
    >
      {history.isPending ? (
        <p className='text-muted-foreground flex items-center gap-2 py-6 text-sm'>
          <Loader2 className='size-4 animate-spin' />
          {copy('Memuat pembayaran…', 'Loading payments…')}
        </p>
      ) : history.isError ? (
        <div
          role='alert'
          className='bg-card shadow-surface rounded-lg border p-4 text-sm'
        >
          {copy(
            'Riwayat pembayaran belum bisa dimuat.',
            'Payment history couldn’t be loaded.'
          )}{' '}
          <Button
            variant='link'
            className='h-auto p-0'
            onClick={() => void history.refetch()}
          >
            {copy('Coba lagi', 'Try again')}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className='text-muted-foreground py-2 text-sm'>
          {copy('Belum ada pembayaran.', 'No payments yet.')}
        </p>
      ) : (
        <>
          <div className='-mx-1 overflow-x-auto'>
            <table className='w-full min-w-[34rem] text-sm'>
              <thead>
                <tr className='text-left'>
                  <th className='px-1 pb-3 font-medium'>
                    {copy('Tanggal', 'Date')}
                  </th>
                  <th className='px-1 pb-3 font-medium'>
                    {copy('Deskripsi', 'Description')}
                  </th>
                  <th className='px-1 pb-3 text-right font-medium'>
                    {copy('Total', 'Total')}
                  </th>
                  <th className='px-1 ps-6 pb-3 font-medium'>
                    {copy('Status', 'Status')}
                  </th>
                  <th className='px-1 pb-3 font-medium'>
                    {copy('Tindakan', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const badge = STATUS_BADGE[row.paymentStatus]
                  const open =
                    row.paymentStatus === 'PENDING' &&
                    new Date(row.expiresAt).getTime() > Date.now()
                  return (
                    <tr key={row.id} className='border-t align-top'>
                      <td className='px-1 py-3 whitespace-nowrap'>
                        {formatDate(row.paidAt ?? row.createdAt)}
                      </td>
                      <td className='px-1 py-3'>
                        <div>
                          {row.tier
                            ? `${row.tier.charAt(0)}${row.tier.slice(1).toLowerCase()} · ${cycleLabel(copy, row.billingCycle)}`
                            : copy('Langganan', 'Subscription')}
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {row.kind === 'RENEWAL'
                            ? `${copy('Perpanjangan otomatis', 'Automatic renewal')} · `
                            : ''}
                          <span className='whitespace-nowrap'>
                            {paymentMethodLabel(
                              copy,
                              row.paymentType,
                              row.card
                            )}
                          </span>
                        </div>
                      </td>
                      <td className='px-1 py-3 text-right whitespace-nowrap tabular-nums'>
                        {formatMoney(row.amount)}
                      </td>
                      <td className='px-1 py-3 ps-6'>
                        <Badge variant={badge.variant}>
                          {copy(...badge.label)}
                        </Badge>
                      </td>
                      <td className='px-1 py-3 whitespace-nowrap'>
                        {row.invoiceNumber &&
                        (row.paymentStatus === 'PAID' ||
                          row.paymentStatus === 'REFUNDED') ? (
                          <button
                            type='button'
                            className={LINK}
                            disabled={downloading === row.id}
                            onClick={() => void download(row)}
                            aria-label={copy(
                              `Unduh PDF invoice ${row.invoiceNumber}`,
                              `Download PDF of invoice ${row.invoiceNumber}`
                            )}
                          >
                            {downloading === row.id && (
                              <Loader2 className='size-3.5 animate-spin' />
                            )}
                            {copy('Unduh PDF', 'Download PDF')}
                          </button>
                        ) : open ? (
                          <Link
                            to='/checkout'
                            search={{ order: row.id }}
                            className={LINK}
                          >
                            {copy('Lanjutkan', 'Continue')}
                          </Link>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className='flex items-center justify-between gap-3 text-sm'>
              <span className='text-muted-foreground'>
                {copy(
                  `Halaman ${page} dari ${totalPages}`,
                  `Page ${page} of ${totalPages}`
                )}
              </span>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page <= 1 || history.isFetching}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {copy('Sebelumnya', 'Previous')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page >= totalPages || history.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {copy('Berikutnya', 'Next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </BillingSection>
  )
}
