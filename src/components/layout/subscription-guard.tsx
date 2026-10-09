import { type ReactNode } from 'react'
import { useLocation, Link } from '@tanstack/react-router'
import { hasRouteAccess, getRequiredTier } from '@/lib/subscription-access'
import { Button } from '@/components/ui/button'
import { Lock } from '@/components/icons'
import { UiText } from '@/components/ui-text'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (l) => l.pathname })
  const { data, isLoading } = useCurrentSubscriptionQuery()

  const currentTier = data?.data?.tier ?? 'BASIC'

  if (isLoading || hasRouteAccess(currentTier, pathname)) {
    return <>{children}</>
  }

  const requiredTier = getRequiredTier(pathname)

  return (
    <div className='relative h-full'>
      <div className='pointer-events-none blur-sm select-none' aria-hidden>
        {children}
      </div>
      <div className='bg-background/60 absolute inset-0 flex items-center justify-center'>
        <div className='bg-card flex flex-col items-center gap-4 rounded-lg border p-8 shadow-none'>
          <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
            <Lock className='text-muted-foreground size-6' />
          </div>
          <p className='text-center text-lg font-medium'>
            <UiText id='Pilih paket ' en='Upgrade to ' />
            {requiredTier}
            <UiText
              id=' untuk menggunakan fitur ini'
              en=' to access this feature'
            />
          </p>
          <Button asChild>
            <Link to='/settings/subscription'>
              <UiText id='Lihat paket' en='Upgrade' />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
