import type { Reservation } from '../api/reservations.types'

/**
 * How long a booking holds its table. Reservations have no end time, so a
 * table booked within this many minutes of the chosen time counts as taken.
 */
export const BOOKING_HOLD_MINUTES = 120

/** Table names compare without case or surrounding spaces, as cashiers type them. */
export const tableKey = (name: string) => name.trim().toLowerCase()

/** Booking times per table name, from the outlet's open reservations. */
export function bookingsByTable(
  reservations: Pick<
    Reservation,
    'tableNumber' | 'reservationDate' | 'status'
  >[]
) {
  const byTable = new Map<string, Date[]>()
  for (const reservation of reservations) {
    if (reservation.status !== 'RESERVED' || !reservation.tableNumber) continue
    const at = new Date(reservation.reservationDate)
    if (!Number.isFinite(at.getTime())) continue
    const key = tableKey(reservation.tableNumber)
    byTable.set(key, [...(byTable.get(key) ?? []), at])
  }
  for (const times of byTable.values())
    times.sort((a, b) => a.getTime() - b.getTime())
  return byTable
}

/** Whether a booking holds the table at the chosen time. */
export function isTaken(bookings: Date[], at: Date | null) {
  if (!at) return false
  const hold = BOOKING_HOLD_MINUTES * 60_000
  return bookings.some((b) => Math.abs(b.getTime() - at.getTime()) < hold)
}

/** The chosen day and time as one instant in the browser's time zone. */
export function reservationInstant(day: string, time: string) {
  if (!day || !/^\d{2}:\d{2}$/.test(time)) return null
  const at = new Date(`${day}T${time}:00`)
  return Number.isFinite(at.getTime()) ? at : null
}
