import { useState } from 'react'
import { Logo } from '@/assets/logo'
import { formatMoney, formatMoneyChange } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { ArrowRight, Send } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'

const examples = [
  {
    question: ['Bagaimana penjualan minggu ini?', 'How were sales this week?'],
    answer: ['Penjualan 28 Sep–4 Okt 2026 sebesar Rp10.800.000, turun 10% dari Rp12.000.000 pada 21–27 Sep.', 'Sales for 28 Sep–4 Oct 2026 were Rp10,800,000, down 10% from Rp12,000,000 on 21–27 Sep.'],
    takeaway: ['Ada selisih Rp1.200.000 yang perlu Anda telusuri.', 'There is a Rp1,200,000 difference to look into.'],
    checks: [['Bandingkan jumlah pesanan per hari.', 'Compare the number of orders each day.'], ['Cek produk yang penjualannya turun.', 'Check which products sold less.']],
    rows: [{ name: ['Penjualan', 'Sales'], previous: 12_000_000, current: 10_800_000 }],
  },
  {
    question: ['Produk apa yang paling laku?', 'Which product sells best?'],
    answer: ['Penjualan Es kopi susu Rp3.600.000 pada 28 Sep–4 Okt 2026. Pisang goreng menyumbang Rp2.400.000 pada periode yang sama.', 'Es kopi susu sales were Rp3,600,000 on 28 Sep–4 Oct 2026. Pisang goreng contributed Rp2,400,000 in the same period.'],
    takeaway: ['Es kopi susu menghasilkan penjualan tertinggi dari dua produk ini.', 'Es kopi susu generated the most sales of these two products.'],
    checks: [['Cek persediaan bahan Es kopi susu.', 'Check ingredients for Es kopi susu.'], ['Bandingkan laba kedua produk.', 'Compare the profit on both products.']],
    rows: [{ name: ['Es kopi susu', 'Es kopi susu'], previous: 4_200_000, current: 3_600_000 }, { name: ['Pisang goreng', 'Pisang goreng'], previous: 2_100_000, current: 2_400_000 }],
  },
  {
    question: ['Hari apa penjualannya turun?', 'Which day had lower sales?'],
    answer: ['Penjualan Selasa 29 Sep 2026 Rp800.000, turun Rp400.000 dari Rp1.200.000 pada Selasa 22 Sep. Penjualan Sabtu naik Rp300.000.', 'Sales on Tuesday 29 Sep 2026 were Rp800,000, down Rp400,000 from Rp1,200,000 on Tuesday 22 Sep. Saturday sales rose Rp300,000.'],
    takeaway: ['Mulai dengan mengecek pesanan dan jam buka hari Selasa.', 'Start by checking Tuesday’s orders and opening hours.'],
    checks: [['Cek apakah jam buka Selasa berubah.', 'Check whether Tuesday’s opening hours changed.'], ['Bandingkan jumlah pesanan Selasa.', 'Compare the number of Tuesday orders.']],
    rows: [{ name: ['Selasa', 'Tuesday'], previous: 1_200_000, current: 800_000 }, { name: ['Sabtu', 'Saturday'], previous: 2_000_000, current: 2_300_000 }],
  },
] as const

export function Chats() {
  const copy = useCopy()
  const [selected, setSelected] = useState(0)
  const [view, setView] = useState<'chart' | 'numbers'>('chart')
  const [focused, setFocused] = useState<string | null>(null)
  const [checked, setChecked] = useState<number[]>([])
  const example = examples[selected]
  const maximum = Math.max(...example.rows.flatMap((row) => [row.previous, row.current]))

  return (
    <>
      <AppHeader />
      <Main className='space-y-8'>
        <PageHeader title={copy('Tanya Ansilum', 'Ask Ansilum')} description={copy('Tanyakan penjualan dan stok dengan bahasa sehari-hari', 'Ask about your sales and stock in plain language')} actions={<Badge variant='upcoming'>{copy('Segera hadir', 'Coming soon')}</Badge>} />
        <section aria-labelledby='example-title' className='space-y-4'>
          <h2 id='example-title' className='text-sm font-semibold'>{copy('Contoh percakapan', 'Example conversation')}</h2>
          <div className='flex flex-wrap gap-2'>
            {examples.map((item, index) => <Button key={index} variant={selected === index ? 'default' : 'outline'} aria-pressed={selected === index} onClick={() => { setSelected(index); setFocused(null); setChecked([]) }} className='h-auto whitespace-normal text-start text-sm'>{copy(item.question[0], item.question[1])}<ArrowRight className='size-4 shrink-0' /></Button>)}
          </div>
          <div className='overflow-hidden rounded-lg border'>
            <header className='flex items-center gap-3 border-b px-5 py-4 sm:px-6'>
              <Logo />
              <div><p className='text-sm font-semibold'>{copy('Usaha contoh', 'Example business')}</p><p className='text-muted-foreground mt-1 text-xs'>{copy('28 Sep–4 Okt 2026', '28 Sep–4 Oct 2026')}</p></div>
            </header>
            <div className='grid xl:grid-cols-[1.1fr_1fr]'>
              <div className='flex flex-col gap-8 p-5 sm:p-6'>
                <div className='ms-auto max-w-[88%] space-y-2'><p className='text-muted-foreground text-right text-xs font-semibold'>{copy('Anda', 'You')}</p><p className='rounded-2xl rounded-tr-sm bg-ink px-5 py-4 text-[15px] leading-relaxed text-white'>{copy(example.question[0], example.question[1])}</p></div>
                <div className='flex min-h-80 items-start gap-3' aria-live='polite' aria-atomic='true'>
                  <span aria-hidden='true' className='bg-brand-soft text-brand-ink flex size-7 shrink-0 items-center justify-center rounded-full text-lg font-semibold'>a</span>
                  <div className='min-w-0 flex-1 space-y-4'>
                    <p className='text-sm font-semibold'>Ansilum</p>
                    <p className='text-[15px] leading-7'>{copy(example.answer[0], example.answer[1])}</p>
                    <p className='text-muted-foreground text-[15px] leading-7'>{copy(example.takeaway[0], example.takeaway[1])}</p>
                    <div className='flex flex-wrap gap-3'>{example.rows.map((row) => <button key={row.name[0]} type='button' aria-pressed={focused === row.name[0]} onClick={() => setFocused(focused === row.name[0] ? null : row.name[0])} className='min-h-11 border-b-2 border-brand/50 text-sm font-semibold'>{copy(row.name[0], row.name[1])} {formatMoney(row.current)}</button>)}</div>
                    <div className='space-y-2 pt-2'><h3 className='text-sm font-semibold'>{copy('Yang perlu dicek', 'What to check')}</h3>{example.checks.map((check, index) => <Label key={`${selected}-${index}`} className={`flex min-h-11 cursor-pointer items-start gap-3 py-3 text-sm leading-relaxed ${checked.includes(index) ? 'text-leaf line-through' : ''}`}><Checkbox checked={checked.includes(index)} onCheckedChange={(value) => setChecked((previous) => value ? [...previous, index] : previous.filter((item) => item !== index))} /><span>{copy(check[0], check[1])}</span></Label>)}</div>
                  </div>
                </div>
              </div>
              <section className='bg-muted/50 min-w-0 border-t p-5 sm:p-6 xl:border-t-0 xl:border-l'>
                <div className='flex flex-wrap items-start justify-between gap-4'><div><h3 className='text-base font-semibold'>{copy('Penjualan mingguan', 'Weekly sales')}</h3><p className='text-muted-foreground mt-2 text-xs'>{copy('Dibanding 21–27 Sep 2026', 'Compared with 21–27 Sep 2026')}</p></div><div className='border-divider bg-surface-subtle inline-flex rounded-md border p-0.5' role='group' aria-label={copy('Tampilan data', 'Data view')}>{(['chart', 'numbers'] as const).map((mode) => <button key={mode} type='button' aria-pressed={view === mode} onClick={() => setView(mode)} className={`h-8 rounded-[5px] px-3 text-[13px] font-medium ${view === mode ? 'bg-card text-foreground ring-divider-strong ring-1' : 'text-fg-muted hover:text-foreground'}`}>{mode === 'chart' ? copy('Grafik', 'Chart') : copy('Angka', 'Numbers')}</button>)}</div></div>
                {view === 'chart' ? <div className='mt-8 space-y-8'>{example.rows.map((row) => <div key={row.name[0]} className='space-y-3 transition-opacity' style={{ opacity: focused && focused !== row.name[0] ? 0.25 : 1 }}><p className='text-sm font-semibold'>{copy(row.name[0], row.name[1])}</p><div className='space-y-2'>{[row.previous, row.current].map((amount, index) => <div key={index} className='flex items-center gap-3'><div className='min-w-0 flex-1'><div role='img' aria-label={`${copy(row.name[0], row.name[1])}, ${index === 0 ? copy('minggu lalu', 'last week') : copy('minggu ini', 'this week')}: ${formatMoney(amount)}`} className={`h-9 rounded-md ${index === 0 ? 'bg-steel/40' : focused && focused !== row.name[0] ? 'bg-steel' : 'bg-brand'}`} style={{ width: `${amount / maximum * 100}%` }} /></div><span className='w-28 text-right text-xs font-semibold tabular-nums'>{formatMoney(amount)}</span></div>)}</div></div>)}<div className='flex flex-wrap gap-4 text-xs text-muted-foreground'><span className='flex items-center gap-2'><span className='size-3 rounded-sm bg-steel/40' />{copy('Minggu lalu', 'Last week')}</span><span className='flex items-center gap-2'><span className='size-3 rounded-sm bg-brand' />{copy('Minggu ini', 'This week')}</span></div></div> : <div className='mt-8 overflow-x-auto'><table className='w-full text-left text-xs tabular-nums'><thead><tr className='border-b text-muted-foreground'><th className='py-3 pr-4'>{copy('Penjualan', 'Sales')}</th><th className='px-2 py-3'>{copy('Minggu lalu', 'Last week')}</th><th className='px-2 py-3'>{copy('Minggu ini', 'This week')}</th><th className='px-2 py-3'>{copy('Selisih', 'Change')}</th></tr></thead><tbody>{example.rows.map((row) => <tr key={row.name[0]} className='border-b'><th className='py-4 pr-4 font-medium'>{copy(row.name[0], row.name[1])}</th><td className='whitespace-nowrap px-2'>{formatMoney(row.previous)}</td><td className='whitespace-nowrap px-2 font-semibold'>{formatMoney(row.current)}</td><td className={`whitespace-nowrap px-2 ${row.current < row.previous ? 'text-brand-ink' : 'text-leaf'}`}>{formatMoneyChange(row.current - row.previous)}</td></tr>)}</tbody></table></div>}
              </section>
            </div>
            <div className='flex gap-3 border-t p-5 sm:p-6'><Input disabled aria-label={copy('Tanya soal penjualan Anda', 'Ask about your sales')} placeholder={copy('Tanya soal penjualan Anda…', 'Ask about your sales…')} /><Button disabled size='icon' aria-label={copy('Kirim pertanyaan', 'Send question')}><Send className='size-5' /></Button></div>
          </div>
        </section>
      </Main>
    </>
  )
}
