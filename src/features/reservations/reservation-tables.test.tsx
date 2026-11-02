import type { PropsWithChildren, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTableLayoutApi } from '@/features/tables/api/tables.api'
import type { TableLayoutResponse } from '@/features/tables/api/tables.types'
import { listReservationsApi } from './api/reservations.api'
import type { Reservation } from './api/reservations.types'
import { ReservationTablePicker } from './components/reservation-table-picker'
import {
  bookingsByTable,
  isTaken,
  reservationInstant,
} from './lib/table-availability'

vi.mock('@/features/tables/api/tables.api', () => ({
  getTableLayoutApi: vi.fn(),
}))
vi.mock('./api/reservations.api', () => ({
  listReservationsApi: vi.fn(),
}))
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

const DAY = '2030-06-15'
const at = (time: string) => new Date(`${DAY}T${time}:00`).toISOString()
const booking = (overrides: Partial<Reservation>) =>
  ({
    status: 'RESERVED',
    tableNumber: 'T1',
    reservationDate: at('19:00'),
    ...overrides,
  }) as Reservation

const table = (id: string, name: string, capacity = 4) => ({
  id,
  name,
  capacity,
  shape: 'SQUARE' as const,
  status: 'AVAILABLE' as const,
  posX: 0,
  posY: 0,
  width: 80,
  height: 80,
})

const layout: TableLayoutResponse = {
  version: 1,
  savedAt: '2030-01-01T00:00:00.000Z',
  totalTables: 3,
  sections: [
    { id: 's2', name: 'Teras', order: 2, tables: [table('t3', 'TR-1', 2)] },
    {
      id: 's1',
      name: 'Dalam',
      order: 1,
      tables: [table('t1', 'T1'), table('t2', 'T2', 2)],
    },
    { id: 's3', name: 'Kosong', order: 3, tables: [] },
  ],
}

describe('table availability', () => {
  it('collects open bookings per table name, ignoring case and spacing', () => {
    const map = bookingsByTable([
      booking({ tableNumber: ' t1 ' }),
      booking({ tableNumber: 'T1', reservationDate: at('12:00') }),
      booking({ tableNumber: 'T2', status: 'VOIDED' }),
      booking({ tableNumber: undefined }),
    ])
    expect([...map.keys()]).toEqual(['t1'])
    expect(map.get('t1')!.map((d) => d.toISOString())).toEqual([
      at('12:00'),
      at('19:00'),
    ])
  })

  it('holds a table for two hours either side of a booking', () => {
    const booked = [new Date(at('19:00'))]
    expect(isTaken(booked, reservationInstant(DAY, '20:30'))).toBe(true)
    expect(isTaken(booked, reservationInstant(DAY, '17:30'))).toBe(true)
    expect(isTaken(booked, reservationInstant(DAY, '21:00'))).toBe(false)
    expect(isTaken(booked, reservationInstant(DAY, ''))).toBe(false)
    expect(reservationInstant(DAY, '19:00')?.toISOString()).toBe(at('19:00'))
  })
})

describe('ReservationTablePicker', () => {
  beforeEach(() => {
    vi.mocked(getTableLayoutApi).mockReset()
    vi.mocked(listReservationsApi).mockReset()
  })

  function setup(
    props: Partial<Parameters<typeof ReservationTablePicker>[0]> = {}
  ) {
    const onChange = vi.fn()
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    render(
      <ReservationTablePicker
        outletId='outlet-1'
        day={DAY}
        time='19:30'
        partySize={3}
        value=''
        onChange={onChange}
        {...props}
      />,
      { wrapper }
    )
    return onChange
  }

  it('shows the outlet’s real sections and blocks tables booked around that time', async () => {
    vi.mocked(getTableLayoutApi).mockResolvedValue(layout)
    vi.mocked(listReservationsApi).mockResolvedValue({
      data: [booking({})],
      meta: { total: 1, limit: 200, offset: 0 },
    })
    const onChange = setup()

    // Sections in their configured order; empty sections are left out.
    const tabs = await screen.findAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Dalam', 'Teras'])

    const booked = await screen.findByRole('button', { name: /T1/ })
    await waitFor(() => expect(booked).toBeDisabled())
    expect(booked).toHaveTextContent('Booked 19:00')

    await userEvent.click(screen.getByRole('button', { name: /T2/ }))
    expect(onChange).toHaveBeenCalledWith('t2')
    // Only that day's bookings were asked for.
    expect(listReservationsApi).toHaveBeenCalledWith({
      outletId: 'outlet-1',
      startDate: DAY,
      endDate: DAY,
      limit: 200,
    })
  })

  it('warns when the party is larger than the chosen table', async () => {
    vi.mocked(getTableLayoutApi).mockResolvedValue(layout)
    vi.mocked(listReservationsApi).mockResolvedValue({
      data: [],
      meta: { total: 0, limit: 200, offset: 0 },
    })
    setup({ value: 't2' })
    expect(
      await screen.findByText('T2 seats 2; this party is 3.')
    ).toBeInTheDocument()
  })

  it('lets an outlet without tables book without one', async () => {
    vi.mocked(getTableLayoutApi).mockResolvedValue({
      ...layout,
      totalTables: 0,
      sections: [],
    })
    vi.mocked(listReservationsApi).mockResolvedValue({
      data: [],
      meta: { total: 0, limit: 200, offset: 0 },
    })
    setup({ day: null })
    expect(
      await screen.findByText(/This outlet has no tables yet/)
    ).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/tables')
    // No day chosen: no booking lookup.
    expect(listReservationsApi).not.toHaveBeenCalled()
  })
})
