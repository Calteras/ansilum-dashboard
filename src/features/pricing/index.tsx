import { Link } from '@tanstack/react-router'
import { Logo } from '@/assets/logo'
import { PRICING, PLAN_FEATURES } from '@/content/pricing'
import { useAuthStore } from '@/stores/auth-store'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { ArrowRight, Check, MessageCircle } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LanguageSwitch } from '@/components/language-switch'

export default function Pricing() {
  const copy = useCopy()
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const destination = authenticated ? '/settings/subscription' : '/sign-up'
  return (
    <div className='min-h-svh bg-background'>
      <header className='mx-auto flex max-w-6xl items-center justify-between border-b px-6 py-5'>
        <Link to={authenticated ? '/' : '/sign-in'} className='flex min-h-12 items-center gap-3'><Logo /><span className='text-xl font-semibold tracking-tight'>ansilum</span></Link>
        <div className='flex items-center gap-3'><LanguageSwitch /><Button variant='outline' asChild><Link to={authenticated ? '/' : '/sign-in'}>{copy(authenticated ? 'Buka usaha Anda' : 'Masuk', authenticated ? 'Open your business' : 'Sign in')}</Link></Button></div>
      </header>
      <main id='main' className='mx-auto max-w-6xl px-6 py-16 sm:py-20'>
        <div className='mb-12 max-w-2xl space-y-5'>
          <p className='text-brand-ink text-sm font-semibold'>{copy('Paket Ansilum', 'Ansilum plans')}</p>
          <h1 className='text-4xl leading-[1.1] font-semibold tracking-[-0.035em] sm:text-[52px]'>{copy('Sesuai kebutuhan usaha.', 'A plan for your business.')}<br /><span className='text-muted-foreground'>{copy('Jelas dari awal.', 'Clear from the start.')}</span></h1>
          <p className='text-muted-foreground text-lg leading-relaxed'>{copy('Mulai dari mencatat penjualan hingga mengelola banyak gerai. Pilih yang Anda butuhkan, bayar bulanan.', 'From recording sales to managing multiple outlets. Choose what you need, billed monthly.')}</p>
        </div>
        <div className='grid overflow-hidden rounded-lg border md:grid-cols-3'>
          {PRICING.map((plan) => (
            <section key={plan.tier} className={`flex flex-col gap-6 border-b p-6 last:border-0 md:border-r md:border-b-0 sm:p-8 ${plan.tier === 'STANDARD' ? 'bg-muted/50' : ''}`}>
              <div className='flex min-h-6 items-center justify-between gap-2'><h2 className='text-xl font-semibold'>{plan.name}</h2>{plan.tier === 'STANDARD' && <Badge variant='upcoming'>{copy('Rekomendasi', 'Recommended')}</Badge>}</div>
              <p className='text-muted-foreground min-h-12 text-sm'>{copy(plan.description[0], plan.description[1])}</p>
              <div><p className='text-[32px] font-semibold tracking-[-0.04em] tabular-nums'>{formatMoney(plan.monthly)}</p><p className='text-muted-foreground mt-1 text-sm'>{copy('per bulan', 'per month')}</p></div>
              <Button variant={plan.tier === 'STANDARD' ? 'default' : 'outline'} asChild><Link to={destination}>{copy('Pilih', 'Choose')} {plan.name}<ArrowRight className='ms-auto size-5' /></Link></Button>
              <p className='border-t pt-6 text-sm font-semibold'>{plan.outlets === -1 ? copy('Gerai tanpa batas', 'Unlimited outlets') : `${plan.outlets} ${copy('gerai', plan.outlets === 1 ? 'outlet' : 'outlets')}`}</p>
              <ul className='space-y-3'>{plan.features.map((feature) => <li key={feature} className='flex items-start gap-3 text-sm leading-relaxed'><Check className='text-leaf mt-0.5 size-5 shrink-0' /><span>{copy(...PLAN_FEATURES[feature])}</span></li>)}</ul>
            </section>
          ))}
        </div>
        <section className='bg-night mt-8 flex flex-wrap items-start justify-between gap-6 rounded-lg p-8 text-white sm:p-10'>
          <div className='max-w-xl space-y-4'><div className='flex items-center gap-3'><MessageCircle className='text-sun size-6' /><h2 className='text-xl font-semibold'>Tanya Ansilum</h2><Badge className='border-0 bg-sun text-ink'>{copy('Segera hadir', 'Coming soon')}</Badge></div><p className='text-sm leading-relaxed text-white/75'>{copy('Tanya soal penjualan Anda dengan bahasa sehari-hari. Harga kredit akan diumumkan saat peluncuran.', 'Ask about your sales in everyday language. Credit prices will be announced at launch.')}</p></div>
          <p className='text-base font-semibold text-sun'>{copy('Bayar sesuai pemakaian', 'Pay as you go')}</p>
        </section>
      </main>
      <footer className='border-t px-6 py-8 text-center text-sm text-muted-foreground'>© {new Date().getFullYear()} Ansilum</footer>
    </div>
  )
}
