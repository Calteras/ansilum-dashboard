import { getRouteApi } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useModifierGroupsQuery } from './api/modifier-groups.queries'
import { ModifierGroupsDialogs } from './components/modifier-groups-dialogs'
import { ModifierGroupsPrimaryButtons } from './components/modifier-groups-primary-buttons'
import { ModifierGroupsProvider } from './components/modifier-groups-provider'
import { ModifierGroupsTable } from './components/modifier-groups-table'

const route = getRouteApi('/_authenticated/modifier-groups/')

export function ModifierGroups() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading, isFetching, refetch } = useModifierGroupsQuery({
    page: search.page,
    pageSize: search.pageSize,
    name: search.name,
    status: search.status,
  })

  return (
    <ModifierGroupsProvider>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title='Modifier groups'
          description='Option sets attached to products, such as size or sugar level'
          actions={<ModifierGroupsPrimaryButtons />}
        />
        <ModifierGroupsTable
          data={data?.data ?? []}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
          onRefresh={refetch}
          isFetching={isFetching}
        />
      </Main>
      <ModifierGroupsDialogs />
    </ModifierGroupsProvider>
  )
}
