'use client'

import { AlertTriangle } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Reservation } from '../api/reservations.types'
import { useCancelReservationMutation } from '../api/reservations.queries'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Reservation
}

export function ReservationsCancelDialog({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const cancelMutation = useCancelReservationMutation()

  const handleConfirm = async () => {
    try {
      await cancelMutation.mutateAsync(currentRow.id)
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!cancelMutation.isPending) {
          onOpenChange(state)
        }
      }}
      handleConfirm={handleConfirm}
      disabled={cancelMutation.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Cancel Reservation
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p>
            Are you sure you want to cancel reservation{' '}
            <span className='font-semibold'>{currentRow.transactionNo}</span> for{' '}
            <span className='font-semibold'>{currentRow.customerName}</span>?
          </p>
          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              This action will void the reservation and cannot be undone.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={cancelMutation.isPending ? 'Cancelling...' : 'Cancel Reservation'}
      destructive
    />
  )
}
