import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDashboardOutletsQuery } from '@/features/dashboard/api/dashboard.queries'
import { useProductsQuery } from '@/features/products/api/products.queries'
import {
  useProductCostQuery,
  useMarginForecastQuery,
} from '../api/cogs.queries'
import type { CostBreakdownItem } from '../api/cogs.types'

const COSTING_METHOD_LABEL: Record<string, string> = {
  WEIGHTED_AVERAGE: 'WAC',
  FIFO: 'FIFO',
  LIFO: 'LIFO',
}

function formatRp(value: number) {
  return `Rp${value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
}

function MarginGauge({ pct, label }: { pct: number; label: string }) {
  const color =
    pct >= 50 ? 'bg-leaf' : pct >= 30 ? 'bg-amber-500' : 'bg-rose-500'
  const textColor =
    pct >= 50
      ? 'text-leaf '
      : pct >= 30
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400'

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between text-xs'>
        <span className='text-muted-foreground'>{label}</span>
        <span className={`font-sans tabular-nums font-bold ${textColor}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
        <div
          className={`h-full rounded-full transition-colors duration-500 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

function BreakdownBars({
  items,
  total,
}: {
  items: CostBreakdownItem[]
  total: number
}) {
  return (
    <div className='space-y-2.5'>
      {items.map((item) => {
        const pct = total > 0 ? (item.lineCost / total) * 100 : 0
        return (
          <div key={item.ingredientId} className='space-y-1'>
            <div className='flex items-center justify-between gap-3 text-xs'>
              <div className='flex min-w-0 items-center gap-2'>
                <span className='truncate font-medium'>
                  {item.ingredientName}
                </span>
                <span className='bg-muted text-muted-foreground shrink-0 rounded px-1 py-0.5 font-sans tabular-nums text-xs'>
                  {COSTING_METHOD_LABEL[item.costingMethod] ??
                    item.costingMethod}
                </span>
              </div>
              <span className='shrink-0 font-sans tabular-nums tabular-nums'>
                {formatRp(item.lineCost)}
              </span>
            </div>
            <div className='bg-muted/60 h-1.5 w-full overflow-hidden rounded-full'>
              <div
                className='bg-primary/70 h-full rounded-full transition-colors duration-500'
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ForecastSection({
  productId,
  outletId,
}: {
  productId: string
  outletId: string
}) {
  const { t } = useTranslation()
  const [pct, setPct] = useState(10)

  const { data, isFetching } = useMarginForecastQuery({
    productId,
    outletId,
    simulatedMaterialIncreasePct: pct,
  })

  const forecast = data?.data

  return (
    <div className='bg-muted/30 space-y-4 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
          {t('cogs.forecast.title')}
        </p>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground font-sans tabular-nums text-xs'>
            {t('cogs.forecast.increase')}
          </span>
          <Input
            type='number'
            min={0}
            max={100}
            value={pct}
            onChange={(e) =>
              setPct(Math.min(100, Math.max(0, Number(e.target.value))))
            }
            className='h-7 w-16 text-center font-sans tabular-nums text-xs'
          />
          <span className='text-muted-foreground font-sans tabular-nums text-xs'>%</span>
        </div>
      </div>

      {isFetching && (
        <p className='text-muted-foreground font-sans tabular-nums text-xs'>
          {t('common.loading')}
        </p>
      )}

      {forecast && !isFetching && (
        <div className='space-y-3'>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='text-muted-foreground mb-1 text-xs font-semibold tracking-widest uppercase'>
                {t('cogs.forecast.currentMargin')}
              </p>
              <MarginGauge
                pct={forecast.currentMarginPct}
                label={`${formatRp(forecast.currentGrossProfit)} / unit`}
              />
            </div>
            <div>
              <p className='text-muted-foreground mb-1 text-xs font-semibold tracking-widest uppercase'>
                {t('cogs.forecast.simulatedMargin')}
              </p>
              <MarginGauge
                pct={forecast.simulatedMarginPct}
                label={`${formatRp(forecast.simulatedGrossProfit)} / unit`}
              />
            </div>
          </div>

          {forecast.ingredientBreakdown.length > 0 && (
            <div className='space-y-1.5'>
              <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>
                {t('cogs.forecast.ingredientImpact')}
              </p>
              {forecast.ingredientBreakdown.map((ing) => (
                <div
                  key={ing.ingredientId}
                  className='flex items-center justify-between font-sans tabular-nums text-xs'
                >
                  <span className='text-muted-foreground truncate'>
                    {ing.ingredientName}
                  </span>
                  <div className='flex shrink-0 items-center gap-2'>
                    <span>{formatRp(ing.currentCost)}</span>
                    <span className='text-muted-foreground'>→</span>
                    <span className='text-amber-600 dark:text-amber-400'>
                      {formatRp(ing.simulatedCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ProductCostCard() {
  const { t } = useTranslation()
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  const { data: productsData } = useProductsQuery({ includeInactive: false })
  const products = productsData?.data ?? []

  const { data: costData, isLoading } = useProductCostQuery(selectedProductId, {
    outletId: selectedOutletId,
    quantity,
  })
  const cost = costData?.data

  return (
    <div className='flex flex-col gap-5'>
      {/* Selectors */}
      <div className='flex flex-wrap items-center gap-3'>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger className='h-9 w-[220px] text-sm'>
            <SelectValue placeholder={t('cogs.productCost.selectProduct')} />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
          <SelectTrigger className='h-9 w-[200px] text-sm'>
            <SelectValue placeholder={t('dashboard.filters.selectOutlet')} />
          </SelectTrigger>
          <SelectContent>
            {outlets.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>
            {t('cogs.productCost.qty')}
          </span>
          <Input
            type='number'
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className='h-9 w-20 text-center font-sans tabular-nums text-sm'
          />
        </div>
      </div>

      {/* Prompt */}
      {!selectedProductId || !selectedOutletId ? (
        <div className='bg-card flex h-48 items-center justify-center rounded-lg border'>
          <p className='text-muted-foreground text-sm'>
            {t('cogs.productCost.selectPrompt')}
          </p>
        </div>
      ) : isLoading ? (
        <div className='bg-card flex h-48 items-center justify-center rounded-lg border'>
          <p className='text-muted-foreground font-sans tabular-nums text-xs'>
            {t('common.loading')}
          </p>
        </div>
      ) : cost ? (
        <div className='flex flex-col gap-4 xl:flex-row'>
          {/* Left: Stats */}
          <div className='flex flex-col gap-4 xl:w-[340px]'>
            {/* Cost summary */}
            <div className='bg-border grid grid-cols-2 gap-px overflow-hidden rounded-xl border'>
              {[
                {
                  label: t('cogs.productCost.materialCost'),
                  value: cost.materialCost,
                },
                {
                  label: t('cogs.productCost.overheadCost'),
                  value: cost.overheadCost,
                },
                {
                  label: t('cogs.productCost.totalUnitCost'),
                  value: cost.totalUnitCost,
                  bold: true,
                },
                {
                  label: t('cogs.productCost.totalCogs'),
                  value: cost.totalCogs,
                  bold: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className='bg-card flex flex-col gap-1.5 p-4'
                >
                  <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                    {s.label}
                  </p>
                  <p
                    className={`font-sans tabular-nums tabular-nums ${s.bold ? 'text-lg font-bold' : 'text-sm'}`}
                  >
                    {formatRp(s.value)}
                  </p>
                </div>
              ))}
            </div>

            {/* Selling price + margin */}
            <div className='bg-card space-y-3 rounded-lg border p-4'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {t('cogs.productCost.sellingPrice')}
                </span>
                <span className='font-sans tabular-nums font-semibold'>
                  {formatRp(cost.basePrice)}
                </span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {t('cogs.productCost.grossMargin')}
                </span>
                <span className='font-sans tabular-nums font-semibold'>
                  {formatRp(cost.grossMargin)}
                </span>
              </div>
              <MarginGauge
                pct={cost.grossMarginPct}
                label={`${cost.grossMarginPct.toFixed(1)}% ${t('cogs.productCost.marginLabel')}`}
              />
            </div>

            {/* Forecast */}
            {selectedProductId && selectedOutletId && (
              <ForecastSection
                productId={selectedProductId}
                outletId={selectedOutletId}
              />
            )}
          </div>

          {/* Right: breakdown */}
          <div className='bg-card flex-1 rounded-lg border p-4 sm:p-5'>
            <p className='text-muted-foreground mb-4 text-xs font-semibold tracking-wide uppercase'>
              {t('cogs.productCost.materialBreakdown')}
              <span className='text-muted-foreground ml-2 font-normal normal-case'>
                ({cost.quantityEstimated} {t('cogs.productCost.units')})
              </span>
            </p>
            {cost.breakdown.length === 0 ? (
              <p className='text-muted-foreground font-sans tabular-nums text-xs'>
                {t('cogs.productCost.noRecipe')}
              </p>
            ) : (
              <BreakdownBars items={cost.breakdown} total={cost.materialCost} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
