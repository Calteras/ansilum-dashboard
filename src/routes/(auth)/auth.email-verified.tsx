import { createFileRoute } from '@tanstack/react-router'
import {
  initialVerificationError,
  safeVerificationError,
} from '@/features/auth/verification/callback-location'
import { EmailVerified } from '@/features/auth/verification/pages'

export const Route = createFileRoute('/(auth)/auth/email-verified')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: safeVerificationError(search.error),
  }),
  component: Callback,
})
function Callback() {
  const { error } = Route.useSearch()
  return <EmailVerified error={error ?? initialVerificationError()} />
}
