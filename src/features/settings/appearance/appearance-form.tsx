import { useTheme } from '@/context/theme-provider'
import { useCopy } from '@/hooks/use-copy'
import { Monitor, Moon, Sun } from '@/components/icons'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function AppearanceForm() {
  const { theme, setTheme } = useTheme()
  const copy = useCopy()
  const options = [{ value: 'light', icon: Sun, label: copy('Terang', 'Light') }, { value: 'dark', icon: Moon, label: copy('Gelap', 'Dark') }, { value: 'system', icon: Monitor, label: copy('Ikuti perangkat', 'System') }] as const
  return <div className='space-y-8'>
    <fieldset className='space-y-4'><legend className='text-sm font-semibold'>{copy('Tema', 'Theme')}</legend><p className='text-muted-foreground text-sm'>{copy('Pilih tampilan yang nyaman untuk Anda. Perubahan langsung tersimpan.', 'Choose a comfortable appearance. Changes save automatically.')}</p>
      <RadioGroup value={theme} onValueChange={(value) => setTheme(value as typeof theme)} className='grid gap-3 sm:grid-cols-3'>
        {options.map(({ value, icon: Icon, label }) => <Label key={value} htmlFor={`theme-${value}`} className={`flex min-h-28 cursor-pointer flex-col items-start justify-between gap-4 rounded-lg border p-4 ${theme === value ? 'border-foreground bg-muted' : 'bg-card'}`}><Icon className='size-6' /><span className='flex w-full items-center justify-between gap-3'>{label}<RadioGroupItem value={value} id={`theme-${value}`} /></span></Label>)}
      </RadioGroup>
    </fieldset>
    <div className='space-y-3 border-t pt-6'><p className='text-sm font-semibold'>{copy('Tipografi', 'Typography')}</p><p className='text-2xl font-semibold tracking-tight'>Plus Jakarta Sans</p><p className='text-muted-foreground text-sm'>{copy('Satu jenis huruf untuk tampilan Ansilum yang konsisten dan mudah dibaca.', 'One typeface keeps Ansilum consistent and easy to read.')}</p><p className='text-xl tabular-nums'>Rp12.000.000</p></div>
  </div>
}
