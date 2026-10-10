import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
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
import { UiText } from '@/components/ui-text'
import { signUpApi, AuthRequestError } from '../../api/auth.api'
import { TurnstileChallenge } from '../../components/turnstile-challenge'
import { useChallenge } from '../../hooks/use-challenge'
import { useCooldown } from '../../hooks/use-cooldown'
import { savePendingVerification } from '../../verification/pending-email'

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export function SignupStepForm() {
  const navigate = useNavigate()
  const challenge = useChallenge()
  const cooldown = useCooldown()
  const isLoading = challenge.pending
  const [error, setError] = useState<string>('')

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const handleSubmit = async (data: z.infer<typeof signupSchema>) => {
    if (cooldown.isCoolingDown()) return
    await challenge.run(async (token) => {
      setError('')
      savePendingVerification(data.email)
      // Clear secrets as soon as submission starts, including uncertain failures.
      form.setValue('password', '')
      form.setValue('confirmPassword', '')
      try {
        await signUpApi(
          { name: data.name, email: data.email, password: data.password },
          token
        )
        savePendingVerification(data.email, Date.now() + 60_000)
        await navigate({ to: '/auth/check-email' })
      } catch (err) {
        if (err instanceof AuthRequestError && err.status === 429) {
          cooldown.setDeadline(err.retryAt)
          savePendingVerification(data.email, err.retryAt)
        }
        setError(
          err instanceof AuthRequestError
            ? err.message + ' You can also request verification below.'
            : 'We could not confirm registration completed. Try again or request verification.'
        )
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='grid gap-5'>
        <div className='grid gap-5'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Nama lengkap' en='Full Name' />
                </FormLabel>
                <FormControl>
                  <Input
                    autoComplete='name'
                    placeholder='John Doe'
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
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Alamat email' en='Email Address' />
                </FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    autoComplete='email'
                    placeholder='john@example.com'
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
              <FormItem>
                <FormLabel>
                  <UiText id='Kata sandi' en='Password' />
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete='new-password'
                    placeholder='••••••••'
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
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Ulangi kata sandi' en='Confirm Password' />
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete='new-password'
                    placeholder='••••••••'
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <div
            role='alert'
            className='animate-in shake border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm duration-300'
          >
            <div className='flex gap-2'>
              <div className='bg-destructive mt-1 h-2 w-2 shrink-0 rounded-full' />
              <p>{error}</p>
            </div>
          </div>
        )}

        {error && (
          <Link to='/auth/check-email' className='text-sm underline'>
            <UiText
              id='Kirim email verifikasi'
              en='Request verification email'
            />
          </Link>
        )}
        {!isLoading && (
          <TurnstileChallenge
            key={challenge.generation}
            onToken={challenge.onToken}
          />
        )}
        {cooldown.remaining > 0 && (
          <p role='status'>
            <UiText id='Coba lagi dalam' en='Try again in' />{' '}
            {cooldown.remaining} <UiText id='detik.' en='seconds.' />
          </p>
        )}
        <Button
          type='submit'
          className='mt-2 w-full'
          disabled={isLoading || !challenge.ready || cooldown.remaining > 0}
        >
          {isLoading ? (
            <span className='flex items-center justify-center gap-2'>
              <div className='border-primary-foreground/30 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2' />
              <UiText id='Membuat akun…' en='Creating Account...' />
            </span>
          ) : (
            'Continue'
          )}
        </Button>
      </form>
    </Form>
  )
}
