import { Loader2, LogIn } from '@/components/icons'
import { Link } from '@tanstack/react-router'
import { useCopy } from '@/hooks/use-copy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { useLogin } from '@/features/auth/hooks/use-login'
import { TurnstileChallenge } from '../../components/turnstile-challenge'

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({ className, redirectTo: _redirectTo, ...props }: UserAuthFormProps) {
  const copy = useCopy()
  // Keep the existing authentication and challenge lifecycle.
  const { form, onSubmit, isLoading, challenge, cooldown } = useLogin()

  return (
    <Form {...form}>
      <form
        aria-busy={isLoading}
        onSubmit={onSubmit}
        className={cn('grid gap-5', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type='email' autoComplete='email' placeholder='nama@usaha.com'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <div className='flex items-center justify-between gap-2'><FormLabel>{copy('Kata sandi', 'Password')}</FormLabel><Link to='/forgot-password' className='text-brand-ink inline-flex min-h-11 items-center text-sm font-semibold hover:underline'>{copy('Lupa kata sandi?', 'Forgot password?')}</Link></div>
              <FormControl>
                <PasswordInput
                  autoComplete='current-password' placeholder='•••••••••'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isLoading && (
          <TurnstileChallenge
            key={challenge.generation}
            onToken={challenge.onToken}
          />
        )}
        {cooldown.remaining > 0 && (
          <p role='status'>{copy('Coba lagi dalam', 'Try again in')} {cooldown.remaining} {copy('detik.', 'seconds.')}</p>
        )}
        <Button
          className='mt-2'
          disabled={isLoading || !challenge.ready || cooldown.remaining > 0}
        >
          {isLoading ? (
            <>
              <Loader2 className='animate-spin' />
              {copy('Sedang masuk…', 'Signing in…')}
            </>
          ) : (
            <>
              <LogIn />
              {copy('Masuk', 'Sign in')}
            </>
          )}
        </Button>

      </form>
    </Form>
  )
}
