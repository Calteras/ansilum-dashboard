'use client'

import { useEffect } from 'react'
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
import type { Category } from '../api/categories.types'
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '../api/categories.queries'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0, 'Sort order must be 0 or greater.'),
  color: z.string().min(1, 'Color is required.').regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g. #FF0000).'),
  icon: z.string().optional(),
  isActive: z.boolean(),
})

type CategoryForm = z.infer<typeof formSchema>

type CategoriesActionDialogProps = {
  currentRow?: Category
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoriesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: CategoriesActionDialogProps) {
  const isEdit = !!currentRow
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const isLoading = createMutation.isPending || updateMutation.isPending

  const form = useForm<CategoryForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          description: currentRow.description ?? '',
          sortOrder: currentRow.sortOrder,
          color: currentRow.color,
          icon: currentRow.icon ?? '',
          isActive: currentRow.isActive,
        }
      : {
          name: '',
          description: '',
          sortOrder: 0,
          color: '#000000',
          icon: '',
          isActive: true,
        },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        isEdit
          ? {
              name: currentRow.name,
              description: currentRow.description ?? '',
              sortOrder: currentRow.sortOrder,
              color: currentRow.color,
              icon: currentRow.icon ?? '',
              isActive: currentRow.isActive,
            }
          : {
              name: '',
              description: '',
              sortOrder: 0,
              color: '#000000',
              icon: '',
              isActive: true,
            }
      )
    }
  }, [open, isEdit, currentRow, form])

  const onSubmit = async (values: CategoryForm) => {
    try {
      if (isEdit && currentRow) {
        await updateMutation.mutateAsync({
          id: currentRow.id,
          data: {
            name: values.name,
            description: values.description || undefined,
            sortOrder: values.sortOrder,
            color: values.color,
            icon: values.icon || undefined,
            isActive: values.isActive,
          },
        })
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          description: values.description || undefined,
          sortOrder: values.sortOrder,
          color: values.color,
          icon: values.icon || undefined,
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
          <DialogTitle>
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the category details. '
              : 'Create a new category. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='category-form'
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
                      placeholder='Beverages'
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
              name='description'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 pt-2 text-end'>
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Category description...'
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
              name='sortOrder'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    Sort Order
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='0'
                      className='col-span-4'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='color'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Color</FormLabel>
                  <div className='col-span-4 flex items-center gap-2'>
                    <FormControl>
                      <Input
                        type='color'
                        className='h-9 w-12 cursor-pointer p-1'
                        {...field}
                      />
                    </FormControl>
                    <Input
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder='#FF0000'
                      className='flex-1 font-sans tabular-nums uppercase'
                    />
                  </div>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='icon'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Icon</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='coffee-ice'
                      className='col-span-4'
                      autoComplete='off'
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
                    <FormLabel className='col-span-2 text-end'>
                      Active
                    </FormLabel>
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
          <Button type='submit' form='category-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
