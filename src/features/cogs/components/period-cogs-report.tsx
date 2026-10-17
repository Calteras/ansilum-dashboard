import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getPresetSpan, toApiDateTime, type DateSpan } from '@/lib/date-range'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calculator } from '@/components/icons'
import { ContextToolbar } from '@/components/data-display/context-toolbar'
import { DateRangePicker } from '@/components/date-range-picker'
import { OutletSelect } from '@/components/outlet-select'
import { useDashboardOutletsQuery } from '@/features/dashboard/api/dashboard.queries'
import { useCalculatePeriodCogsMutation } from '../api/cogs.queries'
import type { ByProductCogs, PeriodCogsData } from '../api/cogs.types'

function formatRp(value: number, dp = 0) {
  return `Rp${value.toLocaleString('id-ID', { maximumFractionDigits: dp })}`
}

function marginColor(pct: number) {
  if (pct >= 50) return 'text-leaf '
  if (pct >= 30) return 'text-status-warning'
  return 'text-status-danger'
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
    <div className='bg-card rounded-lg border p-5 sm:p-6'>
      <p className='text-fg-muted mb-4 text-xs font-medium'>
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
              className={`font-sans text-sm tabular-nums ${row.bold ? 'font-semibold' : ''}`}
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
      <div className='bg-card rounded-lg border p-5 sm:p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-fg-muted text-xs font-medium'>
              {t('cogs.period.materialCogs')}
            </p>
            <p className='mt-2 text-2xl leading-8 font-semibold tracking-[-0.02em]'>
              {formatRp(data.materialCogs)}
            </p>
          </div>
          <span className='bg-muted text-fg-secondary rounded-md px-2 py-0.5 text-xs font-medium'>
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
      <div className='bg-card rounded-lg border p-5 sm:p-6'>
        <p className='text-fg-muted text-xs font-medium'>
          {t('cogs.period.directCogs')}
        </p>
        <p className='mt-3 text-2xl leading-8 font-semibold tracking-[-0.02em]'>
          {formatRp(data.directMethodCogs, 2)}
        </p>
        <p className='text-fg-secondary mt-3 text-sm leading-relaxed'>
          {diffPct > 0
            ? `${diffPct.toFixed(1)}% ${diff > 0 ? t('cogs.period.belowAbsorption') : t('cogs.period.aboveAbsorption')}`
            : t('cogs.period.exactMatch')}
        </p>
        <div className='border-divider mt-8 border-t pt-4'>
          <p className='text-fg-muted text-xs'>
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
    <div className='bg-card overflow-hidden rounded-lg border'>
      <div className='flex items-center justify-between border-b px-4 py-4 sm:px-5'>
        <div>
          <p className='text-fg-muted text-xs font-medium'>
            {t('cogs.period.byProduct')}
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Products ranked by margin pressure
          </p>
        </div>
        <span className='bg-muted rounded-md px-2 py-1 font-sans text-xs font-semibold tabular-nums'>
          <span className='text-fg-muted text-[13px] tabular-nums'>
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
                  className='text-fg-muted px-4 py-2.5 text-xs font-medium'
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
                className='hover:bg-surface-hover border-b last:border-0'
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
                              ? 'bg-status-warning'
                              : 'bg-status-danger'
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
  const [span, setSpan] = useState<DateSpan>(() => getPresetSpan('this-month'))
  const [selectedOutletId, setSelectedOutletId] = useState<string>('all')

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  const mutation = useCalculatePeriodCogsMutation()
  const result = mutation.data?.data ?? null

  function handleCalculate() {
    mutation.mutate({
      startDate: toApiDateTime(span.from),
      endDate: toApiDateTime(span.to),
      outletId: selectedOutletId !== 'all' ? selectedOutletId : undefined,
    })
  }

  return (
    <div className='flex flex-col gap-5'>
      <ContextToolbar
        aria-label={t('cogs.page.title')}
        actions={
          <Button
            size='sm'
            onClick={handleCalculate}
            disabled={mutation.isPending}
          >
            <Calculator className='size-4' aria-hidden />
            {mutation.isPending
              ? t('common.loading')
              : t('cogs.period.calculate')}
          </Button>
        }
      >
        {outlets.length > 0 && (
          <OutletSelect
            outlets={outlets}
            value={selectedOutletId}
            onValueChange={setSelectedOutletId}
            allLabel={t('common.all')}
          />
        )}
        <DateRangePicker value={span} onChange={setSpan} />
      </ContextToolbar>

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
