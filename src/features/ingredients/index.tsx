import { getRouteApi } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Beaker, LayoutDashboard, Store } from '@/components/icons'
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
          description='Monitor stock health across all outlets and manage the master ingredient catalogue.'
        />

        <Tabs defaultValue='dashboard' className='flex flex-1 flex-col gap-4'>
          <div className='flex items-center justify-between gap-4'>
            <TabsList className='h-9'>
              <TabsTrigger value='dashboard' className='gap-1.5 text-sm'>
                <LayoutDashboard className='h-3.5 w-3.5' />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value='master' className='gap-1.5 text-sm'>
                <Beaker className='h-3.5 w-3.5' />
                Master Ingredients
              </TabsTrigger>
              <TabsTrigger value='outlet-stock' className='gap-1.5 text-sm'>
                <Store className='h-3.5 w-3.5' />
                Outlet Stock
              </TabsTrigger>
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
