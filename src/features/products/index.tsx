import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useCopy } from '@/hooks/use-copy'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useAssistantPageContext } from '@/features/assistant/hooks/use-assistant-page-context'
import { pageContextFor } from '@/features/assistant/model/page-context'
import { useProductsQuery } from './api/products.queries'
import { ProductsDialogs } from './components/products-dialogs'
import { ProductsPrimaryButtons } from './components/products-primary-buttons'
import { ProductsProvider } from './components/products-provider'
import { ProductsTable } from './components/products-table'

const route = getRouteApi('/_authenticated/products/')

export function Products() {
  const { t } = useTranslation()
  const copy = useCopy()
  useAssistantPageContext(
    pageContextFor({
      title: copy('Produk', 'Products'),
      surface: 'products',
      route: '/products',
    })
  )
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading, isFetching, refetch } = useProductsQuery({
    search: search.search,
    productType: search.productType,
    includeInactive: search.includeInactive,
  })

  return (
    <ProductsProvider>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title={t('products.page.title')}
          description={t('products.page.subtitle')}
          actions={<ProductsPrimaryButtons />}
        />
        <ProductsTable
          data={data?.data ?? []}
          search={search}
          navigate={navigate}
          isLoading={isLoading}
          onRefresh={refetch}
          isFetching={isFetching}
        />
      </Main>
      <ProductsDialogs />
    </ProductsProvider>
  )
}
