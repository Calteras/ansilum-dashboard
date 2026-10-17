import type { ReactNode } from 'react'
import { formatSpan, type DateSpan } from '@/lib/date-range'
import { useCopy } from '@/hooks/use-copy'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContextToolbar } from '@/components/data-display/context-toolbar'
import { DateRangePicker } from '@/components/date-range-picker'
import { OutletSelect } from '@/components/outlet-select'
import type { Outlet } from '../../api/dashboard.types'
import {
  getComparisonSpan,
  isComparisonAvailable,
  type ComparisonMode,
} from '../../utils/sales-analytics'

interface SalesContextBarProps {
  outlets: Outlet[]
  outletId: string
  onOutletChange: (id: string) => void
  span: DateSpan
  onSpanChange: (span: DateSpan) => void
  comparison: ComparisonMode
  onComparisonChange: (mode: ComparisonMode) => void
  actions?: ReactNode
}

/** Outlet, range and baseline: the query scope for the sales view. */
export function SalesContextBar({
  outlets,
  outletId,
  onOutletChange,
  span,
  onSpanChange,
  comparison,
  onComparisonChange,
  actions,
}: SalesContextBarProps) {
  const copy = useCopy()
  const modes: { value: ComparisonMode; label: string }[] = [
    {
      value: 'previous-period',
      label: copy('Periode sebelumnya', 'Previous period'),
    },
    {
      value: 'previous-month',
      label: copy('Bulan sebelumnya', 'Previous month'),
    },
    {
      value: 'previous-year',
      label: copy('Tahun sebelumnya', 'Previous year'),
    },
    { value: 'none', label: copy('Tanpa pembanding', 'No comparison') },
  ]
  const activeMode = modes.find((m) => m.value === comparison) ?? modes[0]

  return (
    <ContextToolbar
      sticky
      aria-label={copy('Cakupan data', 'Data scope')}
      actions={actions}
    >
      {outlets.length > 0 && (
        <OutletSelect
          outlets={outlets}
          value={outletId}
          onValueChange={onOutletChange}
        />
      )}

      <DateRangePicker value={span} onChange={onSpanChange} />

      <Select
        value={comparison}
        onValueChange={(value) => onComparisonChange(value as ComparisonMode)}
      >
        <SelectTrigger
          size='sm'
          aria-label={copy('Bandingkan dengan', 'Compare with')}
        >
          <SelectValue>
            <span className='text-fg-muted'>
              {copy('Bandingkan:', 'Compare:')}
            </span>{' '}
            {activeMode.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className='min-w-64'>
          {modes.map((mode) => {
            const comparisonSpan = getComparisonSpan(span, mode.value)
            const available = isComparisonAvailable(span, mode.value)
            return (
              <SelectItem
                key={mode.value}
                value={mode.value}
                disabled={!available}
              >
                <span className='flex w-full items-baseline justify-between gap-4'>
                  {mode.label}
                  {comparisonSpan && (
                    <span className='text-fg-muted text-xs tabular-nums'>
                      {available
                        ? formatSpan(comparisonSpan)
                        : copy('Tumpang tindih', 'Overlaps range')}
                    </span>
                  )}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </ContextToolbar>
  )
}
