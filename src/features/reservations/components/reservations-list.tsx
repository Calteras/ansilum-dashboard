import { formatMoney } from '@/lib/format'
import { useState } from 'react'
import { format } from 'date-fns'
import {
  CalendarCheck,
  Clock,
  Users,
  Phone,
  MoreHorizontal,
  CheckCircle,
  Banknote,
  XCircle,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import type { Reservation } from '../api/reservations.types'
import { reservationStatusStyles } from '../data/data'
import { useReservations } from './reservations-provider'

type Props = {
  reservations: Reservation[]
  isLoading: boolean
}

const formatCurrency = formatMoney

export function ReservationsList({ reservations, isLoading }: Props) {
  const { setOpen, setCurrentRow } = useReservations()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = useState('')

  // Filter by selected date and search
  const filtered = reservations.filter((r) => {
    if (selectedDate) {
      const resDate = new Date(r.reservationDate)
      if (
        resDate.getFullYear() !== selectedDate.getFullYear() ||
        resDate.getMonth() !== selectedDate.getMonth() ||
        resDate.getDate() !== selectedDate.getDate()
      ) {
        return false
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.transactionNo.toLowerCase().includes(q) ||
        r.customerPhone?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Dates that have reservations for calendar highlighting
  const reservationDates = reservations.map((r) => new Date(r.reservationDate))

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6'>
      {/* Left: Calendar + Stats */}
      <div className='space-y-4'>
        <Card>
          <CardContent className='p-3'>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                hasReservation: reservationDates,
              }}
              modifiersClassNames={{
                hasReservation:
                  'relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary',
              }}
              className='mx-auto'
            />
          </CardContent>
        </Card>

        {/* Stats for selected date */}
        <Card>
          <CardContent className='p-4 space-y-3'>
            <h4 className='text-sm font-medium'>
              {selectedDate
                ? format(selectedDate, 'EEEE, dd MMM yyyy')
                : 'All dates'}
            </h4>
            <div className='grid grid-cols-2 gap-2'>
              <div className='bg-muted  rounded-lg p-3 text-center'>
                <div className='text-xl font-semibold text-muted-foreground '>
                  {filtered.filter((r) => r.status === 'RESERVED').length}
                </div>
                <div className='text-xs text-fg-muted'>
                  Reserved
                </div>
              </div>
              <div className='bg-status-success/10 rounded-lg p-3 text-center'>
                <div className='text-xl font-semibold text-status-success'>
                  {filtered.filter((r) => r.status === 'OPEN').length}
                </div>
                <div className='text-xs text-fg-muted'>
                  Open
                </div>
              </div>
              <div className='bg-neutral-50 dark:bg-neutral-900/30 rounded-lg p-3 text-center'>
                <div className='text-xl font-semibold'>
                  {filtered.filter((r) => r.status === 'CLOSED').length}
                </div>
                <div className='text-xs text-fg-muted'>
                  Closed
                </div>
              </div>
              <div className='bg-status-danger/10 rounded-lg p-3 text-center'>
                <div className='text-xl font-semibold text-status-danger'>
                  {filtered.filter((r) => r.status === 'VOIDED').length}
                </div>
                <div className='text-xs text-fg-muted'>
                  Voided
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          className='w-full'
          onClick={() => setSelectedDate(undefined)}
          variant='outline'
          size='sm'
        >
          Show all dates
        </Button>
      </div>

      {/* Right: Reservation cards */}
      <div className='space-y-4'>
        <Input
          placeholder='Search by name, phone, or transaction no...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {isLoading ? (
          <div className='flex h-40 items-center justify-center text-muted-foreground'>
            Loading reservations...
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className='flex h-40 items-center justify-center text-muted-foreground'>
              <div className='text-center'>
                <CalendarCheck className='mx-auto mb-2 h-8 w-8 opacity-40' />
                <p>No reservations found</p>
                {selectedDate && (
                  <p className='text-xs mt-1'>
                    for {format(selectedDate, 'dd MMM yyyy')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-3'>
            {filtered.map((reservation) => (
              <Card
                key={reservation.id}
                className='py-0 shadow-none transition-shadow'
              >
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between gap-4'>
                    {/* Main info */}
                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center gap-2 flex-wrap'>
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
                          {reservation.status}
                        </Badge>
                        <span className='text-xs text-muted-foreground font-sans tabular-nums'>
                          {reservation.transactionNo}
                        </span>
                      </div>

                      <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground'>
                        {reservation.customerPhone && (
                          <span className='flex items-center gap-1'>
                            <Phone size={12} />
                            {reservation.customerPhone}
                          </span>
                        )}
                        <span className='flex items-center gap-1'>
                          <CalendarCheck size={12} />
                          {new Date(reservation.reservationDate).toLocaleDateString(
                            'id-ID',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </span>
                        {reservation.reservedAt && (
                          <span className='flex items-center gap-1'>
                            <Clock size={12} />
                            {new Date(reservation.reservedAt).toLocaleTimeString(
                              'id-ID',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        )}
                        {reservation.tableNumber && (
                          <span className='flex items-center gap-1'>
                            <Users size={12} />
                            Table {reservation.tableNumber}
                          </span>
                        )}
                      </div>

                      <div className='flex gap-4 text-sm'>
                        <span>
                          <span className='text-muted-foreground'>Total: </span>
                          <span className='font-medium'>
                            {formatCurrency(reservation.grandTotal)}
                          </span>
                        </span>
                        <span>
                          <span className='text-muted-foreground'>
                            Deposit:{' '}
                          </span>
                          <span className='font-medium'>
                            {formatCurrency(reservation.depositAmount)}
                          </span>
                        </span>
                        <span>
                          <span className='text-muted-foreground'>
                            Items:{' '}
                          </span>
                          <span className='font-medium'>
                            {reservation.items?.length ?? 0}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {reservation.status === 'RESERVED' && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-[160px]'>
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentRow(reservation)
                              setOpen('fulfill')
                            }}
                          >
                            <CheckCircle size={14} className='mr-2' />
                            Fulfill
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentRow(reservation)
                              setOpen('deposit')
                            }}
                          >
                            <Banknote size={14} className='mr-2' />
                            Add Deposit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentRow(reservation)
                              setOpen('cancel')
                            }}
                            className='text-status-danger!'
                          >
                            <XCircle size={14} className='mr-2' />
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
