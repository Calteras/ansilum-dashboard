import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCopy } from '@/hooks/use-copy'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState, ErrorState } from '@/components/data-display/data-states'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { useAuth, useHasAnyRole } from '@/features/auth/hooks/use-auth'
import { ConnectCard } from './components/connect-card'
import { ConnectionStatus } from './components/connection-status'
import {
  CredentialsDialog,
  type Credentials,
} from './components/credentials-dialog'
import { FeesCard } from './components/fees-card'
import { HoursDialog } from './components/hours-dialog'
import { OutletCard } from './components/outlet-card'
import { SetupSteps } from './components/setup-steps'
import {
  connectionState,
  defaultPosAddress,
  normalizePlatformUrl,
} from './street-food.logic'
import {
  useConnectMutation,
  useDisconnectMutation,
  useFeesQuery,
  useHoursMutation,
  useOverviewQuery,
  usePublicationMutation,
  useReconnectMutation,
  useRotateSecretMutation,
  useSettingsMutation,
} from './street-food.queries'

/**
 * StreetFood: connect the business to the customer platform, choose which outlets customers
 * see, and keep their status and hours. The owner's side of ansilum-be `/integrations/streetfood`.
 */
export function StreetFood() {
  const { activeTenant, user } = useAuth()
  const admin = useHasAnyRole(['OWNER', 'ADMIN'])
  // A different business or role starts from a clean screen: no drafts, no open dialogs.
  return (
    <Workspace key={`${activeTenant?.id}:${user?.id}:${admin}`} admin={admin} />
  )
}

function Workspace({ admin }: { admin: boolean }) {
  const { t } = useTranslation()
  const copy = useCopy()
  const { activeTenant } = useAuth()
  const tenantId = activeTenant?.id
  const businessName = activeTenant?.name ?? ''

  const overview = useOverviewQuery(tenantId, admin)
  const data = overview.data
  const state = data ? connectionState(data) : 'not_connected'
  const showFees = state === 'connected' || state === 'delayed'
  const fees = useFeesQuery(tenantId, showFees)

  const failed = copy('Belum berhasil', 'That did not work')
  const connect = useConnectMutation(tenantId, { failed })
  const rotate = useRotateSecretMutation(tenantId, { failed })
  const reconnect = useReconnectMutation(tenantId, {
    failed,
    saved: copy(
      'Kunci didaftarkan ke platform',
      'The key was registered with the platform'
    ),
  })
  const disconnect = useDisconnectMutation(tenantId, {
    failed,
    saved: copy('Koneksi diputus', 'Disconnected'),
  })
  const publication = usePublicationMutation(tenantId, { failed })
  const settings = useSettingsMutation(tenantId, {
    failed,
    saved: copy('Tersimpan', 'Saved'),
  })
  const hours = useHoursMutation(tenantId, {
    failed,
    saved: copy('Jam buka tersimpan', 'Opening hours saved'),
  })

  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [rotated, setRotated] = useState(false)
  const [confirm, setConfirm] = useState<'rotate' | 'disconnect' | null>(null)
  const [hoursFor, setHoursFor] = useState<string | null>(null)

  const hoursOutlet = data?.outlets.find((o) => o.outletId === hoursFor)
  const posAddress = defaultPosAddress(
    import.meta.env.VITE_API_URL,
    window.location.origin
  )
  const busyOutlet = (outletId: string) =>
    (publication.isPending && publication.variables?.outletId === outletId) ||
    (settings.isPending && settings.variables?.outletId === outletId)

  const content = !admin ? (
    <Alert>
      <AlertDescription>
        {copy(
          'Hanya pemilik dan admin yang dapat mengatur StreetFood.',
          'Only owners and admins can manage StreetFood.'
        )}
      </AlertDescription>
    </Alert>
  ) : overview.isPending ? (
    <div
      className='space-y-3'
      role='status'
      aria-label={copy('Memuat', 'Loading')}
    >
      <Skeleton className='h-20 w-full' />
      <Skeleton className='h-40 w-full' />
    </div>
  ) : overview.isError ? (
    // The POS answers "Not found." for every StreetFood call when the feature is off.
    overview.error.message === 'Not found.' ? (
      <EmptyState
        title={copy(
          'StreetFood belum aktif di POS ini',
          'StreetFood is not switched on for this POS'
        )}
        description={copy(
          'Minta administrator sistem mengaktifkannya (STREETFOOD_ENABLED).',
          'Ask your system administrator to switch it on (STREETFOOD_ENABLED).'
        )}
      />
    ) : (
      <ErrorState
        title={copy(
          'StreetFood tidak bisa dimuat',
          'StreetFood could not load'
        )}
        description={overview.error.message}
        onRetry={() => void overview.refetch()}
        isRetrying={overview.isFetching}
      />
    )
  ) : !data ? null : (
    <>
      {state !== 'connected' && <SetupSteps state={state} />}

      {state === 'not_connected' ? (
        <ConnectCard
          defaultUrl={import.meta.env.VITE_STREETFOOD_PLATFORM_URL ?? ''}
          busy={connect.isPending}
          onConnect={(url) =>
            connect.mutate(normalizePlatformUrl(url), {
              onSuccess: (link) => {
                setRotated(false)
                setCredentials({
                  tenantId: link.tenantId,
                  keyId: link.keyId,
                  secret: link.secret,
                  platformUrl: link.platformUrl,
                  businessName,
                })
              },
            })
          }
        />
      ) : (
        <>
          <ConnectionStatus
            overview={data}
            state={state}
            canEdit={admin}
            onNewSecret={() => setConfirm('rotate')}
            onDisconnect={() => setConfirm('disconnect')}
            onReconnect={() => reconnect.mutate()}
            reconnecting={reconnect.isPending}
          />

          <section aria-labelledby='sf-outlets' className='space-y-3'>
            <h2 id='sf-outlets' className='text-base font-semibold'>
              {copy('Outlet Anda', 'Your outlets')}
            </h2>
            {data.outlets.length === 0 ? (
              <EmptyState
                title={copy('Belum ada outlet aktif', 'No active outlets yet')}
                description={copy(
                  'Buat outlet dulu, lalu kembali ke sini.',
                  'Create an outlet first, then come back here.'
                )}
                action={
                  <Link
                    to='/outlets'
                    className='text-sm underline underline-offset-2'
                  >
                    {copy('Buka daftar outlet', 'Open outlets')}
                  </Link>
                }
              />
            ) : (
              <ul className='space-y-3'>
                {data.outlets.map((outlet) => (
                  <OutletCard
                    key={outlet.outletId}
                    outlet={outlet}
                    canEdit={admin}
                    pending={busyOutlet(outlet.outletId)}
                    onPublish={(enabled) =>
                      publication.mutate({ outletId: outlet.outletId, enabled })
                    }
                    onSave={(next) =>
                      settings.mutate({
                        outletId: outlet.outletId,
                        settings: next,
                      })
                    }
                    onEditHours={() => setHoursFor(outlet.outletId)}
                  />
                ))}
              </ul>
            )}
          </section>

          {showFees && (
            <FeesCard
              fees={fees.data}
              loading={fees.isPending}
              failed={fees.isError}
            />
          )}
        </>
      )}
    </>
  )

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-6'>
        <PageHeader
          title={t('nav.streetFood')}
          description={copy(
            'Tampilkan outlet Anda ke pelanggan StreetFood, terima pesanan, dan atur statusnya.',
            'Show your outlets to StreetFood customers, take their orders, and control their status.'
          )}
        />
        <div className='max-w-3xl space-y-6'>{content}</div>
      </Main>

      <CredentialsDialog
        credentials={credentials}
        rotated={rotated}
        defaultPosAddress={posAddress}
        onDone={() => setCredentials(null)}
      />

      <ConfirmDialog
        open={confirm === 'rotate'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={copy('Buat kunci rahasia baru?', 'Create a new secret?')}
        desc={copy(
          'Kunci lama langsung berhenti bekerja. Kunci baru didaftarkan ke platform otomatis; jika server ini belum bisa melakukannya, Anda mendapat rincian untuk dikirim ke operator StreetFood, dan outlet tidak tersinkron sampai operator memperbaruinya.',
          'The old secret stops working at once. The new one is registered with the platform for you; if this server cannot do that yet, you get details to send to your StreetFood operator, and your outlets will not sync until they update the key.'
        )}
        confirmText={copy('Buat kunci baru', 'Create new secret')}
        cancelBtnText={copy('Batal', 'Cancel')}
        isLoading={rotate.isPending}
        handleConfirm={() =>
          rotate.mutate(undefined, {
            onSuccess: (next) => {
              setConfirm(null)
              if (next.registered) {
                toast.success(
                  copy(
                    'Kunci baru sudah didaftarkan ke platform',
                    'The new secret is registered with the platform'
                  )
                )
                return
              }
              setRotated(true)
              setCredentials({
                tenantId: tenantId ?? '',
                keyId: next.keyId,
                secret: next.secret,
                platformUrl: data?.link?.platformUrl ?? '',
                businessName,
              })
            },
          })
        }
      />

      <ConfirmDialog
        open={confirm === 'disconnect'}
        onOpenChange={(open) => !open && setConfirm(null)}
        destructive
        title={copy('Putuskan dari StreetFood?', 'Disconnect from StreetFood?')}
        desc={copy(
          'Semua outlet disembunyikan dari pelanggan dan pesanan baru berhenti masuk. Pesanan yang sedang berjalan tetap bisa Anda selesaikan. Anda bisa menghubungkan lagi nanti, dengan kunci baru.',
          'Every outlet is hidden from customers and new orders stop. Orders already in progress can still be finished. You can connect again later, with a new key.'
        )}
        confirmText={copy('Putuskan', 'Disconnect')}
        cancelBtnText={copy('Batal', 'Cancel')}
        isLoading={disconnect.isPending}
        handleConfirm={() =>
          disconnect.mutate(undefined, { onSuccess: () => setConfirm(null) })
        }
      />

      <HoursDialog
        open={hoursOutlet !== undefined}
        outletName={hoursOutlet?.name ?? ''}
        hours={hoursOutlet?.hours ?? []}
        saving={hours.isPending}
        onOpenChange={(open) => !open && setHoursFor(null)}
        onSave={(intervals) =>
          hoursOutlet &&
          hours.mutate(
            { outletId: hoursOutlet.outletId, intervals },
            { onSuccess: () => setHoursFor(null) }
          )
        }
      />
    </>
  )
}
