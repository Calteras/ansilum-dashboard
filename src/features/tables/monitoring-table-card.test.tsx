import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatMoney } from '@/lib/format'
import type {
  TableMonitoring,
  TableMonitoringResponse,
} from './api/tables.types'
import { MonitoringTableCard } from './index'

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children }: PropsWithChildren) => <a>{children}</a>,
}))

const table = (overrides: Partial<TableMonitoring>): TableMonitoring => ({
  id: 't1',
  name: 'T1',
  capacity: 4,
  shape: 'SQUARE',
  status: 'AVAILABLE',
  posX: 0,
  posY: 0,
  width: 80,
  height: 80,
  section: { id: 's', name: 'Dalam', order: 0 },
  activeTransaction: null,
  openOrders: 0,
  bookings: [],
  ...overrides,
})

const board = (tables: TableMonitoring[]): TableMonitoringResponse => ({
  outletId: 'o1',
  generatedAt: '2030-06-15T11:00:00.000Z',
  date: '2030-06-15',
  timeZone: 'Asia/Jakarta',
  bookingHoldMinutes: 120,
  totals: {
    tables: tables.length,
    byStatus: { AVAILABLE: 1, OCCUPIED: 1, RESERVED: 0, CLEANING: 0 },
    capacity: 8,
    occupiedCapacity: 4,
  },
  tables,
})

const booking = {
  id: 'b1',
  transactionNo: 'RSV-1',
  tableNumber: 'T1',
  customerName: 'Ayu',
  customerPhone: '0812',
  // 19:00 on the business clock
  reservationDate: '2030-06-15T12:00:00.000Z',
  grandTotal: 200000,
  paidAmount: 50000,
  depositAmount: 100000,
  itemCount: 2,
  notes: null,
}

function renderCard(t: TableMonitoring) {
  const client = new QueryClient()
  render(
    <QueryClientProvider client={client}>
      <MonitoringTableCard
        table={t}
        outletId='o1'
        board={board([t])}
        onRefresh={() => {}}
      />
    </QueryClientProvider>
  )
}

describe('MonitoringTableCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    // 18:00 on the business clock
    vi.setSystemTime(new Date('2030-06-15T11:00:00.000Z'))
  })
  afterEach(() => vi.useRealTimers())

  const party = {
    id: 's1',
    transactionNo: 'TRX-1',
    status: 'CLOSED',
    tableNumber: 'T1',
    grandTotal: 207000,
    createdAt: '2030-06-15T10:30:00.000Z',
    seatedAt: '2030-06-15T10:30:00.000Z',
    customerName: 'Budi',
    itemCount: 3,
    paidAmount: 207000,
    cashierName: 'Rina',
    guestCount: 4,
    orderCount: 2,
  }

  it('shows the party seated at the table, paid up front', () => {
    renderCard(
      table({ status: 'OCCUPIED', openOrders: 0, activeTransaction: party })
    )
    expect(screen.getByText('Budi')).toBeInTheDocument()
    expect(screen.getByText('4 of 4 seats')).toBeInTheDocument()
    expect(screen.getByText('Since 17:30')).toBeInTheDocument()
    expect(screen.getByText('2 orders')).toBeInTheDocument()
    expect(screen.getByText('3 items')).toBeInTheDocument()
    expect(screen.getByText('Rina')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText(formatMoney(207000))).toBeInTheDocument()
  })

  it('shows what is still owed, and a bill left on a cleared table', () => {
    renderCard(
      table({
        status: 'OCCUPIED',
        openOrders: 1,
        activeTransaction: { ...party, paidAmount: 103500 },
      })
    )
    expect(screen.getByText(`${formatMoney(103500)} paid`)).toBeInTheDocument()
    cleanup()
    renderCard(table({ openOrders: 1 }))
    expect(
      screen.getByText('1 unpaid bill left on this table')
    ).toBeInTheDocument()
  })

  it('shows the day’s bookings and holds a free table near one', () => {
    renderCard(table({ bookings: [booking] }))
    expect(screen.getByText('Held for Ayu at 19:00')).toBeInTheDocument()
    expect(screen.getByText('Booked today')).toBeInTheDocument()
    expect(screen.getByText('19:00')).toBeInTheDocument()
    expect(
      screen.getByText(`2 items · ${formatMoney(50000)} paid`)
    ).toBeInTheDocument()
  })

  it('does not hold a table for a booking hours away', () => {
    renderCard(
      table({
        bookings: [{ ...booking, reservationDate: '2030-06-15T15:00:00.000Z' }],
      })
    )
    expect(screen.queryByText(/Held for/)).not.toBeInTheDocument()
    expect(screen.getByText('22:00')).toBeInTheDocument()
  })
})
