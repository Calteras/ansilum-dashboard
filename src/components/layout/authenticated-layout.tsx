import { Outlet, Navigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Loader2 } from '@/components/icons'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SubscriptionGuard } from '@/components/layout/subscription-guard'
import { SkipToMain } from '@/components/skip-to-main'
import { AssistantShell } from '@/features/assistant/shell/assistant-shell'
import { useSessionRestore } from '@/features/auth/hooks/use-session-restore'
import { CommandMenu } from '@/features/search/command-menu'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { isPending } = useSessionRestore()

  if (isPending) {
    return (
      <div
        role='status'
        aria-label='Loading session'
        className='flex h-svh items-center justify-center'
      >
        <Loader2 className='text-muted-foreground size-8 animate-spin' />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to='/sign-in-2' />

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <CommandMenu />
          <AppSidebar />
          <SidebarInset
            className={cn(
              // Set content container, so we can use container queries
              '@container/content',

              // If layout is fixed, set the height
              // to 100svh to prevent overflow
              'has-data-[layout=fixed]:h-svh',

              // If layout is fixed and sidebar is inset,
              // set the height to 100svh - spacing (total margins) to prevent overflow
              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            <SubscriptionGuard>{children ?? <Outlet />}</SubscriptionGuard>
          </SidebarInset>
          <AssistantShell />
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
