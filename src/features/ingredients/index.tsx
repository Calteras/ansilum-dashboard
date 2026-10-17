import { getRouteApi } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useIngredientsQuery } from './api/ingredients.queries'
import { IngredientsDashboard } from './components/ingredients-dashboard'
import { IngredientsDialogs } from './components/ingredients-dialogs'
import { IngredientsPrimaryButtons } from './components/ingredients-primary-buttons'
import { IngredientsProvider } from './components/ingredients-provider'
import { IngredientsTable } from './components/ingredients-table'
import { OutletInventoryTab } from './components/outlet-inventory-tab'

const route = getRouteApi('/_authenticated/ingredients/')

export function Ingredients() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading, isFetching, refetch } = useIngredientsQuery({
    page: search.page,
    pageSize: search.pageSize,
    name: search.name,
    status: search.status,
  })

  const totalIngredients = data?.meta.totalData ?? 0

  return (
    <IngredientsProvider>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title='Ingredients'
          description='Stock levels across outlets and the master ingredient list'
        />

        <Tabs
          // A name filter (e.g. from global search) opens the master list.
          key={search.name ? 'filtered' : 'default'}
          defaultValue={search.name ? 'master' : 'dashboard'}
          className='flex flex-1 flex-col gap-4'
        >
          <div className='border-divider flex items-center justify-between gap-4 border-b'>
            <TabsList variant='line' aria-label='Ingredient views'>
              <TabsTrigger value='dashboard'>Overview</TabsTrigger>
              <TabsTrigger value='master'>Master list</TabsTrigger>
              <TabsTrigger value='outlet-stock'>Outlet stock</TabsTrigger>
            </TabsList>

            {/* Add button only shown on master tab */}
            <TabsContent value='master' className='m-0 p-0'>
              <IngredientsPrimaryButtons />
            </TabsContent>
          </div>

          <TabsContent value='dashboard' className='mt-0 flex-1'>
            <IngredientsDashboard totalIngredients={totalIngredients} />
          </TabsContent>

          <TabsContent value='master' className='mt-0 flex-1'>
            <IngredientsTable
              data={data?.data ?? []}
              search={search}
              navigate={navigate}
              isLoading={isLoading}
              onRefresh={refetch}
              isFetching={isFetching}
            />
          </TabsContent>

          <TabsContent value='outlet-stock' className='mt-0 flex-1'>
            <OutletInventoryTab />
          </TabsContent>
        </Tabs>
      </Main>

      <IngredientsDialogs />
    </IngredientsProvider>
  )
}
