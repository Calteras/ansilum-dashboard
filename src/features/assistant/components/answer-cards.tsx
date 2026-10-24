import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrendingDown, TrendingUp } from '@/components/icons'
import type {
  AnswerComponent,
  CellValue,
  DataTableComponent,
  Metric,
  MetricGroupComponent,
  MetricUnit,
} from '../api/assistant.types'

function formatValue(value: CellValue, unit: MetricUnit | 'text' | undefined) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  switch (unit) {
    case 'currency':
      return formatMoney(value)
    case 'percent':
      return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(value)}%`
    case 'count':
    case 'quantity':
      return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 2,
      }).format(value)
    default:
      return String(value)
  }
}

function MetricTile({ metric }: { metric: Metric }) {
  const copy = useCopy()
  const change = metric.change_percent
  return (
    <div className='border-divider bg-card min-w-0 rounded-xl border px-4 py-3'>
      <p className='text-fg-muted truncate text-xs font-medium'>
        {metric.label}
      </p>
      <p className='mt-1 text-lg font-semibold tabular-nums'>
        {formatValue(metric.value, metric.unit)}
      </p>
      {change !== null && change !== undefined && (
        <p
          className={cn(
            'mt-1 flex items-center gap-1 text-xs font-medium tabular-nums',
            change < 0 ? 'text-brand-ink' : 'text-leaf'
          )}
        >
          {change < 0 ? (
            <TrendingDown className='size-3.5' aria-hidden />
          ) : (
            <TrendingUp className='size-3.5' aria-hidden />
          )}
          {formatValue(change, 'percent')}{' '}
          <span className='text-fg-muted font-normal'>
            {copy('vs periode sebelumnya', 'vs previous period')}
          </span>
        </p>
      )}
    </div>
  )
}

export function MetricGroupCard({
  component,
}: {
  component: MetricGroupComponent
}) {
  return (
    <section className='aa-rise space-y-2' aria-label={component.title}>
      <header>
        <h3 className='text-sm font-semibold'>{component.title}</h3>
        {component.subtitle && (
          <p className='text-fg-muted text-xs'>{component.subtitle}</p>
        )}
      </header>
      <div className='grid grid-cols-2 gap-2 lg:grid-cols-3'>
        {component.metrics.map((metric) => (
          <MetricTile key={metric.key} metric={metric} />
        ))}
      </div>
    </section>
  )
}

export function DataTableCard({
  component,
}: {
  component: DataTableComponent
}) {
  return (
    <section className='aa-rise space-y-2' aria-label={component.title}>
      <h3 className='text-sm font-semibold'>{component.title}</h3>
      <div className='border-divider bg-card overflow-x-auto rounded-xl border'>
        <Table>
          <TableHeader>
            <TableRow>
              {component.columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.unit && column.unit !== 'text' && 'text-right'
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {component.rows.map((row, index) => (
              <TableRow key={index}>
                {component.columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      'tabular-nums',
                      column.unit && column.unit !== 'text' && 'text-right'
                    )}
                  >
                    {formatValue(row[column.key] ?? null, column.unit)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

/** Cards built by the backend from tool data: the figures are exactly what it returned. */
export function AnswerCards({ components }: { components: AnswerComponent[] }) {
  if (!components.length) return null
  return (
    <div className='space-y-4'>
      {components.map((component, index) =>
        component.type === 'metric_group' ? (
          <MetricGroupCard key={index} component={component} />
        ) : component.type === 'data_table' ? (
          <DataTableCard key={index} component={component} />
        ) : null
      )}
    </div>
  )
}
