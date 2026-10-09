import { useState } from 'react'
import { format, startOfMonth, endOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { CalendarIcon, Calculator } from '@/components/icons'
import { useDashboardOutletsQuery } from '@/features/dashboard/api/dashboard.queries'
import { useCalculatePeriodCogsMutation } from '../api/cogs.queries'
import type { ByProductCogs, PeriodCogsData } from '../api/cogs.types'

function formatRp(value: number, dp = 0) {
  return `Rp${value.toLocaleString('id-ID', { maximumFractionDigits: dp })}`
}

function marginColor(pct: number) {
  if (pct >= 50) return 'text-leaf '
  if (pct >= 30) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

function InventoryFlow({ data }: { data: PeriodCogsData }) {
  const { t } = useTranslation()
  const rows = [
    {
      label: t('cogs.period.beginningInventory'),
      value: data.beginningInventoryValue,
      sign: '',
    },
    {
      label: t('cogs.period.purchases'),
      value: data.purchasesValue,
      sign: '+',
    },
    {
      label: t('cogs.period.endingInventory'),
      value: data.endingInventoryValue,
      sign: '−',
    },
    {
      label: t('cogs.period.materialCogs'),
      value: data.materialCogs,
      sign: '=',
      bold: true,
    },
  ]
  return (
    <div className='bg-card rounded-2xl border p-5 shadow-[0_14px_45px_-36px_var(--brand-ink)] sm:p-6'>
      <p className='text-brand-ink mb-4 text-[11px] font-bold tracking-[0.18em] uppercase'>
        {t('cogs.period.absorptionFormula')}
      </p>
      <div className='space-y-3'>
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-4 ${row.bold ? 'border-t pt-2' : ''}`}
          >
            <span
              className={`text-sm ${row.bold ? 'font-semibold' : 'text-muted-foreground'}`}
            >
              {row.sign && (
                <span className='text-muted-foreground mr-2 font-sans tabular-nums'>
                  {row.sign}
                </span>
              )}
              {row.label}
            </span>
            <span
              className={`font-sans text-sm tabular-nums ${row.bold ? 'text-brand-ink font-bold' : ''}`}
            >
              {formatRp(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CogsComparisonCards({ data }: { data: PeriodCogsData }) {
  const { t } = useTranslation()
  const diff = data.materialCogs - data.directMethodCogs
  const diffPct =
    data.directMethodCogs > 0
      ? (Math.abs(diff) / data.directMethodCogs) * 100
      : 0
  const maxValue = Math.max(data.materialCogs, data.directMethodCogs, 1)
  const lowestMargin = [...data.byProduct].sort(
    (a, b) => a.grossMarginPct - b.grossMarginPct
  )[0]

  return (
    <div className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
      <div className='bg-card rounded-2xl border p-5 shadow-[0_14px_45px_-36px_var(--brand-ink)] sm:p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-brand-ink text-[11px] font-bold tracking-[0.18em] uppercase'>
              {t('cogs.period.materialCogs')}
            </p>
            <p className='mt-2 font-sans text-3xl leading-none font-bold tracking-tight tabular-nums'>
              {formatRp(data.materialCogs)}
            </p>
          </div>
          <span className='bg-brand-soft text-brand-ink rounded-md px-2.5 py-1 text-xs font-semibold'>
            {t('cogs.period.absorptionMethod')}
          </span>
        </div>
        <p className='text-muted-foreground mt-3 text-sm leading-relaxed'>
          {t('cogs.period.absorptionDesc')}
        </p>
        <div className='mt-7 space-y-4'>
          {[
            {
              label: t('cogs.period.materialCogs'),
              value: data.materialCogs,
              color: 'bg-brand',
            },
            {
              label: t('cogs.period.directCogs'),
              value: data.directMethodCogs,
              color: 'bg-steel',
            },
          ].map((item) => (
            <div key={item.label}>
              <div className='mb-1.5 flex items-center justify-between gap-4 text-xs'>
                <span className='text-muted-foreground'>{item.label}</span>
                <span className='font-semibold tabular-nums'>
                  {formatRp(item.value)}
                </span>
              </div>
              <div className='bg-muted h-2 overflow-hidden rounded-full'>
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className='bg-brand-ink rounded-2xl p-5 text-white shadow-[0_18px_50px_-30px_var(--brand-ink)] sm:p-6'>
        <p className='text-[11px] font-bold tracking-[0.18em] text-white/60 uppercase'>
          {t('cogs.period.directCogs')}
        </p>
        <p className='mt-3 font-sans text-3xl leading-none font-bold tracking-tight tabular-nums'>
          {formatRp(data.directMethodCogs, 2)}
        </p>
        <p className='mt-3 text-sm leading-relaxed text-white/70'>
          {diffPct > 0
            ? `${diffPct.toFixed(1)}% ${diff > 0 ? t('cogs.period.belowAbsorption') : t('cogs.period.aboveAbsorption')}`
            : t('cogs.period.exactMatch')}
        </p>
        <div className='mt-8 border-t border-white/15 pt-4'>
          <p className='text-xs text-white/60'>
            {lowestMargin ? 'Lowest product margin' : 'Product coverage'}
          </p>
          <p className='mt-1 font-semibold'>
            {lowestMargin
              ? `${lowestMargin.productName} · ${lowestMargin.grossMarginPct.toFixed(1)}%`
              : `${data.byProduct.length} products`}
          </p>
        </div>
      </div>
    </div>
  )
}

function ByProductTable({ rows }: { rows: ByProductCogs[] }) {
  const { t } = useTranslation()
  const sorted = [...rows].sort((a, b) => a.grossMarginPct - b.grossMarginPct)

  return (
    <div className='bg-card overflow-hidden rounded-2xl border shadow-[0_14px_45px_-36px_var(--brand-ink)]'>
      <div className='flex items-center justify-between border-b px-4 py-4 sm:px-5'>
        <div>
          <p className='text-brand-ink text-[11px] font-bold tracking-[0.18em] uppercase'>
            {t('cogs.period.byProduct')}
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Products ranked by margin pressure
          </p>
        </div>
        <span className='bg-muted rounded-md px-2 py-1 font-sans text-xs font-semibold tabular-nums'>
          <span className='bg-primary/10 text-primary ml-2 rounded px-1.5 py-0.5 font-sans text-xs tabular-nums'>
            {sorted.length}
          </span>
        </span>
      </div>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='border-b hover:bg-transparent'>
              {[
                t('cogs.period.colProduct'),
                t('cogs.period.colQtySold'),
                t('cogs.period.colCogs'),
                t('cogs.period.colRevenue'),
                t('cogs.period.colGrossMargin'),
                t('cogs.period.colMarginPct'),
              ].map((h) => (
                <TableHead
                  key={h}
                  className='text-muted-foreground px-4 py-2.5 text-xs font-semibold tracking-wide uppercase'
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow
                key={row.productId}
                className='hover:bg-muted/20 border-b last:border-0'
              >
                <TableCell className='px-4 py-3 text-sm font-medium'>
                  {row.productName}
                </TableCell>
                <TableCell className='text-muted-foreground px-4 py-3 font-sans text-xs tabular-nums'>
                  {row.quantitySold.toLocaleString()}
                </TableCell>
                <TableCell className='px-4 py-3 font-sans text-xs tabular-nums'>
                  {formatRp(row.cogs, 2)}
                </TableCell>
                <TableCell className='px-4 py-3 font-sans text-xs tabular-nums'>
                  {formatRp(row.revenue)}
                </TableCell>
                <TableCell className='px-4 py-3 font-sans text-xs tabular-nums'>
                  {formatRp(row.grossMargin)}
                </TableCell>
                <TableCell className='px-4 py-3'>
                  <div className='flex items-center gap-2'>
                    <div className='bg-muted h-1.5 w-16 overflow-hidden rounded-full'>
                      <div
                        className={`h-full rounded-full ${
                          row.grossMarginPct >= 50
                            ? 'bg-leaf'
                            : row.grossMarginPct >= 30
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`}
                        style={{
                          width: `${Math.min(row.grossMarginPct, 100)}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`font-sans text-xs font-semibold tabular-nums ${marginColor(row.grossMarginPct)}`}
                    >
                      {row.grossMarginPct.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function PeriodCogsReport() {
  const { t } = useTranslation()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  })
  const [selectedOutletId, setSelectedOutletId] = useState<string>('all')

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  const mutation = useCalculatePeriodCogsMutation()
  const result = mutation.data?.data ?? null

  function handleCalculate() {
    if (!dateRange.from || !dateRange.to) return
    mutation.mutate({
      startDate: format(dateRange.from, "yyyy-MM-dd'T'HH:mm:ss"),
      endDate: format(dateRange.to, "yyyy-MM-dd'T'HH:mm:ss"),
      outletId: selectedOutletId !== 'all' ? selectedOutletId : undefined,
    })
  }

  return (
    <div className='flex flex-col gap-5'>
      {/* Filters */}
      <div className='bg-card/80 flex flex-wrap items-center gap-3 rounded-2xl border p-3 shadow-[0_12px_40px_-32px_var(--brand-ink)] sm:p-4'>
        {outlets.length > 0 && (
          <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
            <SelectTrigger className='h-11 w-[200px] rounded-xl text-sm'>
              <SelectValue placeholder={t('dashboard.filters.selectOutlet')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('common.all')}</SelectItem>
              {outlets.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className='h-11 w-[280px] justify-start rounded-xl text-sm font-normal'
            >
              {dateRange.from && dateRange.to
                ? `${format(dateRange.from, 'dd MMM yyyy')} – ${format(dateRange.to, 'dd MMM yyyy')}`
                : t('dashboard.filters.selectDateRange')}
              <CalendarIcon className='ml-auto size-4 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='range'
              captionLayout='dropdown'
              selected={dateRange}
              onSelect={(range) => range && setDateRange(range)}
              disabled={(d) => d > new Date()}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Button
          className='h-11 rounded-xl'
          onClick={handleCalculate}
          disabled={mutation.isPending || !dateRange.from || !dateRange.to}
        >
          <Calculator className='mr-2 size-4' />
          {mutation.isPending
            ? t('common.loading')
            : t('cogs.period.calculate')}
        </Button>
      </div>

      {/* Placeholder before first calculation */}
      {!result && !mutation.isPending && (
        <div className='bg-card flex h-48 items-center justify-center rounded-lg border'>
          <p className='text-muted-foreground text-sm'>
            {t('cogs.period.selectAndCalculate')}
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          <CogsComparisonCards data={result} />
          <InventoryFlow data={result} />
          {result.byProduct.length > 0 && (
            <ByProductTable rows={result.byProduct} />
          )}
        </>
      )}
    </div>
  )
}
