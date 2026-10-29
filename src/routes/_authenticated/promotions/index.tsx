import { createFileRoute } from '@tanstack/react-router'
import { Promotions } from '@/features/sale-pricing/promotions'

export const Route = createFileRoute('/_authenticated/promotions/')({
  component: Promotions,
})
