import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  return (
    <header className={cn('z-30 h-(--app-header-height) shrink-0 border-b bg-background', fixed && 'header-fixed peer/header sticky top-0', className)} {...props}>
      <div className='flex h-full min-w-0 items-center gap-2 px-4 sm:gap-3 sm:px-6'>
        <SidebarTrigger variant='ghost' className='shrink-0 md:hidden' />
        {children}
      </div>
    </header>
  )
}
