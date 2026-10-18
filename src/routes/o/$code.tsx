import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/storefront/pages/order-page'

const searchSchema = z.object({
  t: z.string().max(64).optional().catch(undefined),
})

export const Route = createFileRoute('/o/$code')({
  validateSearch: searchSchema,
  component: function OrderRoute() {
    const { code } = Route.useParams()
    const { t } = Route.useSearch()
    return <OrderPage code={code.toUpperCase()} token={t} />
  },
})
