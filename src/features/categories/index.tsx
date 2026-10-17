import { getRouteApi } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useCategoriesQuery } from './api/categories.queries'
import { CategoriesDialogs } from './components/categories-dialogs'
import { CategoriesPrimaryButtons } from './components/categories-primary-buttons'
import { CategoriesProvider } from './components/categories-provider'
import { CategoriesTable } from './components/categories-table'

const route = getRouteApi('/_authenticated/categories/')

export function Categories() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading, isFetching, refetch } = useCategoriesQuery({
    page: search.page,
    pageSize: search.pageSize,
    name: search.name,
    status: search.status,
  })

  return (
    <CategoriesProvider>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title='Categories'
          description='Groups that organise products on the menu and in reports'
          actions={<CategoriesPrimaryButtons />}
        />
        <CategoriesTable
          data={data?.data ?? []}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
          onRefresh={refetch}
          isFetching={isFetching}
        />
      </Main>
      <CategoriesDialogs />
    </CategoriesProvider>
  )
}
