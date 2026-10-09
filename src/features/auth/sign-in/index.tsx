import { Link, useSearch } from '@tanstack/react-router'
import { useCopy } from '@/hooks/use-copy'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignInContent({ redirect }: { redirect?: string }) {
  const copy = useCopy()
  return (
    <AuthLayout>
      <div className='space-y-8'>
        <div className='space-y-3'>
          <h1 className='text-[32px] font-bold tracking-[-0.03em]'>{copy('Selamat datang kembali.', 'Welcome back.')}</h1>
          <p className='text-muted-foreground'>{copy('Masuk untuk melihat kabar usaha Anda.', 'Sign in to see how your business is doing.')}</p>
        </div>
        <UserAuthForm redirectTo={redirect} />
        <p className='text-muted-foreground border-t pt-6 text-sm'>{copy('Belum punya akun?', 'New to Ansilum?')} <Link to='/sign-up' className='text-brand-ink inline-flex min-h-11 items-center font-semibold hover:underline'>{copy('Buat akun', 'Create an account')} →</Link></p>
      </div>
    </AuthLayout>
  )
}

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  return <SignInContent redirect={redirect} />
}
