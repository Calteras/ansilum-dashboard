import { Link } from '@tanstack/react-router'
import { UiText } from '@/components/ui-text'
import { AuthLayout } from '../auth-layout'
import { AuthPanel } from '../components/auth-panel'
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  return (
    <AuthLayout>
      <AuthPanel
        title={<UiText id='Lupa kata sandi?' en='Forgot Password' />}
        description={
          <UiText
            id='Masukkan email yang terdaftar dan kami akan mengirim tautan untuk membuat kata sandi baru.'
            en='Enter your registered email and we will send you a link to reset your password.'
          />
        }
        footer={
          <p>
            <UiText id='Belum punya akun?' en="Don't have an account?" />{' '}
            <Link
              to='/sign-up'
              className='text-brand-ink inline-flex min-h-11 items-center font-semibold hover:underline'
            >
              <UiText id='Daftar' en='Sign up' /> →
            </Link>
          </p>
        }
      >
        <ForgotPasswordForm />
      </AuthPanel>
    </AuthLayout>
  )
}
