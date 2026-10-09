import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthRequestError } from '../api/auth.api'
import { useLoginMutation } from '../api/auth.queries'
import { useChallenge } from './use-challenge'
import { useCooldown } from './use-cooldown'

// Login form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(7, 'Password must be at least 7 characters long'),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Hook for login form logic
 * Handles form state, validation, and submission
 */
export function useLogin() {
  const loginMutation = useLoginMutation()
  const challenge = useChallenge()
  const cooldown = useCooldown()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    if (cooldown.isCoolingDown()) return
    await challenge.run(async (captchaToken) => {
      form.setValue('password', '')
      try {
        await loginMutation.mutateAsync({ credentials: data, captchaToken })
      } catch (error) {
        if (error instanceof AuthRequestError && error.status === 429)
          cooldown.setDeadline(error.retryAt)
      } finally {
        loginMutation.reset()
      }
    })
  }

  return {
    form,
    challenge,
    cooldown,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading: challenge.pending,
    error: loginMutation.error,
  }
}
