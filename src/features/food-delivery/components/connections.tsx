import { useState } from 'react'
import { Plus, ArrowRight } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Outlet } from '@/features/outlets/api/outlets.types'
import { deliveryApi } from '../delivery.api'
import { authorizationDestination } from '../delivery.logic'
import {
  notifySaved,
  useDeliveryMutation,
  useDeliveryQuery,
} from '../delivery.queries'
import type {
  Binding,
  Connection,
  Environment,
  Provider,
} from '../delivery.types'
import { MenuMappings } from './menu-mappings'
import { ProviderMenu, ProviderOperations } from './provider-operations'
import {
  Choice,
  ErrorNotice,
  Field,
  Notice,
  Panel,
  Status,
  Toggle,
  ProviderMark,
  SetupStep,
} from './shared'

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
  const [selectedId, setSelectedId] = useState('')
  const [creating, setCreating] = useState(false)
  const [newProvider, setNewProvider] = useState<Provider>('GOFOOD')
  const connection =
    query.data?.find((item) => item.id === selectedId) ?? query.data?.[0]
  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2'>
        {(['GOFOOD', 'GRABFOOD'] as const).map((provider) => {
          const accounts =
            query.data?.filter((item) => item.provider === provider) ?? []
          const selected = connection?.provider === provider && !creating
          return (
            <button
              type='button'
              key={provider}
              aria-pressed={selected}
              onClick={() => {
                if (accounts.length) {
                  setSelectedId(accounts[0].id)
                  setCreating(false)
                } else {
                  setNewProvider(provider)
                  setCreating(true)
                }
              }}
              className={`bg-card rounded-xl border p-5 text-left transition-shadow shadow-none focus-visible:ring-2 ${selected ? 'border-primary ring-primary/15 ring-2' : ''}`}
            >
              <div className='flex items-center justify-between gap-3'>
                <ProviderMark provider={provider} />
                <ArrowRight
                  className='text-muted-foreground size-4'
                  aria-hidden='true'
                />
              </div>
              <p className='mt-4 font-medium'>
                {accounts.length
                  ? `${accounts.length} saved connection${accounts.length > 1 ? 's' : ''}`
                  : `Set up ${provider === 'GOFOOD' ? 'GoFood' : 'GrabFood'}`}
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>
                {accounts.length
                  ? `${accounts.filter((account) => account.enabled).length} enabled · Manage outlets and menus`
                  : provider === 'GOFOOD'
                    ? 'Connect your merchant account and link your outlets.'
                    : 'Link your partner account and prepare your delivery menu.'}
              </p>
            </button>
          )
        })}
      </div>
      <Notice>
        Connections and outlet effects start disabled. Complete provider
        testing, menu review, and mappings before enabling an outlet. Disabling
        Ansilum does not pause the marketplace store.
      </Notice>
      <ErrorNotice error={query.error} />
      {query.isPending && <p role='status'>Loading connections…</p>}
      <div className='flex flex-wrap items-end gap-3'>
        <Choice
          label='Provider connection'
          value={connection?.id ?? ''}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          <option value='' disabled>
            Select connection
          </option>
          {query.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.provider} · {item.environment} · {item.accountId}
            </option>
          ))}
        </Choice>
        <Button
          variant='outline'
          onClick={() => setCreating((value) => !value)}
        >
          <Plus className='mr-2 size-4' aria-hidden='true' />
          {creating ? 'Close new connection' : 'Add connection'}
        </Button>
      </div>
      {!query.isPending && query.data?.length === 0 && (
        <Notice>
          No delivery connections yet. Add the server-managed credential
          reference to get started.
        </Notice>
      )}
      {creating && (
        <CreateConnection
          key={newProvider}
          initialProvider={newProvider}
          onCreated={(id) => {
            setSelectedId(id)
            setCreating(false)
          }}
        />
      )}
      {connection && (
        <ConnectionDetails
          key={`${connection.id}:${outletId}`}
          connection={connection}
          outletId={outletId}
          outlets={outlets}
        />
      )}
    </div>
  )
}

function CreateConnection({
  onCreated,
  initialProvider,
}: {
  onCreated: (id: string) => void
  initialProvider: Provider
}) {
  const [provider, setProvider] = useState<Provider>(initialProvider)
  const [environment, setEnvironment] = useState<Environment>('SANDBOX')
  const [accountId, setAccountId] = useState('')
  const [credentialKey, setCredentialKey] = useState('')
  const mutation = useDeliveryMutation(
    () =>
      deliveryApi.connect({
        provider,
        environment,
        accountId: accountId.trim(),
        credentialKey,
      }),
    (connection) => onCreated(connection.id)
  )
  return (
    <Panel title='Add delivery connection'>
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined)
        }}
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <Choice
            label='Provider'
            value={provider}
            onChange={(event) => setProvider(event.target.value as Provider)}
          >
            <option value='GOFOOD'>GoFood</option>
            <option value='GRABFOOD'>GrabFood</option>
          </Choice>
          <Choice
            label='Environment'
            value={environment}
            onChange={(event) =>
              setEnvironment(event.target.value as Environment)
            }
          >
            <option value='SANDBOX'>Sandbox</option>
            <option value='PRODUCTION'>Production</option>
          </Choice>
          <Field
            label='Provider account ID'
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            required
            maxLength={128}
          />
          <Field
            label='Credential reference'
            value={credentialKey}
            onChange={(event) => setCredentialKey(event.target.value)}
            placeholder='CAFE_GRAB'
            pattern='[A-Z][A-Z0-9_]{0,63}'
            required
            maxLength={64}
            autoComplete='off'
          />
        </div>
        <p className='text-muted-foreground text-sm'>
          Use the reference configured by your server operator. API secrets and
          tokens stay on the server.
        </p>
        <ErrorNotice error={mutation.error} />
        <Button disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create disabled connection'}
        </Button>
      </form>
    </Panel>
  )
}

function ConnectionDetails({
  connection,
  outletId,
  outlets,
}: {
  connection: Connection
  outletId: string
  outlets: Outlet[]
}) {
  const bindings = useDeliveryQuery(['bindings', connection.id], (signal) =>
    deliveryApi.bindings(connection.id, signal)
  )
  const binding = bindings.data?.find((item) => item.outletId === outletId)
  const authorize = useDeliveryMutation(
    async () => {
      const result = await deliveryApi.authorize(connection.id)
      return authorizationDestination(
        result.authorizationUrl,
        window.location.origin
      )
    },
    (url) => window.location.assign(url)
  )
  return (
    <>
      <Panel
        title={`${connection.provider === 'GOFOOD' ? 'GoFood' : 'GrabFood'} connection`}
      >
        <div className='flex flex-wrap gap-2'>
          <Status value={connection.environment} />
          <Status value={connection.enabled ? 'ENABLED' : 'DISABLED'} />
          <Status
            value={
              connection.writesEnabled ? 'WRITES_ENABLED' : 'WRITES_DISABLED'
            }
          />
        </div>
        <p className='text-sm'>Account: {connection.accountId}</p>
        <details>
          <summary className='cursor-pointer text-sm font-medium'>
            Connection settings
          </summary>
          <div className='mt-4'>
            {' '}
            <ConnectionFlags
              key={`${connection.id}:${connection.enabled}:${connection.writesEnabled}`}
              connection={connection}
            />
          </div>
        </details>
        {connection.provider === 'GOFOOD' && (
          <>
            <Button
              variant='outline'
              disabled={authorize.isPending}
              onClick={() => authorize.mutate(undefined)}
            >
              Authorize GoFood merchant
            </Button>
            <p className='text-muted-foreground text-sm'>
              Continues to merchant consent in this browser.
            </p>
            <ErrorNotice error={authorize.error} />
          </>
        )}
      </Panel>
      <ErrorNotice error={bindings.error} />
      {bindings.isPending && <p role='status'>Loading outlet bindings…</p>}
      {outletId &&
        !bindings.isPending &&
        !bindings.error &&
        (binding ? (
          <BindingWorkspace
            binding={binding}
            connection={connection}
            outletName={
              outlets.find((item) => item.id === outletId)?.name ?? outletId
            }
          />
        ) : (
          <BindOutlet
            key={`${connection.id}:${outletId}`}
            connectionId={connection.id}
            outletId={outletId}
          />
        ))}
    </>
  )
}

function BindingWorkspace({
  binding,
  connection,
  outletName,
}: {
  binding: Binding
  connection: Connection
  outletName: string
}) {
  const [tab, setTab] = useState('settings')
  const mappings = useDeliveryQuery(['mappings', binding.id], (signal) =>
    deliveryApi.mappings(binding.id, signal)
  )
  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-lg font-semibold'>{outletName}</h2>
          <p className='text-muted-foreground text-sm'>
            Provider outlet: {binding.externalOutletId}
          </p>
        </div>
        <div className='flex gap-2'>
          <Status value={binding.integrationStatus ?? 'NOT_ACTIVATED'} />
          <Status value={binding.menuSyncStatus ?? 'MENU_NOT_PUBLISHED'} />
        </div>
      </div>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <SetupStep label='1. Link outlet' complete />
        <SetupStep
          label='2. Map menu items'
          complete={!!mappings.data?.length}
          onClick={() => setTab('mappings')}
        />
        <SetupStep
          label='3. Review delivery menu'
          complete={!!binding.menu}
          onClick={() => setTab('menu')}
        />
        <SetupStep
          label='4. Enable outlet'
          complete={binding.enabled}
          onClick={() => setTab('settings')}
        />
      </div>
      <p className='text-muted-foreground text-xs'>
        Setup progress reflects saved configuration. Verify full mapping
        coverage and provider approval before activation.
      </p>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className='mb-3 h-auto flex-wrap'>
          <TabsTrigger value='settings'>Outlet settings</TabsTrigger>
          <TabsTrigger value='mappings'>Item mappings</TabsTrigger>
          <TabsTrigger value='menu'>Delivery menu</TabsTrigger>
          <TabsTrigger value='operations'>Provider operations</TabsTrigger>
        </TabsList>
        <TabsContent value='settings'>
          <Panel title='Outlet controls'>
            {binding.provider === 'GRABFOOD' && (
              <details>
                <summary className='cursor-pointer text-sm'>
                  Grab merchant registration ID
                </summary>
                <p className='mt-2 text-xs break-all'>
                  partnerMerchantID: <code>{binding.id}</code>
                </p>
              </details>
            )}
            <BindingFlags
              key={`${binding.id}:${binding.enabled}:${binding.inventoryEnabled}:${binding.salesEnabled}:${binding.manualAcceptance}:${binding.preparationLeadMinutes}`}
              binding={binding}
            />
          </Panel>
        </TabsContent>
        <TabsContent value='mappings'>
          <MenuMappings binding={binding} />
        </TabsContent>
        <TabsContent value='menu'>
          <ProviderMenu key={binding.id} binding={binding} />
        </TabsContent>
        <TabsContent value='operations'>
          <ProviderOperations binding={binding} connection={connection} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ConnectionFlags({ connection }: { connection: Connection }) {
  const [enabled, setEnabled] = useState(connection.enabled)
  const [writesEnabled, setWritesEnabled] = useState(connection.writesEnabled)
  const mutation = useDeliveryMutation(
    () =>
      deliveryApi.connectionFlags(connection.id, { enabled, writesEnabled }),
    notifySaved
  )
  return (
    <form
      className='space-y-4'
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate(undefined)
      }}
    >
      <Toggle
        label='Enable connection'
        checked={enabled}
        onChange={setEnabled}
      />
      <Toggle
        label='Enable provider writes'
        checked={writesEnabled}
        onChange={setWritesEnabled}
      />
      <ErrorNotice error={mutation.error} />
      <Button disabled={mutation.isPending}>Save connection settings</Button>
    </form>
  )
}

function BindOutlet({
  connectionId,
  outletId,
}: {
  connectionId: string
  outletId: string
}) {
  const [externalOutletId, setExternalOutletId] = useState('')
  const mutation = useDeliveryMutation(
    () =>
      deliveryApi.bind(connectionId, {
        outletId,
        externalOutletId: externalOutletId.trim(),
      }),
    notifySaved
  )
  return (
    <Panel title='Link selected outlet'>
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined)
        }}
      >
        <Field
          label='Provider outlet ID'
          value={externalOutletId}
          onChange={(event) => setExternalOutletId(event.target.value)}
          required
          maxLength={128}
        />
        <p className='text-muted-foreground text-sm'>
          This links the selected Ansilum outlet. Inventory and sales effects
          remain disabled.
        </p>
        <ErrorNotice error={mutation.error} />
        <Button disabled={mutation.isPending}>Link outlet</Button>
      </form>
    </Panel>
  )
}

function BindingFlags({ binding }: { binding: Binding }) {
  const [flags, setFlags] = useState({
    enabled: binding.enabled,
    inventoryEnabled: binding.inventoryEnabled,
    salesEnabled: binding.salesEnabled,
    manualAcceptance: binding.manualAcceptance,
    preparationLeadMinutes: binding.preparationLeadMinutes,
  })
  const mutation = useDeliveryMutation(
    () => deliveryApi.bindingFlags(binding.id, flags),
    notifySaved
  )
  return (
    <form
      className='space-y-4'
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate(undefined)
      }}
    >
      <Toggle
        label='Enable outlet integration'
        checked={flags.enabled}
        onChange={(enabled) => setFlags({ ...flags, enabled })}
      />
      <Toggle
        label='Consume inventory at preparation'
        checked={flags.inventoryEnabled}
        onChange={(inventoryEnabled) =>
          setFlags({ ...flags, inventoryEnabled })
        }
      />
      <Toggle
        label='Project completed delivery sales'
        checked={flags.salesEnabled}
        onChange={(salesEnabled) => setFlags({ ...flags, salesEnabled })}
      />
      {binding.provider === 'GRABFOOD' && (
        <Toggle
          label='Manual order acceptance'
          checked={flags.manualAcceptance}
          onChange={(manualAcceptance) =>
            setFlags({ ...flags, manualAcceptance })
          }
        />
      )}
      <Field
        label='Preparation lead time (minutes)'
        type='number'
        min={0}
        max={240}
        step={1}
        required
        value={flags.preparationLeadMinutes}
        onChange={(event) =>
          setFlags({
            ...flags,
            preparationLeadMinutes: Number(event.target.value),
          })
        }
      />
      <p className='text-muted-foreground text-sm'>
        Provider activation notifications do not enable these effects
        automatically.
      </p>
      <ErrorNotice error={mutation.error} />
      <Button disabled={mutation.isPending}>Save outlet settings</Button>
    </form>
  )
}
