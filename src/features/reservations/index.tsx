import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useDashboardOutletsQuery } from '@/features/dashboard/api/dashboard.queries'
import { useReservationsQuery } from './api/reservations.queries'
import { ReservationsDialogs } from './components/reservations-dialogs'
import { ReservationsList } from './components/reservations-list'
import { ReservationsMakeForm } from './components/reservations-make-form'
import { ReservationsProvider } from './components/reservations-provider'

export function Reservations() {
  // No search needed here for now

  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = outletsData?.data ?? []

  const [selectedOutletId, setSelectedOutletId] = useState<string>('')

  useEffect(() => {
    if (outlets.length > 0 && !selectedOutletId) {
      setSelectedOutletId(outlets[0].id)
    }
  }, [outlets, selectedOutletId])

  const { data, isLoading } = useReservationsQuery({
    outletId: selectedOutletId,
  })

  return (
    <ReservationsProvider>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title='Reservations'
          description='Table bookings and pre-orders by outlet'
          actions={
            outlets.length > 0 ? (
              <Select
                value={selectedOutletId}
                onValueChange={setSelectedOutletId}
              >
                <SelectTrigger className='h-9 w-[200px] text-sm'>
                  <SelectValue placeholder='Select outlet' />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : undefined
          }
        />

        <Tabs defaultValue='make' className='flex-1'>
          <div className='border-divider border-b'>
            <TabsList variant='line'>
              <TabsTrigger value='make'>New reservation</TabsTrigger>
              <TabsTrigger value='list'>Reservations</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='make' className='mt-4'>
            <ReservationsMakeForm outletId={selectedOutletId} />
          </TabsContent>

          <TabsContent value='list' className='mt-4'>
            <ReservationsList
              reservations={data?.data ?? []}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </Main>

      <ReservationsDialogs />
    </ReservationsProvider>
  )
}
