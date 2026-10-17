import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { UiText } from '@/components/ui-text'
import type { OnboardingFormData } from '../types'

const businessSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must not exceed 100 characters'),
  businessSlug: z
    .string()
    .min(2, 'Business slug must be at least 2 characters')
    .max(50, 'Business slug must not exceed 50 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
})

interface BusinessStepFormProps {
  onSubmit: (data: OnboardingFormData) => Promise<void>
  onBack?: () => void
  isLoading?: boolean
}

export function BusinessStepForm({
  onSubmit,
  onBack,
  isLoading,
}: BusinessStepFormProps) {
  const [error, setError] = useState<string>('')

  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: '',
      businessSlug: '',
    },
  })

  // Auto-generate slug when business name changes
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const handleBusinessNameChange = (value: string) => {
    form.setValue('businessName', value)
    if (!form.formState.dirtyFields.businessSlug) {
      form.setValue('businessSlug', generateSlug(value))
    }
  }

  const handleSubmit = async (data: z.infer<typeof businessSchema>) => {
    try {
      setError('')
      await onSubmit(data as OnboardingFormData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='grid gap-5'>
        <div className='grid gap-5'>
          <FormField
            control={form.control}
            name='businessName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Nama usaha' en='Business Name' />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., TerraCafe Indonesia'
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  <UiText
                    id='Nama yang digunakan usaha Anda'
                    en='The name of your business or restaurant'
                  />
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='businessSlug'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Alamat usaha' en='Business Slug' />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., terracafe-indonesia'
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  <UiText
                    id='Alamat singkat usaha Anda, gunakan huruf kecil dan tanda hubung.'
                    en='URL-friendly identifier for your business'
                  />
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <div className='rounded-md bg-status-danger/10 p-3 text-sm text-status-danger'>
            {error}
          </div>
        )}

        <div className='mt-2 flex flex-col gap-3 sm:flex-row'>
          {onBack && (
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={onBack}
              disabled={isLoading}
            >
              <UiText id='Kembali' en='Back' />
            </Button>
          )}
          <Button type='submit' className='flex-1' disabled={isLoading}>
            {isLoading ? 'Creating Business...' : 'Continue'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
