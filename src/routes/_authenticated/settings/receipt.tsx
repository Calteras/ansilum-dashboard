import { createFileRoute } from '@tanstack/react-router'
import { SettingsReceipt } from '@/features/settings/receipt'

export const Route = createFileRoute('/_authenticated/settings/receipt')({
  component: SettingsReceipt,
})
