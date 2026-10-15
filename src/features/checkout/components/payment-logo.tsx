import { cn } from '@/lib/utils'
import type { PaymentMethod } from '../payment-methods'

/**
 * Brand marks sit on a white chip in both themes: several are drawn in black and would
 * vanish on a dark surface, and a uniform chip keeps differently shaped logos aligned.
 */
export function PaymentLogo({
  method,
  size = 'md',
  className,
}: {
  method: Pick<PaymentMethod, 'logo' | 'label'> & { bleed?: boolean }
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/10 bg-white',
        size === 'sm' ? 'h-7 w-12' : 'h-9 w-16',
        !method.bleed && (size === 'sm' ? 'px-1.5' : 'px-2'),
        className
      )}
    >
      <img
        src={method.logo}
        alt=''
        aria-hidden
        draggable={false}
        className={cn(
          method.bleed
            ? 'size-full object-cover'
            : cn(
                'w-auto max-w-full object-contain',
                size === 'sm' ? 'max-h-4' : 'max-h-5'
              )
        )}
      />
    </span>
  )
}
