import { UiText } from '@/components/ui-text'
import { type ReactNode } from 'react'
import { useLocation, Link } from '@tanstack/react-router'
import { Lock } from '@/components/icons'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'
import { hasRouteAccess, getRequiredTier } from '@/lib/subscription-access'
import { Button } from '@/components/ui/button'

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
      <div className='pointer-events-none select-none blur-sm' aria-hidden>
        {children}
      </div>
      <div className='absolute inset-0 flex items-center justify-center bg-background/60'>
        <div className='flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-none'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
            <Lock className='size-6 text-muted-foreground' />
          </div>
          <p className='text-center text-lg font-medium'><UiText id="Pilih paket" en="Upgrade to" />{requiredTier}<UiText id="untuk menggunakan fitur ini" en="to access this feature" /></p>
          <Button asChild>
            <Link to='/settings/subscription'><UiText id="Lihat paket" en="Upgrade" /></Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
