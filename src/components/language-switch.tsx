import { useCopy } from '@/hooks/use-copy'
import { Check, Languages } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/language-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitch() {
  const copy = useCopy()
  const { language, setLanguage, supportedLanguages, languageLabels } =
    useLanguage()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Languages className='size-[1.2rem]' />
          <span className='sr-only'>{copy('Pilih bahasa', 'Choose language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)}>
            {languageLabels[lang]}
            <Check
              size={14}
              className={cn('ms-auto', language !== lang && 'hidden')}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
