import { useCopy } from '@/hooks/use-copy'
import { ContentSection } from '../components/content-section'
import { TenantLogo } from './tenant-logo'

export function SettingsBusiness() {
  const copy = useCopy()
  return (
    <ContentSection
      title={copy('Usaha', 'Business')}
      desc={copy(
        'Atur identitas usaha yang sedang aktif.',
        'Manage the identity of your active business.'
      )}
    >
      <TenantLogo />
    </ContentSection>
  )
}
