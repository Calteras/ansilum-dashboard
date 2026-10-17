import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OutletSelectProps {
  outlets: { id: string; name: string }[]
  value: string
  onValueChange: (id: string) => void
  /** Adds an "all outlets" option with value `all`. */
  allLabel?: string
  className?: string
}

/** The outlet scope control used in every context toolbar. */
export function OutletSelect({
  outlets,
  value,
  onValueChange,
  allLabel,
  className,
}: OutletSelectProps) {
  const copy = useCopy()
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        size='sm'
        aria-label={copy('Outlet', 'Outlet')}
        className={cn('max-w-56 min-w-36', className)}
      >
        <SelectValue placeholder={copy('Pilih outlet', 'Select outlet')} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value='all'>{allLabel}</SelectItem>}
        {outlets.map((outlet) => (
          <SelectItem key={outlet.id} value={outlet.id}>
            {outlet.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
