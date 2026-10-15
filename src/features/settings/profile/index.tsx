import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'
import { ProfilePhoto } from './profile-photo'

export function SettingsProfile() {
  return (
    <ContentSection
      title='Profile'
      desc='This is how others will see you on the site.'
    >
      <div className='space-y-8'>
        <ProfilePhoto />
        <ProfileForm />
      </div>
    </ContentSection>
  )
}
