import type { ReactNode } from 'react'
import { STATUS_TONE } from '@/lib/status-tone'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertTriangle,
  CheckIcon,
  ChevronsUpDown,
  Info,
  X,
} from '@/components/icons'
import {
  chargeStateLabel,
  promotionStateLabel,
  type ChargeState,
  type PromotionState,
} from '../lib/pricing'

const PROMOTION_TONE: Record<PromotionState, string> = {
  running: STATUS_TONE.success,
  scheduled: STATUS_TONE.info,
  ended: STATUS_TONE.neutral,
  usedUp: STATUS_TONE.neutral,
  inactive: STATUS_TONE.neutral,
}

export function PromotionStateBadge({ state }: { state: PromotionState }) {
  const copy = useCopy()
  return (
    <Badge variant='outline' className={PROMOTION_TONE[state]}>
      {promotionStateLabel(state, copy)}
    </Badge>
  )
}

const CHARGE_TONE: Record<ChargeState, string> = {
  active: STATUS_TONE.success,
  scheduled: STATUS_TONE.info,
  ended: STATUS_TONE.neutral,
  inactive: STATUS_TONE.neutral,
}

export function ChargeStateBadge({ state }: { state: ChargeState }) {
  const copy = useCopy()
  return (
    <Badge variant='outline' className={CHARGE_TONE[state]}>
      {chargeStateLabel(state, copy)}
    </Badge>
  )
}

/** A titled group of fields inside a long form, split by a hairline. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn('border-divider grid gap-4 border-t pt-5', className)}
    >
      <div>
        <h3 className='text-sm leading-5 font-semibold'>{title}</h3>
        {description && (
          <p className='text-fg-muted text-[13px] leading-5'>{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

export interface TargetOption {
  id: string
  label: string
  hint?: string
}

/**
 * Picks any number of outlets, categories or products. Nothing picked means
 * "all", which is how the server reads an empty list.
 */
export function TargetPicker({
  options,
  value,
  onChange,
  allLabel,
  countLabel,
  searchPlaceholder,
  isLoading,
  disabled,
  id,
}: {
  options: TargetOption[]
  value: string[]
  onChange: (next: string[]) => void
  allLabel: string
  countLabel: (count: number) => string
  searchPlaceholder: string
  isLoading?: boolean
  disabled?: boolean
  id?: string
}) {
  const copy = useCopy()
  const byId = new Map(options.map((o) => [o.id, o]))
  const labelOf = (key: string) =>
    byId.get(key)?.label ?? copy('Tidak tersedia', 'Unavailable')
  const toggle = (key: string) =>
    onChange(
      value.includes(key) ? value.filter((v) => v !== key) : [...value, key]
    )

  return (
    <div className='grid gap-2'>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type='button'
            variant='outline'
            role='combobox'
            disabled={disabled || isLoading}
            className='w-full justify-between font-normal'
          >
            <span
              className={cn('truncate', value.length === 0 && 'text-fg-muted')}
            >
              {isLoading
                ? copy('Memuat…', 'Loading…')
                : value.length === 0
                  ? allLabel
                  : value.length === 1
                    ? labelOf(value[0])
                    : countLabel(value.length)}
            </span>
            <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align='start'
          className='w-(--radix-popover-trigger-width) min-w-64 p-0'
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>
                {copy('Tidak ditemukan.', 'No matches.')}
              </CommandEmpty>
              {value.length > 0 && (
                <>
                  <CommandGroup>
                    <CommandItem onSelect={() => onChange([])}>
                      <X className='me-2 size-4' />
                      {copy('Kosongkan pilihan', 'Clear selection')}
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={`${option.label} ${option.hint ?? ''} ${option.id}`}
                    onSelect={() => toggle(option.id)}
                  >
                    <CheckIcon
                      className={cn(
                        'me-2 size-4',
                        value.includes(option.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className='truncate'>{option.label}</span>
                    {option.hint && (
                      <span className='text-fg-muted ms-auto text-xs'>
                        {option.hint}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 1 && value.length <= 8 && (
        <ul className='flex flex-wrap gap-1.5' aria-label={allLabel}>
          {value.map((key) => (
            <li key={key}>
              <Badge variant='outline' className='gap-1 pe-1 font-normal'>
                {labelOf(key)}
                <button
                  type='button'
                  onClick={() => toggle(key)}
                  disabled={disabled}
                  className='text-fg-muted hover:text-foreground rounded-sm'
                  aria-label={copy(
                    `Hapus ${labelOf(key)}`,
                    `Remove ${labelOf(key)}`
                  )}
                >
                  <X className='size-3' />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Several independent choices in one row, styled like SegmentedControl. */
export function ToggleChips<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
  ...props
}: {
  options: { value: T; label: string }[]
  value: T[]
  onChange: (next: T[]) => void
  disabled?: boolean
  'aria-label': string
}) {
  return (
    <div
      role='group'
      aria-label={props['aria-label']}
      className='border-divider bg-surface-subtle inline-flex h-8 w-fit items-stretch rounded-md border p-0.5 pointer-coarse:h-11'
    >
      {options.map((option) => {
        const pressed = value.includes(option.value)
        return (
          <button
            key={option.value}
            type='button'
            aria-pressed={pressed}
            disabled={disabled}
            onClick={() =>
              onChange(
                pressed
                  ? value.filter((v) => v !== option.value)
                  : [...value, option.value]
              )
            }
            className='text-fg-muted hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:ring-divider-strong focus-visible:outline-ring min-w-9 rounded-[5px] px-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 disabled:pointer-events-none disabled:opacity-40 aria-pressed:ring-1'
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** A standing note about how a setting behaves; warning tone when it needs action. */
export function Notice({
  title,
  children,
  action,
  tone = 'info',
  className,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
  tone?: 'info' | 'warning'
  className?: string
}) {
  const Icon = tone === 'warning' ? AlertTriangle : Info
  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-x-3 gap-y-2 rounded-lg border px-4 py-3',
        tone === 'warning'
          ? 'border-status-warning/25 bg-status-warning/10'
          : 'border-divider bg-card shadow-surface',
        className
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 size-4 shrink-0',
          tone === 'warning' ? 'text-status-warning' : 'text-fg-muted'
        )}
        aria-hidden
      />
      <div className='min-w-0 flex-1 text-[13px] leading-5'>
        <p className='text-foreground font-medium'>{title}</p>
        {children && <div className='text-fg-secondary'>{children}</div>}
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </div>
  )
}

/** The "(optional)" suffix used on form labels across the console. */
export function Optional() {
  const copy = useCopy()
  return (
    <span className='text-fg-muted font-normal'>
      {copy('(opsional)', '(optional)')}
    </span>
  )
}
