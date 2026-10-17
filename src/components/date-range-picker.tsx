import { useState } from 'react'
import { startOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import {
  DATE_PRESET_IDS,
  formatSpan,
  getPresetSpan,
  matchPreset,
  normalizeSpan,
  type DatePresetId,
  type DateSpan,
} from '@/lib/date-range'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Check, ChevronDown } from '@/components/icons'

interface DateRangePickerProps {
  value: DateSpan
  onChange: (span: DateSpan) => void
  className?: string
}

/**
 * Presets apply in one click. A custom range is drafted in the calendar and only
 * applied once both ends are chosen, so queries never run on a half-picked range.
 */
export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const copy = useCopy()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>()
  const activePreset = matchPreset(value)

  const presetLabels: Record<DatePresetId, string> = {
    today: copy('Hari ini', 'Today'),
    yesterday: copy('Kemarin', 'Yesterday'),
    'last-7-days': copy('7 hari terakhir', 'Last 7 days'),
    'last-30-days': copy('30 hari terakhir', 'Last 30 days'),
    'this-month': copy('Bulan ini', 'This month'),
    'last-month': copy('Bulan lalu', 'Last month'),
    'last-90-days': copy('90 hari terakhir', 'Last 90 days'),
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) setDraft({ from: value.from, to: value.to })
  }

  const applyPreset = (id: DatePresetId) => {
    onChange(getPresetSpan(id))
    setOpen(false)
  }

  const applyDraft = () => {
    if (!draft?.from) return
    onChange(normalizeSpan(draft.from, draft.to ?? draft.from))
    setOpen(false)
  }

  const today = startOfDay(new Date())

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          aria-label={`${copy('Rentang tanggal', 'Date range')}: ${formatSpan(value)}`}
          className={cn(
            'border-divider-strong hover:border-divider-strong hover:bg-surface-hover h-8 justify-start gap-2 px-2.5 text-[13px] font-normal tabular-nums',
            className
          )}
        >
          <CalendarIcon className='text-fg-muted size-4' aria-hidden />
          {formatSpan(value)}
          <ChevronDown className='text-fg-muted size-3.5' aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='border-divider-strong flex w-auto flex-col p-0 sm:flex-row'
      >
        <div
          role='group'
          aria-label={copy('Rentang cepat', 'Quick ranges')}
          className='border-divider grid grid-cols-2 gap-0.5 border-b p-2 sm:flex sm:w-44 sm:flex-col sm:border-r sm:border-b-0'
        >
          {DATE_PRESET_IDS.map((id) => (
            <button
              key={id}
              type='button'
              onClick={() => applyPreset(id)}
              aria-pressed={activePreset === id}
              className='hover:bg-surface-hover focus-visible:outline-ring flex h-8 items-center justify-between gap-2 rounded px-2 text-left text-[13px] focus-visible:outline-2 aria-pressed:font-medium pointer-coarse:h-11'
            >
              {presetLabels[id]}
              {activePreset === id && <Check className='size-4' aria-hidden />}
            </button>
          ))}
        </div>
        <div className='flex flex-col'>
          <Calendar
            mode='range'
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={isMobile ? 1 : 2}
            defaultMonth={
              isMobile
                ? value.to
                : new Date(value.to.getFullYear(), value.to.getMonth() - 1)
            }
            disabled={{ after: today }}
            showOutsideDays={false}
            className='bg-transparent [--cell-size:--spacing(9)]'
          />
          <div className='border-divider flex items-center justify-between gap-3 border-t px-3 py-2'>
            <span className='text-fg-muted text-xs tabular-nums'>
              {draft?.from
                ? formatSpan(normalizeSpan(draft.from, draft.to ?? draft.from))
                : copy('Pilih tanggal mulai', 'Select a start date')}
            </span>
            <div className='flex gap-2'>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 px-3 text-[13px]'
                onClick={() => setOpen(false)}
              >
                {copy('Batal', 'Cancel')}
              </Button>
              <Button
                size='sm'
                className='h-8 px-3 text-[13px]'
                onClick={applyDraft}
                disabled={!draft?.from}
              >
                {copy('Terapkan', 'Apply')}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
