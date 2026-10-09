import { LanguageSwitch } from '@/components/language-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Header } from './header'

export function AppHeader() {
  return (
    <Header
      fixed
      className='border-border/70 bg-background/85 border-b backdrop-blur-xl'
    >
      <Search />
      <div className='ms-auto flex shrink-0 items-center gap-1 sm:gap-2'>
        <LanguageSwitch />
        <ThemeSwitch />
        <ProfileDropdown />
      </div>
    </Header>
  )
}
