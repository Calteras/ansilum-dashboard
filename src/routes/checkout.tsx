import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Checkout } from '@/features/checkout'

const checkoutSearchSchema = z.object({
  plan: z.enum(['STANDARD', 'FULL']).optional().catch(undefined),
  order: z.string().uuid().optional().catch(undefined),
  // Pay for the current plan again (within the renewal window) instead of upgrading.
  renew: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/checkout')({
  validateSearch: checkoutSearchSchema,
  component: CheckoutRoute,
})

function CheckoutRoute() {
  return <Checkout search={Route.useSearch()} />
}
