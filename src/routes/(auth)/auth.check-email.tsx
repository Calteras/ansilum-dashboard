import { createFileRoute } from '@tanstack/react-router'
import { CheckEmail } from '@/features/auth/verification/pages'

export const Route = createFileRoute('/(auth)/auth/check-email')({
  component: CheckEmail,
})
