import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string
  description?: string
  actions?: ReactNode
  eyebrow?: string
}) {
  return (
    <div className='page-intro relative flex flex-wrap items-end justify-between gap-6 overflow-hidden border-b pb-7'>
      <div className='bg-brand-soft/70 pointer-events-none absolute -top-20 -right-12 size-48 rounded-full blur-3xl' />
      <div className='relative min-w-0 space-y-2'>
        {eyebrow && (
          <p className='text-brand-ink text-[11px] font-bold tracking-[0.2em] uppercase'>
            {eyebrow}
          </p>
        )}
        <h1 className='max-w-3xl text-[30px] font-bold tracking-[-0.045em] sm:text-[40px]'>
          {title}
        </h1>
        {description && (
          <p className='text-muted-foreground max-w-2xl text-[15px] leading-relaxed'>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className='relative flex flex-wrap items-center gap-2'>
          {actions}
        </div>
      )}
    </div>
  )
}
