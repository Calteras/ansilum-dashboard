'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, ChevronsUpDown } from '@/components/icons'
import { cn } from '@/lib/utils'
import { ImagePicker } from '@/components/image-picker'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { useOutletsQuery } from '@/features/outlets/api/outlets.queries'
import {
  useCreateEmployeeMutation,
  useDeleteEmployeePhotoMutation,
  useUpdateEmployeeMutation,
  useUploadEmployeePhotoMutation,
} from '../api/employees.queries'
import { employeeRoles } from '../data/data'
import type { Employee } from '../data/schema'

const formSchema = z
  .object({
    employeeNo: z.string().min(1, 'Employee No is required.'),
    name: z.string().min(1, 'Name is required.'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    role: z.string().min(1, 'Role is required.'),
    pin: z.string().transform((pwd) => pwd.trim()),
    confirmPin: z.string().transform((pwd) => pwd.trim()),
    isActive: z.boolean(),
    isEdit: z.boolean(),
    outletIds: z.array(z.string()),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.pin) return true
      return data.pin.length > 0
    },
    {
      message: 'PIN is required.',
      path: ['pin'],
    }
  )
  .refine(
    ({ isEdit, pin }) => {
      if (isEdit && !pin) return true
      return pin.length >= 4 && pin.length <= 6
    },
    {
      message: 'PIN must be 4-6 characters.',
      path: ['pin'],
    }
  )
  .refine(
    ({ isEdit, pin }) => {
      if (isEdit && !pin) return true
      return /^\d+$/.test(pin)
    },
    {
      message: 'PIN must contain only numbers.',
      path: ['pin'],
    }
  )
  .refine(
    ({ isEdit, pin, confirmPin }) => {
      if (isEdit && !pin) return true
      return pin === confirmPin
    },
    {
      message: "PINs don't match.",
      path: ['confirmPin'],
    }
  )

type EmployeeForm = z.infer<typeof formSchema>

type EmployeesActionDialogProps = {
  currentRow?: Employee
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: EmployeesActionDialogProps) {
  const isEdit = !!currentRow
  const createMutation = useCreateEmployeeMutation()
  const updateMutation = useUpdateEmployeeMutation()
  const { data: outletsData, isLoading: outletsLoading } = useOutletsQuery()
  const uploadPhotoMutation = useUploadEmployeePhotoMutation()
  const deletePhotoMutation = useDeleteEmployeePhotoMutation()
  const isPhotoPending =
    uploadPhotoMutation.isPending || deletePhotoMutation.isPending
  const isLoading =
    createMutation.isPending || updateMutation.isPending || isPhotoPending

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  // Edit only: the existing photo is deleted on save, not immediately.
  const [removePhoto, setRemovePhoto] = useState(false)
  const resetPhoto = () => {
    setPhotoFile(null)
    setRemovePhoto(false)
  }

  const form = useForm<EmployeeForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          employeeNo: currentRow.employeeNo,
          name: currentRow.name,
          email: currentRow.email ?? '',
          phone: currentRow.phone ?? '',
          role: currentRow.role,
          pin: '',
          confirmPin: '',
          isActive: currentRow.isActive,
          isEdit,
          outletIds:
            currentRow.outlets?.map((outlet) => outlet.outlet.id) ?? [],
        }
      : {
          employeeNo: '',
          name: '',
          email: '',
          phone: '',
          role: '',
          pin: '',
          confirmPin: '',
          isActive: true,
          isEdit,
          outletIds: [],
        },
  })

  const onSubmit = async (values: EmployeeForm) => {
    try {
      if (isEdit && currentRow) {
        await updateMutation.mutateAsync({
          id: currentRow.id,
          data: {
            employeeNo: values.employeeNo,
            name: values.name,
            email: values.email || undefined,
            phone: values.phone || undefined,
            role: values.role as Employee['role'],
            pin: values.pin || undefined,
            isActive: values.isActive,
            outletIds: values.outletIds,
          },
        })
        // Photo changes go through the dedicated endpoint after the details
        // are saved, so a rejected image never discards the other edits.
        if (photoFile) {
          await uploadPhotoMutation.mutateAsync({
            id: currentRow.id,
            photo: photoFile,
          })
        } else if (removePhoto && currentRow.image) {
          await deletePhotoMutation.mutateAsync(currentRow.id)
        }
      } else {
        await createMutation.mutateAsync({
          employeeNo: values.employeeNo,
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          role: values.role as Employee['role'],
          pin: values.pin,
          outletIds: values.outletIds,
          photo: photoFile ?? undefined,
        })
      }
      resetPhoto()
      form.reset()
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isPinTouched = !!form.formState.dirtyFields.pin

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!isLoading) {
          resetPhoto()
          form.reset()
          onOpenChange(state)
        }
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {isEdit ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the employee details. '
              : 'Create a new employee. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='employee-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <div className='grid grid-cols-6 items-start gap-x-4 gap-y-1'>
                <span className='col-span-2 pt-2 text-end text-sm font-medium'>
                  Photo
                </span>
                <div className='col-span-4'>
                  <ImagePicker
                    shape='circle'
                    src={removePhoto ? null : currentRow?.image}
                    file={photoFile}
                    alt='Employee photo'
                    fallback={
                      currentRow ? (
                        <span className='text-lg font-medium'>
                          {currentRow.name.slice(0, 2).toUpperCase()}
                        </span>
                      ) : undefined
                    }
                    busy={isPhotoPending}
                    disabled={isLoading}
                    onSelect={setPhotoFile}
                    onRemove={() => {
                      if (photoFile) setPhotoFile(null)
                      else setRemovePhoto(true)
                    }}
                    uploadLabel='Upload photo'
                    changeLabel='Change photo'
                    removeLabel='Remove'
                    hint='Optional. JPG, PNG or WebP. Max 10 MB.'
                  />
                </div>
              </div>
              <FormField
                control={form.control}
                name='employeeNo'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Employee No
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='EMP001'
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
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='John Doe'
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
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='john.doe@example.com'
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
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='+62 812 3456 7890'
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
                name='role'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Role</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a role'
                      className='col-span-4'
                      items={employeeRoles.map(({ label, value }) => ({
                        label,
                        value,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='pin'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>PIN</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='e.g., 1234'
                        className='col-span-4'
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='outletIds'
                render={({ field }) => {
                  const selectedOutlets = outletsData?.data.filter((outlet) =>
                    field.value.includes(outlet.id)
                  )

                  return (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>
                        Outlets
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type='button'
                              variant='outline'
                              role='combobox'
                              disabled={outletsLoading}
                              className='col-span-4 justify-between font-normal'
                            >
                              <span className='truncate'>
                                {outletsLoading
                                  ? 'Loading outlets...'
                                  : selectedOutlets?.length
                                    ? selectedOutlets.length === 1
                                      ? selectedOutlets[0].name
                                      : `${selectedOutlets.length} outlets selected`
                                    : 'Select outlets'}
                              </span>
                              <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-(--radix-popover-trigger-width) p-0'>
                          <Command>
                            <CommandInput placeholder='Search outlets...' />
                            <CommandList>
                              <CommandEmpty>No outlets found.</CommandEmpty>
                              <CommandGroup>
                                {outletsData?.data.map((outlet) => {
                                  const isSelected = field.value.includes(
                                    outlet.id
                                  )

                                  return (
                                    <CommandItem
                                      key={outlet.id}
                                      value={`${outlet.name} ${outlet.code}`}
                                      onSelect={() => {
                                        field.onChange(
                                          isSelected
                                            ? field.value.filter(
                                                (id) => id !== outlet.id
                                              )
                                            : [...field.value, outlet.id]
                                        )
                                      }}
                                    >
                                      <CheckIcon
                                        className={cn(
                                          'me-2 size-4',
                                          isSelected
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                        )}
                                      />
                                      <span className='truncate'>
                                        {outlet.name}
                                      </span>
                                      <span className='text-muted-foreground ms-auto text-xs'>
                                        {outlet.code}
                                      </span>
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name='confirmPin'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Confirm PIN
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        disabled={!isPinTouched}
                        placeholder='e.g., 1234'
                        className='col-span-4'
                        maxLength={6}
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
        </div>
        <DialogFooter>
          <Button type='submit' form='employee-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
