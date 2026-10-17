import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'

interface SegmentedOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface SegmentedControlProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: SegmentedOption<T>[]
  'aria-label': string
  className?: string
}

/**
 * A single choice that changes how the adjacent content is shown (interval, unit, view).
 * Radio semantics: one tab stop, arrow keys move the selection.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      orientation='horizontal'
      loop
      aria-label={props['aria-label']}
      className={cn(
        'border-divider bg-surface-subtle inline-flex h-8 items-stretch rounded-md border p-0.5 pointer-coarse:h-11',
        className
      )}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className='text-fg-muted hover:text-foreground data-[state=checked]:bg-card data-[state=checked]:text-foreground data-[state=checked]:ring-divider-strong focus-visible:outline-ring rounded-[5px] px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 disabled:pointer-events-none disabled:opacity-40 data-[state=checked]:ring-1'
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}
