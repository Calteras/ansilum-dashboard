import { STATUS_TONE } from '@/lib/status-tone'
import { useCopy } from '@/hooks/use-copy'
import type { OutletActivity } from '../api/outlet-monitor.types'

/** Live is good news, quiet needs a look, inactive is a fact rather than a fault. */
export const ACTIVITY_DOT: Record<OutletActivity, string> = {
  LIVE: 'bg-status-success',
  IDLE: 'bg-status-warning',
  OFFLINE: 'bg-fg-muted',
}

export const ACTIVITY_TONE: Record<OutletActivity, string> = {
  LIVE: STATUS_TONE.success,
  IDLE: STATUS_TONE.warning,
  OFFLINE: STATUS_TONE.neutral,
}

export function useActivityCopy(liveWindowMinutes: number) {
  const copy = useCopy()
  return (activity: OutletActivity) =>
    ({
      LIVE: {
        label: copy('Aktif', 'Active'),
        description: copy(
          `Ada penjualan dalam ${liveWindowMinutes} menit terakhir`,
          `Sold in the last ${liveWindowMinutes} min`
        ),
      },
      IDLE: {
        label: copy('Sepi', 'Quiet'),
        description: copy(
          `Buka, tanpa penjualan ${liveWindowMinutes} menit terakhir`,
          `Open, no sale in the last ${liveWindowMinutes} min`
        ),
      },
      OFFLINE: {
        label: copy('Tidak aktif', 'Inactive'),
        description: copy(
          'Tidak ada shift terbuka atau penjualan hari ini',
          'No open shift or sales today'
        ),
      },
    })[activity]
}
