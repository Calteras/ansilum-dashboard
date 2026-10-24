import { format } from 'date-fns'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import type { UnitBalance } from '../api/assistant.types'

/** AI units left this period, shared by every business of the subscription account. */
export function UnitsBalance({
  balance,
  remainingOverride,
}: {
  balance: UnitBalance | undefined
  remainingOverride: number | null
}) {
  const copy = useCopy()
  if (!balance) return null
  const remaining = remainingOverride ?? balance.remaining_units
  return (
    <Badge
      variant={remaining > 0 ? 'upcoming' : 'default'}
      title={copy(
        `Diisi ulang ${format(new Date(balance.cycle_end), 'd MMM yyyy')}`,
        `Refills on ${format(new Date(balance.cycle_end), 'd MMM yyyy')}`
      )}
    >
      {copy(`${remaining} unit AI tersisa`, `${remaining} AI units left`)}
    </Badge>
  )
}
