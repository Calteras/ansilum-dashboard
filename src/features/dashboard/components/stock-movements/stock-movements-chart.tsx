import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useCopy } from '@/hooks/use-copy'

export function StockMovementsChart({ movements }: { movements: { movementDate: string }[] }) {
  const copy = useCopy()
  const counts = new Map<string, number>()
  movements.forEach((item) => {
    const date = parseISO(item.movementDate)
    if (Number.isNaN(date.getTime())) return
    const day = format(date, 'yyyy-MM-dd')
    counts.set(day, (counts.get(day) ?? 0) + 1)
  })
  const data = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: format(parseISO(date), 'dd MMM'), count }))
  return <section className='bg-card flex min-w-0 flex-1 flex-col gap-6 rounded-xl border p-6'>
    <div><h3 className='text-lg font-bold'>{copy('Aktivitas stok', 'Stock activity')}</h3><p className='text-muted-foreground mt-2 text-sm'>{copy('Jumlah catatan per hari', 'Entries per day')}</p></div>
    {data.length === 0 ? <p className='text-muted-foreground flex min-h-64 items-center justify-center text-sm'>{copy('Belum ada catatan stok.', 'No stock entries yet.')}</p> : <div className='h-64'><ResponsiveContainer width='100%' height='100%'><BarChart data={data} margin={{ left: -20 }}><CartesianGrid vertical={false} stroke='var(--border)' /><XAxis dataKey='date' tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} /><Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} /><Bar isAnimationActive={false} dataKey='count' name={copy('Catatan stok', 'Stock entries')} fill='var(--steel)' radius={[6, 6, 0, 0]} maxBarSize={36} /></BarChart></ResponsiveContainer></div>}
    <p className='text-muted-foreground flex items-center gap-2 text-xs'><span className='bg-steel size-3 rounded-sm' />{copy('Catatan stok', 'Stock entries')}</p>
  </section>
}
