import { createFileRoute } from '@tanstack/react-router'
import { FoodDelivery } from '@/features/food-delivery'

export const Route = createFileRoute('/_authenticated/food-delivery/')({
  component: FoodDelivery,
})
