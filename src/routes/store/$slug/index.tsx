import { createFileRoute } from '@tanstack/react-router'
import { StorefrontLanding } from '@/features/storefront/pages/storefront-landing'

export const Route = createFileRoute('/store/$slug/')({
  component: function StorefrontLandingRoute() {
    const { slug } = Route.useParams()
    return <StorefrontLanding slug={slug} />
  },
})
