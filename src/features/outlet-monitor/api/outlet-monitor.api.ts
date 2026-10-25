import { tenantGet, tenantApiPaths } from '@/lib/tenant-api-client'
import type { OutletMonitorResponse } from './outlet-monitor.types'

export async function getOutletMonitorApi(): Promise<OutletMonitorResponse> {
  return tenantGet<OutletMonitorResponse>(tenantApiPaths.analytics.outletsLive)
}
