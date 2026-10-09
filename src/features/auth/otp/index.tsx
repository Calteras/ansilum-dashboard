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
import { OtpForm } from './components/otp-form'

export function Otp() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-base tracking-tight'><UiText id="Verifikasi dua langkah" en="Two-factor Authentication" /></CardTitle>
          <CardDescription><UiText id="Masukkan kode verifikasi Anda." en="Please enter the authentication code." /><br /><UiText id="Kode verifikasi sudah dikirim ke email Anda." en="We have sent the authentication code to your email." /></CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground px-8 text-center text-sm'><UiText id="Belum menerima kode?" en="Haven't received it?" />{' '}
            <Link
              to='/sign-in'
              className='hover:text-primary underline underline-offset-4'
            ><UiText id="Kirim ulang kode." en="Resend a new code." /></Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
