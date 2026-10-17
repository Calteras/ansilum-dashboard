'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Building2, CheckCircle2 } from '@/components/icons'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { tenantGet, tenantApiPaths } from '@/lib/tenant-api-client'
import type { Ingredient } from '@/features/ingredients/api/ingredients.types'
import { useCreateStockMovementMutation } from '../api/stock-movements.queries'
import type { StockMovementType } from '../api/stock-movements.types'

// ── Inline types for fetched lists ────────────────────────────────────────

interface Outlet {
  id: string
  name: string
  code: string
  isActive: boolean
}
interface OutletsResponse {
  data: Outlet[]
}

interface Employee {
  id: string
  name: string
  employeeNo: string
}
interface EmployeesResponse {
  data: Employee[]
}

interface IngredientsResponse {
  data: Ingredient[]
}

// ── Movement type config ──────────────────────────────────────────────────

const MOVEMENT_TYPES: {
  value: Exclude<StockMovementType, 'SALE'>
  label: string
  description: string
  colorClass: string
  accentClass: string
}[] = [
  {
    value: 'PURCHASE',
    label: 'Purchase',
    description: 'Stock received from supplier. Updates WAC.',
    colorClass: 'text-leaf ',
    accentClass:
      'border-status-success/30 bg-leaf-soft ',
  },
  {
    value: 'ADJUSTMENT_IN',
    label: 'Adjust In',
    description: 'Manual positive correction.',
    colorClass: 'text-muted-foreground ',
    accentClass:
      'border-border bg-muted  ',
  },
  {
    value: 'ADJUSTMENT_OUT',
    label: 'Adjust Out',
    description: 'Manual negative correction.',
    colorClass: 'text-status-warning',
    accentClass:
      'border-status-warning/30 bg-status-warning/10',
  },
  {
    value: 'WASTE',
    label: 'Waste',
    description: 'Spoilage or loss.',
    colorClass: 'text-status-danger',
    accentClass:
      'border-status-danger/30 bg-status-danger/10',
  },
]

// ── Zod schema ─────────────────────────────────────────────────────────────

const formSchema = z.object({
  ingredientId: z.string().min(1, 'Select an ingredient.'),
  employeeId: z.string().min(1, 'Select an employee.'),
  movementType: z.enum([
    'PURCHASE',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'WASTE',
  ]),
  quantity: z.coerce.number().positive('Quantity must be greater than 0.'),
  unit: z.string().min(1, 'Unit is required.'),
  costPerUnit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

type MovementForm = z.infer<typeof formSchema>

// ── Props ──────────────────────────────────────────────────────────────────

interface StockMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When launched from an ingredient row the ingredient is pre-filled. */
  initialIngredient?: Ingredient | null
  /** When launched from an outlet-specific view, skip outlet selection. */
  initialOutletId?: string
}

// ── Component ──────────────────────────────────────────────────────────────

export function StockMovementDialog({
  open,
  onOpenChange,
  initialIngredient,
  initialOutletId,
}: StockMovementDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null)

  const mutation = useCreateStockMovementMutation()

  // ── Remote data ──────────────────────────────────────────────────────────

  const { data: outletsData, isLoading: isLoadingOutlets } = useQuery({
    queryKey: ['outlets', 'list'],
    queryFn: () => tenantGet<OutletsResponse>(tenantApiPaths.outlets.list),
    enabled: open,
  })
  const outlets = (outletsData?.data ?? []).filter((o) => o.isActive)

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'list'],
    queryFn: () => tenantGet<EmployeesResponse>(tenantApiPaths.employees.list),
    enabled: open && step === 2,
  })
  const employees = employeesData?.data ?? []

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', 'list-all'],
    queryFn: () =>
      tenantGet<IngredientsResponse>(
        `${tenantApiPaths.ingredients.list}?size=200`
      ),
    enabled: open && step === 2 && !initialIngredient,
  })
  const ingredientsList = ingredientsData?.data ?? []

  // ── Form ──────────────────────────────────────────────────────────────────

  const form = useForm<MovementForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      ingredientId: initialIngredient?.id ?? '',
      employeeId: '',
      movementType: 'PURCHASE',
      quantity: '' as unknown as number,
      unit: initialIngredient?.unit ?? '',
      costPerUnit: initialIngredient
        ? Number(initialIngredient.costPerUnit)
        : undefined,
      notes: '',
    },
  })

  const watchMovementType = form.watch('movementType')
  const watchIngredientId = form.watch('ingredientId')
  const showCost =
    watchMovementType === 'PURCHASE' || watchMovementType === 'ADJUSTMENT_IN'

  // Auto-fill unit + costPerUnit when ingredient changes (standalone mode)
  useEffect(() => {
    if (initialIngredient || !watchIngredientId) return
    const found = ingredientsList.find((i) => i.id === watchIngredientId)
    if (found) {
      form.setValue('unit', found.unit)
      form.setValue('costPerUnit', Number(found.costPerUnit))
    }
  }, [watchIngredientId, ingredientsList, form, initialIngredient])

  // Auto-advance when initialOutletId is provided (outlet-inventory-tab context)
  useEffect(() => {
    if (open && initialOutletId && step === 1 && !selectedOutlet && outlets.length > 0) {
      const found = outlets.find((o) => o.id === initialOutletId)
      if (found) {
        setSelectedOutlet(found)
        setStep(2)
      }
    }
  }, [open, initialOutletId, outlets, step, selectedOutlet])

  // Auto-advance to step 2 when only one outlet is available
  useEffect(() => {
    if (open && !initialOutletId && outlets.length === 1 && step === 1 && !selectedOutlet) {
      setSelectedOutlet(outlets[0])
      setStep(2)
    }
  }, [open, initialOutletId, outlets, step, selectedOutlet])

  // Reset everything on close
  useEffect(() => {
    if (!open) {
      setStep(1)
      setSelectedOutlet(null)
      form.reset({
        ingredientId: initialIngredient?.id ?? '',
        employeeId: '',
        movementType: 'PURCHASE',
        quantity: '' as unknown as number,
        unit: initialIngredient?.unit ?? '',
        costPerUnit: initialIngredient
          ? Number(initialIngredient.costPerUnit)
          : undefined,
        notes: '',
      })
    }
  }, [open, initialIngredient, form])

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (values: MovementForm) => {
    if (!selectedOutlet) return
    try {
      await mutation.mutateAsync({
        localUuid: crypto.randomUUID(),
        outletId: selectedOutlet.id,
        ingredientId: values.ingredientId,
        employeeId: values.employeeId,
        movementType: values.movementType,
        quantity: values.quantity,
        unit: values.unit,
        costPerUnit: showCost ? (values.costPerUnit ?? undefined) : undefined,
        notes: values.notes || undefined,
      })
      onOpenChange(false)
    } catch {
      // handled by mutation
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onOpenChange={(s) => {
        if (!mutation.isPending) onOpenChange(s)
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>New Stock Movement</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Step 1 of 2 — Select the outlet to update.'
              : `Step 2 of 2 — Record movement at ${selectedOutlet?.name}.`}
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP 1: Outlet selection ─────────────────────────────────── */}
        {step === 1 && (
          <div className='space-y-4'>
            {isLoadingOutlets ? (
              <div className='grid grid-cols-2 gap-3'>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className='bg-muted h-20 animate-pulse rounded-lg'
                  />
                ))}
              </div>
            ) : outlets.length === 0 ? (
              <p className='text-muted-foreground py-6 text-center text-sm'>
                No active outlets found.
              </p>
            ) : (
              <div className='grid grid-cols-2 gap-3'>
                {outlets.map((outlet) => {
                  const isSelected = selectedOutlet?.id === outlet.id
                  return (
                    <button
                      key={outlet.id}
                      type='button'
                      onClick={() => setSelectedOutlet(outlet)}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <Building2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      <div className='min-w-0'>
                        <p
                          className={`truncate text-sm font-medium ${
                            isSelected ? 'text-primary' : ''
                          }`}
                        >
                          {outlet.name}
                        </p>
                        <p className='text-muted-foreground font-sans tabular-nums text-xs'>
                          {outlet.code}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className='text-primary ml-auto h-4 w-4 shrink-0' />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedOutlet || mutation.isPending}
                onClick={() => setStep(2)}
              >
                Continue →
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── STEP 2: Movement form ─────────────────────────────────────── */}
        {step === 2 && (
          <Form {...form}>
            <form
              id='stock-movement-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              {/* Movement type selector */}
              <FormField
                control={form.control}
                name='movementType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movement Type</FormLabel>
                    <div className='grid grid-cols-2 gap-2'>
                      {MOVEMENT_TYPES.map((mt) => {
                        const isSelected = field.value === mt.value
                        return (
                          <button
                            key={mt.value}
                            type='button'
                            onClick={() => field.onChange(mt.value)}
                            className={`rounded-lg border p-2.5 text-left text-sm transition-colors ${
                              isSelected
                                ? mt.accentClass + ' ring-1 ring-current'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <span
                              className={`font-semibold ${isSelected ? mt.colorClass : ''}`}
                            >
                              {mt.label}
                            </span>
                            <p className='text-muted-foreground mt-0.5 text-xs'>
                              {mt.description}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ingredient */}
              <FormField
                control={form.control}
                name='ingredientId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      Ingredient
                    </FormLabel>
                    {initialIngredient ? (
                      <div className='col-span-4 rounded border bg-muted/40 px-3 py-2'>
                        <p className='text-sm font-medium'>
                          {initialIngredient.name}
                        </p>
                        <p className='text-muted-foreground font-sans tabular-nums text-xs'>
                          {initialIngredient.code}
                        </p>
                      </div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='col-span-4'>
                            <SelectValue placeholder='Select ingredient' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ingredientsList.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name}{' '}
                              <span className='text-muted-foreground font-sans tabular-nums text-xs'>
                                ({ing.code})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* Quantity + Unit */}
              <FormField
                control={form.control}
                name='quantity'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      Quantity
                    </FormLabel>
                    <div className='col-span-4 flex gap-2'>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='any'
                          placeholder='0'
                          className='flex-1'
                          {...field}
                        />
                      </FormControl>
                      <FormField
                        control={form.control}
                        name='unit'
                        render={({ field: unitField }) => (
                          <Input
                            placeholder='unit'
                            className='w-20 font-sans tabular-nums'
                            {...unitField}
                          />
                        )}
                      />
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* Cost per unit — only for IN-type movements */}
              {showCost && (
                <FormField
                  control={form.control}
                  name='costPerUnit'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                      <FormLabel className='col-span-2 text-end'>
                        Cost / Unit
                        {watchMovementType === 'PURCHASE' && (
                          <span className='text-muted-foreground block text-xs font-normal'>
                            Updates WAC
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='any'
                          placeholder='0'
                          className='col-span-4'
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              )}

              {/* Employee */}
              <FormField
                control={form.control}
                name='employeeId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      Employee
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className='col-span-4'>
                          <SelectValue placeholder='Select employee' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                            <span className='text-muted-foreground ml-1 font-sans tabular-nums text-xs'>
                              #{emp.employeeNo}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 pt-2 text-end'>
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Optional notes…'
                        className='col-span-4 resize-none'
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setStep(1)}
                disabled={mutation.isPending}
              >
                <ArrowLeft className='mr-1.5 h-3.5 w-3.5' />
                Back
              </Button>
              <Button
                type='submit'
                form='stock-movement-form'
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving…' : 'Save Movement'}
              </Button>
            </DialogFooter>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
