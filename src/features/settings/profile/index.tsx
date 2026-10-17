import { useCopy } from '@/hooks/use-copy'
import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'
import { ProfilePhoto } from './profile-photo'

export function SettingsProfile() {
  const copy = useCopy()
  return (
    <ContentSection
      title={copy('Profil', 'Profile')}
      desc={copy(
        'Kelola nama, foto, dan detail akun Anda.',
        'Manage your name, photo, and account details.'
      )}
    >
      <div className='space-y-8'>
        <ProfilePhoto />
        <ProfileForm />
      </div>
    </ContentSection>
  )
}
