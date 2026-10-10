import { Link } from '@tanstack/react-router'
import { UiText } from '@/components/ui-text'
import { AuthLayout } from '../auth-layout'
import { AuthPanel } from '../components/auth-panel'
import { ResendForm } from './resend-form'

export function CheckEmail() {
  return (
    <VerificationCard title='Check your email to verify your Ansilum POS account.'>
      <p className='text-muted-foreground text-sm'>
        Check your inbox and spam/junk folders. After verification, sign in to
        continue.
      </p>
      <ResendForm />
      <Link
        to='/sign-up'
        className='text-brand-ink inline-flex min-h-11 items-center text-sm font-semibold hover:underline'
      >
        Correct your email or return to signup
      </Link>
    </VerificationCard>
  )
}

export function EmailVerified({ error }: { error?: string }) {
  const message = !error
    ? 'Email verified successfully. You can now sign in.'
    : error === 'token_expired'
      ? 'Verification link expired. Request a new verification email.'
      : error === 'invalid_token'
        ? 'This verification link is invalid. Request a new verification email.'
        : 'We could not verify your email. Request a new verification email.'
  return (
    <VerificationCard title={message}>
      {error && <ResendForm />}
    </VerificationCard>
  )
}

function VerificationCard({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <AuthLayout>
      <AuthPanel
        title={title}
        titleRole='status'
        footer={
          <Link
            to='/sign-in-2'
            className='text-brand-ink inline-flex min-h-11 items-center font-semibold hover:underline'
          >
            <UiText id='Masuk' en='Sign in' /> →
          </Link>
        }
      >
        {children && <div className='space-y-5'>{children}</div>}
      </AuthPanel>
    </AuthLayout>
  )
}
