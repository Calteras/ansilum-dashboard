import { usePricingSettingsQuery } from '@/features/sale-pricing/api/pricing.queries'
import { DEFAULT_TIMEZONE } from '@/features/sale-pricing/lib/pricing'

/** The tenant's business clock, which the server reads booking times on. */
export function useBusinessTimeZone() {
  const settings = usePricingSettingsQuery()
  return settings.data?.timezone ?? DEFAULT_TIMEZONE
}
