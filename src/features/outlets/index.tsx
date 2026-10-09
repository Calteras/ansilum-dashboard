import { getRouteApi } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useOutletsQuery } from './api/outlets.queries'
import { OutletsDialogs } from './components/outlets-dialogs'
import { OutletsPrimaryButtons } from './components/outlets-primary-buttons'
import { OutletsProvider } from './components/outlets-provider'
import { OutletsTable } from './components/outlets-table'

const route = getRouteApi('/_authenticated/outlets/')

export function Outlets() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading, isFetching, refetch } = useOutletsQuery({
    page: search.page,
    pageSize: search.pageSize,
    search: search.name,
    status: search.status,
  })

  return (
    <OutletsProvider>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title='Outlets'
          description='Manage your store outlets and locations here.'
          actions={<OutletsPrimaryButtons />}
        />
        <OutletsTable
          data={data?.data ?? []}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
          onRefresh={refetch}
          isFetching={isFetching}
        />
      </Main>

      <OutletsDialogs />
    </OutletsProvider>
  )
}
