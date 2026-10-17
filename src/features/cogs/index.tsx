import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { OverheadManager } from './components/overhead-manager'
import { PeriodCogsReport } from './components/period-cogs-report'
import { ProductCostCard } from './components/product-cost-card'

export function Cogs() {
  const { t } = useTranslation()

  return (
    <>
      <AppHeader />

      <Main className='w-full flex-1 overscroll-none p-3 sm:p-4 md:p-6'>
        <PageHeader
          title={t('cogs.page.title')}
          description={t('cogs.page.subtitle')}
        />

        <Tabs defaultValue='period' className='gap-4'>
          <div className='border-divider border-b'>
          <TabsList variant='line'>
            <TabsTrigger value='period'>
              {t('cogs.tabs.period')}
            </TabsTrigger>
            <TabsTrigger value='product'>
              {t('cogs.tabs.product')}
            </TabsTrigger>
            <TabsTrigger value='overhead'>
              {t('cogs.tabs.overhead')}
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value='period' className='mt-0'>
            <PeriodCogsReport />
          </TabsContent>

          <TabsContent value='product' className='mt-0'>
            <ProductCostCard />
          </TabsContent>

          <TabsContent value='overhead' className='mt-0'>
            <OverheadManager />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
