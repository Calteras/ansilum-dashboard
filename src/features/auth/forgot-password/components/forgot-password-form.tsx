import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { ArrowRight, Loader2 } from '@/components/icons'
import { UiText } from '@/components/ui-text'
import { AuthRequestError, requestPasswordResetApi } from '../../api/auth.api'
import { TurnstileChallenge } from '../../components/turnstile-challenge'
import { useChallenge } from '../../hooks/use-challenge'
import { useCooldown } from '../../hooks/use-cooldown'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email' : undefined),
  }),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const challenge = useChallenge()
  const cooldown = useCooldown()
  const isLoading = challenge.pending
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (cooldown.isCoolingDown()) return
    await challenge.run(async (token) => {
      setError('')
      setMessage('')
      try {
        await requestPasswordResetApi(data.email, token)
        setMessage(
          'If this account can reset its password, an email will be sent. Check your inbox and spam folder.'
        )
      } catch (err) {
        if (err instanceof AuthRequestError && err.status === 429)
          cooldown.setDeadline(err.retryAt)
        setError(
          err instanceof AuthRequestError ? err.message : 'Please try again.'
        )
      }
    })
  }

  return (
    <Form {...form}>
      <form
        aria-busy={isLoading}
        onSubmit={form.handleSubmit(onSubmit)}
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
                <Input placeholder='name@example.com' {...field} />
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
        {error && <p role='alert'>{error}</p>}
        {message && <p role='status'>{message}</p>}
        {cooldown.remaining > 0 && (
          <p role='status'>
            <UiText id='Coba lagi dalam' en='Try again in' />
            {cooldown.remaining}
            <UiText id='detik.' en='seconds.' />
          </p>
        )}
        <Button
          className='mt-2'
          disabled={isLoading || !challenge.ready || cooldown.remaining > 0}
        >
          <UiText id='Lanjutkan' en='Continue' />
          {isLoading ? <Loader2 className='animate-spin' /> : <ArrowRight />}
        </Button>
      </form>
    </Form>
  )
}
