import type { Reservation } from '../api/reservations.types'

/** Money actually received: deposits and payments, net of any returns. */
export function paidAmount(reservation: Pick<Reservation, 'payments'>) {
  return (reservation.payments ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
}

/** What the guest still owes on the pre-order. */
export function amountDue(
  reservation: Pick<Reservation, 'payments' | 'grandTotal'>
) {
  return Math.max(Number(reservation.grandTotal) - paidAmount(reservation), 0)
}
