import { createFileRoute } from '@tanstack/react-router'
import { Rewards } from '@/features/loyalty/rewards'

export const Route = createFileRoute('/_authenticated/rewards/')({
  component: Rewards,
})
