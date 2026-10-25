import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getOutletMonitorApi } from './outlet-monitor.api'

/** How often an open monitor refreshes itself. */
const MONITOR_REFRESH_MS = 60_000

const outletMonitorKeys = {
  all: ['outlet-monitor'] as const,
  live: () => [...outletMonitorKeys.all, 'live'] as const,
}

export function useOutletMonitorQuery(enabled = true) {
  const activeTenant = useAuthStore((s) => s.activeTenant)

  return useQuery({
    queryKey: outletMonitorKeys.live(),
    queryFn: getOutletMonitorApi,
    enabled: enabled && !!activeTenant,
    refetchInterval: MONITOR_REFRESH_MS,
  })
}
