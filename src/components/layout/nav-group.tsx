import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { ChevronRight, Lock } from '@/components/icons'
import {
  isPathActive,
  type ResolvedNavGroup,
  type ResolvedNavItem,
  type ResolvedNavLink,
} from './data/use-navigation'

export function NavGroup({ group }: { group: ResolvedNavGroup }) {
  const pathname = useLocation({ select: (location) => location.pathname })

  return (
    <SidebarGroup className='p-0'>
      {group.title && (
        <SidebarGroupLabel className='text-fg-muted h-7 px-2 text-xs font-medium'>
          {group.title}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className='gap-px'>
        {group.items.map((item) =>
          item.items ? (
            <NavCollapsibleItem
              key={item.title}
              item={item}
              pathname={pathname}
            />
          ) : (
            <NavLinkItem key={item.url} item={item} pathname={pathname} />
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function LockMark() {
  return (
    <Lock
      className='text-fg-muted ms-auto size-3.5'
      aria-label='Requires a plan upgrade'
    />
  )
}

export function NavLinkItem({
  item,
  pathname,
}: {
  item: ResolvedNavLink
  pathname: string
}) {
  const { setOpenMobile } = useSidebar()
  const active = isPathActive(pathname, item.url)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
        <Link
          to={item.url}
          aria-current={active ? 'page' : undefined}
          onClick={() => setOpenMobile(false)}
          className={cn(item.locked && 'opacity-70')}
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.locked ? <LockMark /> : item.indicator && <item.indicator />}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

const OPEN_STATE_KEY = 'ansilum.sidebar.open-groups'

function readOpenState(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(OPEN_STATE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeOpenState(id: string, open: boolean) {
  try {
    localStorage.setItem(
      OPEN_STATE_KEY,
      JSON.stringify({ ...readOpenState(), [id]: open })
    )
  } catch {
    // Storage unavailable (private mode): the group simply won't remember.
  }
}

function NavCollapsibleItem({
  item,
  pathname,
}: {
  item: Extract<ResolvedNavItem, { items: ResolvedNavLink[] }>
  pathname: string
}) {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const id = item.items[0]?.url ?? item.title
  const childActive = item.items.some((sub) => isPathActive(pathname, sub.url))
  const [remembered, setRemembered] = useState(
    () => readOpenState()[id] ?? false
  )
  // A group holding the current page stays open unless closed on that page.
  const [closedOn, setClosedOn] = useState<string | null>(null)
  const open = childActive ? closedOn !== pathname : remembered

  const handleOpenChange = (next: boolean) => {
    if (childActive) setClosedOn(next ? null : pathname)
    setRemembered(next)
    writeOpenState(id, next)
  }

  if (state === 'collapsed' && !isMobile) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={childActive}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side='right'
            align='start'
            sideOffset={8}
            className='min-w-48'
          >
            <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
            {item.items.map((sub) => (
              <DropdownMenuItem key={sub.url} asChild>
                <Link
                  to={sub.url}
                  aria-current={
                    isPathActive(pathname, sub.url) ? 'page' : undefined
                  }
                  className={cn(
                    isPathActive(pathname, sub.url) &&
                      'bg-surface-selected font-medium'
                  )}
                >
                  <span>{sub.title}</span>
                  {sub.locked && <LockMark />}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={handleOpenChange}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight className='text-fg-muted ms-auto size-3.5! transition-transform duration-150 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub className='me-0 gap-px py-1 pe-0'>
            {item.items.map((sub) => {
              const active = isPathActive(pathname, sub.url)
              return (
                <SidebarMenuSubItem key={sub.url}>
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link
                      to={sub.url}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setOpenMobile(false)}
                      className={cn(sub.locked && 'opacity-70')}
                    >
                      <span>{sub.title}</span>
                      {sub.locked && <LockMark />}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
