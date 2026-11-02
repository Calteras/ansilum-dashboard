import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useEmployeesQuery } from '@/features/employees/api/employees.queries'
import { useCancelReservationMutation } from '../api/reservations.queries'
import type { PaymentMethod, Reservation } from '../api/reservations.types'
import { paymentMethodOptions } from '../data/data'
import { paidAmount } from '../lib/reservation-money'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Reservation
}

/** Roles the server accepts as the approver of a cancellation. */
const APPROVER_ROLES = ['OWNER', 'MANAGER', 'SUPERVISOR']

/**
 * Cancelling needs a reason and an approving Owner, Manager or Supervisor;
 * a paid deposit must be returned and recorded with its method.
 */
export function ReservationsCancelDialog({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const copy = useCopy()
  const cancel = useCancelReservationMutation()
  const employees = useEmployeesQuery({ pageSize: 100 })
  const approvers = (employees.data?.data ?? []).filter(
    (e) => e.isActive && APPROVER_ROLES.includes(e.role)
  )
  const paid = paidAmount(currentRow)
  const [reason, setReason] = useState('')
  const [approver, setApprover] = useState('')
  const [refund, setRefund] = useState<PaymentMethod>('CASH')
  const ready = reason.trim().length > 0 && !!approver

  const close = (next: boolean) => {
    if (cancel.isPending) return
    if (!next) {
      setReason('')
      setApprover('')
      setRefund('CASH')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {copy('Batalkan reservasi?', 'Cancel this reservation?')}
          </DialogTitle>
          <DialogDescription>
            {copy(
              `${currentRow.customerName} · ${currentRow.transactionNo}. Reservasi dan pesanannya dibatalkan, tidak bisa dikembalikan.`,
              `${currentRow.customerName} · ${currentRow.transactionNo}. The booking and its pre-order are voided; this cannot be undone.`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='cancel-reason'>{copy('Alasan', 'Reason')}</Label>
            <Textarea
              id='cancel-reason'
              rows={2}
              maxLength={300}
              className='resize-none'
              placeholder={copy(
                'mis. Tamu tidak datang',
                'e.g. Guest did not show up'
              )}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='cancel-approver'>
              {copy('Disetujui oleh', 'Approved by')}
            </Label>
            <Select value={approver} onValueChange={setApprover}>
              <SelectTrigger id='cancel-approver' className='w-full'>
                <SelectValue
                  placeholder={
                    employees.isLoading
                      ? copy('Memuat…', 'Loading…')
                      : copy(
                          'Pilih pemilik, manajer, atau supervisor',
                          'Choose an owner, manager or supervisor'
                        )
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {approvers.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · {e.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!employees.isLoading && approvers.length === 0 && (
              <p className='text-fg-muted text-[13px]'>
                {copy(
                  'Belum ada karyawan pemilik, manajer, atau supervisor yang aktif. ',
                  'No active owner, manager or supervisor employee yet. '
                )}
                <Link
                  to='/employees'
                  className='text-foreground underline-offset-4 hover:underline'
                >
                  {copy('Tambah karyawan', 'Add an employee')}
                </Link>
              </p>
            )}
          </div>

          {paid > 0 && (
            <div className='grid gap-2'>
              <Label htmlFor='cancel-refund'>
                {copy(
                  `Kembalikan deposit ${formatMoney(paid)} lewat`,
                  `Return the ${formatMoney(paid)} deposit by`
                )}
              </Label>
              <Select
                value={refund}
                onValueChange={(v) => setRefund(v as PaymentMethod)}
              >
                <SelectTrigger id='cancel-refund' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {copy(m.id, m.en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-fg-muted text-[13px]'>
                {copy(
                  'Pengembalian tunai tercatat di laci kas kasir.',
                  'A cash return is recorded in the cashier’s drawer.'
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => close(false)}
            disabled={cancel.isPending}
          >
            {copy('Kembali', 'Back')}
          </Button>
          <Button
            variant='destructive'
            disabled={!ready || cancel.isPending}
            onClick={async () => {
              try {
                await cancel.mutateAsync({
                  id: currentRow.id,
                  data: {
                    voidedById: approver,
                    voidReason: reason.trim(),
                    ...(paid > 0 ? { refundPaymentMethod: refund } : {}),
                  },
                })
                close(false)
              } catch {
                // Toast shown by the mutation
              }
            }}
          >
            {cancel.isPending
              ? copy('Membatalkan…', 'Cancelling…')
              : copy('Batalkan reservasi', 'Cancel reservation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
