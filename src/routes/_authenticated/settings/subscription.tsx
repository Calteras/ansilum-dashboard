import { createFileRoute } from '@tanstack/react-router'
import { SettingsSubscription } from '@/features/settings/subscription'

export const Route = createFileRoute('/_authenticated/settings/subscription')({
  component: SettingsSubscription,
})
