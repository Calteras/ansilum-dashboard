import { useCopy } from '@/hooks/use-copy'
'use client'

import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ChevronsUpDown,
  Plus,
  Building2,
  Loader2,
  ArrowUpCircle,
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
          <SidebarMenuButton size='lg' disabled>
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              <Loader2 className='size-4 animate-spin' />
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold'>{copy('Memuat…', 'Loading...')}</span>
              <span className='truncate text-xs'>{copy('Menyiapkan usaha Anda', 'Fetching tenants')}</span>
            </div>
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
            size='lg'
            onClick={() => setCreateDialogOpen(true)}
          >
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              <Plus className='size-4' />
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold'>{copy('Tambahkan usaha Anda', 'No Tenant')}</span>
              <span className='truncate text-xs'>{copy('Mulai dari sini', 'Click to create one')}</span>
            </div>
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
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                disabled={isLoading}
              >
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg'>
                  {isLoading ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : activeTenant?.logo ? (
                    <img src={activeTenant.logo} alt='' className='size-full object-cover' />
                  ) : (
                    <Building2 className='size-4' />
                  )}
                </div>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {activeTenant?.name ?? copy('Pilih usaha', 'Select business')}
                  </span>
                  <span className='truncate text-xs'>
                    {activeTenant?.slug ?? copy('Belum ada usaha dipilih', 'No business selected')}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                {copy('Usaha Anda', 'Tenants')}
              </DropdownMenuLabel>
              {tenants.map((membership) => (
                <DropdownMenuItem
                  key={membership.tenant.id}
                  onClick={() => handleTenantSwitch(membership.tenant.id)}
                  className='gap-2 p-2'
                  disabled={isLoading}
                >
                  <div className='flex size-6 items-center justify-center overflow-hidden rounded-sm border'>
                    {membership.tenant.logo ? (
                      <img src={membership.tenant.logo} alt='' className='size-full object-cover' />
                    ) : (
                      <Building2 className='size-4 shrink-0' />
                    )}
                  </div>
                  <div className='flex flex-1 flex-col'>
                    <span className='truncate'>{membership.tenant.name}</span>
                    <span className='text-muted-foreground text-xs'>
                      {membership.role}
                    </span>
                  </div>
                  {membership.tenant.id === activeTenant?.id && (
                    <span className='text-primary text-xs'>{copy('Aktif', 'Active')}</span>
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
                      <span className='font-medium'>{copy('Lihat paket', 'Upgrade Plan')}</span>
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
                    {copy('Tambah usaha', 'Create Tenant')}
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
