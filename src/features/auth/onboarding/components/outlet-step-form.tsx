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
import { Textarea } from '@/components/ui/textarea'
import { UiText } from '@/components/ui-text'
import type { OnboardingFormData } from '../types'

const outletSchema = z.object({
  outletName: z
    .string()
    .min(2, 'Outlet name must be at least 2 characters')
    .max(100, 'Outlet name must not exceed 100 characters'),
  outletCode: z
    .string()
    .min(1, 'Outlet code is required')
    .max(20, 'Outlet code must not exceed 20 characters')
    .regex(
      /^[A-Z0-9-]+$/,
      'Code must contain only uppercase letters, numbers, and hyphens'
    ),
  outletAddress: z
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .optional(),
  outletPhone: z
    .string()
    .regex(/^[+\d\s\-()]*$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
})

interface OutletStepFormProps {
  onSubmit: (data: OnboardingFormData) => Promise<void>
  onBack: () => void
  isLoading?: boolean
}

export function OutletStepForm({
  onSubmit,
  onBack,
  isLoading,
}: OutletStepFormProps) {
  const [error, setError] = useState<string>('')

  const form = useForm<z.infer<typeof outletSchema>>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      outletName: '',
      outletCode: '',
      outletAddress: '',
      outletPhone: '',
    },
  })

  // Auto-generate code when outlet name changes
  const generateCode = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 3)
      .padEnd(3, '0')
  }

  const handleOutletNameChange = (value: string) => {
    form.setValue('outletName', value)
    if (!form.formState.dirtyFields.outletCode) {
      form.setValue('outletCode', `OUT-${generateCode(value)}`)
    }
  }

  const handleSubmit = async (data: z.infer<typeof outletSchema>) => {
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
            name='outletName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Nama gerai atau cabang' en='Outlet/Branch Name' />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., TerraCafe - Mall Central'
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => handleOutletNameChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  <UiText
                    id='Nama gerai atau cabang usaha Anda'
                    en='The name of your store or restaurant location'
                  />
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='outletCode'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Kode gerai' en='Outlet Code' />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., OUT-001'
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  <UiText
                    id='Kode pengenal gerai ini'
                    en='Unique identifier for this outlet location'
                  />
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='outletAddress'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Alamat (opsional)' en='Address (Optional)' />
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Street address, city, and other location details'
                    disabled={isLoading}
                    className='resize-none'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='outletPhone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText
                    id='Nomor telepon (opsional)'
                    en='Phone Number (Optional)'
                  />
                </FormLabel>
                <FormControl>
                  <Input
                    type='tel'
                    placeholder='+62-21-1234567'
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
          <div className='rounded-md bg-red-50 p-3 text-sm text-red-800'>
            {error}
          </div>
        )}

        <div className='mt-2 flex flex-col gap-3 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            className='flex-1'
            onClick={onBack}
            disabled={isLoading}
          >
            <UiText id='Kembali' en='Back' />
          </Button>
          <Button type='submit' className='flex-1' disabled={isLoading}>
            {isLoading ? 'Creating Outlet...' : 'Continue'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
