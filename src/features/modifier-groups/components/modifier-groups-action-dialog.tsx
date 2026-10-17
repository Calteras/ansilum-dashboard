'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from '@/components/icons'
import {
  useCreateModifierGroupMutation,
  useUpdateModifierGroupMutation,
} from '../api/modifier-groups.queries'
import type { ModifierGroup } from '../api/modifier-groups.types'

const modifierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Modifier name is required.').max(50),
  priceAdjustment: z.coerce.number().min(0, 'Price must be 0 or greater.'),
  sortOrder: z.coerce.number().int().min(0),
})

const formSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(50),
    description: z.string().optional(),
    isRequired: z.boolean(),
    minSelection: z.coerce.number().int().min(0),
    maxSelection: z.coerce.number().int().min(1),
    isActive: z.boolean(),
    modifiers: z.array(modifierSchema),
  })
  .refine((values) => values.minSelection <= values.maxSelection, {
    message: 'Maximum selections must be at least the minimum.',
    path: ['maxSelection'],
  })

type ModifierGroupForm = z.infer<typeof formSchema>

type ModifierGroupsActionDialogProps = {
  currentRow?: ModifierGroup
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModifierGroupsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: ModifierGroupsActionDialogProps) {
  const isEdit = !!currentRow
  const createMutation = useCreateModifierGroupMutation()
  const updateMutation = useUpdateModifierGroupMutation()
  const isLoading = createMutation.isPending || updateMutation.isPending

  const form = useForm<ModifierGroupForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          description: currentRow.description ?? '',
          isRequired: currentRow.isRequired,
          minSelection: currentRow.minSelection,
          maxSelection: currentRow.maxSelection,
          isActive: currentRow.isActive,
          modifiers:
            currentRow.modifiers?.map((m) => ({
              id: m.id,
              name: m.name,
              priceAdjustment: Number(m.priceAdjustment),
              sortOrder: m.sortOrder,
            })) ?? [],
        }
      : {
          name: '',
          description: '',
          isRequired: false,
          minSelection: 0,
          maxSelection: 1,
          isActive: true,
          modifiers: [],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'modifiers',
  })

  useEffect(() => {
    if (open) {
      form.reset(
        isEdit
          ? {
              name: currentRow.name,
              description: currentRow.description ?? '',
              isRequired: currentRow.isRequired,
              minSelection: currentRow.minSelection,
              maxSelection: currentRow.maxSelection,
              isActive: currentRow.isActive,
              modifiers:
                currentRow.modifiers?.map((m) => ({
                  id: m.id,
                  name: m.name,
                  priceAdjustment: Number(m.priceAdjustment),
                  sortOrder: m.sortOrder,
                })) ?? [],
            }
          : {
              name: '',
              description: '',
              isRequired: false,
              minSelection: 0,
              maxSelection: 1,
              isActive: true,
              modifiers: [],
            }
      )
    }
  }, [open, isEdit, currentRow, form])

  const onSubmit = async (values: ModifierGroupForm) => {
    try {
      if (isEdit && currentRow) {
        await updateMutation.mutateAsync({
          id: currentRow.id,
          data: {
            name: values.name,
            description: values.description,
            isRequired: values.isRequired,
            minSelection: values.minSelection,
            maxSelection: values.maxSelection,
            isActive: values.isActive,
            modifiers: values.modifiers,
          },
        })
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          description: values.description || undefined,
          isRequired: values.isRequired,
          minSelection: values.minSelection,
          maxSelection: values.maxSelection,
          modifiers: values.modifiers.length > 0 ? values.modifiers : undefined,
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
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {isEdit ? 'Edit Modifier Group' : 'Add New Modifier Group'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the modifier group details. '
              : 'Create a new modifier group. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='modifier-group-form'
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
                      placeholder='Extra Shots'
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
                      placeholder='Description...'
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
              name='isRequired'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    Required
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
            <FormField
              control={form.control}
              name='minSelection'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    Min Selection
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
              name='maxSelection'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    Max Selection
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='3'
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

            {/* Modifiers Section */}
            <div className='space-y-3 border-t pt-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-medium'>Modifiers</h4>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    append({
                      name: '',
                      priceAdjustment: 0,
                      sortOrder: fields.length,
                    })
                  }
                >
                  <Plus size={14} className='mr-1' />
                  Add Modifier
                </Button>
              </div>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='flex items-start gap-2 rounded-md border p-3'
                >
                  <div className='flex-1 space-y-2'>
                    <FormField
                      control={form.control}
                      name={`modifiers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder='Modifier name (e.g. Extra Shot)'
                              autoComplete='off'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`modifiers.${index}.priceAdjustment`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='Price adjustment'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    aria-label={`Remove modifier ${index + 1}`}
                    className='mt-1 shrink-0 text-red-500'
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='modifier-group-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
