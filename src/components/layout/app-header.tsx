import { LanguageSwitch } from '@/components/language-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AssistantLauncher } from '@/features/assistant/shell/assistant-launcher'
import { NotificationBell } from '@/features/notifications/notification-bell'
import { Header } from './header'

export function AppHeader() {
  return (
    <Header fixed className='bg-background border-b'>
      <Search />
      <div className='ms-auto flex shrink-0 items-center gap-1'>
        <AssistantLauncher />
        <NotificationBell />
        <LanguageSwitch />
        <ThemeSwitch />
        <ProfileDropdown />
      </div>
    </Header>
  )
}
