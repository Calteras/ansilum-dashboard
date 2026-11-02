import { STATUS_TONE } from '@/lib/status-tone'
import type {
  PaymentMethod,
  ReservationStatus,
} from '../api/reservations.types'

export const reservationStatusStyles = new Map<ReservationStatus, string>([
  [
    'RESERVED',
    STATUS_TONE.info,
  ],
  [
    'OPEN',
    STATUS_TONE.success,
  ],
  [
    'CLOSED',
    STATUS_TONE.neutral,
  ],
  [
    'VOIDED',
    STATUS_TONE.danger,
  ],
])

export const reservationStatuses = [
  { label: 'Reserved', value: 'RESERVED' as ReservationStatus },
  { label: 'Open', value: 'OPEN' as ReservationStatus },
  { label: 'Closed', value: 'CLOSED' as ReservationStatus },
  { label: 'Voided', value: 'VOIDED' as ReservationStatus },
] as const

/** Accepted payment methods (the API's enum), labelled in both languages. */
export const paymentMethodOptions: {
  value: PaymentMethod
  id: string
  en: string
}[] = [
  { value: 'CASH', id: 'Tunai', en: 'Cash' },
  { value: 'QRIS', id: 'QRIS', en: 'QRIS' },
  { value: 'DEBIT_CARD', id: 'Kartu debit', en: 'Debit card' },
  { value: 'CREDIT_CARD', id: 'Kartu kredit', en: 'Credit card' },
  { value: 'E_WALLET', id: 'E-wallet', en: 'E-wallet' },
  { value: 'BANK_TRANSFER', id: 'Transfer bank', en: 'Bank transfer' },
  { value: 'OTHER', id: 'Lainnya', en: 'Other' },
]

/** What each state means at the front of house. */
export const reservationStatusLabels: Record<
  ReservationStatus,
  { id: string; en: string }
> = {
  RESERVED: { id: 'Menunggu tamu', en: 'Awaiting guest' },
  OPEN: { id: 'Tamu datang', en: 'Guest arrived' },
  CLOSED: { id: 'Selesai', en: 'Completed' },
  VOIDED: { id: 'Dibatalkan', en: 'Cancelled' },
}
