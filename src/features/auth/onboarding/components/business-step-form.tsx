import { UiText } from '@/components/ui-text'
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-5'>
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='businessName'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-foreground text-sm font-semibold'><UiText id="Nama usaha" en="Business Name" /></FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., TerraCafe Indonesia'
                    disabled={isLoading}
                    className='bg-background/50 focus:border-primary focus:ring-primary/20 h-10 transition-colors duration-200 focus:ring-2'
                    {...field}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription className='text-muted-foreground text-xs'><UiText id="Nama yang digunakan usaha Anda" en="The name of your business or restaurant" /></FormDescription>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='businessSlug'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-foreground text-sm font-semibold'><UiText id="Alamat usaha" en="Business Slug" /></FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., terracafe-indonesia'
                    disabled={isLoading}
                    className='bg-background/50 focus:border-primary focus:ring-primary/20 h-10 transition-colors duration-200 focus:ring-2'
                    {...field}
                  />
                </FormControl>
                <FormDescription className='text-muted-foreground text-xs'><UiText id="Alamat singkat usaha Anda, gunakan huruf kecil dan tanda hubung." en="URL-friendly identifier for your business" /></FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <div className='rounded-md bg-red-50 p-3 text-sm text-red-800'>
            {error}
          </div>
        )}

        <div className='flex gap-3'>
          {onBack && (
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={onBack}
              disabled={isLoading}
            ><UiText id="Kembali" en="Back" /></Button>
          )}
          <Button type='submit' className='flex-1' disabled={isLoading}>
            {isLoading ? 'Creating Business...' : 'Continue'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
