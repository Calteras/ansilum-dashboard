import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { brandStyle } from '../lib/brand'
import { StoreBrandContext } from '../lib/brand-context'
import '../storefront.css'

export function StoreLogo({
  name,
  logoUrl,
  className,
}: {
  name: string
  logoUrl: string | null | undefined
  className?: string
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=''
        className={cn(
          'bg-background size-11 shrink-0 rounded-2xl border object-cover',
          className
        )}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--store-accent)] text-lg font-extrabold text-[var(--store-on-accent)]',
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

/** The striped, scalloped shopfront edge in the merchant's colour. */
export function Awning({ thin = false }: { thin?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn('sf-awning w-full', thin && 'sf-awning-thin')}
    />
  )
}

/** Merchant-branded frame for every storefront page; Ansilum stays in the footer. */
export function StorefrontShell({
  primaryColor,
  header,
  children,
  footer = true,
}: {
  primaryColor: string | null | undefined
  header?: ReactNode
  children: ReactNode
  footer?: boolean
}) {
  const { resolvedTheme } = useTheme()
  const brand = brandStyle(primaryColor, resolvedTheme === 'dark')
  return (
    <StoreBrandContext.Provider value={brand}>
      <div
        style={brand}
        className='sf bg-background text-foreground flex min-h-svh flex-col'
      >
        {header}
        <main className='flex flex-1 flex-col'>{children}</main>
        {footer && (
          <footer className='text-fg-muted px-5 pt-12 pb-32 text-center text-xs lg:pb-10'>
            Ansilum
          </footer>
        )}
      </div>
    </StoreBrandContext.Provider>
  )
}

/** Full-page message for the moments with nothing else to show. */
export function StoreMessage({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className='sf-rise mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-6 py-16'>
      {Icon && (
        <span className='bg-surface-subtle mb-2 flex size-14 items-center justify-center rounded-2xl'>
          <Icon size={26} className='text-fg-secondary' />
        </span>
      )}
      <h1 className='text-2xl font-bold tracking-tight text-balance'>
        {title}
      </h1>
      {description && (
        <p className='text-fg-secondary text-[15px] leading-6'>{description}</p>
      )}
      {action && <div className='pt-3'>{action}</div>}
    </div>
  )
}
