import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deliveryApi } from '../delivery.api'
import { dateTime } from '../delivery.logic'
import {
  useDeliveryAccess,
  useDeliveryMutation,
  useDeliveryQuery,
} from '../delivery.queries'
import {
  Choice,
  ErrorNotice,
  Field,
  JsonDetails,
  Notice,
  Panel,
  Status,
} from './shared'

export function Recovery() {
  const query = useDeliveryQuery(
    ['health'],
    (signal) => deliveryApi.health(signal),
    true,
    15000
  )
  const [replayId, setReplayId] = useState('')
  const [lookup, setLookup] = useState('')
  const [kind, setKind] = useState('command')
  const [inspected, setInspected] = useState<{
    id: string
    kind: string
  } | null>(null)
  const replay = useDeliveryMutation(
    () => deliveryApi.replay(replayId),
    () => setReplayId('')
  )
  return (
    <div className='space-y-4'>
      <Panel title='Delivery health'>
        <div className='flex items-center justify-between gap-3'>
          <p className='text-muted-foreground text-sm'>
            Failed and blocked events retain their original deduplication
            identity when replayed.
          </p>
          <Button
            variant='outline'
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Refresh
          </Button>
        </div>
        <ErrorNotice error={query.error} />
        {query.isPending && <p role='status'>Loading delivery health…</p>}
        {query.data && (
          <>
            <div className='flex flex-wrap gap-2'>
              {query.data.queues.map((queue) => (
                <span
                  key={queue.status}
                  className='bg-muted rounded-md px-3 py-2 text-sm'
                >
                  {queue.status}: <strong>{queue._count}</strong>
                </span>
              ))}
            </div>
            <p className='text-sm'>
              Oldest pending event: {dateTime(query.data.oldestPendingAt)}
            </p>
            {!query.data.exceptions.length ? (
              <Notice>No failed or blocked events.</Notice>
            ) : (
              <ul className='divide-y'>
                {query.data.exceptions.map((exception) => (
                  <li key={exception.id} className='space-y-2 py-3'>
                    <p className='text-sm font-medium'>
                      {exception.errorCode ?? 'Processing exception'}
                    </p>
                    <p className='text-muted-foreground text-xs break-all'>
                      Event: {exception.id}
                      <br />
                      Connection: {exception.connectionId} ·{' '}
                      {exception.attempts} attempts ·{' '}
                      {dateTime(exception.receivedAt)}
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setReplayId(exception.id)
                        replay.reset()
                      }}
                    >
                      Review replay
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {replayId && (
          <Notice>
            <div className='space-y-3'>
              <p>
                Replay event {replayId} only after correcting mappings or the
                cause reported above.
              </p>
              <ErrorNotice error={replay.error} />
              <div className='flex gap-2'>
                <Button
                  disabled={replay.isPending}
                  onClick={() => replay.mutate(undefined)}
                >
                  Cause corrected — replay event
                </Button>
                <Button
                  variant='ghost'
                  disabled={replay.isPending}
                  onClick={() => setReplayId('')}
                >
                  Close
                </Button>
              </div>
            </div>
          </Notice>
        )}
      </Panel>
      <Panel title='Inspect a command or operation'>
        <form
          className='flex flex-wrap items-end gap-3'
          onSubmit={(event) => {
            event.preventDefault()
            setInspected({ id: lookup.trim(), kind })
          }}
        >
          <Choice
            label='Record type'
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value='command'>Order command</option>
            <option value='operation'>Provider operation</option>
          </Choice>
          <Field
            label='Record UUID'
            value={lookup}
            onChange={(event) => setLookup(event.target.value)}
            required
            pattern='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
          />
          <Button>Inspect</Button>
        </form>
        {inspected &&
          (inspected.kind === 'command' ? (
            <CommandStatus key={inspected.id} id={inspected.id} />
          ) : (
            <OperationStatus key={inspected.id} id={inspected.id} />
          ))}
      </Panel>
    </div>
  )
}

export function CommandStatus({ id }: { id: string }) {
  const { admin } = useDeliveryAccess()
  const query = useDeliveryQuery(
    ['command', id],
    (signal) => deliveryApi.command(id, signal),
    true,
    5000
  )
  const [outcome, setOutcome] = useState<'SUCCEEDED' | 'FAILED'>('SUCCEEDED')
  const [evidence, setEvidence] = useState('')
  const [verified, setVerified] = useState(false)
  const resolution = useDeliveryMutation(() =>
    deliveryApi.resolve(id, outcome, evidence.trim())
  )
  return (
    <div className='space-y-3 rounded-md border p-3'>
      <p className='text-xs break-all'>Command ID: {id}</p>
      <ErrorNotice error={query.error} />
      {query.isPending && <p role='status'>Checking command…</p>}
      {query.data && (
        <>
          <p className='text-sm'>{query.data.action.replace(/_/g, ' ')}</p>
          <Status value={query.data.status} />
          {query.data.errorCode && (
            <p className='text-sm'>{query.data.errorCode}</p>
          )}
          {['PENDING', 'PROCESSING'].includes(query.data.status) && (
            <Notice>
              Waiting for a confirmed outcome. Do not repeat this action in the
              provider application without checking its status.
            </Notice>
          )}
          {query.data.status === 'UNKNOWN' && (
            <>
              <Notice>
                The provider outcome is unknown. Verify it in the provider
                application or API before resolving. Resolution records your
                evidence and never resends the command.
              </Notice>
              {admin && (
                <form
                  className='space-y-3'
                  onSubmit={(event) => {
                    event.preventDefault()
                    resolution.mutate(undefined)
                  }}
                >
                  <Choice
                    label='Verified outcome'
                    value={outcome}
                    onChange={(event) =>
                      setOutcome(event.target.value as 'SUCCEEDED' | 'FAILED')
                    }
                  >
                    <option value='SUCCEEDED'>Succeeded</option>
                    <option value='FAILED'>Failed</option>
                  </Choice>
                  <Field
                    label='Provider verification evidence'
                    value={evidence}
                    onChange={(event) => setEvidence(event.target.value)}
                    minLength={8}
                    maxLength={500}
                    required
                  />
                  <label className='flex items-start gap-2 text-sm'>
                    <input
                      type='checkbox'
                      checked={verified}
                      onChange={(event) => setVerified(event.target.checked)}
                    />
                    I verified this outcome against provider records.
                  </label>
                  <ErrorNotice error={resolution.error} />
                  <Button
                    disabled={
                      resolution.isPending ||
                      !verified ||
                      evidence.trim().length < 8
                    }
                  >
                    Record verified outcome
                  </Button>
                </form>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function OperationStatus({ id }: { id: string }) {
  const query = useDeliveryQuery(
    ['operation', id],
    (signal) => deliveryApi.operation(id, signal),
    true,
    5000
  )
  return (
    <div className='space-y-3'>
      <ErrorNotice error={query.error} />
      {query.isPending && <p role='status'>Checking operation…</p>}
      {query.data && (
        <>
          <p>{query.data.action.replace(/_/g, ' ')}</p>
          <Status value={query.data.status} />
          {query.data.errorCode && <p>{query.data.errorCode}</p>}
          {query.data.result != null && (
            <JsonDetails value={query.data.result} />
          )}
          {query.data.status === 'UNKNOWN' && (
            <Notice>
              This operation needs provider/operator reconciliation before using
              a new operation key. There is no automatic replay or local
              resolution for unknown operations.
            </Notice>
          )}
        </>
      )}
    </div>
  )
}
