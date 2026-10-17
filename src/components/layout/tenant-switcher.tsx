import { useCopy } from '@/hooks/use-copy'
'use client'

import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowUpCircle,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
} from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  useSetActiveTenantMutation,
  useTenantsQuery,
} from '@/features/auth/api/auth.queries'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'
import { TenantCreateDialog } from '@/features/tenants/components/tenant-create-dialog'

function initials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function TenantSwitcher() {
  const copy = useCopy()
  const { isMobile } = useSidebar()
  const { activeTenant, tenants, isAuthenticated } = useAuth()
  const { isLoading: isLoadingTenants } = useTenantsQuery()
  const setActiveTenantMutation = useSetActiveTenantMutation()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const { data: subscription } = useCurrentSubscriptionQuery()

  const limit = subscription?.data?.limits.tenants
  const tenantCount = subscription?.data?.usage.tenants
  const tenantLimitReached = subscription?.data?.canCreateTenant === false

  const handleTenantSwitch = (tenantId: string) => {
    if (tenantId === activeTenant?.id) return
    setActiveTenantMutation.mutate(tenantId)
  }

  const isLoading = setActiveTenantMutation.isPending || isLoadingTenants

  // Show loading state while fetching tenants
  if (isLoadingTenants) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled className='h-9 group-data-[collapsible=icon]:p-1!'>
            <div className='bg-surface-selected flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md'>
              <Loader2 className='size-3.5 animate-spin' />
            </div>
            <span className='truncate text-[13px] font-medium'>{copy('Memuat…', 'Loading…')}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Show empty state if no tenants
  if (tenants.length === 0 && isAuthenticated) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => setCreateDialogOpen(true)}
            tooltip={copy('Tambah usaha', 'Create a business')}
            className='h-9 group-data-[collapsible=icon]:p-1!'
          >
            <div className='bg-surface-selected flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md'>
              <Plus className='size-3.5' />
            </div>
            <span className='truncate text-[13px] font-medium'>
              {copy('Tambah usaha', 'Create a business')}
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <TenantCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </SidebarMenu>
    )
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip={activeTenant?.name ?? copy('Pilih usaha', 'Select business')}
                aria-label={copy('Ganti usaha', 'Switch business')}
                className='data-[state=open]:bg-surface-selected h-9 group-data-[collapsible=icon]:p-1!'
                disabled={isLoading}
              >
                <div className='bg-surface-selected text-foreground flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md text-[11px] font-semibold'>
                  {isLoading ? (
                    <Loader2 className='size-3.5 animate-spin' />
                  ) : activeTenant?.logo ? (
                    <img src={activeTenant.logo} alt='' className='size-full object-cover' />
                  ) : (
                    initials(activeTenant?.name)
                  )}
                </div>
                <span className='truncate text-[13px] font-semibold'>
                  {activeTenant?.name ?? copy('Pilih usaha', 'Select business')}
                </span>
                <ChevronsUpDown className='text-fg-muted ms-auto size-3.5!' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel>
                {copy('Usaha Anda', 'Businesses')}
              </DropdownMenuLabel>
              {tenants.map((membership) => (
                <DropdownMenuItem
                  key={membership.tenant.id}
                  onClick={() => handleTenantSwitch(membership.tenant.id)}
                  className='gap-2 p-2'
                  disabled={isLoading}
                >
                  <div className='bg-surface-selected flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md text-[11px] font-semibold'>
                    {membership.tenant.logo ? (
                      <img src={membership.tenant.logo} alt='' className='size-full object-cover' />
                    ) : (
                      initials(membership.tenant.name)
                    )}
                  </div>
                  <div className='flex flex-1 flex-col'>
                    <span className='truncate'>{membership.tenant.name}</span>
                    <span className='text-muted-foreground text-xs'>
                      {membership.role}
                    </span>
                  </div>
                  {membership.tenant.id === activeTenant?.id && (
                    <Check className='size-4' aria-label={copy('Aktif', 'Active')} />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {tenantLimitReached ? (
                <DropdownMenuItem className='gap-2 p-2' asChild>
                  <Link to='/settings/subscription'>
                    <div className='bg-background flex size-6 items-center justify-center rounded-md border'>
                      <ArrowUpCircle className='size-4' />
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-muted-foreground text-xs'>
                        {copy('Batas usaha tercapai', 'Business limit reached')} ({tenantCount}/{limit})
                      </span>
                      <span className='font-medium'>{copy('Lihat paket', 'Upgrade plan')}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className='gap-2 p-2'
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <div className='bg-background flex size-6 items-center justify-center rounded-md border'>
                    <Plus className='size-4' />
                  </div>
                  <div className='text-muted-foreground font-medium'>
                    {copy('Tambah usaha', 'Create a business')}
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <TenantCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  )
}
