import React from 'react'
import { Users } from '@/components/icons'
import { type NodeProps, NodeResizer } from 'reactflow'
import { cn } from '@/lib/utils'
import type { TableData } from '../data/types'

export const TableNode: React.FC<NodeProps<TableData>> = ({
  data,
  selected,
}) => {
  const isOccupied = data.status === 'occupied'
  const isReserved = data.status === 'reserved'
  const isCleaning = data.status === 'cleaning'

  // Mirror exactly the reservation form's status → class mapping
  const containerClass = cn(
    'relative flex h-full w-full flex-col items-center justify-center border-2 transition-colors',
    // Shape
    data.shape === 'circle' ? 'rounded-full' : 'rounded-xl',
    // Status base (not selected)
    !selected && !isOccupied && !isReserved && !isCleaning
      ? 'border-input bg-card hover:border-primary/50 hover:bg-muted/50'
      : '',
    isOccupied ? 'border-destructive/30 bg-destructive/5 opacity-70' : '',
    isReserved ? 'border-warning/30 bg-warning/5 opacity-70' : '',
    isCleaning ? 'border-muted bg-muted/10 opacity-60' : '',
    // Selected overrides base (not on disabled states)
    selected && !isOccupied && !isReserved && !isCleaning
      ? 'border-primary bg-primary/10 ring-2 ring-primary/30 ring-offset-1'
      : ''
  )

  // Seat pill color follows the same conditional logic as the form
  const seatPillClass = cn(
    selected && !isOccupied && !isReserved
      ? 'bg-primary/60'
      : isOccupied
        ? 'bg-destructive/25'
        : isReserved
          ? 'bg-warning/30'
          : isCleaning
            ? 'bg-muted/40'
            : 'bg-muted-foreground/20'
  )

  const topSeats = Math.min(Math.ceil(data.capacity / 2), 3)
  const bottomSeats = Math.min(Math.floor(data.capacity / 2), 3)

  // Hide side seats on circles (looks wrong on round shapes)
  const showSideSeats = data.shape !== 'circle'

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={80}
        maxWidth={300}
        maxHeight={300}
      />

      <div className={containerClass}>
        {/* ── Top seat indicators ─────────────────────────── */}
        <div className='absolute top-1 left-1/2 flex -translate-x-1/2 gap-1'>
          {Array.from({ length: topSeats }).map((_, i) => (
            <div
              key={`t-${i}`}
              className={cn('h-2 w-4 rounded-t-full', seatPillClass)}
            />
          ))}
        </div>

        {/* ── Bottom seat indicators ───────────────────────── */}
        <div className='absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1'>
          {Array.from({ length: bottomSeats }).map((_, i) => (
            <div
              key={`b-${i}`}
              className={cn('h-2 w-4 rounded-b-full', seatPillClass)}
            />
          ))}
        </div>

        {/* ── Left seat ────────────────────────────────────── */}
        {showSideSeats && (
          <div className='absolute top-1/2 left-1 -translate-y-1/2'>
            <div className={cn('h-4 w-2 rounded-l-full', seatPillClass)} />
          </div>
        )}

        {/* ── Right seat ───────────────────────────────────── */}
        {showSideSeats && (
          <div className='absolute top-1/2 right-1 -translate-y-1/2'>
            <div className={cn('h-4 w-2 rounded-r-full', seatPillClass)} />
          </div>
        )}

        {/* ── Center checkmark box ─────────────────────────── */}
        <div
          className={cn(
            'mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2',
            selected && !isOccupied && !isReserved
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30'
          )}
        >
          {selected && !isOccupied && !isReserved && (
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={3}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M5 13l4 4L19 7'
              />
            </svg>
          )}
        </div>

        {/* ── Name + capacity ──────────────────────────────── */}
        <span className='text-xs leading-tight font-semibold'>{data.name}</span>
        <span className='text-muted-foreground flex items-center gap-0.5 text-xs'>
          <Users className='h-2.5 w-2.5' />
          {data.capacity}
        </span>
      </div>
    </>
  )
}
