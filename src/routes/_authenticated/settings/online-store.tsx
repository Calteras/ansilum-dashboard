import { createFileRoute } from '@tanstack/react-router'
import { SettingsOnlineStore } from '@/features/settings/online-store'

export const Route = createFileRoute('/_authenticated/settings/online-store')({
  component: SettingsOnlineStore,
})
