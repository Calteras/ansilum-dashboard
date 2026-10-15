import { Link } from '@tanstack/react-router'
import { Settings, HelpCircle } from '@/components/icons'
import { useCopy } from '@/hooks/use-copy'
import { useTranslation } from 'react-i18next'
import { useLayout } from '@/context/layout-provider'
import { useAuth } from '@/features/auth/hooks/use-auth'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { BrandCard } from './brand-card'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TenantSwitcher } from './tenant-switcher'
import type { NavGroup as NavGroupType } from './types'

function useSidebarData(): NavGroupType[] {
  const { t } = useTranslation()
  return sidebarData.navGroups.map((group) => ({
    ...group,
    title: t(group.title as any) as string,
    items: group.items.map((item) => ({
      ...item,
      title: t(item.title as any) as string,
    })),
  }))
}

export function AppSidebar() {
  const copy = useCopy()
  const { collapsible, variant } = useLayout()
  const { user } = useAuth()
  const navGroups = useSidebarData()

  // Build user data from auth store
  const userData = {
    name: user?.name ?? 'User',
    email: user?.email ?? '',
    avatar: user?.image ?? undefined,
  }

  return (
    <Sidebar
      collapsible={collapsible}
      variant={variant}
      className='border-r'
    >
      <SidebarHeader className="border-b px-4 py-3">
        <BrandCard />
      </SidebarHeader>
      <SidebarContent className='flex flex-col gap-6 px-4 py-4'>
        <div className="space-y-5">
          <TenantSwitcher />
          {navGroups.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </div>
        <div className='mt-auto'>
          <SidebarMenu>
            {[{ to: '/settings', icon: Settings, label: copy('Pengaturan', 'Settings') }, { to: '/help-center', icon: HelpCircle, label: copy('Bantuan', 'Help') }].map(({ to, icon: Icon, label }) => (
              <SidebarMenuItem key={to}><SidebarMenuButton asChild tooltip={label}><Link to={to}><Icon /><span>{label}</span></Link></SidebarMenuButton></SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className='border-t p-2'>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
