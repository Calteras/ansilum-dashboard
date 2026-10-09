import { Link } from '@tanstack/react-router'
import { Logo } from '@/assets/logo'
import { useSidebar } from '@/components/ui/sidebar'

export function BrandCard() {
  const { state, isMobile } = useSidebar()
  return (
    <Link to='/' aria-label='Ansilum' className='flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5'>
      <Logo />
      {(state !== 'collapsed' || isMobile) && <span className='text-foreground text-xl font-bold tracking-[-0.04em]'>ansilum</span>}
    </Link>
  )
}
