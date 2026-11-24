import { createFileRoute } from '@tanstack/react-router'
import { StreetFood } from '@/features/street-food'

export const Route = createFileRoute('/_authenticated/street-food/')({
  component: StreetFood,
})
