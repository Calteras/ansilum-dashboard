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
import { PasswordInput } from '@/components/password-input'
import { UiText } from '@/components/ui-text'
import type { OnboardingFormData } from '../types'

const employeeSchema = z.object({
  employeeNo: z
    .string()
    .min(1, 'Employee number is required')
    .max(20, 'Employee number must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  employeeName: z
    .string()
    .min(2, 'Employee name must be at least 2 characters')
    .max(100, 'Employee name must not exceed 100 characters'),
  employeeEmail: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
  employeePhone: z
    .string()
    .regex(/^[+\d\s\-()]*$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  employeePin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4-6 digits'),
})

interface EmployeeStepFormProps {
  onSubmit: (data: OnboardingFormData) => Promise<void>
  onBack: () => void
  onSkip: () => void
  isLoading?: boolean
}

export function EmployeeStepForm({
  onSubmit,
  onBack,
  onSkip,
  isLoading,
}: EmployeeStepFormProps) {
  const [error, setError] = useState<string>('')

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeNo: 'EMP-001',
      employeeName: '',
      employeeEmail: '',
      employeePhone: '',
      employeePin: '',
    },
  })

  const handleSubmit = async (data: z.infer<typeof employeeSchema>) => {
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
            name='employeeNo'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Nomor karyawan' en='Employee Number' />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g., EMP-001'
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  <UiText
                    id='Nomor pengenal karyawan ini'
                    en='Unique identifier for this employee'
                  />
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='employeeName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Nama karyawan' en='Employee Name' />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='John Cashier'
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
            name='employeeEmail'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Email (opsional)' en='Email (Optional)' />
                </FormLabel>
                <FormControl>
                  <Input
                    type='email'
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
            name='employeePhone'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='Telepon (opsional)' en='Phone (Optional)' />
                </FormLabel>
                <FormControl>
                  <Input
                    type='tel'
                    placeholder='+62-812-1234567'
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
            name='employeePin'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <UiText id='PIN kasir' en='PIN for POS Terminal' />
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder='••••'
                    disabled={isLoading}
                    maxLength={6}
                    {...field}
                    inputMode='numeric'
                  />
                </FormControl>
                <FormDescription>
                  <UiText
                    id='PIN 4–6 angka untuk masuk ke kasir'
                    en='4-6 digit PIN for POS terminal login'
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
          <Button
            type='button'
            variant='outline'
            className='flex-1'
            onClick={onBack}
            disabled={isLoading}
          >
            <UiText id='Kembali' en='Back' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            className='flex-1'
            onClick={onSkip}
            disabled={isLoading}
          >
            <UiText id='Lewati' en='Skip' />
          </Button>
          <Button type='submit' className='flex-1' disabled={isLoading}>
            {isLoading ? 'Creating Employee...' : 'Continue'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
