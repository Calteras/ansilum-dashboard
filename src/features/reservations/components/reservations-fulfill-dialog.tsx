import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useFulfillReservationMutation } from '../api/reservations.queries'
import type { Reservation } from '../api/reservations.types'
import { amountDue } from '../lib/reservation-money'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Reservation
}

/** The guest has arrived: open the pre-order as a sale. */
export function ReservationsFulfillDialog({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const copy = useCopy()
  const fulfillMutation = useFulfillReservationMutation()
  const due = amountDue(currentRow)

  const handleConfirm = async () => {
    try {
      await fulfillMutation.mutateAsync(currentRow.id)
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!fulfillMutation.isPending) {
          onOpenChange(state)
        }
      }}
      handleConfirm={handleConfirm}
      disabled={fulfillMutation.isPending}
      title={copy('Tamu sudah datang?', 'Has the guest arrived?')}
      desc={
        <div className='space-y-2'>
          <p>
            {copy(
              `Pesanan ${currentRow.customerName} (${currentRow.transactionNo}) dibuka sebagai penjualan dan stoknya dikurangi.`,
              `${currentRow.customerName}'s pre-order (${currentRow.transactionNo}) opens as a sale and its stock is deducted.`
            )}
            {currentRow.tableNumber &&
              copy(
                ` Meja ${currentRow.tableNumber} ditandai terisi bila sedang kosong.`,
                ` Table ${currentRow.tableNumber} is marked in use if it is free.`
              )}
          </p>
          <p className='text-fg-muted'>
            {due > 0
              ? copy(
                  `Sisa ${formatMoney(due)} dibayar di kasir.`,
                  `${formatMoney(due)} is left to pay at the register.`
                )
              : copy(
                  'Sudah lunas: transaksi langsung selesai.',
                  'Fully paid: the sale completes right away.'
                )}
          </p>
        </div>
      }
      confirmText={
        fulfillMutation.isPending
          ? copy('Memproses…', 'Processing…')
          : copy('Proses kedatangan', 'Check in')
      }
    />
  )
}
