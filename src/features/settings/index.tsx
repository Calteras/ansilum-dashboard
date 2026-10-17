import { Outlet } from '@tanstack/react-router'
import { useCopy } from '@/hooks/use-copy'
import { Separator } from '@/components/ui/separator'
import {
  Monitor,
  Bell,
  Palette,
  Wrench,
  UserCog,
  CreditCard,
  Building2,
  Receipt,
} from '@/components/icons'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { SidebarNav } from './components/sidebar-nav'

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/settings',
    icon: <UserCog size={18} />,
  },
  {
    title: 'Business',
    href: '/settings/business',
    icon: <Building2 size={18} />,
  },
  {
    title: 'Receipt',
    href: '/settings/receipt',
    icon: <Receipt size={18} />,
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
  const labels: Record<string, string> = {
    Profile: copy('Profil', 'Profile'),
    Business: copy('Usaha', 'Business'),
    Receipt: copy('Struk & cetak', 'Receipt & printing'),
    Account: copy('Akun', 'Account'),
    Appearance: copy('Tampilan', 'Appearance'),
    Notifications: copy('Notifikasi', 'Notifications'),
    Display: copy('Isi dasbor', 'Display'),
    Subscription: copy('Langganan', 'Subscription'),
  }
  return (
    <>
      {/* ===== Top Heading ===== */}
      <AppHeader />

      <Main fixed>
        <PageHeader
          title={copy('Pengaturan', 'Settings')}
          description={copy(
            'Akun, usaha, tampilan, struk, dan langganan',
            'Account, business, appearance, receipts and subscription'
          )}
        />
        <Separator className='my-4' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav
              items={sidebarNavItems.map((item) => ({
                ...item,
                title: labels[item.title],
              }))}
            />
          </aside>
          <div className='flex w-full overflow-y-auto p-1'>
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  )
}
