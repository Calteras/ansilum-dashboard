'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Reservation } from '../api/reservations.types'
import { useFulfillReservationMutation } from '../api/reservations.queries'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Reservation
}

export function ReservationsFulfillDialog({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const fulfillMutation = useFulfillReservationMutation()

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
      title='Fulfill Reservation'
      desc={
        <p>
          Are you sure you want to fulfill reservation{' '}
          <span className='font-semibold'>{currentRow.transactionNo}</span>? This
          will transition the reservation to OPEN status and deduct stock for all
          items.
        </p>
      }
      confirmText={fulfillMutation.isPending ? 'Fulfilling...' : 'Fulfill'}
    />
  )
}
