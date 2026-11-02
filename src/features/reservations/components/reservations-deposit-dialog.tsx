import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddDepositMutation } from '../api/reservations.queries'
import type { PaymentMethod, Reservation } from '../api/reservations.types'
import { paymentMethodOptions } from '../data/data'
import { amountDue, paidAmount } from '../lib/reservation-money'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Reservation
}

/**
 * Records money received in advance. The request id is kept for the attempt,
 * so retrying after a timeout cannot record the deposit twice.
 */
export function ReservationsDepositDialog({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const copy = useCopy()
  const deposit = useAddDepositMutation()
  const paid = paidAmount(currentRow)
  const due = amountDue(currentRow)
  const requested = Number(currentRow.depositAmount ?? 0)
  const suggested = Math.min(Math.max(requested - paid, 0), due)
  const [amount, setAmount] = useState(suggested ? String(suggested) : '')
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [attempt, setAttempt] = useState(() => crypto.randomUUID())
  const value = Number(amount)
  const valid = Number.isInteger(value) && value >= 1 && value <= due

  const close = (next: boolean) => {
    if (deposit.isPending) return
    if (!next) {
      setAmount(suggested ? String(suggested) : '')
      setMethod('CASH')
      setAttempt(crypto.randomUUID())
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{copy('Terima deposit', 'Take a deposit')}</DialogTitle>
          <DialogDescription>
            {copy(
              `${currentRow.customerName} · ${currentRow.transactionNo}. Sudah dibayar ${formatMoney(paid)} dari total ${formatMoney(currentRow.grandTotal)}.`,
              `${currentRow.customerName} · ${currentRow.transactionNo}. ${formatMoney(paid)} paid of ${formatMoney(currentRow.grandTotal)}.`
            )}
          </DialogDescription>
        </DialogHeader>

        {due <= 0 ? (
          <p className='text-sm'>
            {copy('Pesanan ini sudah lunas.', 'This pre-order is fully paid.')}
          </p>
        ) : (
          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='deposit-amount'>
                {copy('Jumlah (Rp)', 'Amount (Rp)')}
              </Label>
              <Input
                id='deposit-amount'
                inputMode='numeric'
                className='tabular-nums'
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                aria-invalid={!!amount && !valid}
              />
              <p
                className={
                  amount && !valid
                    ? 'text-status-danger text-[13px]'
                    : 'text-fg-muted text-[13px]'
                }
              >
                {copy(
                  `Paling banyak ${formatMoney(due)}, sisa yang belum dibayar.`,
                  `Up to ${formatMoney(due)}, the unpaid balance.`
                )}
                {requested > 0 &&
                  copy(
                    ` Deposit yang diminta ${formatMoney(requested)}.`,
                    ` Requested deposit: ${formatMoney(requested)}.`
                  )}
              </p>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='deposit-method'>
                {copy('Metode pembayaran', 'Payment method')}
              </Label>
              <Select
                value={method}
                onValueChange={(v) => setMethod(v as PaymentMethod)}
              >
                <SelectTrigger id='deposit-method' className='w-full'>
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
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => close(false)}
            disabled={deposit.isPending}
          >
            {copy('Batal', 'Cancel')}
          </Button>
          {due > 0 && (
            <Button
              disabled={!valid || deposit.isPending}
              onClick={async () => {
                try {
                  await deposit.mutateAsync({
                    id: currentRow.id,
                    data: {
                      clientPaymentId: attempt,
                      amount: value,
                      paymentMethod: method,
                    },
                  })
                  close(false)
                } catch {
                  // Toast shown by the mutation; the same id is reused on retry.
                }
              }}
            >
              {deposit.isPending
                ? copy('Menyimpan…', 'Saving…')
                : copy('Simpan deposit', 'Save deposit')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
