import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  AlertCircle,
  ChefHat,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { deliveryApi } from '../delivery.api'
import {
  money,
  dateTime,
  availableActions,
  reviewMessages,
} from '../delivery.logic'
import { providers } from '../delivery.providers'
import {
  useDeliveryAccess,
  useDeliveryMutation,
  useDeliveryOrders,
  useDeliveryQuery,
  useDeliverySession,
  useIntentKey,
} from '../delivery.queries'
import {
  orderStates,
  type Action,
  type ActionInput,
  type DeliveryOrder,
} from '../delivery.types'
import { AdjustmentForm } from './channel-sales'
import { CommandStatus } from './recovery'
import {
  Choice,
  ErrorNotice,
  JsonDetails,
  Notice,
  Panel,
  Status,
  ProviderMark,
  EmptyState,
} from './shared'

const actionLabels: Record<Action, string> = {
  START_PREPARATION: 'Start preparation',
  READY: 'Ready for pickup',
  ACCEPT: 'Accept order',
  REJECT: 'Reject order',
  CANCEL: 'Request cancellation',
  ACKNOWLEDGE_EXTERNAL_INVENTORY: 'Acknowledge external inventory',
}

export function Orders({ outletId }: { outletId: string }) {
  const query = useDeliveryOrders(outletId)
  const [state, setState] = useState('ACTIVE')
  const [provider, setProvider] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const allOrders = (query.data?.orders ?? []).filter(
    (order) => provider === 'ALL' || provider === order.provider
  )
  const summary = [
    {
      label: 'Active orders',
      filter: 'ACTIVE',
      Icon: Clock3,
      count: allOrders.filter(
        (order) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(order.state)
      ).length,
    },
    {
      label: 'In preparation',
      filter: 'PREPARING',
      Icon: ChefHat,
      count: allOrders.filter((order) => order.state === 'PREPARING').length,
    },
    {
      label: 'Ready for pickup',
      filter: 'READY',
      Icon: PackageCheck,
      count: allOrders.filter((order) => order.state === 'READY').length,
    },
    {
      label: 'Needs attention',
      filter: 'REVIEW',
      Icon: AlertCircle,
      count: allOrders.filter(
        (order) => !!reviewMessages[order.processingState]
      ).length,
    },
  ]
  const orders = allOrders.filter(
    (order) =>
      (provider === 'ALL' || provider === order.provider) &&
      (!search ||
        `${order.displayId} ${order.externalId} ${order.items.map((item) => item.name).join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (state === 'ALL' ||
        (state === 'REVIEW'
          ? !!reviewMessages[order.processingState]
          : state === 'ACTIVE'
            ? !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(order.state)
            : state === order.state))
  )
  if (!outletId)
    return <Notice>Select an outlet to view delivery orders.</Notice>
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {summary.map(({ label, filter, Icon, count }) => (
          <button
            key={filter}
            type='button'
            aria-pressed={state === filter}
            onClick={() => setState(filter)}
            className={`bg-card hover:bg-muted/50 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 ${state === filter ? 'border-primary' : ''}`}
          >
            <div className='text-muted-foreground flex items-center justify-between gap-2'>
              <span className='text-xs font-medium sm:text-sm'>{label}</span>
              <Icon className='size-4 shrink-0' aria-hidden='true' />
            </div>
            <p className='mt-3 text-3xl font-semibold tabular-nums'>
              {query.isPending || query.error ? '—' : count}
            </p>
          </button>
        ))}
      </div>
      <div className='flex flex-wrap items-end gap-3'>
        <div className='relative w-full sm:w-64'>
          <label
            htmlFor='delivery-order-search'
            className='mb-2 block text-sm font-medium'
          >
            Find an order
          </label>
          <Search
            className='text-muted-foreground absolute bottom-2.5 left-3 size-4'
            aria-hidden='true'
          />
          <Input
            id='delivery-order-search'
            className='pl-9'
            placeholder='Order ID or item name'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Choice
          label='Order state'
          value={state}
          onChange={(event) => setState(event.target.value)}
        >
          <option value='ACTIVE'>Active orders</option>
          <option value='ALL'>All orders</option>
          <option value='REVIEW'>Needs attention</option>
          {orderStates.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, ' ')}
            </option>
          ))}
        </Choice>
        <Choice
          label='Provider'
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
        >
          <option value='ALL'>All providers</option>
          <option value='GOFOOD'>GoFood</option>
          <option value='GRABFOOD'>GrabFood</option>
        </Choice>
        <Button
          variant='outline'
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw className='mr-2 size-4' aria-hidden='true' />
          Refresh orders
        </Button>
        <p className='text-muted-foreground text-xs' role='status'>
          {query.isFetching
            ? 'Checking for updates…'
            : `Checks every 5 seconds · Last checked ${query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toLocaleTimeString() : '—'}`}
        </p>
      </div>
      <ErrorNotice error={query.error} />
      {query.error && (
        <Notice>
          Updates are unavailable. Displayed orders may be stale; verify current
          provider status before acting.
        </Notice>
      )}
      {query.isPending ? (
        <p role='status'>Loading delivery orders…</p>
      ) : !orders.length ? (
        <EmptyState
          title={query.error ? 'Orders unavailable' : 'No orders to show'}
          description={
            query.error
              ? 'Refresh when the connection is available again.'
              : state === 'ACTIVE'
                ? 'New GoFood and GrabFood orders will appear here when your outlet integration is enabled.'
                : 'Try another status, provider, or search to find an order.'
          }
        />
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {orders.map((order) => (
            <Panel
              key={order.id}
              title={`#${order.displayId || order.externalId}`}
            >
              <div className='flex flex-wrap gap-2'>
                <ProviderMark provider={order.provider} />
                <Status value={order.state} />
              </div>
              {reviewMessages[order.processingState] && (
                <p className='text-destructive text-sm'>
                  {reviewMessages[order.processingState]}
                </p>
              )}
              <p className='text-sm'>
                {order.items.reduce((total, item) => total + item.quantity, 0)}{' '}
                items · {money(order.total, order.currency)}
              </p>
              <p className='text-muted-foreground truncate text-sm'>
                {order.items
                  .slice(0, 3)
                  .map((item) => `${item.quantity}× ${item.name}`)
                  .join(', ')}
              </p>
              {order.scheduledAt && (
                <p className='text-sm'>
                  Scheduled: {dateTime(order.scheduledAt)}
                </p>
              )}
              <Button
                className='w-full'
                variant='outline'
                onClick={() => setSelectedId(order.id)}
              >
                View order
              </Button>
            </Panel>
          ))}
        </div>
      )}
      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Delivery order</DialogTitle>
            <DialogDescription>
              Provider status, preparation, and pickup details.
            </DialogDescription>
          </DialogHeader>
          {selectedId && <OrderDetails key={selectedId} id={selectedId} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrderDetails({ id }: { id: string }) {
  const { admin, owner } = useDeliveryAccess()
  const query = useDeliveryQuery(
    ['order', id],
    (signal) => deliveryApi.order(id, signal),
    true,
    5000
  )
  const history = useDeliveryQuery(
    ['events', id],
    (signal) => deliveryApi.events(id, signal),
    true,
    5000
  )
  const [intent, setIntent] = useState<Omit<
    ActionInput,
    'idempotencyKey'
  > | null>(null)
  const [cancelCode, setCancelCode] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [commandId, setCommandId] = useDeliverySession<string | null>(
    `command:${id}`,
    () => null
  )
  const keyFor = useIntentKey(`order:${id}`)
  const latestCommand = useDeliveryQuery(
    ['command', commandId],
    (signal) => deliveryApi.command(commandId!, signal),
    !!commandId,
    5000
  )
  const commandUnresolved =
    !!commandId &&
    (!latestCommand.data ||
      ['PENDING', 'PROCESSING', 'UNKNOWN'].includes(latestCommand.data.status))
  const mutation = useDeliveryMutation(
    async (input: Omit<ActionInput, 'idempotencyKey'>) =>
      deliveryApi.action(id, { ...input, idempotencyKey: await keyFor(input) }),
    (command) => {
      setCommandId(command.id)
      setIntent(null)
      setConfirmed(false)
    }
  )
  const order = query.data
  if (!order)
    return (
      <>
        <ErrorNotice error={query.error} />
        {query.isPending && <p role='status'>Loading order…</p>}
      </>
    )
  const actions = availableActions(order, admin)
  return (
    <div className='space-y-4'>
      <ErrorNotice error={query.error} />
      <h3 className='font-semibold'>
        #{order.displayId} · {providers[order.provider].name}
      </h3>
      <div className='flex flex-wrap gap-2'>
        <Status value={order.state} />
        <Status value={order.processingState} />
      </div>
      <p className='text-muted-foreground text-sm'>
        Provider: {order.providerState} · Version {order.version}
      </p>
      {reviewMessages[order.processingState] && (
        <Notice>{reviewMessages[order.processingState]}</Notice>
      )}
      {order.financialError && <Notice>{order.financialError}</Notice>}
      {order.scheduledAt && (
        <Notice>
          Scheduled for {dateTime(order.scheduledAt)}. Preparation is available
          only within this outlet’s configured lead time.
        </Notice>
      )}
      <ul className='divide-y'>
        {order.items.map((item) => (
          <li key={item.id} className='py-3'>
            <div className='flex justify-between gap-3'>
              <span>
                {item.quantity} × {item.name}
              </span>
              <span>{money(item.unitPrice, order.currency)} each</span>
            </div>
            {item.notes && (
              <p className='text-muted-foreground text-sm'>{item.notes}</p>
            )}
            {item.options.length > 0 && (
              <p className='text-muted-foreground text-xs'>
                Options:{' '}
                {item.options
                  .map((option) => `${option.quantity} × ${option.externalId}`)
                  .join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className='font-semibold'>
        Provider total: {money(order.total, order.currency)}
      </p>
      <div className='flex flex-wrap gap-2'>
        {actions.map((action) => (
          <Button
            key={action}
            variant={
              ['CANCEL', 'REJECT'].includes(action) ? 'destructive' : 'outline'
            }
            disabled={
              mutation.isPending ||
              !!query.error ||
              !!intent ||
              commandUnresolved
            }
            onClick={() => {
              setIntent({ action, expectedVersion: order.version })
              setConfirmed(false)
              setCancelCode('')
              mutation.reset()
            }}
          >
            {actionLabels[action]}
          </Button>
        ))}
      </div>
      {intent && (
        <Panel title={actionLabels[intent.action]}>
          <ActionExplanation action={intent.action} order={order} />
          {intent.action === 'CANCEL' && (
            <Choice
              label='Provider cancellation code'
              value={cancelCode}
              onChange={(event) => setCancelCode(event.target.value)}
              required
            >
              <option value=''>Select a verified provider code</option>
              {[1001, 1002, 1003, 1004].map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Choice>
          )}
          <label className='flex items-start gap-2 text-sm'>
            <input
              type='checkbox'
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            I have checked this order and confirm this action.
          </label>
          <ErrorNotice error={mutation.error} />
          {mutation.error && (
            <Notice>
              Check the refreshed order. Retrying here uses the same request key
              and version; close this form to choose a new action.
            </Notice>
          )}
          <div className='flex gap-2'>
            <Button
              disabled={
                !confirmed ||
                mutation.isPending ||
                (intent.action === 'CANCEL' && !cancelCode)
              }
              onClick={() =>
                mutation.mutate({
                  ...intent,
                  ...(intent.action === 'CANCEL'
                    ? { cancelCode: Number(cancelCode) }
                    : {}),
                })
              }
            >
              {mutation.isPending ? 'Submitting…' : 'Confirm action'}
            </Button>
            <Button
              variant='ghost'
              disabled={mutation.isPending}
              onClick={() => setIntent(null)}
            >
              Close
            </Button>
          </div>
        </Panel>
      )}
      {commandId && <CommandStatus id={commandId} />}
      <Fulfillment id={id} />
      {owner && order.transactionId && <AdjustmentForm orderId={id} />}
      <details>
        <summary className='cursor-pointer font-medium'>
          Operational history
        </summary>
        <ErrorNotice error={history.error} />
        {history.isPending && <p>Loading history…</p>}
        <ul className='mt-3 space-y-2'>
          {history.data?.map((event) => (
            <li key={event.id} className='text-sm'>
              <strong>{event.type.replace(/_/g, ' ')}</strong>
              <span className='text-muted-foreground'>
                {' '}
                · {dateTime(event.createdAt)}
              </span>
              {event.details != null && <JsonDetails value={event.details} />}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

function ActionExplanation({
  action,
  order,
}: {
  action: Action
  order: DeliveryOrder
}) {
  const text =
    action === 'START_PREPARATION'
      ? 'Starting preparation consumes mapped inventory once, including variants and modifiers.'
      : action === 'ACKNOWLEDGE_EXTERNAL_INVENTORY'
        ? 'Confirm manual stock records show inventory was handled outside Ansilum. This does not deduct stock or create cost-of-goods records.'
        : action === 'CANCEL' || action === 'REJECT'
          ? `The provider must confirm this request.${order.preparedAt ? ' Inventory already consumed will remain consumed; reconcile recoverable stock or waste separately.' : ''}`
          : 'This request stays pending until its provider outcome is confirmed.'
  return <p className='text-sm'>{text}</p>
}

function Fulfillment({ id }: { id: string }) {
  const [visible, setVisible] = useState(false)
  // Use component state rather than the shared query cache for pickup/contact data.
  const mutation = useMutation({
    mutationFn: () => deliveryApi.fulfillment(id),
    retry: false,
    gcTime: 0,
    onSuccess: () => setVisible(true),
  })
  return (
    <div className='space-y-2'>
      <Button
        variant='outline'
        disabled={mutation.isPending}
        onClick={() => {
          if (visible) {
            setVisible(false)
            mutation.reset()
          } else mutation.mutate(undefined)
        }}
      >
        {visible
          ? 'Hide pickup details'
          : mutation.isPending
            ? 'Loading pickup details…'
            : 'Reveal pickup details'}
      </Button>
      <ErrorNotice error={mutation.error} />
      {visible && (
        <div className='bg-muted space-y-3 rounded-lg p-4'>
          {typeof mutation.data?.pickupPin === 'string' && (
            <div>
              <p className='text-muted-foreground text-xs'>Pickup PIN</p>
              <p className='mt-1 font-sans tabular-nums text-2xl font-semibold tracking-widest'>
                {mutation.data.pickupPin}
              </p>
            </div>
          )}
          {mutation.data?.virtualContact != null && (
            <div>
              <p className='text-muted-foreground text-xs'>Provider contact</p>
              {typeof mutation.data.virtualContact === 'string' ? (
                <p className='mt-1 font-medium'>
                  {mutation.data.virtualContact}
                </p>
              ) : (
                <JsonDetails value={mutation.data.virtualContact} />
              )}
            </div>
          )}
          {!mutation.data?.pickupPin && !mutation.data?.virtualContact && (
            <p className='text-sm'>
              Pickup and contact details are unavailable or have expired.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
