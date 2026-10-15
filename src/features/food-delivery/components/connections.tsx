import { useState } from 'react'
import { ArrowRight } from '@/components/icons'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Outlet } from '@/features/outlets/api/outlets.types'
import { deliveryApi } from '../delivery.api'
import { providerIds, providers } from '../delivery.providers'
import { useDeliveryQuery } from '../delivery.queries'
import type { Connection, Provider } from '../delivery.types'
import { SetupGuide, SetupOverview } from './setup-guide'
import { ErrorNotice, ProviderLogo } from './shared'

export function Connections({
  outletId,
  outlets,
}: {
  outletId: string
  outlets: Outlet[]
}) {
  const query = useDeliveryQuery(['connections'], (signal) =>
    deliveryApi.connections(signal)
  )
  const [picked, setPicked] = useState<Provider>()
  const [selectedIds, setSelectedIds] = useState<
    Partial<Record<Provider, string>>
  >({})
  const [adding, setAdding] = useState(false)
  const provider = picked ?? query.data?.[0]?.provider
  const accounts =
    query.data?.filter((item) => item.provider === provider) ?? []
  const selectedId = provider && selectedIds[provider]
  const connection =
    accounts.find((item) => item.id === selectedId) ?? accounts[0]
  // A just-created account appears once the connection list refetches.
  const awaitingNew =
    !!selectedId &&
    !accounts.some((item) => item.id === selectedId) &&
    query.isFetching
  return (
    <div className='space-y-8'>
      <div className='grid gap-4 sm:grid-cols-2'>
        {providerIds.map((id) => (
          <ProviderCard
            key={id}
            provider={id}
            accounts={query.data?.filter((item) => item.provider === id) ?? []}
            selected={id === provider}
            onSelect={() => {
              setPicked(id)
              setAdding(false)
            }}
          />
        ))}
      </div>
      <ErrorNotice error={query.error} />
      {(query.isPending || awaitingNew) && (
        <p role='status'>Loading connections…</p>
      )}
      {!query.isPending && !query.error && !provider && <SetupOverview />}
      {provider && !query.isPending && !awaitingNew && (
        <SetupGuide
          key={`${provider}:${connection?.id ?? 'new'}:${outletId}`}
          provider={provider}
          accounts={accounts}
          connection={connection}
          adding={adding}
          outletId={outletId}
          outletName={outlets.find((item) => item.id === outletId)?.name}
          onSelectAccount={(id) =>
            setSelectedIds({ ...selectedIds, [provider]: id })
          }
          onAddAccount={() => setAdding(true)}
          onCancelAdd={() => setAdding(false)}
          onCreated={(id) => {
            setSelectedIds({ ...selectedIds, [provider]: id })
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function ProviderCard({
  provider,
  accounts,
  selected,
  onSelect,
}: {
  provider: Provider
  accounts: Connection[]
  selected: boolean
  onSelect: () => void
}) {
  const info = providers[provider]
  const active = accounts.some(
    (account) => account.enabled && account.writesEnabled
  )
  return (
    <button
      type='button'
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'bg-card hover:border-foreground/40 flex flex-col rounded-xl border p-5 text-left transition-colors focus-visible:ring-2',
        selected && 'border-primary ring-primary/15 hover:border-primary ring-2'
      )}
    >
      <div className='flex w-full items-start justify-between gap-3'>
        <div className='flex h-8 items-center'>
          <ProviderLogo
            provider={provider}
            className={provider === 'GOFOOD' ? 'h-7' : 'h-6'}
          />
        </div>
        {!accounts.length ? (
          <Badge>Not connected</Badge>
        ) : active ? (
          <Badge variant='success'>Connected</Badge>
        ) : (
          <Badge variant='upcoming'>Setup in progress</Badge>
        )}
      </div>
      <p className='text-muted-foreground mt-4 text-sm leading-relaxed'>
        {info.summary}
      </p>
      <span className='mt-4 inline-flex items-center gap-1.5 text-sm font-semibold'>
        {accounts.length
          ? `Continue setup${accounts.length > 1 ? ` (${accounts.length} accounts)` : ''}`
          : 'Start setup'}
        <ArrowRight className='size-4' aria-hidden='true' />
      </span>
    </button>
  )
}
