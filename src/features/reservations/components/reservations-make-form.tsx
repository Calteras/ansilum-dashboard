import { formatMoney } from '@/lib/format'
import { useState } from 'react'
import { z } from 'zod'
import { format } from 'date-fns'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Users,
  Clock,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  Check,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { SelectDropdown } from '@/components/select-dropdown'
import { useEmployeesQuery } from '@/features/employees/api/employees.queries'
import { useModifierGroupsQuery } from '@/features/modifier-groups/api/modifier-groups.queries'
import type { ModifierGroup } from '@/features/modifier-groups/api/modifier-groups.types'
import { useProductsQuery } from '@/features/products/api/products.queries'
import type { Product } from '@/features/products/api/products.types'
import type { TableSection } from '@/features/tables/data/types'
import { useCreateReservationMutation } from '../api/reservations.queries'

const SECTIONS: { label: string; value: TableSection }[] = [
  { label: 'Main Hall', value: 'Main Hall' },
  { label: 'Outdoor', value: 'Outdoor' },
  { label: 'VIP Room', value: 'VIP Room' },
  { label: 'Bar Area', value: 'Bar Area' },
  { label: 'Private Dining', value: 'Private Dining' },
]

const MOCK_TABLES: Record<
  string,
  { id: string; name: string; capacity: number; status: string }[]
> = {
  'Main Hall': [
    { id: 't1', name: 'T1', capacity: 4, status: 'available' },
    { id: 't2', name: 'T2', capacity: 6, status: 'occupied' },
    { id: 't3', name: 'T3', capacity: 4, status: 'available' },
    { id: 't4', name: 'T4', capacity: 2, status: 'available' },
    { id: 't5', name: 'T5', capacity: 4, status: 'reserved' },
    { id: 't6', name: 'T6', capacity: 8, status: 'available' },
  ],
  Outdoor: [
    { id: 't7', name: 'T7', capacity: 4, status: 'available' },
    { id: 't8', name: 'T8', capacity: 6, status: 'available' },
    { id: 't9', name: 'T9', capacity: 4, status: 'occupied' },
  ],
  'VIP Room': [
    { id: 't10', name: 'VIP-A', capacity: 8, status: 'available' },
    { id: 't11', name: 'VIP-B', capacity: 10, status: 'available' },
    { id: 't12', name: 'VIP-C', capacity: 12, status: 'reserved' },
  ],
  'Bar Area': [
    { id: 't13', name: 'BAR-1', capacity: 2, status: 'available' },
    { id: 't14', name: 'BAR-2', capacity: 2, status: 'available' },
    { id: 't15', name: 'BAR-3', capacity: 2, status: 'occupied' },
    { id: 't16', name: 'BAR-4', capacity: 2, status: 'available' },
  ],
  'Private Dining': [
    { id: 't17', name: 'PD-1', capacity: 6, status: 'available' },
    { id: 't18', name: 'PD-2', capacity: 8, status: 'available' },
  ],
}

const TIME_SLOTS = [
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
]

const formatCurrency = formatMoney

const _selectedModifierSchema = z.object({
  modifierId: z.string(),
  modifierName: z.string(),
  groupName: z.string(),
  priceAdjustment: z.number(),
})

type SelectedModifier = z.infer<typeof _selectedModifierSchema>

// State for the product customization dialog
type CustomizingProduct = {
  product: Product
  fullModifierGroups: ModifierGroup[]
}

interface ReservationItem {
  productId: string
  productName: string
  price: number
  quantity: number
  notes?: string
  variantId?: string
  variantName?: string
  variantPriceDelta?: number
  selectedModifiers?: SelectedModifier[]
}

const formSchema = z.object({
  customerName: z.string().min(1, 'Full name is required.'),
  customerPhone: z.string().min(1, 'Phone number is required.'),
  reservationDate: z.date({ message: 'Please select a date.' }),
  time: z.string().min(1, 'Please select a time.'),
  numberOfPeople: z.coerce.number().min(1),
  notes: z.string().optional(),
  tableId: z.string().min(1),
  cashierId: z.string().min(1),
  depositAmount: z.coerce.number().min(0).optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      price: z.number(),
      quantity: z.number(),
      notes: z.string().optional(),
      variantId: z.string().optional(),
      variantName: z.string().optional(),
      variantPriceDelta: z.number().optional(),
      selectedModifiers: z
        .array(
          z.object({
            modifierId: z.string(),
            modifierName: z.string(),
            groupName: z.string(),
            priceAdjustment: z.number(),
          })
        )
        .optional(),
    })
  ),
})

type ReservationFormValues = z.infer<typeof formSchema>

type Props = {
  outletId: string
}

export function ReservationsMakeForm({ outletId }: Props) {
  const [activeSection, setActiveSection] = useState<string>('Main Hall')
  const [menuSearch, setMenuSearch] = useState('')
  const [customizing, setCustomizing] = useState<CustomizingProduct | null>(
    null
  )
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [selectedModifiers, setSelectedModifiers] = useState<
    SelectedModifier[]
  >([])
  const createMutation = useCreateReservationMutation()

  const { data: employeesData } = useEmployeesQuery(
    outletId ? { search: '' } : {}
  )
  const employees = employeesData?.data ?? []

  const { data: productsData } = useProductsQuery({})
  const products = (productsData?.data ?? []).filter((p) => p.isActive)

  const { data: modifierGroupsData } = useModifierGroupsQuery({})
  const allModifierGroups = modifierGroupsData?.data ?? []

  // Group products by category
  const categories = products.reduce<Record<string, Product[]>>((acc, p) => {
    const catName = p.category?.name ?? 'Uncategorized'
    if (!acc[catName]) acc[catName] = []
    acc[catName].push(p)
    return acc
  }, {})

  const filteredProducts = menuSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(menuSearch.toLowerCase())
      )
    : null // null means show by category

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(formSchema) as Resolver<ReservationFormValues>,
    defaultValues: {
      customerName: '',
      customerPhone: '',
      time: '',
      numberOfPeople: 1,
      notes: '',
      tableId: '',
      cashierId: '',
      depositAmount: 0,
      items: [],
    },
  })

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedTableId = form.watch('tableId')
  const watchedItems = form.watch('items')

  const getItemTotal = (item: ReservationItem) => {
    const base = Number(item.price) + Number(item.variantPriceDelta ?? 0)
    const modifiersTotal = (item.selectedModifiers ?? []).reduce(
      (s, m) => s + Number(m.priceAdjustment),
      0
    )
    return (base + modifiersTotal) * Number(item.quantity)
  }

  const orderSubtotal = watchedItems.reduce(
    (sum, item) => sum + getItemTotal(item),
    0
  )

  const handleProductClick = (product: Product) => {
    const hasVariants = product.variants && product.variants.length > 0
    const productModGroups = (product.modifierGroups ?? [])
      .map((pmg) => allModifierGroups.find((mg) => mg.id === pmg.id))
      .filter((mg): mg is ModifierGroup => !!mg && mg.isActive)

    const hasModifiers = productModGroups.length > 0

    if (!hasVariants && !hasModifiers) {
      // No customization needed — add directly or increment
      const existingIndex = fields.findIndex(
        (f) =>
          f.productId === product.id &&
          !f.variantId &&
          (!f.selectedModifiers || f.selectedModifiers.length === 0)
      )
      if (existingIndex >= 0) {
        const existing = watchedItems[existingIndex]
        update(existingIndex, {
          ...existing,
          quantity: Number(existing.quantity) + 1,
        })
      } else {
        append({
          productId: product.id,
          productName: product.name,
          price: Number(product.basePrice),
          quantity: 1,
          notes: '',
          selectedModifiers: [],
        })
      }
    } else {
      // Open customization dialog
      setSelectedVariantId(hasVariants ? '' : '__none__')
      setSelectedModifiers(
        productModGroups.flatMap((mg) =>
          mg.modifiers
            .filter((m) => m.isDefault)
            .map((m) => ({
              modifierId: m.id!,
              modifierName: m.name,
              groupName: mg.name,
              priceAdjustment: Number(m.priceAdjustment),
            }))
        )
      )
      setCustomizing({ product, fullModifierGroups: productModGroups })
    }
  }

  const handleConfirmCustomization = () => {
    if (!customizing) return
    const { product, fullModifierGroups } = customizing

    // Validate required modifier groups
    for (const mg of fullModifierGroups) {
      if (mg.isRequired) {
        const count = selectedModifiers.filter(
          (m) => m.groupName === mg.name
        ).length
        if (count < mg.minSelection) return
      }
    }

    const variant = product.variants?.find((v) => v.id === selectedVariantId)
    const displayName = variant
      ? `${product.name} (${variant.name})`
      : product.name

    append({
      productId: product.id,
      productName: displayName,
      price: Number(product.basePrice),
      quantity: 1,
      notes: '',
      variantId: variant?.id,
      variantName: variant?.name,
      variantPriceDelta: Number(variant?.priceDelta ?? 0),
      selectedModifiers: selectedModifiers.map((m) => ({
        ...m,
        priceAdjustment: Number(m.priceAdjustment),
      })),
    })

    setCustomizing(null)
    setSelectedVariantId('')
    setSelectedModifiers([])
  }

  const toggleModifier = (
    mg: ModifierGroup,
    modifierId: string,
    modifierName: string,
    priceAdjustment: number
  ) => {
    const existing = selectedModifiers.find((m) => m.modifierId === modifierId)

    if (existing) {
      setSelectedModifiers((prev) =>
        prev.filter((m) => m.modifierId !== modifierId)
      )
    } else {
      const groupCount = selectedModifiers.filter(
        (m) => m.groupName === mg.name
      ).length
      if (mg.maxSelection > 0 && groupCount >= mg.maxSelection) {
        // If max 1 (radio-like behavior), replace
        if (mg.maxSelection === 1) {
          setSelectedModifiers((prev) => [
            ...prev.filter((m) => m.groupName !== mg.name),
            {
              modifierId,
              modifierName,
              groupName: mg.name,
              priceAdjustment,
            },
          ])
        }
        return
      }
      setSelectedModifiers((prev) => [
        ...prev,
        {
          modifierId,
          modifierName,
          groupName: mg.name,
          priceAdjustment,
        },
      ])
    }
  }

  const updateQuantity = (index: number, delta: number) => {
    const item = watchedItems[index]
    const newQty = Number(item.quantity) + delta
    if (newQty <= 0) {
      remove(index)
    } else {
      update(index, { ...item, quantity: newQty })
    }
  }

  const onSubmit = async (values: ReservationFormValues) => {
    try {
      await createMutation.mutateAsync({
        localUuid: crypto.randomUUID(),
        outletId,
        cashierId: values.cashierId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        reservationDate: `${format(values.reservationDate, 'yyyy-MM-dd')}T${values.time}:00`,
        tableNumber: values.tableId,
        notes: values.notes || undefined,
        depositAmount: values.depositAmount || undefined,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      })
      form.reset()
    } catch {
      // Error handled by mutation
    }
  }

  const renderProductCard = (product: Product) => {
    const cartCount = watchedItems
      .filter((i) => i.productId === product.id)
      .reduce((s, i) => s + i.quantity, 0)
    const hasVariants = product.variants && product.variants.length > 0
    const hasModifiers =
      product.modifierGroups && product.modifierGroups.length > 0

    return (
      <button
        key={product.id}
        type='button'
        onClick={() => handleProductClick(product)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
          cartCount > 0
            ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
            : 'hover:bg-muted/50 hover:border-primary/30'
        )}
      >
        <div className='bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md'>
          <UtensilsCrossed size={16} className='text-muted-foreground' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='truncate text-sm font-medium'>{product.name}</div>
          <div className='mt-0.5 flex items-center gap-1.5'>
            <span className='text-muted-foreground text-xs'>{product.sku}</span>
            {hasVariants && (
              <Badge variant='outline' className='h-4 px-1 py-0 text-xs'>
                {product.variants.length} variant
                {product.variants.length > 1 ? 's' : ''}
              </Badge>
            )}
            {hasModifiers && (
              <Badge variant='outline' className='h-4 px-1 py-0 text-xs'>
                Customizable
              </Badge>
            )}
          </div>
        </div>
        <div className='shrink-0 text-right'>
          <div className='text-sm font-semibold'>
            {formatCurrency(product.basePrice)}
          </div>
          {cartCount > 0 && (
            <Badge variant='default' className='px-1.5 py-0 text-xs'>
              x{cartCount}
            </Badge>
          )}
        </div>
      </button>
    )
  }

  return (
    <Card className='py-0'>
      <CardContent className='p-0'>
        <div className='grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0'>
          {/* Left side: Form + Calendar */}
          <div className='space-y-5 p-6'>
            <h3 className='text-xl font-semibold'>Make a Reservation</h3>

            <Form {...form}>
              <form
                id='reservation-make-form'
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='customerName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter customer name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='customerPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-muted-foreground text-xs tracking-wide uppercase'>
                        Phone number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='+62 812 3456 7890'
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
                  name='reservationDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-muted-foreground text-xs tracking-wide uppercase'>
                        Date to come
                      </FormLabel>
                      <div className='rounded-lg border'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          className='mx-auto'
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='time'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-muted-foreground text-xs tracking-wide uppercase'>
                        <Clock size={14} className='mr-1 inline' />
                        Time to come
                      </FormLabel>
                      <div className='flex flex-wrap gap-2'>
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type='button'
                            onClick={() => field.onChange(slot)}
                            className={cn(
                              'rounded-md border px-3 py-1.5 text-sm transition-colors',
                              field.value === slot
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'hover:bg-muted border-input'
                            )}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='numberOfPeople'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-muted-foreground text-xs tracking-wide uppercase'>
                        <Users size={14} className='mr-1 inline' />
                        Number of people
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={1}
                          placeholder='How many people will attend'
                          {...field}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='cashierId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-muted-foreground text-xs tracking-wide uppercase'>
                        Cashier
                      </FormLabel>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select cashier'
                        items={employees.map((e) => ({
                          label: `${e.name} (${e.employeeNo})`,
                          value: e.id,
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='depositAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-muted-foreground text-xs tracking-wide uppercase'>
                        Deposit amount
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          placeholder='0'
                          {...field}
                          value={field.value ?? 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requests</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Add any special requests or notes'
                          rows={3}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex items-center justify-end gap-3 pt-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => form.reset()}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Submitting...' : 'Continue'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Right side: Table Map + Menu */}
          <div className='space-y-6 p-6'>
            {/* Table Selection */}
            <div className='space-y-4'>
              <h3 className='text-xl font-semibold'>Choose a table</h3>

              <Tabs value={activeSection} onValueChange={setActiveSection}>
                <TabsList className='w-full'>
                  {SECTIONS.map((s) => (
                    <TabsTrigger key={s.value} value={s.value}>
                      {s.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {SECTIONS.map((section) => (
                  <TabsContent key={section.value} value={section.value}>
                    <div className='grid grid-cols-3 gap-4 pt-2'>
                      {(MOCK_TABLES[section.value] ?? []).map((table) => {
                        const isSelected = selectedTableId === table.id
                        const isOccupied = table.status === 'occupied'
                        const isReserved = table.status === 'reserved'
                        const isDisabled = isOccupied || isReserved

                        return (
                          <button
                            key={table.id}
                            type='button'
                            disabled={isDisabled}
                            onClick={() =>
                              form.setValue('tableId', table.id, {
                                shouldValidate: true,
                              })
                            }
                            className={cn(
                              'relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 p-4 transition-colors',
                              isSelected && !isDisabled
                                ? 'border-primary bg-primary/10 ring-primary/30 ring-2'
                                : '',
                              isOccupied
                                ? 'border-destructive/30 bg-destructive/5 cursor-not-allowed opacity-50'
                                : '',
                              isReserved
                                ? 'border-warning/30 bg-warning/5 cursor-not-allowed opacity-50'
                                : '',
                              !isDisabled && !isSelected
                                ? 'border-input hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
                                : ''
                            )}
                          >
                            <div
                              className={cn(
                                'mb-2 flex h-12 w-12 items-center justify-center rounded-lg border-2',
                                isSelected && !isDisabled
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-muted-foreground/30'
                              )}
                            >
                              {isSelected && !isDisabled ? (
                                <svg
                                  className='h-5 w-5'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                  stroke='currentColor'
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='M5 13l4 4L19 7'
                                  />
                                </svg>
                              ) : null}
                            </div>

                            {/* Seat indicators */}
                            <div className='absolute top-1 left-1/2 flex -translate-x-1/2 gap-1'>
                              {Array.from({
                                length: Math.min(
                                  Math.ceil(table.capacity / 2),
                                  3
                                ),
                              }).map((_, i) => (
                                <div
                                  key={`t-${i}`}
                                  className={cn(
                                    'h-2 w-4 rounded-t-full',
                                    isSelected && !isDisabled
                                      ? 'bg-primary/60'
                                      : 'bg-muted-foreground/20'
                                  )}
                                />
                              ))}
                            </div>
                            <div className='absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1'>
                              {Array.from({
                                length: Math.min(
                                  Math.floor(table.capacity / 2),
                                  3
                                ),
                              }).map((_, i) => (
                                <div
                                  key={`b-${i}`}
                                  className={cn(
                                    'h-2 w-4 rounded-b-full',
                                    isSelected && !isDisabled
                                      ? 'bg-primary/60'
                                      : 'bg-muted-foreground/20'
                                  )}
                                />
                              ))}
                            </div>
                            <div className='absolute top-1/2 left-1 -translate-y-1/2'>
                              <div
                                className={cn(
                                  'h-4 w-2 rounded-l-full',
                                  isSelected && !isDisabled
                                    ? 'bg-primary/60'
                                    : 'bg-muted-foreground/20'
                                )}
                              />
                            </div>
                            <div className='absolute top-1/2 right-1 -translate-y-1/2'>
                              <div
                                className={cn(
                                  'h-4 w-2 rounded-r-full',
                                  isSelected && !isDisabled
                                    ? 'bg-primary/60'
                                    : 'bg-muted-foreground/20'
                                )}
                              />
                            </div>

                            <span className='mt-1 text-xs font-medium'>
                              {table.name}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              <Users size={10} className='mr-0.5 inline' />
                              {table.capacity}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <div className='text-muted-foreground mt-4 flex flex-wrap gap-4 text-xs'>
                      <div className='flex items-center gap-1.5'>
                        <div className='border-input h-3 w-3 rounded border-2' />
                        Available
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <div className='border-primary bg-primary/20 h-3 w-3 rounded border-2' />
                        Selected
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <div className='border-destructive/30 bg-destructive/10 h-3 w-3 rounded border-2' />
                        Occupied
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <div className='border-warning/30 bg-warning/10 h-3 w-3 rounded border-2' />
                        Reserved
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {form.formState.errors.tableId && (
                <p className='text-destructive text-sm'>
                  {form.formState.errors.tableId.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Menu / Product Selection */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold'>
                  <UtensilsCrossed size={20} className='mr-2 mb-0.5 inline' />
                  Pre-order Menu
                </h3>
                {fields.length > 0 && (
                  <Badge variant='secondary'>
                    {watchedItems.reduce((s, i) => s + i.quantity, 0)} item
                    {watchedItems.reduce((s, i) => s + i.quantity, 0) !== 1
                      ? 's'
                      : ''}
                  </Badge>
                )}
              </div>

              {/* Search menu */}
              <Input
                placeholder='Search menu by name or SKU...'
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
              />

              {/* Product grid */}
              <div className='max-h-80 space-y-4 overflow-y-auto pr-1'>
                {filteredProducts ? (
                  // Search results (flat list)
                  filteredProducts.length > 0 ? (
                    <div className='space-y-2'>
                      {filteredProducts.map((p) => renderProductCard(p))}
                    </div>
                  ) : (
                    <p className='text-muted-foreground py-4 text-center text-sm'>
                      No products found
                    </p>
                  )
                ) : (
                  // Grouped by category
                  Object.entries(categories).map(([catName, catProducts]) => (
                    <div key={catName}>
                      <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
                        {catName}
                      </h4>
                      <div className='space-y-2'>
                        {catProducts.map((p) => renderProductCard(p))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order summary */}
              {fields.length > 0 && (
                <div className='space-y-3'>
                  <Separator />
                  <h4 className='text-muted-foreground text-sm font-semibold tracking-wide uppercase'>
                    Order Summary
                  </h4>
                  <div className='space-y-2'>
                    {fields.map((field, index) => {
                      const item = watchedItems[index]
                      if (!item) return null
                      const unitPrice =
                        Number(item.price) +
                        Number(item.variantPriceDelta ?? 0) +
                        (item.selectedModifiers ?? []).reduce(
                          (s, m) => s + Number(m.priceAdjustment),
                          0
                        )
                      return (
                        <div
                          key={field.id}
                          className='space-y-2 rounded-lg border p-3'
                        >
                          <div className='flex items-start gap-3'>
                            <div className='min-w-0 flex-1'>
                              <div className='truncate text-sm font-medium'>
                                {item.productName}
                              </div>
                              {item.variantName && (
                                <div className='text-muted-foreground text-xs'>
                                  Variant: {item.variantName}
                                  {(item.variantPriceDelta ?? 0) !== 0 && (
                                    <span className='ml-1'>
                                      ({item.variantPriceDelta! > 0 ? '+' : ''}
                                      {formatCurrency(item.variantPriceDelta!)})
                                    </span>
                                  )}
                                </div>
                              )}
                              {item.selectedModifiers &&
                                item.selectedModifiers.length > 0 && (
                                  <div className='mt-1 flex flex-wrap gap-1'>
                                    {item.selectedModifiers.map((m) => (
                                      <Badge
                                        key={m.modifierId}
                                        variant='secondary'
                                        className='h-4 px-1.5 py-0 text-xs'
                                      >
                                        {m.modifierName}
                                        {m.priceAdjustment > 0 &&
                                          ` +${formatCurrency(m.priceAdjustment)}`}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              <div className='text-muted-foreground mt-0.5 text-xs'>
                                {formatCurrency(unitPrice)} each
                              </div>
                            </div>

                            <div className='w-24 shrink-0 text-right text-sm font-semibold'>
                              {formatCurrency(getItemTotal(item))}
                            </div>
                          </div>

                          {/* Quantity controls */}
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              className='h-7 w-7'
                              onClick={() => updateQuantity(index, -1)}
                            >
                              {item.quantity === 1 ? (
                                <Trash2 size={12} />
                              ) : (
                                <Minus size={12} />
                              )}
                            </Button>
                            <span className='w-8 text-center text-sm font-medium'>
                              {item.quantity}
                            </span>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              className='h-7 w-7'
                              onClick={() => updateQuantity(index, 1)}
                            >
                              <Plus size={12} />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Separator />

                  <div className='flex items-center justify-between text-base font-semibold'>
                    <span>Subtotal</span>
                    <span>{formatCurrency(orderSubtotal)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Product Customization Dialog */}
      <Dialog
        open={!!customizing}
        onOpenChange={(open) => {
          if (!open) {
            setCustomizing(null)
            setSelectedVariantId('')
            setSelectedModifiers([])
          }
        }}
      >
        {customizing && (
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Customize {customizing.product.name}</DialogTitle>
              <DialogDescription>
                {formatCurrency(customizing.product.basePrice)}
                {' \u00B7 '}
                {customizing.product.sku}
              </DialogDescription>
            </DialogHeader>

            <div className='max-h-[60vh] space-y-6 overflow-y-auto py-2'>
              {/* Variant Selection */}
              {customizing.product.variants &&
                customizing.product.variants.length > 0 && (
                  <div className='space-y-3'>
                    <Label className='text-sm font-semibold'>
                      Choose Variant <span className='text-destructive'>*</span>
                    </Label>
                    <RadioGroup
                      value={selectedVariantId}
                      onValueChange={setSelectedVariantId}
                      className='space-y-2'
                    >
                      {customizing.product.variants.map((variant) => (
                        <label
                          key={variant.id ?? variant.name}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                            selectedVariantId === (variant.id ?? variant.name)
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          )}
                        >
                          <RadioGroupItem value={variant.id ?? variant.name} />
                          <div className='flex-1'>
                            <span className='text-sm font-medium'>
                              {variant.name}
                            </span>
                          </div>
                          {variant.priceDelta !== 0 && (
                            <span className='text-muted-foreground text-sm'>
                              {variant.priceDelta > 0 ? '+' : ''}
                              {formatCurrency(variant.priceDelta)}
                            </span>
                          )}
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                )}

              {/* Modifier Groups */}
              {customizing.fullModifierGroups.map((mg) => {
                const isSingleSelect = mg.maxSelection === 1
                const groupSelectedCount = selectedModifiers.filter(
                  (m) => m.groupName === mg.name
                ).length

                return (
                  <div key={mg.id} className='space-y-3'>
                    <div>
                      <Label className='text-sm font-semibold'>
                        {mg.name}
                        {mg.isRequired && (
                          <span className='text-destructive ml-1'>*</span>
                        )}
                      </Label>
                      <p className='text-muted-foreground text-xs'>
                        {mg.isRequired ? 'Required' : 'Optional'}
                        {mg.minSelection > 0 &&
                          ` \u00B7 Min ${mg.minSelection}`}
                        {mg.maxSelection > 0 &&
                          ` \u00B7 Max ${mg.maxSelection}`}
                        {groupSelectedCount > 0 && (
                          <span className='text-primary ml-1'>
                            ({groupSelectedCount} selected)
                          </span>
                        )}
                      </p>
                    </div>

                    {isSingleSelect ? (
                      <RadioGroup
                        value={
                          selectedModifiers.find((m) => m.groupName === mg.name)
                            ?.modifierId ?? ''
                        }
                        onValueChange={(modId) => {
                          const mod = mg.modifiers.find((m) => m.id === modId)
                          if (mod) {
                            toggleModifier(
                              mg,
                              mod.id!,
                              mod.name,
                              Number(mod.priceAdjustment)
                            )
                          }
                        }}
                        className='space-y-2'
                      >
                        {mg.modifiers
                          .filter((m) => m.isActive !== false)
                          .map((mod) => (
                            <label
                              key={mod.id ?? mod.name}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                                selectedModifiers.some(
                                  (m) => m.modifierId === mod.id
                                )
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50'
                              )}
                            >
                              <RadioGroupItem value={mod.id!} />
                              <div className='flex-1'>
                                <span className='text-sm font-medium'>
                                  {mod.name}
                                </span>
                              </div>
                              {Number(mod.priceAdjustment) !== 0 && (
                                <span className='text-muted-foreground text-sm'>
                                  {Number(mod.priceAdjustment) > 0 ? '+' : ''}
                                  {formatCurrency(Number(mod.priceAdjustment))}
                                </span>
                              )}
                            </label>
                          ))}
                      </RadioGroup>
                    ) : (
                      <div className='space-y-2'>
                        {mg.modifiers
                          .filter((m) => m.isActive !== false)
                          .map((mod) => {
                            const isChecked = selectedModifiers.some(
                              (m) => m.modifierId === mod.id
                            )
                            const atMax =
                              mg.maxSelection > 0 &&
                              groupSelectedCount >= mg.maxSelection &&
                              !isChecked

                            return (
                              <label
                                key={mod.id ?? mod.name}
                                className={cn(
                                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                                  atMax
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'cursor-pointer',
                                  isChecked
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:bg-muted/50'
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  disabled={atMax}
                                  onCheckedChange={() => {
                                    if (!atMax || isChecked) {
                                      toggleModifier(
                                        mg,
                                        mod.id!,
                                        mod.name,
                                        Number(mod.priceAdjustment)
                                      )
                                    }
                                  }}
                                />
                                <div className='flex-1'>
                                  <span className='text-sm font-medium'>
                                    {mod.name}
                                  </span>
                                </div>
                                {Number(mod.priceAdjustment) !== 0 && (
                                  <span className='text-muted-foreground text-sm'>
                                    {Number(mod.priceAdjustment) > 0 ? '+' : ''}
                                    {formatCurrency(
                                      Number(mod.priceAdjustment)
                                    )}
                                  </span>
                                )}
                              </label>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Price preview */}
            <div className='bg-muted/50 space-y-1 rounded-lg p-3'>
              <div className='flex justify-between text-sm'>
                <span>Base price</span>
                <span>{formatCurrency(customizing.product.basePrice)}</span>
              </div>
              {selectedVariantId &&
                selectedVariantId !== '__none__' &&
                (() => {
                  const v = customizing.product.variants?.find(
                    (v) => v.id === selectedVariantId
                  )
                  return v && v.priceDelta !== 0 ? (
                    <div className='text-muted-foreground flex justify-between text-sm'>
                      <span>{v.name}</span>
                      <span>
                        {v.priceDelta > 0 ? '+' : ''}
                        {formatCurrency(v.priceDelta)}
                      </span>
                    </div>
                  ) : null
                })()}
              {selectedModifiers.map((m) =>
                m.priceAdjustment !== 0 ? (
                  <div
                    key={m.modifierId}
                    className='text-muted-foreground flex justify-between text-sm'
                  >
                    <span>{m.modifierName}</span>
                    <span>
                      {m.priceAdjustment > 0 ? '+' : ''}
                      {formatCurrency(m.priceAdjustment)}
                    </span>
                  </div>
                ) : null
              )}
              <Separator />
              <div className='flex justify-between font-semibold'>
                <span>Total per item</span>
                <span>
                  {formatCurrency(
                    Number(customizing.product.basePrice) +
                      Number(
                        customizing.product.variants?.find(
                          (v) => v.id === selectedVariantId
                        )?.priceDelta ?? 0
                      ) +
                      selectedModifiers.reduce(
                        (s, m) => s + Number(m.priceAdjustment),
                        0
                      )
                  )}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setCustomizing(null)
                  setSelectedVariantId('')
                  setSelectedModifiers([])
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCustomization}
                disabled={
                  // Require variant selection if product has variants
                  (customizing.product.variants &&
                    customizing.product.variants.length > 0 &&
                    !selectedVariantId) ||
                  // Require all required modifier groups to meet minimum
                  customizing.fullModifierGroups.some(
                    (mg) =>
                      mg.isRequired &&
                      selectedModifiers.filter((m) => m.groupName === mg.name)
                        .length < mg.minSelection
                  )
                }
              >
                <Check size={16} className='mr-1' />
                Add to Order
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  )
}
