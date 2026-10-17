import { useLocation } from '@tanstack/react-router'
import { useLayout } from '@/context/layout-provider'
import { useCopy } from '@/hooks/use-copy'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { ChevronsLeft, ChevronsRight } from '@/components/icons'
import { BrandCard } from './brand-card'
import { useNavigation } from './data/use-navigation'
import { NavGroup, NavLinkItem } from './nav-group'
import { TenantSwitcher } from './tenant-switcher'

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

/**
 * Console sidebar: logo row aligned with the app header, business switcher,
 * sectioned navigation with expandable groups, and a collapse control that
 * reduces it to an icon rail (also ⌘/Ctrl+B).
 */
export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  // Collapsing always leaves the icon rail; a fully hidden sidebar would have
  // no way back on desktop now that the header toggle is mobile-only.
  const mode = collapsible === 'none' ? 'none' : 'icon'
  const { groups, footer } = useNavigation()
  const pathname = useLocation({ select: (location) => location.pathname })

  return (
    <Sidebar collapsible={mode} variant={variant} className='border-divider'>
      <SidebarHeader className='border-divider h-(--app-header-height) shrink-0 justify-center border-b px-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2'>
        <BrandCard />
      </SidebarHeader>

      <div className='px-2 pt-2'>
        <TenantSwitcher />
      </div>

      <SidebarContent className='gap-4 px-2 py-3'>
        {groups.map((group, index) => (
          <NavGroup key={group.title ?? index} group={group} />
        ))}
      </SidebarContent>

      <SidebarFooter className='border-divider gap-px border-t p-2'>
        <SidebarMenu className='gap-px'>
          {footer.map((item) => (
            <NavLinkItem key={item.url} item={item} pathname={pathname} />
          ))}
          {mode === 'icon' && <CollapseControl />}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function CollapseControl() {
  const copy = useCopy()
  const { state, isMobile, toggleSidebar } = useSidebar()
  if (isMobile) return null

  const collapsed = state === 'collapsed'
  const label = collapsed
    ? copy('Lebarkan menu', 'Expand sidebar')
    : copy('Ciutkan menu', 'Collapse sidebar')
  const shortcut = isMac ? '⌘B' : 'Ctrl+B'

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={toggleSidebar}
        tooltip={`${label} (${shortcut})`}
        aria-label={label}
        aria-expanded={!collapsed}
        className='text-fg-secondary'
      >
        {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
        <span>{label}</span>
        <kbd className='text-fg-muted ms-auto rounded border px-1 text-[10px] leading-4'>
          {shortcut}
        </kbd>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
