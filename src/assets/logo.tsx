import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Logo({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span role='img' aria-label='Ansilum' className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-[30%] bg-brand font-sans text-[25px] leading-none font-bold tracking-[-0.06em] text-white', className)} {...props}>
      <span aria-hidden='true'>a</span>
    </span>
  )
}
