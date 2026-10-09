'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { Lock } from '@/components/icons'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCurrentSubscriptionQuery } from '@/features/settings/subscription/subscription.queries'
import { useCreateTenantMutation } from '../api/tenants.queries'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters.')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens.'
    ),
})

type TenantForm = z.infer<typeof formSchema>

type TenantCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TenantCreateDialog({
  open,
  onOpenChange,
}: TenantCreateDialogProps) {
  const createMutation = useCreateTenantMutation()
  const { data: subscription } = useCurrentSubscriptionQuery()

  const tier = subscription?.data?.tier ?? 'BASIC'
  const limit = subscription?.data?.limits.tenants ?? 1
  const tenantCount = subscription?.data?.usage.tenants ?? 0
  const limitReached = subscription?.data?.canCreateTenant === false

  const form = useForm<TenantForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  })

  // Auto-generate slug from name
  const watchName = form.watch('name')
  useEffect(() => {
    if (watchName) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      form.setValue('slug', slug, { shouldValidate: true })
    }
  }, [watchName, form])

  const onSubmit = async (values: TenantForm) => {
    try {
      await createMutation.mutateAsync(values)
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
        if (!createMutation.isPending) {
          form.reset()
          onOpenChange(state)
        }
      }}
    >
      <DialogContent className='sm:max-w-md'>
        {limitReached ? (
          <>
            <DialogHeader>
              <DialogTitle>Account Capacity Reached</DialogTitle>
              <DialogDescription>
                Your account has reached its tenant limit or exceeds its outlet
                limit.
              </DialogDescription>
            </DialogHeader>
            <div className='flex flex-col items-center gap-4 py-6'>
              <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
                <Lock className='text-muted-foreground size-6' />
              </div>
              <p className='text-muted-foreground text-center text-sm'>
                Your <span className='font-medium'>{tier}</span> plan allows up
                to {limit} tenant{limit > 1 ? 's' : ''}. You currently have{' '}
                {tenantCount}.
              </p>
              <Button asChild>
                <Link
                  to='/settings/subscription'
                  onClick={() => onOpenChange(false)}
                >
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant to manage a separate business or location.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                id='tenant-create-form'
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder='My Coffee Shop' {...field} />
                      </FormControl>
                      <FormDescription>
                        The display name for your tenant.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder='my-coffee-shop' {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique identifier used in URLs. Auto-generated from
                        name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                form='tenant-create-form'
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
