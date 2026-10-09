import type { ReservationStatus } from '../api/reservations.types'

export const reservationStatusStyles = new Map<ReservationStatus, string>([
  [
    'RESERVED',
    'bg-blue-100/30 text-blue-900 dark:text-blue-200 border-blue-200',
  ],
  [
    'OPEN',
    'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200',
  ],
  [
    'CLOSED',
    'bg-neutral-300/40 border-neutral-300',
  ],
  [
    'VOIDED',
    'bg-red-100/30 text-red-900 dark:text-red-200 border-red-200',
  ],
])

export const reservationStatuses = [
  { label: 'Reserved', value: 'RESERVED' as ReservationStatus },
  { label: 'Open', value: 'OPEN' as ReservationStatus },
  { label: 'Closed', value: 'CLOSED' as ReservationStatus },
  { label: 'Voided', value: 'VOIDED' as ReservationStatus },
] as const
