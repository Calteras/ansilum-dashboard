'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2 } from '@/components/icons'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SelectDropdown } from '@/components/select-dropdown'
import { useDashboardOutletsQuery } from '@/features/dashboard/api/dashboard.queries'
import { useEmployeesQuery } from '@/features/employees/api/employees.queries'
import { useProductsQuery } from '@/features/products/api/products.queries'
import { useCreateReservationMutation } from '../api/reservations.queries'
import { cn } from '@/lib/utils'



interface ReservationItem {
  productId: string
  quantity: number
  discountAmount?: number
  notes?: string
}

interface ReservationForm {
  outletId: string
  cashierId: string
  customerName: string
  customerPhone: string
  reservationDate: Date
  items: ReservationItem[]
  tableNumber?: string
  notes?: string
  depositAmount?: number
}

const reservationSchema = z.object({
  outletId: z.string().min(1),
  cashierId: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  reservationDate: z.date(),
  items: z.array(z.any()),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
  depositAmount: z.preprocess((v) => Number(v), z.number().optional()),
})

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReservationsActionDialog({ open, onOpenChange }: Props) {
  const createMutation = useCreateReservationMutation()
  const isLoading = createMutation.isPending

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  const form = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema) as any,
    defaultValues: {
      outletId: '',
      cashierId: '',
      customerName: '',
      customerPhone: '',
      tableNumber: '',
      notes: '',
      depositAmount: 0,
      items: [{ productId: '', quantity: 1, discountAmount: 0, notes: '' }],
    },
  })

  const selectedOutletId = form.watch('outletId')

  const { data: employeesData } = useEmployeesQuery(
    selectedOutletId ? { search: '' } : {}
  )
  const employees = employeesData?.data ?? []

  const { data: productsData } = useProductsQuery({})
  const products = productsData?.data ?? []

  const { fields, append, remove } = useFieldArray({
    control: form.control as any,
    name: 'items',
  }) as any

  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const onSubmit = async (values: ReservationForm) => {
    try {
      await createMutation.mutateAsync({
        localUuid: crypto.randomUUID(),
        outletId: values.outletId,
        cashierId: values.cashierId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        reservationDate: format(values.reservationDate, 'yyyy-MM-dd'),
        tableNumber: values.tableNumber || undefined,
        notes: values.notes || undefined,
        depositAmount: values.depositAmount || undefined,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          discountAmount: item.discountAmount || undefined,
          notes: item.notes || undefined,
        })),
      })
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
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>Add New Reservation</DialogTitle>
          <DialogDescription>
            Create a new reservation. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[60vh] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='reservation-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField<ReservationForm>
                control={form.control as any}
                name='outletId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Outlet
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={field.value as string}
                      onValueChange={field.onChange}
                      placeholder='Select outlet'
                      className='col-span-4'
                      items={outlets.map((o) => ({
                        label: o.name,
                        value: o.id,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField<ReservationForm>
                control={form.control as any}
                name='cashierId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Cashier
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={field.value as string}
                      onValueChange={field.onChange}
                      placeholder='Select cashier'
                      className='col-span-4'
                      items={employees.map((e) => ({
                        label: `${e.name} (${e.employeeNo})`,
                        value: e.id,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField<ReservationForm>
                control={form.control as any}
                name='customerName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Customer Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Customer Name'
                        {...field}
                        value={field.value as string}
                        autoComplete='off'
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField<ReservationForm>
                control={form.control as any}
                name='customerPhone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Customer Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='+62 812 3456 7890'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                        value={field.value as string}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField<ReservationForm>
                control={form.control as any}
                name='reservationDate'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Reservation Date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className={cn(
                              'col-span-4 pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? format(field.value as Date, 'dd MMM yyyy')
                              : 'Pick a date'}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value as any}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField<ReservationForm>
                control={form.control as any}
                name='tableNumber'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Table Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Optional'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                        value={field.value as string}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField<ReservationForm>
                control={form.control as any}
                name='depositAmount'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Deposit Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        className='col-span-4'
                        {...field}
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField<ReservationForm>
                control={form.control as any}
                name='notes'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 mt-2 text-end'>
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Optional notes'
                        className='col-span-4'
                        rows={2}
                        {...field}
                        value={field.value as string}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* Items */}
              <div className='space-y-3 pt-2'>
                <div className='flex items-center justify-between'>
                  <FormLabel className='text-sm font-medium'>Items</FormLabel>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      append({
                        productId: '',
                        quantity: 1,
                        discountAmount: 0,
                        notes: '',
                      })
                    }
                  >
                    <Plus size={14} className='mr-1' />
                    Add Item
                  </Button>
                </div>
                {form.formState.errors.items?.root && (
                  <p className='text-destructive text-sm'>
                    {form.formState.errors.items.root.message}
                  </p>
                )}
                {(fields as any[]).map((field, index) => (
                  <div
                    key={field.id}
                    className='bg-muted/50 space-y-3 rounded-md border p-3'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>
                        Item {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => remove(index)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                    <FormField<ReservationForm>
                      control={form.control as any}
                      name={`items.${index}.productId`}
                      render={({ field: itemField }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <SelectDropdown
                            defaultValue={itemField.value as string}
                            onValueChange={itemField.onChange}
                            placeholder='Select product'
                            items={products.map((p) => ({
                              label: `${p.name} (${p.sku})`,
                              value: p.id,
                            }))}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='grid grid-cols-2 gap-3'>
                      <FormField<ReservationForm>
                        control={form.control as any}
                        name={`items.${index}.quantity`}
                        render={({ field: itemField }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min={1}
                                {...itemField}
                                value={itemField.value as number}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField<ReservationForm>
                        control={form.control as any}
                        name={`items.${index}.discountAmount`}
                        render={({ field: itemField }) => (
                          <FormItem>
                            <FormLabel>Discount</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min={0}
                                placeholder='0'
                                {...itemField}
                                value={itemField.value as number}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField<ReservationForm>
                      control={form.control as any}
                      name={`items.${index}.notes`}
                      render={({ field: itemField }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Item notes (optional)'
                              {...itemField}
                              value={itemField.value as string}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='reservation-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
