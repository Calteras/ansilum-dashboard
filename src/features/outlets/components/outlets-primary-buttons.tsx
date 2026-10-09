import { Link } from '@tanstack/react-router'
import { Store } from '@/components/icons'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'
import { useOutlets } from './outlets-provider'

export function OutletsPrimaryButtons() {
  const { setOpen } = useOutlets()
  const { data: subscription } = useCurrentSubscriptionQuery()
  const isOwner = useAuthStore((s) =>
    s.tenants.some(
      (t) => t.tenant.id === s.activeTenant?.id && t.role === 'OWNER'
    )
  )

  const limit = subscription?.data?.limits.outlets
  const outletCount = subscription?.data?.usage.outlets
  const limitReached = isOwner && subscription?.data?.canCreateOutlet === false

  return (
    <div className='flex items-center gap-2'>
      {limitReached && (
        <>
          <span className='text-muted-foreground text-sm'>
            Account capacity reached ({outletCount}/{limit})
          </span>
          <Button variant='outline' size='sm' asChild>
            <Link to='/settings/subscription'>Upgrade</Link>
          </Button>
        </>
      )}
      <Button
        className='space-x-1'
        onClick={() => setOpen('add')}
        disabled={limitReached}
      >
        <span>Add Outlet</span> <Store size={18} />
      </Button>
    </div>
  )
}
