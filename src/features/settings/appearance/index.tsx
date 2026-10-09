import { useCopy } from '@/hooks/use-copy'
import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  const copy = useCopy()
  return (
    <ContentSection
      title={copy('Tampilan', 'Appearance')}
      desc={copy('Atur tampilan Ansilum agar nyaman digunakan.', 'Make Ansilum comfortable to use.')}
    >
      <AppearanceForm />
    </ContentSection>
  )
}
