import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UiText } from '@/components/ui-text'
import { AuthLayout } from '../auth-layout'
import { ResendForm } from './resend-form'

export function CheckEmail() {
  return (
    <VerificationCard title='Check your email to verify your Ansilum POS account.'>
      <p className='text-muted-foreground text-sm'>
        Check your inbox and spam/junk folders. After verification, sign in to
        continue.
      </p>
      <ResendForm />
      <Link to='/sign-up' className='block text-sm underline'>
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
      <Card>
        <CardHeader>
          <CardTitle role='status' className='text-xl'>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-5'>
          {children}
          <Link
            to='/sign-in-2'
            className='text-primary block font-medium underline'
          >
            <UiText id='Masuk' en='Sign in' />
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
