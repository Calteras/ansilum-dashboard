import { useCopy } from '@/hooks/use-copy'
import { Outlet } from '@tanstack/react-router'
import { Monitor, Bell, Palette, Wrench, UserCog, CreditCard } from '@/components/icons'
import { Separator } from '@/components/ui/separator'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { SidebarNav } from './components/sidebar-nav'

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/settings',
    icon: <UserCog size={18} />,
  },
  {
    title: 'Account',
    href: '/settings/account',
    icon: <Wrench size={18} />,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: <Palette size={18} />,
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: <Bell size={18} />,
  },
  {
    title: 'Display',
    href: '/settings/display',
    icon: <Monitor size={18} />,
  },
  {
    title: 'Subscription',
    href: '/settings/subscription',
    icon: <CreditCard size={18} />,
  },
]

export function Settings() {
  const copy = useCopy()
  const labels: Record<string, string> = { Profile: copy("Profil", "Profile"), Account: copy("Akun", "Account"), Appearance: copy("Tampilan", "Appearance"), Notifications: copy("Notifikasi", "Notifications"), Display: copy("Isi dasbor", "Display"), Subscription: copy("Langganan", "Subscription") }
  return (
    <>
      {/* ===== Top Heading ===== */}
      <AppHeader />

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {copy('Pengaturan', 'Settings')}
          </h1>
          <p className='text-muted-foreground'>
            {copy('Atur akun, tampilan, dan paket untuk usaha Anda.', 'Manage your account, appearance, and business subscription.')}
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={sidebarNavItems.map((item) => ({ ...item, title: labels[item.title] }))} />
          </aside>
          <div className='flex w-full overflow-y-auto p-1'>
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  )
}
