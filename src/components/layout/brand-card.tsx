import { Link } from '@tanstack/react-router'
import { Logo } from '@/assets/logo'
import { useSidebar } from '@/components/ui/sidebar'

/** Logo row aligned with the app header; the wordmark hides in the icon rail. */
export function BrandCard() {
  const { state, isMobile } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile

  return (
    <Link
      to='/'
      aria-label='Ansilum home'
      className='focus-visible:outline-ring flex h-8 min-w-0 items-center gap-2 rounded-md focus-visible:outline-2'
    >
      <Logo className='size-7 rounded-md' />
      {!collapsed && (
        <span className='text-foreground text-lg font-bold tracking-[-0.04em]'>
          ansilum
          <span className='text-brand -ml-px'>.</span>
        </span>
      )}
    </Link>
  )
}
