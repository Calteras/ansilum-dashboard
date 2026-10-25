import { createFileRoute } from '@tanstack/react-router'
import { LoyaltyProgram } from '@/features/loyalty/program'

export const Route = createFileRoute('/_authenticated/loyalty/')({
  component: LoyaltyProgram,
})
