import type { ReactNode } from 'react'

type AuthPanelProps = {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  titleRole?: 'status'
}

export function AuthPanel({
  title,
  description,
  children,
  footer,
  titleRole,
}: AuthPanelProps) {
  return (
    <div className='min-w-0 space-y-8'>
      <div className='space-y-3'>
        <h1
          role={titleRole}
          className='text-[32px] font-bold tracking-[-0.03em]'
        >
          {title}
        </h1>
        {description && (
          <p className='text-muted-foreground leading-relaxed'>{description}</p>
        )}
      </div>
      {children}
      {footer && (
        <div className='text-muted-foreground space-y-4 border-t pt-6 text-sm'>
          {footer}
        </div>
      )}
    </div>
  )
}
