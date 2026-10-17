import { useState } from 'react'
import {
  ClipboardList,
  Plug,
  Activity,
  ChartNoAxesCombined,
} from '@/components/icons'
import { useTranslation } from 'react-i18next'
import { tenantGet } from '@/lib/tenant-api-client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import type { Outlet } from '@/features/outlets/api/outlets.types'
import { ChannelSales } from './components/channel-sales'
import { Connections } from './components/connections'
import { Orders } from './components/orders'
import { Recovery } from './components/recovery'
import { Choice, ErrorNotice, Notice } from './components/shared'
import { useDeliveryAccess, useDeliveryQuery } from './delivery.queries'

export function FoodDelivery() {
  const { tenantId, userId, admin, owner } = useDeliveryAccess()
  // Tenant/role changes reset selection and unmount restricted detail panels.
  return <DeliveryWorkspace key={`${tenantId}:${userId}:${admin}:${owner}`} />
}

function DeliveryWorkspace() {
  const { t } = useTranslation()
  const { admin, owner } = useDeliveryAccess()
  const [selectedOutlet, setSelectedOutlet] = useState('')
  const outletsQuery = useDeliveryQuery(
    ['outlets'],
    (signal) => tenantGet<{ data: Outlet[] }>('/outlets', { signal }),
    admin
  )
  const outlets =
    outletsQuery.data?.data.filter((outlet) => outlet.isActive) ?? []
  const outletId = outlets.some((outlet) => outlet.id === selectedOutlet)
    ? selectedOutlet
    : (outlets[0]?.id ?? '')
  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeader
          title={t('nav.foodDelivery')}
          description='GoFood and GrabFood orders, from incoming to picked up'
          actions={
            admin && (
            <div className='w-full sm:w-64'>
              <Choice
                label='Outlet'
                value={outletId}
                onChange={(event) => setSelectedOutlet(event.target.value)}
              >
                <option value='' disabled>
                  Select outlet
                </option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </Choice>
            </div>
            )
          }
        />
        {!admin ? (
          <Notice>
            Delivery access requires an active owner or admin membership in this
            web application.
          </Notice>
        ) : (
          <>
            <ErrorNotice error={outletsQuery.error} />
            {outletsQuery.isPending && <p role='status'>Loading outlets…</p>}
            {!outletsQuery.isPending &&
              !outletsQuery.error &&
              !outlets.length && (
                <Notice>
                  Create an active outlet before linking a delivery provider.
                </Notice>
              )}
            <Tabs defaultValue='orders'>
              <div className='border-divider mb-4 border-b'>
              <TabsList variant='line'>
                <TabsTrigger value='orders'>
                  <ClipboardList className='size-4' aria-hidden='true' />
                  Orders
                </TabsTrigger>
                <TabsTrigger value='connections'>
                  <Plug className='size-4' aria-hidden='true' />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value='recovery'>
                  <Activity className='size-4' aria-hidden='true' />
                  Recovery
                </TabsTrigger>
                {owner && (
                  <TabsTrigger value='reports'>
                    <ChartNoAxesCombined
                      className='size-4'
                      aria-hidden='true'
                    />
                    Channel sales
                  </TabsTrigger>
                )}
              </TabsList>
              </div>
              <TabsContent value='orders'>
                <Orders key={outletId} outletId={outletId} />
              </TabsContent>
              <TabsContent value='connections'>
                <Connections outletId={outletId} outlets={outlets} />
              </TabsContent>
              <TabsContent value='recovery'>
                <Recovery />
              </TabsContent>
              {owner && (
                <TabsContent value='reports'>
                  <ChannelSales key={outletId} outletId={outletId} />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </Main>
    </>
  )
}
