import { formatMoney } from '@/lib/format'
import { formatCount } from '@/lib/metrics'
import { useCopy } from '@/hooks/use-copy'
import { Metric, MetricGroup } from '@/components/data-display/metric'

interface StockMovement {
  id: string
  movementType: string
  quantity: string
  totalCost: string
  ingredient: { name: string }
}

export function StockMovementsStats({
  movements,
  isLoading,
  className,
}: {
  movements: StockMovement[]
  isLoading?: boolean
  className?: string
}) {
  const copy = useCopy()
  const stats = [
    {
      label: copy('Catatan stok', 'Stock entries'),
      value: formatCount(movements.length),
    },
    {
      label: copy('Total biaya tercatat', 'Total recorded cost'),
      definition: copy(
        'Jumlah nilai absolut biaya dari semua catatan.',
        'Sum of the absolute cost of every entry.'
      ),
      value: formatMoney(
        movements.reduce(
          (sum, item) => sum + Math.abs(Number(item.totalCost)),
          0
        )
      ),
    },
    {
      label: copy('Pemakaian untuk penjualan', 'Sales usage entries'),
      value: formatCount(
        movements.filter((item) => item.movementType === 'SALE').length
      ),
    },
    {
      label: copy('Jenis bahan', 'Ingredients'),
      value: formatCount(
        new Set(movements.map((item) => item.ingredient.name)).size
      ),
    },
  ]

  return (
    <MetricGroup
      aria-label={copy('Ringkasan stok', 'Stock summary')}
      className={className}
    >
      {stats.map((stat) => (
        <Metric key={stat.label} {...stat} isLoading={isLoading} />
      ))}
    </MetricGroup>
  )
}
