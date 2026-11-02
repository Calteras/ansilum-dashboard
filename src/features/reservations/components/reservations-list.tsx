import { useState } from 'react'
import { addDays, endOfMonth, format, startOfMonth } from 'date-fns'
import { enUS, id as idLocale } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  Banknote,
  CalendarCheck,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Phone,
  Users,
  XCircle,
} from '@/components/icons'
import { useReservationsQuery } from '../api/reservations.queries'
import type { Reservation, ReservationStatus } from '../api/reservations.types'
import { reservationStatusLabels, reservationStatusStyles } from '../data/data'
import { useBusinessTimeZone } from '../hooks/use-business-time-zone'
import { dayDate, wallClock } from '../lib/business-clock'
import { amountDue, paidAmount } from '../lib/reservation-money'
import { useReservations } from './reservations-provider'

const ALL_STATUSES: ReservationStatus[] = [
  'RESERVED',
  'OPEN',
  'CLOSED',
  'VOIDED',
]
const ymd = (d: Date) => format(d, 'yyyy-MM-dd')

/**
 * The month's bookings in every state, so arrivals, completed and cancelled
 * bookings stay visible after they are processed, plus the bookings whose
 * day has passed without a check-in (likely no-shows). Days and times are
 * read on the business clock, as the server and POS read them.
 */
export function ReservationsList({ outletId }: { outletId: string }) {
  const copy = useCopy()
  const { i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage ?? 'id').startsWith('id')
    ? idLocale
    : enUS
  const { setOpen, setCurrentRow } = useReservations()
  const timeZone = useBusinessTimeZone()
  const clock = (iso: string) =>
    wallClock(iso, timeZone) ?? { day: '', time: '', minutes: 0 }
  const today = clock(new Date().toISOString()).day || ymd(new Date())
  // Opens on the business day, which can differ from the browser's date.
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    dayDate(today)
  )
  const [month, setMonth] = useState(() => startOfMonth(dayDate(today)))
  const [searchQuery, setSearchQuery] = useState('')

  const monthQuery = useReservationsQuery({
    outletId,
    statuses: ALL_STATUSES,
    startDate: ymd(startOfMonth(month)),
    endDate: ymd(endOfMonth(month)),
    limit: 500,
  })
  // Still awaiting a guest after their day: shown wherever you are browsing.
  const overdueQuery = useReservationsQuery({
    outletId,
    endDate: ymd(addDays(dayDate(today), -1)),
    limit: 100,
  })
  const reservations = monthQuery.data?.data ?? []
  const overdue = overdueQuery.data?.data ?? []

  const q = searchQuery.trim().toLowerCase()
  const filtered = reservations
    .filter(
      (r) => !selectedDate || clock(r.reservationDate).day === ymd(selectedDate)
    )
    .filter(
      (r) =>
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.transactionNo.toLowerCase().includes(q) ||
        r.customerPhone?.toLowerCase().includes(q) ||
        r.tableNumber?.toLowerCase().includes(q)
    )
    .sort(
      (a, b) => Date.parse(a.reservationDate) - Date.parse(b.reservationDate)
    )
  const awaitingDays = reservations
    .filter((r) => r.status === 'RESERVED')
    .map((r) => dayDate(clock(r.reservationDate).day))
  const count = (status: ReservationStatus) =>
    filtered.filter((r) => r.status === status).length

  const act = (
    reservation: Reservation,
    kind: 'fulfill' | 'deposit' | 'cancel'
  ) => {
    setCurrentRow(reservation)
    setOpen(kind)
  }

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]'>
      <div className='space-y-4'>
        <Card>
          <CardContent className='p-3'>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={month}
              onMonthChange={setMonth}
              locale={locale}
              modifiers={{ hasReservation: awaitingDays }}
              modifiersClassNames={{
                hasReservation:
                  'relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary',
              }}
              className='mx-auto'
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className='space-y-3 p-4'>
            <h4 className='text-sm font-medium'>
              {selectedDate
                ? format(selectedDate, 'EEEE, d MMM yyyy', { locale })
                : format(month, 'MMMM yyyy', { locale })}
            </h4>
            <div className='grid grid-cols-2 gap-2'>
              {ALL_STATUSES.map((status) => (
                <div
                  key={status}
                  className={cn(
                    'rounded-lg border p-3 text-center',
                    reservationStatusStyles.get(status)
                  )}
                >
                  <div className='text-xl font-semibold tabular-nums'>
                    {count(status)}
                  </div>
                  <div className='text-xs'>
                    {copy(
                      reservationStatusLabels[status].id,
                      reservationStatusLabels[status].en
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          className='w-full'
          onClick={() => setSelectedDate(undefined)}
          variant='outline'
          size='sm'
        >
          {copy('Tampilkan sebulan', 'Show the whole month')}
        </Button>
      </div>

      <div className='space-y-4'>
        {overdue.length > 0 && (
          <div
            role='status'
            className='border-status-warning/30 bg-status-warning/10 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm'
          >
            <AlertTriangle className='text-status-warning size-4 shrink-0' />
            <p className='min-w-0 flex-1'>
              {copy(
                `${overdue.length} reservasi sudah lewat tanggalnya tapi belum diproses. Proses bila tamu datang, atau batalkan bila tidak datang.`,
                `${overdue.length} bookings are past their date and were never checked in. Check them in if the guest came, or cancel no-shows.`
              )}
            </p>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                const earliest = overdue.reduce((a, b) =>
                  Date.parse(b.reservationDate) < Date.parse(a.reservationDate)
                    ? b
                    : a
                )
                const first = dayDate(clock(earliest.reservationDate).day)
                setMonth(startOfMonth(first))
                setSelectedDate(first)
              }}
            >
              {copy('Lihat yang pertama', 'Show the first')}
            </Button>
          </div>
        )}

        <Input
          placeholder={copy(
            'Cari nama, telepon, meja, atau nomor transaksi…',
            'Search name, phone, table or transaction no…'
          )}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {monthQuery.isError ? (
          <Card>
            <CardContent className='flex h-40 flex-col items-center justify-center gap-2 text-sm'>
              <p>
                {copy(
                  'Reservasi belum termuat.',
                  "Reservations couldn't load."
                )}
              </p>
              <Button
                size='sm'
                variant='outline'
                onClick={() => void monthQuery.refetch()}
              >
                {copy('Coba lagi', 'Try again')}
              </Button>
            </CardContent>
          </Card>
        ) : monthQuery.isLoading ? (
          <div className='text-muted-foreground flex h-40 items-center justify-center'>
            {copy('Memuat reservasi…', 'Loading reservations…')}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className='text-muted-foreground flex h-40 items-center justify-center'>
              <div className='text-center'>
                <CalendarCheck className='mx-auto mb-2 h-8 w-8 opacity-40' />
                <p>{copy('Tidak ada reservasi', 'No reservations')}</p>
                {selectedDate && (
                  <p className='mt-1 text-xs'>
                    {format(selectedDate, 'd MMM yyyy', { locale })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-3'>
            {filtered.map((reservation) => {
              const at = clock(reservation.reservationDate)
              const booked = reservation.reservedAt
                ? clock(reservation.reservedAt)
                : null
              const paid = paidAmount(reservation)
              const due = amountDue(reservation)
              const requested = Number(reservation.depositAmount ?? 0)
              return (
                <Card
                  key={reservation.id}
                  className='py-0 shadow-none transition-shadow'
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='min-w-0 flex-1 space-y-2'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-lg font-semibold tabular-nums'>
                            {at.time}
                          </span>
                          <span className='font-semibold'>
                            {reservation.customerName}
                          </span>
                          <Badge
                            variant='outline'
                            className={cn(
                              'text-xs',
                              reservationStatusStyles.get(reservation.status)
                            )}
                          >
                            {copy(
                              reservationStatusLabels[reservation.status].id,
                              reservationStatusLabels[reservation.status].en
                            )}
                          </Badge>
                          <span className='text-muted-foreground text-xs tabular-nums'>
                            {reservation.transactionNo}
                          </span>
                        </div>

                        <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm'>
                          {!selectedDate && (
                            <span className='flex items-center gap-1'>
                              <CalendarCheck size={12} />
                              {format(dayDate(at.day), 'd MMM yyyy', {
                                locale,
                              })}
                            </span>
                          )}
                          {reservation.tableNumber ? (
                            <span className='flex items-center gap-1'>
                              <Users size={12} />
                              {copy('Meja', 'Table')} {reservation.tableNumber}
                            </span>
                          ) : (
                            <span className='flex items-center gap-1'>
                              <Users size={12} />
                              {copy('Tanpa meja', 'No table')}
                            </span>
                          )}
                          {reservation.customerPhone && (
                            <span className='flex items-center gap-1'>
                              <Phone size={12} />
                              {reservation.customerPhone}
                            </span>
                          )}
                          {booked?.day && (
                            <span className='flex items-center gap-1'>
                              <Clock size={12} />
                              {copy('Dipesan', 'Booked')}{' '}
                              {format(dayDate(booked.day), 'd MMM', { locale })}
                              , {booked.time}
                            </span>
                          )}
                        </div>

                        <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums'>
                          <span>
                            <span className='text-muted-foreground'>
                              {copy('Total', 'Total')}:{' '}
                            </span>
                            <span className='font-medium'>
                              {formatMoney(reservation.grandTotal)}
                            </span>
                          </span>
                          <span>
                            <span className='text-muted-foreground'>
                              {copy('Dibayar', 'Paid')}:{' '}
                            </span>
                            <span className='font-medium'>
                              {formatMoney(paid)}
                            </span>
                            {requested > paid &&
                              reservation.status === 'RESERVED' && (
                                <span className='text-status-warning'>
                                  {' '}
                                  {copy(
                                    `(deposit diminta ${formatMoney(requested)})`,
                                    `(${formatMoney(requested)} deposit requested)`
                                  )}
                                </span>
                              )}
                          </span>
                          {reservation.status !== 'VOIDED' && due > 0 && (
                            <span>
                              <span className='text-muted-foreground'>
                                {copy('Sisa', 'Due')}:{' '}
                              </span>
                              <span className='font-medium'>
                                {formatMoney(due)}
                              </span>
                            </span>
                          )}
                          <span>
                            <span className='text-muted-foreground'>
                              {copy('Item', 'Items')}:{' '}
                            </span>
                            <span className='font-medium'>
                              {reservation.items?.reduce(
                                (s, i) => s + Number(i.quantity),
                                0
                              ) ?? 0}
                            </span>
                          </span>
                        </div>

                        {reservation.notes && (
                          <p className='text-fg-secondary text-sm whitespace-pre-line'>
                            {reservation.notes}
                          </p>
                        )}
                      </div>

                      {reservation.status === 'RESERVED' && (
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              aria-label={copy('Aksi', 'Actions')}
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='w-[190px]'
                          >
                            <DropdownMenuItem
                              onClick={() => act(reservation, 'fulfill')}
                            >
                              <CheckCircle size={14} className='mr-2' />
                              {copy('Tamu datang', 'Guest arrived')}
                            </DropdownMenuItem>
                            {due > 0 && (
                              <DropdownMenuItem
                                onClick={() => act(reservation, 'deposit')}
                              >
                                <Banknote size={14} className='mr-2' />
                                {copy('Terima deposit', 'Take a deposit')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => act(reservation, 'cancel')}
                              className='text-status-danger!'
                            >
                              <XCircle size={14} className='mr-2' />
                              {copy('Batalkan', 'Cancel')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
