import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
interface StockMovement { id: string; movementType: string; quantity: string; totalCost: string; ingredient: { name: string } }
export function StockMovementsStats({ movements }: { movements: StockMovement[] }) {
  const copy = useCopy()
  const stats = [
    [copy('Catatan stok', 'Stock entries'), movements.length.toLocaleString()],
    [copy('Total biaya tercatat', 'Total recorded cost'), formatMoney(movements.reduce((sum, item) => sum + Math.abs(Number(item.totalCost)), 0))],
    [copy('Pemakaian untuk penjualan', 'Sales usage entries'), movements.filter((item) => item.movementType === 'SALE').length.toLocaleString()],
    [copy('Jenis bahan', 'Ingredients'), new Set(movements.map((item) => item.ingredient.name)).size.toLocaleString()],
  ]
  return <section className='metric-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'>{stats.map(([label, value]) => <div key={label} className='space-y-3'><p className='text-muted-foreground text-xs font-semibold'>{label}</p><p className='text-[26px] font-bold tracking-tight tabular-nums'>{value}</p><p className='text-muted-foreground text-xs'>{copy('Dari catatan stok yang tersedia', 'From available stock entries')}</p></div>)}</section>
}
