import { Link } from '@tanstack/react-router'
import { UiText } from '@/components/ui-text'
import { AuthLayout } from '../auth-layout'
import { AuthPanel } from '../components/auth-panel'
import { SignupStepForm } from '../onboarding/components/signup-step-form'

export function SignUp() {
  return (
    <AuthLayout>
      <AuthPanel
        title={
          <UiText id='Mulai kelola usaha Anda.' en='Build your workspace' />
        }
        description={
          <UiText
            id='Buat akun dan verifikasi email Anda. Lalu masuk untuk menyiapkan usaha dan gerai pertama.'
            en='Create your account and verify your email. Then sign in to set up your business and first outlet.'
          />
        }
        footer={
          <>
            <p>
              <UiText id='Sudah punya akun?' en='Already have an account?' />{' '}
              <Link
                to='/sign-in'
                className='text-brand-ink inline-flex min-h-11 items-center font-semibold hover:underline'
              >
                <UiText id='Masuk' en='Sign In' /> →
              </Link>
            </p>
            <p className='text-xs leading-relaxed'>
              <UiText
                id='Dengan membuat akun, Anda menyetujui'
                en='By creating an account, you agree to our'
              />{' '}
              <a
                href='/terms'
                className='hover:text-primary underline underline-offset-4'
              >
                <UiText id='Ketentuan layanan' en='Terms of Service' />
              </a>{' '}
              <UiText id='dan' en='and' />{' '}
              <a
                href='/privacy'
                className='hover:text-primary underline underline-offset-4'
              >
                <UiText id='Kebijakan privasi' en='Privacy Policy' />
              </a>
              .
            </p>
          </>
        }
      >
        <SignupStepForm />
      </AuthPanel>
    </AuthLayout>
  )
}
