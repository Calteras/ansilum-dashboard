import { useId, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight, Copy, ExternalLink } from '@/components/icons'
import { deliveryApi } from '../delivery.api'
import { authorizationDestination } from '../delivery.logic'
import { providers } from '../delivery.providers'
import { notifySaved, useDeliveryMutation } from '../delivery.queries'
import type {
  Binding,
  Connection,
  Environment,
  Provider,
} from '../delivery.types'
import { ErrorNotice, Field, Panel, Status, Toggle } from './shared'

const environments: {
  value: Environment
  label: string
  description: string
}[] = [
  {
    value: 'SANDBOX',
    label: 'Sandbox',
    description:
      'Test with the provider’s sandbox. No real customers or orders.',
  },
  {
    value: 'PRODUCTION',
    label: 'Production',
    description: 'Your live store. Real customers place real orders.',
  },
]

export function CreateConnection({
  provider,
  onCreated,
  onCancel,
}: {
  provider: Provider
  onCreated: (id: string) => void
  onCancel?: () => void
}) {
  const info = providers[provider]
  const legendId = useId()
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
    <Panel
      title={`Connect your ${info.name} account`}
      description='Ask your server operator for the account ID and credential reference. They set these up when they added the provider’s API keys to the server.'
    >
      <form
        className='space-y-5'
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined)
        }}
      >
        <fieldset className='space-y-2' aria-labelledby={legendId}>
          <legend id={legendId} className='text-sm font-medium'>
            Environment
          </legend>
          <div className='grid gap-3 sm:grid-cols-2'>
            {environments.map((item) => (
              <label
                key={item.value}
                className={cn(
                  'bg-card hover:bg-muted flex cursor-pointer gap-3 rounded-lg border p-3 text-sm has-[:focus-visible]:ring-2',
                  environment === item.value && 'border-primary bg-muted'
                )}
              >
                <input
                  type='radio'
                  name={`environment-${provider}`}
                  value={item.value}
                  checked={environment === item.value}
                  onChange={() => setEnvironment(item.value)}
                  className='accent-primary mt-0.5'
                />
                <span>
                  <span className='font-medium'>{item.label}</span>
                  <span className='text-muted-foreground block text-xs leading-relaxed'>
                    {item.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field
            label='Partner account ID'
            hint={info.accountHint}
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            required
            maxLength={128}
            autoComplete='off'
          />
          <Field
            label='Credential reference'
            hint='A short name that points to the keys stored on the server. Never paste secret keys or tokens here.'
            value={credentialKey}
            onChange={(event) =>
              setCredentialKey(event.target.value.toUpperCase())
            }
            placeholder={`CAFE_${provider === 'GOFOOD' ? 'GOFOOD' : 'GRAB'}`}
            pattern='[A-Z][A-Z0-9_]{0,63}'
            title='Start with a letter, then use capital letters, numbers or underscores.'
            required
            maxLength={64}
            autoComplete='off'
          />
        </div>
        <p className='text-muted-foreground text-sm'>
          The connection is saved switched off. Nothing is sent to {info.name}{' '}
          until you switch it on in step 5.
        </p>
        <ErrorNotice error={mutation.error} />
        <div className='flex flex-wrap gap-2'>
          <Button disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Connecting…'
              : `Connect ${info.name} account`}
          </Button>
          {onCancel && (
            <Button type='button' variant='ghost' onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Panel>
  )
}

export function AccountSummary({ connection }: { connection: Connection }) {
  const info = providers[connection.provider]
  return (
    <Panel title={`${info.name} account connected`}>
      <dl className='grid gap-4 text-sm sm:grid-cols-3'>
        <div>
          <dt className='text-muted-foreground'>Partner account ID</dt>
          <dd className='mt-1 font-medium break-all'>{connection.accountId}</dd>
        </div>
        <div>
          <dt className='text-muted-foreground'>Environment</dt>
          <dd className='mt-1'>
            <Status value={connection.environment} />
          </dd>
        </div>
        <div>
          <dt className='text-muted-foreground'>Connection</dt>
          <dd className='mt-1'>
            <Status value={connection.enabled ? 'ENABLED' : 'DISABLED'} />
          </dd>
        </div>
      </dl>
      {connection.provider === 'GOFOOD' && (
        <GoFoodConsent connectionId={connection.id} />
      )}
    </Panel>
  )
}

function GoFoodConsent({ connectionId }: { connectionId: string }) {
  const authorize = useDeliveryMutation(
    async () => {
      const result = await deliveryApi.authorize(connectionId)
      return authorizationDestination(
        result.authorizationUrl,
        window.location.origin
      )
    },
    (url) => window.location.assign(url)
  )
  return (
    <div className='bg-muted/50 space-y-3 rounded-lg border p-4'>
      <div>
        <h3 className='font-semibold'>Give Ansilum access in GoBiz</h3>
        <p className='text-muted-foreground mt-1 text-sm'>
          GoFood asks the merchant to approve access once per account. Ansilum
          can’t check this for you, so repeat it whenever GoFood asks you to
          reconnect.
        </p>
      </div>
      <ol className='text-muted-foreground list-decimal space-y-1 pl-5 text-sm'>
        <li>Select Authorize GoFood merchant below.</li>
        <li>Sign in to GoBiz with the owner account and approve access.</li>
        <li>When GoFood shows its confirmation, come back to Food Delivery.</li>
      </ol>
      <ErrorNotice error={authorize.error} />
      <Button
        variant='outline'
        disabled={authorize.isPending}
        onClick={() => authorize.mutate(undefined)}
      >
        <ExternalLink className='mr-2 size-4' aria-hidden='true' />
        Authorize GoFood merchant
      </Button>
    </div>
  )
}

export function BindOutlet({
  connection,
  outletId,
  outletName,
  onLinked,
}: {
  connection: Connection
  outletId: string
  outletName: string
  onLinked: () => void
}) {
  const info = providers[connection.provider]
  const [externalOutletId, setExternalOutletId] = useState('')
  const mutation = useDeliveryMutation(
    () =>
      deliveryApi.bind(connection.id, {
        outletId,
        externalOutletId: externalOutletId.trim(),
      }),
    () => {
      notifySaved()
      onLinked()
    }
  )
  return (
    <Panel
      title={`Link ${outletName} to ${info.name}`}
      description='To link a different outlet, change it in the Outlet menu at the top of the page.'
    >
      <form
        className='space-y-5'
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined)
        }}
      >
        <div className='grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]'>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Ansilum outlet</p>
            <p className='bg-muted flex h-9 items-center rounded-md px-3 text-sm'>
              {outletName}
            </p>
          </div>
          <ArrowLeftRight
            className='text-muted-foreground mx-auto mb-2 hidden size-5 sm:block'
            aria-hidden='true'
          />
          <Field
            label={info.outletLabel}
            value={externalOutletId}
            onChange={(event) => setExternalOutletId(event.target.value)}
            required
            maxLength={128}
            autoComplete='off'
          />
        </div>
        <p className='text-muted-foreground text-sm'>{info.outletHint}</p>
        <p className='text-muted-foreground text-sm'>
          Linking only connects the two. Orders, stock and sales stay off until
          you switch them on in step 6.
        </p>
        <ErrorNotice error={mutation.error} />
        <Button disabled={mutation.isPending}>
          {mutation.isPending ? 'Linking…' : 'Link outlet'}
        </Button>
      </form>
    </Panel>
  )
}

export function OutletLinkSummary({
  binding,
  outletName,
}: {
  binding: Binding
  outletName: string
}) {
  const info = providers[binding.provider]
  return (
    <Panel title='Outlet linked'>
      <dl className='grid gap-4 text-sm sm:grid-cols-2'>
        <div>
          <dt className='text-muted-foreground'>Ansilum outlet</dt>
          <dd className='mt-1 font-medium'>{outletName}</dd>
        </div>
        <div>
          <dt className='text-muted-foreground'>{info.outletLabel}</dt>
          <dd className='mt-1 font-medium break-all'>
            {binding.externalOutletId}
          </dd>
        </div>
      </dl>
      {binding.provider === 'GRABFOOD' && (
        <div className='bg-muted/50 space-y-2 rounded-lg border p-4'>
          <h3 className='font-semibold'>Your partner merchant ID for Grab</h3>
          <p className='text-muted-foreground text-sm'>
            When Grab registers this store’s integration, they ask for a{' '}
            <code>partnerMerchantID</code>. Give them this value.
          </p>
          <div className='flex flex-wrap items-center gap-2'>
            <code className='bg-background rounded-md border px-2 py-1 text-xs break-all'>
              {binding.id}
            </code>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() =>
                navigator.clipboard.writeText(binding.id).then(
                  () => toast.success('Copied'),
                  () => toast.error('Copy failed. Select the ID and copy it.')
                )
              }
            >
              <Copy className='mr-2 size-4' aria-hidden='true' />
              Copy ID
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}

export function ConnectionFlags({ connection }: { connection: Connection }) {
  const info = providers[connection.provider]
  const [enabled, setEnabled] = useState(connection.enabled)
  const [writesEnabled, setWritesEnabled] = useState(connection.writesEnabled)
  const mutation = useDeliveryMutation(
    () =>
      deliveryApi.connectionFlags(connection.id, { enabled, writesEnabled }),
    notifySaved
  )
  return (
    <Panel
      title={`Allow Ansilum to work with ${info.name}`}
      description='Both switches cover every outlet linked to this account.'
    >
      <form
        className='space-y-5'
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined)
        }}
      >
        <Toggle
          label='Connection active'
          description={`Accept orders and notifications from this ${info.name} account.`}
          checked={enabled}
          onChange={setEnabled}
        />
        <Toggle
          label={`Send updates to ${info.name}`}
          description={`Let Ansilum send order statuses, menus and store actions to ${info.name}. The actions below need this.`}
          checked={writesEnabled}
          onChange={setWritesEnabled}
        />
        <ErrorNotice error={mutation.error} />
        <Button disabled={mutation.isPending}>Save connection settings</Button>
      </form>
    </Panel>
  )
}

export function BindingFlags({ binding }: { binding: Binding }) {
  const info = providers[binding.provider]
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
    <Panel
      title='Outlet settings'
      description='Your provider confirming activation doesn’t switch any of these on. You decide when each one starts.'
    >
      <form
        className='space-y-5'
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined)
        }}
      >
        <Toggle
          label='Process orders for this outlet'
          description={`New ${info.name} orders appear in the Orders tab and staff can act on them. While off, incoming orders are blocked and wait in Recovery.`}
          checked={flags.enabled}
          onChange={(enabled) => setFlags({ ...flags, enabled })}
        />
        <Toggle
          label='Deduct stock when preparation starts'
          description='Uses each matched product’s recipe to reduce ingredient stock.'
          checked={flags.inventoryEnabled}
          onChange={(inventoryEnabled) =>
            setFlags({ ...flags, inventoryEnabled })
          }
        />
        <Toggle
          label='Record completed orders as sales'
          description='Adds completed delivery orders to your sales records, kept separate by channel.'
          checked={flags.salesEnabled}
          onChange={(salesEnabled) => setFlags({ ...flags, salesEnabled })}
        />
        {binding.provider === 'GRABFOOD' && (
          <Toggle
            label='Accept orders manually'
            description='Turn this on if your GrabFood store uses manual acceptance, so staff can accept or reject each order here.'
            checked={flags.manualAcceptance}
            onChange={(manualAcceptance) =>
              setFlags({ ...flags, manualAcceptance })
            }
          />
        )}
        <Field
          label='Preparation lead time (minutes)'
          hint='For scheduled orders, staff can start preparing this many minutes before the pickup time.'
          type='number'
          min={0}
          max={240}
          step={1}
          required
          className='sm:max-w-40'
          value={flags.preparationLeadMinutes}
          onChange={(event) =>
            setFlags({
              ...flags,
              preparationLeadMinutes: Number(event.target.value),
            })
          }
        />
        <ErrorNotice error={mutation.error} />
        <Button disabled={mutation.isPending}>Save outlet settings</Button>
      </form>
    </Panel>
  )
}
