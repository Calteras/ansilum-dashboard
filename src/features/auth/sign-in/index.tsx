import { Link, useSearch } from '@tanstack/react-router'
import { useCopy } from '@/hooks/use-copy'
import { AuthLayout } from '../auth-layout'
import { AuthPanel } from '../components/auth-panel'
import { UserAuthForm } from './components/user-auth-form'

export function SignInContent({ redirect }: { redirect?: string }) {
  const copy = useCopy()
  return (
    <AuthLayout>
      <AuthPanel
        title={copy('Selamat datang kembali.', 'Welcome back.')}
        description={copy(
          'Masuk untuk melihat kabar usaha Anda.',
          'Sign in to see how your business is doing.'
        )}
        footer={
          <p>
            {copy('Belum punya akun?', 'New to Ansilum?')}{' '}
            <Link
              to='/sign-up'
              className='text-brand-ink inline-flex min-h-11 items-center font-semibold hover:underline'
            >
              {copy('Buat akun', 'Create an account')} →
            </Link>
          </p>
        }
      >
        <UserAuthForm redirectTo={redirect} />
      </AuthPanel>
    </AuthLayout>
  )
}

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  return <SignInContent redirect={redirect} />
}
