import { useTableLayoutQuery } from '@/features/tables/api/tables.queries'
import type { TableLayoutTable } from '@/features/tables/api/tables.types'
import { useReservationsQuery } from '../api/reservations.queries'
import {
  bookingsByTable,
  isTaken,
  reservationInstant,
  tableKey,
} from '../lib/table-availability'

/**
 * The outlet's configured tables (the same layout the POS uses), with the
 * bookings already made for the chosen day. Live status describes now, so
 * it is shown only for bookings today and never blocks a later booking.
 */
export function useReservationTables(
  outletId: string,
  day: string | null,
  time: string
) {
  const layout = useTableLayoutQuery(outletId)
  // Only the chosen business day's open bookings matter.
  const booked = useReservationsQuery(
    {
      outletId,
      startDate: day ?? undefined,
      endDate: day ?? undefined,
      limit: 200,
    },
    { enabled: !!day }
  )
  const sections = (layout.data?.sections ?? [])
    .filter((s) => s.tables.length > 0)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const tables = sections.flatMap((s) => s.tables)
  const bookings = day ? bookingsByTable(booked.data?.data ?? []) : new Map()
  const at = day ? reservationInstant(day, time) : null
  return {
    layout,
    sections,
    tables,
    bookingsFor: (table: TableLayoutTable): Date[] =>
      bookings.get(tableKey(table.name)) ?? [],
    taken: (table: TableLayoutTable) =>
      isTaken(bookings.get(tableKey(table.name)) ?? [], at),
    bookingsLoading: !!day && booked.isLoading,
  }
}
