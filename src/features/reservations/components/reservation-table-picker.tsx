import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users } from '@/components/icons'
import type {
  TableLayoutTable,
  TableStatus,
} from '@/features/tables/api/tables.types'
import { useReservationTables } from '../hooks/use-reservation-tables'
import { BOOKING_HOLD_MINUTES } from '../lib/table-availability'

export function ReservationTablePicker({
  outletId,
  day,
  time,
  partySize,
  value,
  onChange,
}: {
  outletId: string
  /** "yyyy-MM-dd", or null before a date is chosen. */
  day: string | null
  time: string
  partySize: number
  value: string
  onChange: (tableId: string) => void
}) {
  const copy = useCopy()
  const { layout, sections, tables, isToday, bookingsFor, taken } =
    useReservationTables(outletId, day, time)
  const [picked, setPicked] = useState<string | null>(null)
  const activeSection =
    sections.find((s) => (s.id ?? s.name) === picked) ?? sections[0]

  if (!outletId)
    return (
      <p className='text-fg-muted text-sm'>
        {copy('Pilih gerai terlebih dahulu.', 'Choose an outlet first.')}
      </p>
    )
  if (layout.isLoading)
    return (
      <div className='grid grid-cols-3 gap-4 pt-2' aria-busy='true'>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className='bg-surface-hover aspect-square animate-pulse rounded-lg'
          />
        ))}
      </div>
    )
  if (layout.isError)
    return (
      <div className='space-y-2 text-sm'>
        <p className='text-status-danger'>
          {copy('Denah meja belum termuat.', "The table map couldn't load.")}
        </p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => void layout.refetch()}
        >
          {copy('Coba lagi', 'Try again')}
        </Button>
      </div>
    )
  if (tables.length === 0)
    return (
      <div className='border-divider text-fg-secondary space-y-1 rounded-lg border border-dashed p-4 text-sm'>
        <p>
          {copy(
            'Gerai ini belum punya meja. Reservasi tetap bisa dibuat tanpa meja.',
            'This outlet has no tables yet. You can still book without one.'
          )}
        </p>
        <Link
          to='/tables'
          className='text-foreground font-medium underline-offset-4 hover:underline'
        >
          {copy('Atur denah meja', 'Set up the table map')}
        </Link>
      </div>
    )

  const selected = tables.find((t) => t.id === value)
  const liveLabel: Record<Exclude<TableStatus, 'AVAILABLE'>, string> = {
    OCCUPIED: copy('Terisi sekarang', 'In use now'),
    RESERVED: copy('Ditahan sekarang', 'Held now'),
    CLEANING: copy('Dibersihkan', 'Being cleaned'),
  }

  const grid = (list: TableLayoutTable[]) => (
    <div className='grid grid-cols-3 gap-4 pt-2'>
      {list.map((table) => {
        const isSelected = value === table.id
        const isBooked = taken(table)
        const bookedTimes = bookingsFor(table)
        const tooSmall = partySize > table.capacity
        const live =
          isToday && table.status !== 'AVAILABLE'
            ? liveLabel[table.status]
            : null
        const seat = cn(
          isSelected && !isBooked ? 'bg-primary/60' : 'bg-muted-foreground/20'
        )
        return (
          <button
            key={table.id}
            type='button'
            disabled={isBooked}
            aria-pressed={isSelected}
            onClick={() => onChange(isSelected ? '' : table.id)}
            className={cn(
              'relative flex aspect-square flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors',
              isSelected && !isBooked
                ? 'border-primary bg-primary/10 ring-primary/30 ring-2'
                : '',
              isBooked
                ? 'border-status-warning/30 bg-status-warning/5 cursor-not-allowed opacity-60'
                : '',
              !isBooked && !isSelected
                ? 'border-input hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
                : ''
            )}
          >
            <div
              className={cn(
                'mb-2 flex h-12 w-12 items-center justify-center rounded-lg border-2',
                table.shape === 'CIRCLE' && 'rounded-full',
                isSelected && !isBooked
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}
            >
              {isSelected && !isBooked ? (
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={3}
                  aria-hidden
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              ) : null}
            </div>

            {/* Seat indicators */}
            <div className='absolute top-1 left-1/2 flex -translate-x-1/2 gap-1'>
              {Array.from({
                length: Math.min(Math.ceil(table.capacity / 2), 3),
              }).map((_, i) => (
                <div
                  key={`t-${i}`}
                  className={cn('h-2 w-4 rounded-t-full', seat)}
                />
              ))}
            </div>
            <div className='absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1'>
              {Array.from({
                length: Math.min(Math.floor(table.capacity / 2), 3),
              }).map((_, i) => (
                <div
                  key={`b-${i}`}
                  className={cn('h-2 w-4 rounded-b-full', seat)}
                />
              ))}
            </div>
            <div className='absolute top-1/2 left-1 -translate-y-1/2'>
              <div className={cn('h-4 w-2 rounded-l-full', seat)} />
            </div>
            <div className='absolute top-1/2 right-1 -translate-y-1/2'>
              <div className={cn('h-4 w-2 rounded-r-full', seat)} />
            </div>

            <span className='mt-1 max-w-full truncate text-xs font-medium'>
              {table.name}
            </span>
            <span
              className={cn(
                'text-xs',
                tooSmall ? 'text-status-warning' : 'text-muted-foreground'
              )}
            >
              <Users size={10} className='mr-0.5 inline' />
              {table.capacity}
            </span>
            {bookedTimes.length > 0 && (
              <span className='text-status-warning max-w-full truncate text-[11px] leading-tight'>
                {copy('Dipesan', 'Booked')}{' '}
                {bookedTimes.map((t) => t.time).join(', ')}
              </span>
            )}
            {live && !bookedTimes.length && (
              <span className='text-fg-muted max-w-full truncate text-[11px] leading-tight'>
                {live}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className='space-y-3'>
      {sections.length > 1 ? (
        <Tabs
          value={activeSection.id ?? activeSection.name}
          onValueChange={setPicked}
        >
          <TabsList className='h-auto w-full flex-wrap justify-start'>
            {sections.map((s) => (
              <TabsTrigger key={s.id ?? s.name} value={s.id ?? s.name}>
                {s.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map((s) => (
            <TabsContent key={s.id ?? s.name} value={s.id ?? s.name}>
              {grid(s.tables)}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        grid(tables)
      )}

      {selected && partySize > selected.capacity && (
        <p className='text-status-warning text-[13px]'>
          {copy(
            `${selected.name} untuk ${selected.capacity} orang; rombongan ini ${partySize} orang.`,
            `${selected.name} seats ${selected.capacity}; this party is ${partySize}.`
          )}
        </p>
      )}

      <div className='text-muted-foreground flex flex-wrap gap-4 text-xs'>
        <div className='flex items-center gap-1.5'>
          <div className='border-input h-3 w-3 rounded border-2' />
          {copy('Tersedia', 'Available')}
        </div>
        <div className='flex items-center gap-1.5'>
          <div className='border-primary bg-primary/20 h-3 w-3 rounded border-2' />
          {copy('Dipilih', 'Selected')}
        </div>
        <div className='flex items-center gap-1.5'>
          <div className='border-status-warning/30 bg-status-warning/10 h-3 w-3 rounded border-2' />
          {copy(
            `Sudah dipesan (${BOOKING_HOLD_MINUTES / 60} jam di sekitar waktu itu)`,
            `Booked (within ${BOOKING_HOLD_MINUTES / 60} hours of that time)`
          )}
        </div>
      </div>
      {!day && (
        <p className='text-fg-muted text-[13px]'>
          {copy(
            'Pilih tanggal dan jam untuk melihat meja yang sudah dipesan.',
            'Choose a date and time to see which tables are booked.'
          )}
        </p>
      )}
    </div>
  )
}
