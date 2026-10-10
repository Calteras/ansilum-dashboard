import { Link } from '@tanstack/react-router'
import { Logo } from '@/assets/logo'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import { Receipt, ChartBar, MessageCircle } from '@/components/icons'
import { LanguageSwitch } from '@/components/language-switch'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const copy = useCopy()
  const steps = [
    {
      icon: Receipt,
      title: copy('Catat penjualan.', 'Record your sales.'),
      body: copy(
        'Mulai dari kegiatan usaha Anda sehari-hari.',
        'Start with the work you already do every day.'
      ),
    },
    {
      icon: ChartBar,
      title: copy('Pahami angkanya.', 'Understand the numbers.'),
      body: copy(
        'Lihat penjualan, stok, dan laporan di satu tempat.',
        'See sales, stock, and reports in one place.'
      ),
    },
    {
      icon: MessageCircle,
      title: copy('Tanya Ansilum.', 'Ask Ansilum.'),
      body: copy(
        'Tanya soal usaha Anda dengan bahasa sehari-hari.',
        'Ask about your business in your own words.'
      ),
    },
  ]
  return (
    <div className='grid min-h-svh lg:grid-cols-[1fr_0.9fr]'>
      <div className='flex min-w-0 flex-col px-5 py-6 sm:px-10 lg:px-16'>
        <header className='flex items-center justify-between'>
          <Link to='/sign-in' className='flex min-h-12 items-center gap-3'>
            <Logo />
            <span className='text-xl font-bold tracking-tight'>ansilum</span>
          </Link>
          <LanguageSwitch />
        </header>
        <main
          id='main'
          className='mx-auto flex w-full max-w-md min-w-0 flex-1 flex-col justify-center py-12'
        >
          {children}
        </main>
        <footer className='text-muted-foreground text-xs'>
          © {new Date().getFullYear()} Ansilum
        </footer>
      </div>
      <aside className='bg-night relative hidden flex-col justify-center overflow-hidden p-12 text-white lg:flex xl:p-20'>
        <div className='bg-brand mb-12 h-1 w-12 rounded-sm' />
        <h2 className='max-w-lg text-[40px] leading-[1.15] font-bold tracking-[-0.04em]'>
          {copy('Usaha jalan.', 'Business keeps moving.')}
          <br />
          <span className='text-white/70'>
            {copy('Angka jadi jelas.', 'The numbers make sense.')}
          </span>
        </h2>
        <p className='mt-6 max-w-md text-base leading-relaxed text-white/75'>
          {copy(
            'Untuk warung, toko, laundry, salon, dan usaha yang Anda bangun setiap hari.',
            'For the shop, laundry, salon, and everyday business you are building.'
          )}
        </p>
        <ol className='mt-12 divide-y divide-white/15'>
          {steps.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className='flex gap-4 py-6'>
              <span className='text-sun pt-0.5 text-xs font-bold tabular-nums'>
                0{index + 1}
              </span>
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h3 className='text-base font-bold'>{title}</h3>
                  {index === 2 && (
                    <Badge className='bg-sun text-ink border-0'>
                      {copy('Segera hadir', 'Coming soon')}
                    </Badge>
                  )}
                </div>
                <p className='mt-2 text-sm leading-relaxed text-white/75'>
                  {body}
                </p>
              </div>
              <Icon
                aria-hidden='true'
                className='size-6 shrink-0 text-white/70'
              />
            </li>
          ))}
        </ol>
      </aside>
    </div>
  )
}
