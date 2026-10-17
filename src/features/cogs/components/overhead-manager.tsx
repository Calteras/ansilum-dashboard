import { useState } from 'react'
import { Trash2, Plus } from '@/components/icons'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useProductsQuery } from '@/features/products/api/products.queries'
import {
  useProductOverheadQuery,
  useAddOverheadMutation,
  useDeleteOverheadMutation,
} from '../api/cogs.queries'
import type { OverheadCostType } from '../api/cogs.types'

const COST_TYPES: OverheadCostType[] = ['LABOR', 'MACHINE_RUNTIME', 'RENT', 'OTHER']

const formSchema = z.object({
  name: z.string().min(1),
  costType: z.enum(['LABOR', 'MACHINE_RUNTIME', 'RENT', 'OTHER']),
  ratePerHour: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Must be a positive number'),
  hoursRequired: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Must be a positive number'),
})

type FormValues = z.infer<typeof formSchema>

function AddOverheadForm({
  productId,
  onClose,
}: {
  productId: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const mutation = useAddOverheadMutation(productId)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      costType: 'LABOR',
      ratePerHour: '',
      hoursRequired: '',
    },
  })

  function onSubmit(values: FormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        form.reset()
        onClose()
      },
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-3 rounded-lg border bg-muted/30 p-4'
      >
        <p className='text-xs font-medium text-fg-muted'>
          {t('cogs.overhead.addTitle')}
        </p>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs'>{t('cogs.overhead.name')}</FormLabel>
                <FormControl>
                  <Input placeholder='Barista Labor' className='h-8 text-sm' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='costType'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs'>{t('cogs.overhead.type')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className='h-8 text-sm'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COST_TYPES.map((ct) => (
                      <SelectItem key={ct} value={ct}>
                        {t(`cogs.overhead.costTypes.${ct}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='ratePerHour'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs'>{t('cogs.overhead.ratePerHour')}</FormLabel>
                <FormControl>
                  <Input placeholder='15000.00' className='h-8 text-sm font-sans tabular-nums' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='hoursRequired'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs'>{t('cogs.overhead.hoursRequired')}</FormLabel>
                <FormControl>
                  <Input placeholder='0.0833' className='h-8 text-sm font-sans tabular-nums' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex items-center gap-2'>
          <Button type='submit' size='sm' disabled={mutation.isPending}>
            {mutation.isPending ? t('common.loading') : t('common.save')}
          </Button>
          <Button type='button' variant='ghost' size='sm' onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export function OverheadManager() {
  const { t } = useTranslation()
  const [selectedProductId, setSelectedProductId] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data: productsData } = useProductsQuery({ includeInactive: false })
  const products = productsData?.data ?? []

  const { data: overheadData, isLoading } = useProductOverheadQuery(selectedProductId)
  const overheads = overheadData?.data ?? []

  const deleteMutation = useDeleteOverheadMutation(selectedProductId)

  return (
    <div className='flex flex-col gap-5'>
      {/* Product selector */}
      <div className='flex items-center gap-3'>
        <Select value={selectedProductId} onValueChange={(v) => { setSelectedProductId(v); setShowForm(false) }}>
          <SelectTrigger className='h-9 w-[220px] text-sm'>
            <SelectValue placeholder={t('cogs.overhead.selectProduct')} />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedProductId && (
          <Button size='sm' onClick={() => setShowForm((v) => !v)}>
            <Plus className='mr-1.5 size-3.5' />
            {t('cogs.overhead.add')}
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && selectedProductId && (
        <AddOverheadForm productId={selectedProductId} onClose={() => setShowForm(false)} />
      )}

      {/* Prompt */}
      {!selectedProductId && (
        <div className='flex h-40 items-center justify-center rounded-lg border bg-card'>
          <p className='text-sm text-muted-foreground'>{t('cogs.overhead.selectPrompt')}</p>
        </div>
      )}

      {/* Table */}
      {selectedProductId && (
        <div className='overflow-hidden rounded-lg border bg-card'>
          <div className='border-b px-4 py-3 sm:px-5'>
            <p className='text-xs font-medium text-foreground'>
              {t('cogs.overhead.title')}
              <span className='ml-2 rounded bg-primary/10 px-1.5 py-0.5 font-sans tabular-nums text-xs text-primary'>
                {overheads.length}
              </span>
            </p>
          </div>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='border-b hover:bg-transparent'>
                  {[
                    t('cogs.overhead.colName'),
                    t('cogs.overhead.colType'),
                    t('cogs.overhead.colRate'),
                    t('cogs.overhead.colHours'),
                    t('cogs.overhead.colCostPerUnit'),
                    '',
                  ].map((h, i) => (
                    <TableHead
                      key={i}
                      className='px-4 py-2.5 text-xs font-medium text-fg-muted'
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-24 text-center font-sans tabular-nums text-xs text-muted-foreground'>
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : overheads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-24 text-center font-sans tabular-nums text-xs text-muted-foreground'>
                      {t('cogs.overhead.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  overheads.map((oh) => {
                    const costPerUnit = Number(oh.ratePerHour) * Number(oh.hoursRequired)
                    return (
                      <TableRow key={oh.id} className='group border-b last:border-0 hover:bg-surface-hover'>
                        <TableCell className='px-4 py-3 text-sm font-medium'>{oh.name}</TableCell>
                        <TableCell className='px-4 py-3'>
                          <span className='rounded bg-muted px-1.5 py-0.5 font-sans tabular-nums text-xs text-muted-foreground'>
                            {t(`cogs.overhead.costTypes.${oh.costType}`)}
                          </span>
                        </TableCell>
                        <TableCell className='px-4 py-3 font-sans tabular-nums text-xs tabular-nums text-muted-foreground'>
                          Rp{Number(oh.ratePerHour).toLocaleString('id-ID')} / hr
                        </TableCell>
                        <TableCell className='px-4 py-3 font-sans tabular-nums text-xs tabular-nums text-muted-foreground'>
                          {Number(oh.hoursRequired).toFixed(4)} hr
                        </TableCell>
                        <TableCell className='px-4 py-3 font-sans tabular-nums text-xs font-semibold tabular-nums'>
                          Rp{costPerUnit.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className='px-4 py-3'>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='size-7 opacity-0 transition-opacity group-hover:opacity-100'
                              >
                                <Trash2 className='size-3.5 text-destructive' />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('cogs.overhead.deleteTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('cogs.overhead.deleteDesc', { name: oh.name })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                  onClick={() => deleteMutation.mutate(oh.id)}
                                >
                                  {t('common.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
