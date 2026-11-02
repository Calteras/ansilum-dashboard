import type { Reservation } from '../api/reservations.types'
import { wallClock, type WallClock } from './business-clock'

/**
 * How long a booking holds its table. Reservations have no end time, so a
 * table booked within this many minutes of the chosen time counts as taken.
 */
export const BOOKING_HOLD_MINUTES = 120

/** Table names compare without case or surrounding spaces, as cashiers type them. */
export const tableKey = (name: string) => name.trim().toLowerCase()

/** Booking times per table name, on the business clock, from open reservations. */
export function bookingsByTable(
  reservations: Pick<
    Reservation,
    'tableNumber' | 'reservationDate' | 'status'
  >[],
  timeZone: string
) {
  const byTable = new Map<string, WallClock[]>()
  for (const reservation of reservations) {
    if (reservation.status !== 'RESERVED' || !reservation.tableNumber) continue
    const at = wallClock(reservation.reservationDate, timeZone)
    if (!at) continue
    const key = tableKey(reservation.tableNumber)
    byTable.set(key, [...(byTable.get(key) ?? []), at])
  }
  for (const times of byTable.values())
    times.sort((a, b) => a.minutes - b.minutes)
  return byTable
}

/** Whether a booking holds the table at the chosen time (from `wallMinutes`). */
export function isTaken(bookings: WallClock[], at: number | null) {
  if (at === null) return false
  return bookings.some((b) => Math.abs(b.minutes - at) < BOOKING_HOLD_MINUTES)
}
