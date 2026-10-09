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
import type { Ingredient } from '../api/ingredients.types'
import {
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
} from '../api/ingredients.queries'

const formSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required.')
    .regex(
      /^[A-Z0-9-]+$/,
      'Code can only contain uppercase letters, numbers, and hyphens.'
    ),
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required.'),
  costPerUnit: z.coerce.number().min(0, 'Cost must be 0 or greater.'),
  minimumStock: z.coerce.number().min(0, 'Minimum stock must be 0 or greater.'),
  currentStock: z.coerce.number().min(0, 'Current stock must be 0 or greater.'),
  isActive: z.boolean(),
})

type IngredientForm = z.infer<typeof formSchema>

type IngredientsActionDialogProps = {
  currentRow?: Ingredient
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IngredientsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: IngredientsActionDialogProps) {
  const isEdit = !!currentRow
  const createMutation = useCreateIngredientMutation()
  const updateMutation = useUpdateIngredientMutation()
  const isLoading = createMutation.isPending || updateMutation.isPending

  const form = useForm<IngredientForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: isEdit
      ? {
          code: currentRow.code,
          name: currentRow.name,
          description: currentRow.description ?? '',
          unit: currentRow.unit,
          costPerUnit: Number(currentRow.costPerUnit),
          minimumStock: Number(currentRow.minimumStock),
          currentStock: Number(currentRow.currentStock),
          isActive: currentRow.isActive,
        }
      : {
          code: '',
          name: '',
          description: '',
          unit: '',
          costPerUnit: 0,
          minimumStock: 0,
          currentStock: 0,
          isActive: true,
        },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        isEdit
          ? {
              code: currentRow.code,
              name: currentRow.name,
              description: currentRow.description ?? '',
              unit: currentRow.unit,
              costPerUnit: Number(currentRow.costPerUnit),
              minimumStock: Number(currentRow.minimumStock),
              currentStock: Number(currentRow.currentStock),
              isActive: currentRow.isActive,
            }
          : {
              code: '',
              name: '',
              description: '',
              unit: '',
              costPerUnit: 0,
              minimumStock: 0,
              currentStock: 0,
              isActive: true,
            }
      )
    }
  }, [open, isEdit, currentRow, form])

  const onSubmit = async (values: IngredientForm) => {
    try {
      if (isEdit && currentRow) {
        await updateMutation.mutateAsync({
          id: currentRow.id,
          data: {
            code: values.code,
            name: values.name,
            description: values.description || undefined,
            unit: values.unit,
            costPerUnit: values.costPerUnit,
            minimumStock: values.minimumStock,
            currentStock: values.currentStock,
            isActive: values.isActive,
          },
        })
      } else {
        await createMutation.mutateAsync({
          code: values.code,
          name: values.name,
          description: values.description || undefined,
          unit: values.unit,
          costPerUnit: values.costPerUnit,
          minimumStock: values.minimumStock,
          currentStock: values.currentStock,
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
            {isEdit ? 'Edit Ingredient' : 'Add New Ingredient'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the ingredient details. '
              : 'Create a new ingredient. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='ingredient-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='ING-001'
                      className='col-span-4 font-sans tabular-nums uppercase'
                      autoComplete='off'
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
              name='name'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Susu UHT'
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
                      placeholder='Ingredient description...'
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
              name='unit'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>Unit</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='ml, g, pcs'
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
              name='costPerUnit'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    Cost/Unit
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='100'
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
              name='minimumStock'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    Min Stock
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='1000'
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
              name='currentStock'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    Current Stock
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='5000'
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
          <Button type='submit' form='ingredient-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
