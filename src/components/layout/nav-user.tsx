import { useCopy } from '@/hooks/use-copy'
import { Link } from '@tanstack/react-router'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
} from '@/components/icons'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { SignOutDialog } from '@/components/sign-out-dialog'

type NavUserProps = {
  user: {
    name: string
    email: string
    avatar?: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const copy = useCopy()
  const { isMobile, state } = useSidebar()
  const [open, setOpen] = useDialogState()
  const isCollapsed = state === 'collapsed'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {isCollapsed ? (
            <button type='button' aria-label={copy('Menu akun', 'Account menu')} className='flex min-h-12 w-full items-center justify-center rounded-lg py-2'>
              <Avatar className='size-8'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='text-xs'>
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <button type='button' className='hover:bg-accent flex min-h-12 w-full items-center gap-3 rounded-lg p-3 text-start transition-colors'>
              <Avatar className='size-7 sm:size-8'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='text-xs'>
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <p className='text-xs font-semibold sm:text-sm'>{user.name}</p>
                <p className='text-muted-foreground truncate text-xs sm:text-xs'>
                  {user.email}
                </p>
              </div>
              <ChevronsUpDown className='text-muted-foreground size-4 shrink-0' />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-[200px]'
          side={isMobile ? 'bottom' : 'right'}
          align='end'
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to='/settings/account'>
                <BadgeCheck className='mr-2 size-4' />
                {copy('Akun Anda', 'Your account')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings/subscription'>
                <CreditCard className='mr-2 size-4' />
                {copy('Paket langganan', 'Subscription')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings/notifications'>
                <Bell className='mr-2 size-4' />
                {copy('Notifikasi', 'Notifications')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
            <LogOut className='mr-2 size-4' />
            {copy('Keluar', 'Sign out')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
