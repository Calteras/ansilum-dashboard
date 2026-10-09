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
import { SignupStepForm } from '../onboarding/components/signup-step-form'

export function SignUp() {
  return (
    <AuthLayout>
      <div className='grid gap-6'>
        <Card className='gap-0 overflow-hidden'>
          <CardHeader className='border-b pb-6'>
            <p className='text-primary font-sans tabular-nums text-xs tracking-widest uppercase'><UiText id="Selamat datang di Ansilum" en="Welcome to Ansilum POS" /></p>
            <CardTitle className='pt-2 text-2xl tracking-tight'><UiText id="Mulai kelola usaha Anda." en="Build your workspace" /></CardTitle>
            <CardDescription className='leading-relaxed'><UiText id="Buat akun dan verifikasi email Anda. Lalu masuk untuk menyiapkan usaha dan gerai pertama." en="Create your account and verify your email. Then sign in to set up your business and first outlet." /></CardDescription>
          </CardHeader>
          <CardContent className='py-5'>
            <SignupStepForm />
          </CardContent>
          <CardFooter className='bg-muted/30 flex-col gap-4 border-t pt-5'>
            <p className='text-muted-foreground text-center text-sm'><UiText id="Sudah punya akun?" en="Already have an account?" />{' '}
              <Link
                to='/sign-in'
                className='hover:text-primary underline underline-offset-4'
              ><UiText id="Masuk" en="Sign In" /></Link>
            </p>
          </CardFooter>
        </Card>

        <p className='text-muted-foreground px-4 text-center text-xs leading-relaxed'><UiText id="Dengan membuat akun, Anda menyetujui" en="By creating an account, you agree to our" />{' '}
          <a
            href='/terms'
            className='hover:text-primary underline underline-offset-4'
          ><UiText id="Ketentuan layanan" en="Terms of Service" /></a>{' '}<UiText id="dan" en="and" />{' '}
          <a
            href='/privacy'
            className='hover:text-primary underline underline-offset-4'
          ><UiText id="Kebijakan privasi" en="Privacy Policy" /></a>
          .
        </p>
      </div>
    </AuthLayout>
  )
}
