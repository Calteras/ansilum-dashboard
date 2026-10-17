import { getRouteApi } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { users } from './data/users'

const route = getRouteApi('/_authenticated/staffs/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <UsersProvider>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title='Users'
          description='People who can sign in, with their roles'
          actions={<UsersPrimaryButtons />}
        />
        <UsersTable data={users} search={search} navigate={navigate} />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
