import { createFileRoute } from '@tanstack/react-router'
import { Taxes } from '@/features/sale-pricing/taxes'

export const Route = createFileRoute('/_authenticated/taxes/')({
  component: Taxes,
})
