import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { deliveryApi } from '../delivery.api'
import { dateTime, parseMenu } from '../delivery.logic'
import {
  notifySaved,
  useDeliveryMutation,
  useDeliveryQuery,
  useDeliverySession,
} from '../delivery.queries'
import type { Binding, Connection, OperationAction } from '../delivery.types'
import {
  Choice,
  ErrorNotice,
  Field,
  JsonDetails,
  Notice,
  Panel,
  Status,
} from './shared'

const events = [
  'gofood.order.created',
  'gofood.order.merchant_accepted',
  'gofood.order.driver_otw_pickup',
  'gofood.order.driver_arrived',
  'gofood.order.placed',
  'gofood.order.completed',
  'gofood.order.cancelled',
  'gofood.order.webhook_error',
]

export function ProviderMenu({ binding }: { binding: Binding }) {
  const [menu, setMenu] = useState(
    binding.menu ? JSON.stringify(binding.menu, null, 2) : ''
  )
  const [reviewed, setReviewed] = useState(false)
  const [expectedVersion, setExpectedVersion] = useState(binding.menuVersion)
  const mutation = useDeliveryMutation(
    () => deliveryApi.menu(binding.id, parseMenu(menu), expectedVersion),
    (result) => {
      setExpectedVersion(result.version)
      notifySaved()
    }
  )
  return (
    <Panel title={`Reviewed provider menu · Version ${expectedVersion}`}>
      <p className='text-muted-foreground text-sm'>
        Save the menu in your provider’s reviewed JSON format. Delivery prices
        are separate from POS prices. Validate it with provider tools before
        publication.
      </p>
      {binding.menuVersion > expectedVersion && (
        <Notice>
          <div className='space-y-3'>
            <p>
              A newer menu was saved elsewhere. Your draft is preserved below.
              Copy it before loading the latest version.
            </p>
            <Button
              variant='outline'
              onClick={() => {
                setMenu(
                  binding.menu ? JSON.stringify(binding.menu, null, 2) : ''
                )
                setExpectedVersion(binding.menuVersion)
                setReviewed(false)
                mutation.reset()
              }}
            >
              Load latest saved menu
            </Button>
          </div>
        </Notice>
      )}
      {binding.importedMenu && (
        <details>
          <summary className='cursor-pointer'>Provider-imported menu</summary>
          <JsonDetails value={binding.importedMenu} />
          <Button
            variant='outline'
            onClick={() => {
              setMenu(JSON.stringify(binding.importedMenu, null, 2))
              setReviewed(false)
            }}
          >
            Use as draft
          </Button>
        </details>
      )}
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined)
        }}
      >
        <Label htmlFor={`menu-${binding.id}`}>Reviewed menu JSON</Label>
        <Textarea
          id={`menu-${binding.id}`}
          className='min-h-64 font-sans tabular-nums text-xs'
          value={menu}
          onChange={(event) => {
            setMenu(event.target.value)
            setReviewed(false)
          }}
          required
          spellCheck={false}
        />
        <label className='flex items-start gap-2 text-sm'>
          <input
            type='checkbox'
            checked={reviewed}
            onChange={(event) => setReviewed(event.target.checked)}
          />
          I have reviewed this menu using the provider’s validation tools.
        </label>
        <ErrorNotice error={mutation.error} />
        <Button disabled={!reviewed || mutation.isPending}>
          Save reviewed menu
        </Button>
      </form>
    </Panel>
  )
}

type OperationSession = {
  key: string
  id: string
  input?: { action: OperationAction; event?: string; date?: string }
}

export function ProviderOperations({
  binding,
  connection,
}: {
  binding: Binding
  connection: Connection
}) {
  const [session, setSession] = useDeliverySession<OperationSession>(
    `operation:${binding.id}`,
    () => ({ key: crypto.randomUUID(), id: '' })
  )
  const [action, setAction] = useState<OperationAction>(
    session.input?.action ??
      (binding.provider === 'GOFOOD' ? 'ACTIVATE' : 'STORE_STATUS')
  )
  const [event, setEvent] = useState(session.input?.event ?? events[0])
  const [date, setDate] = useState(session.input?.date ?? '')
  const [confirmed, setConfirmed] = useState(false)
  const [verified, setVerified] = useState(false)
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [earliest] = useState(() =>
    new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
  )
  const actions: OperationAction[] =
    binding.provider === 'GOFOOD'
      ? ['ACTIVATE', 'PUBLISH_MENU', 'SUBSCRIBE']
      : ['STORE_STATUS', 'ACTIVATE', 'PUBLISH_MENU', 'RECONCILE', 'PAUSE_STORE']
  const status = useDeliveryQuery(
    ['operation', session.id],
    (signal) => deliveryApi.operation(session.id, signal),
    !!session.id,
    5000
  )
  const mutation = useDeliveryMutation(
    async (input: NonNullable<OperationSession['input']>) =>
      deliveryApi.operate(binding.id, {
        ...input,
        idempotencyKey: session.key,
      }),
    (operation) => {
      setSession({ ...session, id: operation.id })
      setConfirmed(false)
    }
  )
  const locked = !!session.input || mutation.isPending
  function prepareNext() {
    setSession({ id: '', key: crypto.randomUUID() })
    setConfirmed(false)
    setVerified(false)
    mutation.reset()
  }
  return (
    <Panel title='Provider operations'>
      <p className='text-muted-foreground text-sm'>
        Activate your store, publish a reviewed menu, or recover provider
        orders. Each operation is tracked until its outcome is confirmed.
      </p>
      <p className='text-sm'>
        Last reconciliation: {dateTime(binding.reconciledAt)}
      </p>
      <form
        className='space-y-4'
        onSubmit={(submit) => {
          submit.preventDefault()
          const input = session.input ?? {
            action,
            ...(action === 'SUBSCRIBE' ? { event } : {}),
            ...(action === 'RECONCILE' ? { date } : {}),
          }
          setSession({ ...session, input })
          mutation.mutate(input)
        }}
      >
        <Choice
          label='Operation'
          value={action}
          onChange={(event) => {
            setAction(event.target.value as OperationAction)
            setConfirmed(false)
          }}
          disabled={locked}
        >
          {actions.map((item) => (
            <option key={item} value={item}>
              {item.toLowerCase().replace(/_/g, ' ')}
            </option>
          ))}
        </Choice>
        {action === 'SUBSCRIBE' && (
          <Choice
            label='GoFood notification event'
            value={event}
            onChange={(value) => setEvent(value.target.value)}
            disabled={locked}
          >
            {events.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Choice>
        )}
        {action === 'RECONCILE' && (
          <Field
            label='Order date'
            type='date'
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            max={today}
            min={earliest}
            disabled={locked}
          />
        )}
        {action === 'PUBLISH_MENU' && !binding.menu && (
          <Notice>Save a reviewed menu before publishing.</Notice>
        )}
        {action === 'PAUSE_STORE' && (
          <Notice>
            This requests a pause of the GrabFood marketplace store.
          </Notice>
        )}
        {!session.id && (
          <label className='flex items-start gap-2 text-sm'>
            <input
              type='checkbox'
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={mutation.isPending}
            />
            I have reviewed this operation and its provider requirements.
          </label>
        )}
        {(!connection.enabled || !connection.writesEnabled) && (
          <Notice>
            Enable the connection and provider writes before queuing operations.
          </Notice>
        )}
        <ErrorNotice error={mutation.error} />
        {!session.id && (
          <Button
            disabled={
              mutation.isPending ||
              !confirmed ||
              !connection.enabled ||
              !connection.writesEnabled ||
              (action === 'PUBLISH_MENU' && !binding.menu)
            }
          >
            {mutation.isPending
              ? 'Submitting…'
              : session.input
                ? 'Retrieve or retry the same request'
                : 'Queue operation'}
          </Button>
        )}
      </form>
      {session.id && (
        <div className='space-y-3 rounded-lg border p-4'>
          <p className='text-xs break-all'>Operation ID: {session.id}</p>
          <ErrorNotice error={status.error} />
          {status.isPending && <p role='status'>Checking provider outcome…</p>}
          {status.data && (
            <>
              <Status value={status.data.status} />
              {status.data.errorCode && (
                <p className='text-sm'>{status.data.errorCode}</p>
              )}
              {status.data.result != null && (
                <JsonDetails value={status.data.result} />
              )}
              {['SUCCEEDED', 'FAILED'].includes(status.data.status) && (
                <Button variant='outline' onClick={prepareNext}>
                  Prepare another operation
                </Button>
              )}
            </>
          )}
        </div>
      )}
      {(status.data?.status === 'UNKNOWN' ||
        (!session.id && !!session.input && !mutation.isPending)) && (
        <div className='space-y-3'>
          <Notice>
            The outcome needs verification. Retrying the same request keeps its
            original key. Before preparing a different operation, reconcile this
            request with the provider/operator.
          </Notice>
          <label className='flex items-start gap-2 text-sm'>
            <input
              type='checkbox'
              checked={verified}
              onChange={(event) => setVerified(event.target.checked)}
            />
            I have reconciled this request with the provider/operator.
          </label>
          <Button variant='outline' disabled={!verified} onClick={prepareNext}>
            Prepare a new operation after verification
          </Button>
        </div>
      )}
    </Panel>
  )
}
