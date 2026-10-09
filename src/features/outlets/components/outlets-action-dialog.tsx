'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { Outlet } from '../data/schema'
import {
  useCreateOutletMutation,
  useUpdateOutletMutation,
} from '../api/outlets.queries'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  code: z
    .string()
    .min(1, 'Code is required.')
    .max(10, 'Code must be at most 10 characters.')
    .regex(/^[A-Z0-9-]+$/, 'Code can only contain uppercase letters, numbers, and hyphens.'),
  address: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean(),
})

type OutletForm = z.infer<typeof formSchema>

type OutletsActionDialogProps = {
  currentRow?: Outlet
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OutletsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: OutletsActionDialogProps) {
  const isEdit = !!currentRow
  const createMutation = useCreateOutletMutation()
  const updateMutation = useUpdateOutletMutation()
  const isLoading = createMutation.isPending || updateMutation.isPending

  const form = useForm<OutletForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          code: currentRow.code,
          address: currentRow.address ?? '',
          phone: currentRow.phone ?? '',
          isActive: currentRow.isActive,
        }
      : {
          name: '',
          code: '',
          address: '',
          phone: '',
          isActive: true,
        },
  })

  const onSubmit = async (values: OutletForm) => {
    try {
      if (isEdit && currentRow) {
        await updateMutation.mutateAsync({
          id: currentRow.id,
          data: {
            name: values.name,
            code: values.code,
            address: values.address || undefined,
            phone: values.phone || undefined,
            isActive: values.isActive,
          },
        })
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          code: values.code,
          address: values.address || undefined,
          phone: values.phone || undefined,
        })
      }
      form.reset()
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!isLoading) {
          form.reset()
          onOpenChange(state)
        }
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Outlet' : 'Add New Outlet'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the outlet details. ' : 'Create a new outlet. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='outlet-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Main Branch'
                      className='col-span-4'
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='MAIN-01'
                      className='col-span-4 font-sans tabular-nums uppercase'
                      autoComplete='off'
                      maxLength={10}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='address'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 pt-2 text-end'>
                    Address
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='123 Main Street, City'
                      className='col-span-4 resize-none'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='+62 21 1234 5678'
                      className='col-span-4'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            {isEdit && (
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Active</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='outlet-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
