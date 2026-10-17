import { STATUS_TONE } from '@/lib/status-tone'
import type { ReservationStatus } from '../api/reservations.types'

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
