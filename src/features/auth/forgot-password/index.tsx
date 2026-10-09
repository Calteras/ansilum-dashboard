import { UiText } from '@/components/ui-text'
import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'><UiText id="Lupa kata sandi?" en="Forgot Password" /></CardTitle>
          <CardDescription><UiText id="Masukkan email yang terdaftar dan" en="Enter your registered email and" /><br /><UiText id="kami akan mengirim tautan untuk membuat kata sandi baru." en="we will send you a link to reset your password." /></CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground mx-auto px-8 text-center text-sm text-balance'><UiText id="Belum punya akun?" en="Don't have an account?" />{' '}
            <Link
              to='/sign-up'
              className='hover:text-primary underline underline-offset-4'
            ><UiText id="Daftar" en="Sign up" /></Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
