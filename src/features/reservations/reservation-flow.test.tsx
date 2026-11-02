import type { PropsWithChildren, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { formatMoney } from '@/lib/format'
import { listEmployeesApi } from '@/features/employees/api/employees.api'
import type { Employee } from '@/features/employees/api/employees.types'
import {
  addDepositApi,
  cancelReservationApi,
  listReservationsApi,
} from './api/reservations.api'
import type {
  Reservation,
  ReservationListParams,
} from './api/reservations.types'
import { ReservationsCancelDialog } from './components/reservations-cancel-dialog'
import { ReservationsDepositDialog } from './components/reservations-deposit-dialog'
import { ReservationsList } from './components/reservations-list'
import { ReservationsProvider } from './components/reservations-provider'
import { amountDue, paidAmount } from './lib/reservation-money'

vi.mock('./api/reservations.api', () => ({
  listReservationsApi: vi.fn(),
  addDepositApi: vi.fn(),
  cancelReservationApi: vi.fn(),
  fulfillReservationApi: vi.fn(),
  createReservationApi: vi.fn(),
}))
vi.mock('@/features/employees/api/employees.api', () => ({
  listEmployeesApi: vi.fn(),
}))
vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

beforeAll(() => {
  // Radix Select needs these in jsdom.
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.scrollIntoView = () => {}
})

const booking = (overrides: Partial<Reservation> = {}) =>
  ({
    id: 'r1',
    transactionNo: 'RSV-001',
    status: 'RESERVED',
    customerName: 'Ayu',
    customerPhone: '0812',
    tableNumber: 'T1',
    // 19:00 on the business clock (Asia/Jakarta)
    reservationDate: '2030-06-15T12:00:00.000Z',
    reservedAt: '2030-06-10T03:00:00.000Z',
    grandTotal: 200000,
    depositAmount: 100000,
    payments: [{ id: 'p1', paymentMethod: 'CASH', amount: 50000 }],
    items: [{ quantity: 2 }],
    ...overrides,
  }) as Reservation

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>
      <ReservationsProvider>{children}</ReservationsProvider>
    </QueryClientProvider>
  )
}

describe('reservation money', () => {
  it('counts what was received and what is left', () => {
    expect(paidAmount(booking())).toBe(50000)
    expect(amountDue(booking())).toBe(150000)
    expect(
      amountDue(
        booking({
          payments: [{ id: 'p', paymentMethod: 'CASH', amount: 250000 }],
        })
      )
    ).toBe(0)
  })
})

describe('ReservationsDepositDialog', () => {
  beforeEach(() => vi.mocked(addDepositApi).mockReset())

  it('suggests the unpaid deposit, caps it at the balance and retries with the same id', async () => {
    const onOpenChange = vi.fn()
    render(
      <ReservationsDepositDialog
        open
        onOpenChange={onOpenChange}
        currentRow={booking()}
      />,
      { wrapper }
    )
    const amount = screen.getByLabelText('Amount (Rp)')
    expect(amount).toHaveValue('50000')

    await userEvent.clear(amount)
    await userEvent.type(amount, '150001')
    const save = screen.getByRole('button', { name: 'Save deposit' })
    expect(save).toBeDisabled()

    await userEvent.clear(amount)
    await userEvent.type(amount, '50000')
    vi.mocked(addDepositApi)
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(booking())
    await userEvent.click(save)
    await waitFor(() => expect(addDepositApi).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(save).toBeEnabled())
    await userEvent.click(save)
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))

    const [first, second] = vi.mocked(addDepositApi).mock.calls
    expect(first).toEqual([
      'r1',
      {
        clientPaymentId: expect.any(String),
        amount: 50000,
        paymentMethod: 'CASH',
      },
    ])
    expect(second[1].clientPaymentId).toBe(first[1].clientPaymentId)
  })
})

describe('ReservationsCancelDialog', () => {
  const employee = (id: string, name: string, role: string, isActive = true) =>
    ({ id, name, role, isActive }) as Employee

  beforeEach(() => {
    vi.mocked(cancelReservationApi).mockReset()
    vi.mocked(listEmployeesApi).mockResolvedValue({
      data: [
        employee('e1', 'Budi', 'MANAGER'),
        employee('e2', 'Cici', 'CASHIER'),
        employee('e3', 'Dedi', 'OWNER', false),
      ],
      total: 3,
      page: 1,
      pageSize: 100,
    })
  })

  it('needs a reason and an active approver, and says how a paid deposit goes back', async () => {
    vi.mocked(cancelReservationApi).mockResolvedValue(booking())
    const onOpenChange = vi.fn()
    render(
      <ReservationsCancelDialog
        open
        onOpenChange={onOpenChange}
        currentRow={booking()}
      />,
      { wrapper }
    )
    const confirm = screen.getByRole('button', { name: 'Cancel reservation' })
    expect(confirm).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Reason'), 'Guest did not come')
    await userEvent.click(screen.getByLabelText('Approved by'))
    const options = await screen.findAllByRole('option')
    // Only active owners, managers and supervisors can approve.
    expect(options.map((o) => o.textContent)).toEqual(['Budi · MANAGER'])
    await userEvent.click(options[0])

    expect(
      screen.getByText(`Return the ${formatMoney(50000)} deposit by`)
    ).toBeInTheDocument()
    await userEvent.click(confirm)
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(cancelReservationApi).toHaveBeenCalledWith('r1', {
      voidedById: 'e1',
      voidReason: 'Guest did not come',
      refundPaymentMethod: 'CASH',
    })
  })
})

describe('ReservationsList', () => {
  const month = [
    booking(),
    booking({
      id: 'r2',
      customerName: 'Bima',
      status: 'OPEN',
      reservationDate: '2030-06-15T05:00:00.000Z',
    }),
    booking({ id: 'r3', customerName: 'Citra', status: 'CLOSED' }),
    booking({ id: 'r4', customerName: 'Dewi', status: 'VOIDED' }),
    // 01:00 the next business day, though still the 15th in UTC.
    booking({
      id: 'r5',
      customerName: 'Late',
      reservationDate: '2030-06-15T18:00:00.000Z',
    }),
    booking({
      id: 'r0',
      customerName: 'Old',
      reservationDate: '2030-06-12T12:00:00.000Z',
    }),
  ]

  beforeEach(() => {
    // Midday on 15 June 2030, business clock.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2030-06-15T05:00:00.000Z'))
    vi.mocked(listReservationsApi).mockReset()
    vi.mocked(listReservationsApi).mockImplementation(
      async (params: ReservationListParams) => {
        const data = params.statuses ? month : [month[5]]
        return { data, meta: { total: data.length, limit: 500, offset: 0 } }
      }
    )
  })
  afterEach(() => vi.useRealTimers())

  it('lists the day’s bookings in every state on the business clock', async () => {
    render(<ReservationsList outletId='o1' />, { wrapper })

    expect(await screen.findByText('Ayu')).toBeInTheDocument()
    expect(screen.getByText('Bima')).toBeInTheDocument()
    expect(screen.getByText('Citra')).toBeInTheDocument()
    expect(screen.getByText('Dewi')).toBeInTheDocument()
    expect(screen.queryByText('Late')).not.toBeInTheDocument()
    expect(screen.queryByText('Old')).not.toBeInTheDocument()

    expect(listReservationsApi).toHaveBeenCalledWith({
      outletId: 'o1',
      statuses: ['RESERVED', 'OPEN', 'CLOSED', 'VOIDED'],
      startDate: '2030-06-01',
      endDate: '2030-06-30',
      limit: 500,
    })
    expect(listReservationsApi).toHaveBeenCalledWith({
      outletId: 'o1',
      endDate: '2030-06-14',
      limit: 100,
    })

    // Booking time, not the time it was made; money received, not requested.
    const ayu = screen
      .getByText('Ayu')
      .closest('[data-slot="card"]') as HTMLElement
    expect(within(ayu).getByText('19:00')).toBeInTheDocument()
    expect(within(ayu).getByText('Awaiting guest')).toBeInTheDocument()
    expect(within(ayu).getByText(formatMoney(50000))).toBeInTheDocument()
    expect(
      within(ayu).getByText(`(${formatMoney(100000)} deposit requested)`, {
        exact: false,
      })
    ).toBeInTheDocument()
    const bima = screen
      .getByText('Bima')
      .closest('[data-slot="card"]') as HTMLElement
    expect(within(bima).getByText('12:00')).toBeInTheDocument()
    expect(within(bima).getByText('Guest arrived')).toBeInTheDocument()

    // Only bookings still awaiting a guest can be acted on.
    expect(screen.getAllByRole('button', { name: 'Actions' })).toHaveLength(1)
  })

  it('points at bookings whose day passed without a check-in', async () => {
    render(<ReservationsList outletId='o1' />, { wrapper })
    expect(
      await screen.findByText(/1 bookings are past their date/)
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Show the first' })
    )
    expect(await screen.findByText('Old')).toBeInTheDocument()
    expect(screen.queryByText('Ayu')).not.toBeInTheDocument()
  })
})
