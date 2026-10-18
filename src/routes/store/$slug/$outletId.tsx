import { createFileRoute } from '@tanstack/react-router'
import { StorefrontMenu } from '@/features/storefront/pages/storefront-menu'

export const Route = createFileRoute('/store/$slug/$outletId')({
  component: function StorefrontMenuRoute() {
    const { slug, outletId } = Route.useParams()
    return (
      <StorefrontMenu
        key={`${slug}/${outletId}`}
        slug={slug}
        outletId={outletId}
      />
    )
  },
})
