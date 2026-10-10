import { Link } from '@tanstack/react-router'
import { UiText } from '@/components/ui-text'
import { AuthLayout } from '../auth-layout'
import { AuthPanel } from '../components/auth-panel'
import { OtpForm } from './components/otp-form'

export function Otp() {
  return (
    <AuthLayout>
      <AuthPanel
        title={
          <UiText id='Verifikasi dua langkah' en='Two-factor Authentication' />
        }
        description={
          <UiText
            id='Masukkan kode verifikasi Anda. Kode verifikasi sudah dikirim ke email Anda.'
            en='Please enter the authentication code. We have sent the authentication code to your email.'
          />
        }
        footer={
          <p>
            <UiText id='Belum menerima kode?' en="Haven't received it?" />{' '}
            <Link
              to='/sign-in'
              className='text-brand-ink inline-flex min-h-11 items-center font-semibold hover:underline'
            >
              <UiText id='Kirim ulang kode.' en='Resend a new code.' />
            </Link>
          </p>
        }
      >
        <OtpForm />
      </AuthPanel>
    </AuthLayout>
  )
}
