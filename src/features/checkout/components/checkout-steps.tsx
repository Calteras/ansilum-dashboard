import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Check } from '@/components/icons'

export type StepId = 'plan' | 'method' | 'pay'

const STEPS: { id: StepId; label: readonly [string, string] }[] = [
  { id: 'plan', label: ['Paket', 'Plan'] },
  { id: 'method', label: ['Cara bayar', 'Payment method'] },
  { id: 'pay', label: ['Bayar', 'Pay'] },
]

/** Checkout progress. Completed steps stay clickable while no payment is open. */
export function CheckoutSteps({
  current,
  done = false,
  onSelect,
}: {
  current: StepId
  done?: boolean
  onSelect?: (step: StepId) => void
}) {
  const copy = useCopy()
  const currentIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <ol className='flex flex-wrap items-center gap-x-3 gap-y-2 text-sm'>
      {STEPS.map((step, index) => {
        const complete = done || index < currentIndex
        const active = !done && index === currentIndex
        const clickable = complete && !done && onSelect && current !== 'pay'
        const content = (
          <>
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
                active && 'border-foreground bg-foreground text-background',
                complete && 'border-foreground text-foreground',
                !active && !complete && 'text-muted-foreground'
              )}
            >
              {complete ? <Check className='size-3.5' /> : index + 1}
            </span>
            <span
              className={cn(
                active
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground',
                complete && 'text-foreground'
              )}
            >
              {copy(...step.label)}
            </span>
          </>
        )
        return (
          <li
            key={step.id}
            className='flex items-center gap-3'
            aria-current={active ? 'step' : undefined}
          >
            {clickable ? (
              <button
                type='button'
                onClick={() => onSelect(step.id)}
                className='focus-visible:ring-ring flex items-center gap-2 rounded-md underline-offset-4 outline-none hover:underline focus-visible:ring-2'
              >
                {content}
              </button>
            ) : (
              <span className='flex items-center gap-2'>{content}</span>
            )}
            {index < STEPS.length - 1 && (
              <span aria-hidden className='bg-border h-px w-6' />
            )}
          </li>
        )
      })}
    </ol>
  )
}
