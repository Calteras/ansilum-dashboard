import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-none hover:bg-brand-ink hover:text-white dark:hover:bg-brand-soft dark:hover:text-brand-ink',
        destructive:
          'bg-destructive text-destructive-foreground shadow-none hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border border-border bg-card hover:border-foreground hover:bg-muted text-foreground',
        secondary:
          'border border-border bg-card text-foreground hover:border-foreground hover:bg-muted',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-brand-ink underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-5 py-3 has-[>svg]:px-4',
        sm: 'h-12 rounded-md gap-2 px-4 text-sm',
        lg: 'h-12 rounded-md px-6',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp: React.ElementType = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot='button'
      data-size={size ?? 'default'}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
