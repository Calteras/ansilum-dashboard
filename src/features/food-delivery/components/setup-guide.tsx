import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Plus,
  PowerOff,
  Shield,
} from '@/components/icons'
import { deliveryApi } from '../delivery.api'
import { operationInfo, providers } from '../delivery.providers'
import { useDeliveryQuery } from '../delivery.queries'
import type { Connection, Provider } from '../delivery.types'
import { MenuMappings } from './menu-mappings'
import { ProviderMenu, ProviderOperations } from './provider-operations'
import {
  AccountSummary,
  BindOutlet,
  BindingFlags,
  ConnectionFlags,
  CreateConnection,
  OutletLinkSummary,
} from './setup-forms'
import { Choice, ErrorNotice, Notice, Status } from './shared'

type StepId = 'account' | 'outlet' | 'menu' | 'items' | 'activate' | 'live'

const stepTitles: Record<StepId, string> = {
  account: 'Connect your account',
  outlet: 'Link your outlet',
  menu: 'Prepare the delivery menu',
  items: 'Match menu items',
  activate: 'Activate with the provider',
  live: 'Go live',
}

const overview: { id: StepId; summary: string }[] = [
  { id: 'account', summary: 'Enter the partner account your operator set up.' },
  { id: 'outlet', summary: 'Tell Ansilum which store is which outlet.' },
  { id: 'menu', summary: 'Save the menu customers will see.' },
  { id: 'items', summary: 'Match delivery items to your products.' },
  { id: 'activate', summary: 'Allow updates, then activate and publish.' },
  { id: 'live', summary: 'Start processing orders, stock and sales.' },
]

/** First-run explainer shown before a provider is picked. */
export function SetupOverview() {
  return (
    <section className='space-y-5' aria-labelledby='delivery-setup-overview'>
      <div className='space-y-1'>
        <h2 id='delivery-setup-overview' className='text-lg font-semibold'>
          How setup works
        </h2>
        <p className='text-muted-foreground max-w-prose text-sm'>
          Choose GoFood or GrabFood above to begin. Each provider takes six
          steps. You can stop at any point and continue where you left off.
        </p>
      </div>
      <ol className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {overview.map((step, index) => (
          <li key={step.id} className='flex gap-3 rounded-lg border p-4'>
            <StepNumber index={index} state='upcoming' />
            <div>
              <p className='text-sm font-medium'>{stepTitles[step.id]}</p>
              <p className='text-muted-foreground mt-0.5 text-sm'>
                {step.summary}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <GoodToKnow />
    </section>
  )
}

function GoodToKnow({ providerName }: { providerName?: string }) {
  const points = [
    {
      Icon: PowerOff,
      text: 'Everything starts switched off. Orders, stock and sales stay untouched until the last step.',
    },
    {
      Icon: Shield,
      text: 'Secret keys stay on the server. You only enter the name that points to them.',
    },
    {
      Icon: Lock,
      text: `Switching off here doesn’t close your store on ${providerName ?? 'GoFood or GrabFood'}. Pause or close it from the provider’s merchant app.`,
    },
  ]
  return (
    <aside className='bg-muted/50 space-y-3 rounded-lg p-4'>
      <h3 className='text-sm font-semibold'>Good to know</h3>
      <ul className='space-y-3'>
        {points.map(({ Icon, text }) => (
          <li key={text} className='flex gap-3 text-sm'>
            <Icon
              className='text-muted-foreground mt-0.5 size-4 shrink-0'
              aria-hidden='true'
            />
            <span className='text-muted-foreground'>{text}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}

type StepState = 'done' | 'current' | 'upcoming'

function StepNumber({ index, state }: { index: number; state: StepState }) {
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        state === 'done' && 'bg-leaf-soft text-leaf',
        state === 'current' && 'bg-primary text-primary-foreground',
        state === 'upcoming' && 'bg-muted text-muted-foreground'
      )}
    >
      {state === 'done' ? (
        <Check className='size-3.5' aria-hidden='true' />
      ) : (
        index + 1
      )}
    </span>
  )
}

interface Step {
  id: StepId
  title: string
  done: boolean
  /** Why the step can’t be opened yet, if it can’t. */
  locked?: string
}

export function SetupGuide({
  provider,
  accounts,
  connection,
  adding,
  outletId,
  outletName,
  onSelectAccount,
  onAddAccount,
  onCancelAdd,
  onCreated,
}: {
  provider: Provider
  accounts: Connection[]
  connection?: Connection
  adding: boolean
  outletId: string
  outletName?: string
  onSelectAccount: (id: string) => void
  onAddAccount: () => void
  onCancelAdd: () => void
  onCreated: (id: string) => void
}) {
  const info = providers[provider]
  const [picked, setPicked] = useState<StepId>()
  const bindings = useDeliveryQuery(
    ['bindings', connection?.id],
    (signal) => deliveryApi.bindings(connection?.id ?? '', signal),
    !!connection
  )
  const binding = bindings.data?.find((item) => item.outletId === outletId)
  const mappings = useDeliveryQuery(
    ['mappings', binding?.id],
    (signal) => deliveryApi.mappings(binding?.id ?? '', signal),
    !!binding
  )
  const needsAccount = connection ? undefined : 'Connect an account first.'
  const needsOutlet =
    needsAccount ?? (binding ? undefined : 'Link your outlet first.')
  const steps: Step[] = [
    { id: 'account', title: stepTitles.account, done: !!connection },
    {
      id: 'outlet',
      title: stepTitles.outlet,
      done: !!binding,
      locked: needsAccount,
    },
    {
      id: 'menu',
      title: stepTitles.menu,
      done: !!binding?.menu,
      locked: needsOutlet,
    },
    {
      id: 'items',
      title: stepTitles.items,
      done: !!mappings.data?.length,
      locked: needsOutlet,
    },
    {
      id: 'activate',
      title: `Activate with ${info.name}`,
      done: !!connection?.enabled && !!connection.writesEnabled,
      locked: needsOutlet,
    },
    {
      id: 'live',
      title: stepTitles.live,
      done: !!binding?.enabled,
      locked: needsOutlet,
    },
  ]
  const loading =
    (!!connection && bindings.isPending) || (!!binding && mappings.isPending)
  const pickedStep = steps.find((step) => step.id === picked && !step.locked)
  const active = adding
    ? steps[0]
    : (pickedStep ??
      steps.find((step) => !step.done && !step.locked) ??
      steps[steps.length - 1])
  const index = steps.indexOf(active)
  const previous = steps[index - 1]
  const next = steps[index + 1]
  const doneCount = steps.filter((step) => step.done).length
  const outlet = outletName ?? 'this outlet'

  const content: Record<StepId, { intro: string; body: ReactNode }> = {
    account: {
      intro: `Ansilum connects to ${info.name} through a partner account that your server operator sets up. You only need its account ID and credential reference, not the secret keys.${provider === 'GOFOOD' ? ' After connecting, approve access in GoBiz.' : ''}`,
      body:
        adding || !connection ? (
          <CreateConnection
            provider={provider}
            onCreated={onCreated}
            onCancel={adding ? onCancelAdd : undefined}
          />
        ) : (
          <AccountSummary connection={connection} />
        ),
    },
    outlet: {
      intro: `Each ${info.name} store has its own ID. Linking it to ${outlet} tells Ansilum where incoming orders belong.`,
      body: !connection ? null : !outletId ? (
        <Notice>
          Create an active outlet before linking a delivery provider.
        </Notice>
      ) : binding ? (
        <OutletLinkSummary binding={binding} outletName={outlet} />
      ) : (
        <BindOutlet
          key={`${connection.id}:${outletId}`}
          connection={connection}
          outletId={outletId}
          outletName={outlet}
          onLinked={() => setPicked('menu')}
        />
      ),
    },
    menu: {
      intro: `This is the menu customers see on ${info.name}: categories, items, prices and options, written in ${info.name}’s menu format. Delivery prices can differ from your in-store prices. Save it here and publish it in step 5.`,
      body: binding && <ProviderMenu key={binding.id} binding={binding} />,
    },
    items: {
      intro: `Orders from ${info.name} list items by their delivery menu IDs. Match each ID to an Ansilum product, variant or modifier so orders deduct the right stock and land in the right reports. Orders with an unmatched item are held until you match it and replay them in Recovery.`,
      body: binding && <MenuMappings binding={binding} />,
    },
    activate: {
      intro: `First allow Ansilum to work with ${info.name}. Then run the provider actions below in order. Each action is tracked until ${info.name} confirms the result.`,
      body: connection && binding && (
        <div className='space-y-6'>
          <ConnectionFlags
            key={`${connection.id}:${connection.enabled}:${connection.writesEnabled}`}
            connection={connection}
          />
          <LaunchChecklist provider={provider}>
            {(binding.integrationStatus || binding.menuSyncStatus) && (
              <div className='flex flex-wrap items-center gap-2 text-sm'>
                <span className='text-muted-foreground'>
                  Latest from {info.name}:
                </span>
                {binding.integrationStatus && (
                  <Status value={binding.integrationStatus} />
                )}
                {binding.menuSyncStatus && (
                  <Status value={binding.menuSyncStatus} />
                )}
              </div>
            )}
          </LaunchChecklist>
          <ProviderOperations binding={binding} connection={connection} />
        </div>
      ),
    },
    live: {
      intro: `Choose what happens when a ${info.name} order arrives at ${outlet}. Switch on “Process orders for this outlet” when you’re ready to receive orders.`,
      body: binding && (
        <BindingFlags
          key={`${binding.id}:${binding.enabled}:${binding.inventoryEnabled}:${binding.salesEnabled}:${binding.manualAcceptance}:${binding.preparationLeadMinutes}`}
          binding={binding}
        />
      ),
    },
  }

  return (
    <section className='space-y-6' aria-label={`${info.name} setup`}>
      <header className='flex flex-wrap items-center justify-between gap-4 border-b pb-5'>
        <div className='flex items-center gap-4'>
          <img src={info.icon} alt='' className='size-11 shrink-0' />
          <div className='space-y-2'>
            <h2 className='text-xl font-semibold tracking-tight'>
              Set up {info.name} for {outlet}
            </h2>
            <div className='flex items-center gap-3'>
              <div
                className='bg-muted h-1.5 w-32 overflow-hidden rounded-full'
                role='progressbar'
                aria-label='Setup progress'
                aria-valuemin={0}
                aria-valuemax={steps.length}
                aria-valuenow={doneCount}
              >
                <div
                  className='bg-leaf h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none'
                  style={{ width: `${(doneCount / steps.length) * 100}%` }}
                />
              </div>
              <p className='text-muted-foreground text-sm'>
                {loading
                  ? 'Checking your progress…'
                  : `${doneCount} of ${steps.length} steps done`}
              </p>
            </div>
          </div>
        </div>
        {connection && (
          <div className='flex w-full flex-wrap items-end gap-2 sm:w-auto'>
            {accounts.length > 1 && (
              <div className='w-full sm:w-64'>
                <Choice
                  label='Account'
                  value={connection.id}
                  onChange={(event) => onSelectAccount(event.target.value)}
                >
                  {accounts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.accountId} ({item.environment.toLowerCase()})
                    </option>
                  ))}
                </Choice>
              </div>
            )}
            {!adding && (
              <Button variant='ghost' size='sm' onClick={onAddAccount}>
                <Plus className='mr-2 size-4' aria-hidden='true' />
                Add another account
              </Button>
            )}
          </div>
        )}
      </header>
      <ErrorNotice error={bindings.error ?? mappings.error} />
      <div className='grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]'>
        <div className='space-y-6'>
          <nav aria-label='Setup steps'>
            {/* Phones get a compact row of numbers; titles stay readable to screen readers. */}
            <ol className='grid grid-cols-6 gap-1 lg:block lg:space-y-1'>
              {steps.map((step, position) => {
                const state: StepState =
                  step === active ? 'current' : step.done ? 'done' : 'upcoming'
                // Only the first locked step explains what unlocks the rest.
                const note =
                  step.locked && !steps[position - 1]?.locked
                    ? step.locked
                    : step.done && step !== active
                      ? 'Done'
                      : null
                return (
                  <li key={step.id}>
                    <button
                      type='button'
                      disabled={!!step.locked || adding}
                      aria-current={step === active ? 'step' : undefined}
                      onClick={() => setPicked(step.id)}
                      className={cn(
                        'flex w-full items-center justify-center gap-3 rounded-lg p-2 text-left focus-visible:ring-2 disabled:cursor-not-allowed lg:justify-start lg:p-2.5',
                        step === active
                          ? 'bg-muted'
                          : 'enabled:hover:bg-muted/60'
                      )}
                    >
                      <StepNumber index={position} state={state} />
                      <span className='sr-only min-w-0 lg:not-sr-only'>
                        <span
                          className={cn(
                            'block text-sm font-medium',
                            step.locked && 'text-muted-foreground'
                          )}
                        >
                          {step.title}
                        </span>
                        {note && (
                          <span className='text-muted-foreground block text-xs'>
                            {note}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
          <p className='text-muted-foreground text-xs leading-relaxed lg:px-2.5'>
            Checkmarks show saved settings. They don’t confirm that {info.name}{' '}
            has approved your store.
          </p>
          <div className='hidden lg:block'>
            <GoodToKnow providerName={info.name} />
          </div>
        </div>
        <div className='min-w-0 space-y-5'>
          <div className='space-y-2'>
            <p className='text-muted-foreground text-sm'>
              Step {index + 1} of {steps.length}
            </p>
            <h3 className='text-2xl font-semibold tracking-tight'>
              {active.title}
            </h3>
            <p className='text-muted-foreground max-w-prose text-sm leading-relaxed'>
              {content[active.id].intro}
            </p>
          </div>
          {loading ? (
            <p role='status'>Loading setup…</p>
          ) : (
            content[active.id].body
          )}
          {!adding && (
            <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-5'>
              {previous ? (
                <Button variant='ghost' onClick={() => setPicked(previous.id)}>
                  <ArrowLeft className='mr-2 size-4' aria-hidden='true' />
                  Back
                </Button>
              ) : (
                <span />
              )}
              {next && (
                <Button
                  variant={active.done ? 'default' : 'outline'}
                  disabled={!!next.locked}
                  onClick={() => setPicked(next.id)}
                >
                  Next: {next.title}
                  <ArrowRight className='ml-2 size-4' aria-hidden='true' />
                </Button>
              )}
            </div>
          )}
          <div className='lg:hidden'>
            <GoodToKnow providerName={info.name} />
          </div>
        </div>
      </div>
    </section>
  )
}

function LaunchChecklist({
  provider,
  children,
}: {
  provider: Provider
  children?: ReactNode
}) {
  const info = providers[provider]
  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <h4 className='font-semibold'>Run these actions in order</h4>
      <ol className='list-decimal space-y-1.5 pl-5 text-sm'>
        {info.launchSequence.map((action) => (
          <li key={action}>
            <span className='font-medium'>{operationInfo[action].label}</span>
            {action === 'SUBSCRIBE' && (
              <span className='text-muted-foreground'>
                {' '}
                (once for each order event)
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className='text-muted-foreground text-sm'>
        Wait for each action to show Succeeded before starting the next one.
      </p>
      {children}
    </div>
  )
}
