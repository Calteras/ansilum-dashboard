import { getRouteApi } from '@tanstack/react-router'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useEmployeesQuery } from './api/employees.queries'
import { EmployeesDialogs } from './components/employees-dialogs'
import { EmployeesPrimaryButtons } from './components/employees-primary-buttons'
import { EmployeesProvider } from './components/employees-provider'
import { EmployeesTable } from './components/employees-table'

const route = getRouteApi('/_authenticated/employees/')

export function Employees() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading, isFetching, refetch } = useEmployeesQuery({
    page: search.page,
    pageSize: search.pageSize,
    search: search.name,
    role: search.role,
    status: search.status,
  })

  return (
    <EmployeesProvider>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title='Employees'
          description='Staff accounts, roles and outlet access'
          actions={<EmployeesPrimaryButtons />}
        />
        <EmployeesTable
          data={data?.data ?? []}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
          onRefresh={refetch}
          isFetching={isFetching}
        />
      </Main>

      <EmployeesDialogs />
    </EmployeesProvider>
  )
}
