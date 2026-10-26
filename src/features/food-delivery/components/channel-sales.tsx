import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deliveryApi } from '../delivery.api'
import { money, dateTime, reportPeriod } from '../delivery.logic'
import {
  useDeliveryMutation,
  useDeliveryQuery,
  useIntentKey,
} from '../delivery.queries'
import type { AdjustmentInput } from '../delivery.types'
import { Choice, ErrorNotice, Field, Notice, Panel } from './shared'

export function ChannelSales({ outletId }: { outletId: string }) {
  const [start, setStart] = useState(() =>
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  )
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [allOutlets, setAllOutlets] = useState(false)
  const [params, setParams] = useState<{
    start: string
    end: string
    outletId?: string
  } | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const report = useDeliveryQuery(
    ['report', params],
    (signal) => deliveryApi.report(params!, signal),
    !!params
  )
  return (
    <Panel title='Sales by channel'>
      <Notice>
        Closed sales are provider-collected amounts or receivables, not bank
        payouts. Adjustments only include confirmed activity explicitly recorded
        here. Delivery sales remain separate from existing POS reports.
      </Notice>
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault()
          try {
            setParams({
              ...reportPeriod(start, end),
              ...(!allOutlets ? { outletId } : {}),
            })
            setError(null)
          } catch (error) {
            setError(error as Error)
          }
        }}
      >
        <div className='grid gap-4 sm:grid-cols-3'>
          <Field
            label='Start date (inclusive, UTC)'
            type='date'
            value={start}
            onChange={(event) => setStart(event.target.value)}
            required
          />
          <Field
            label='End date (exclusive, UTC)'
            type='date'
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            required
          />
          <Choice
            label='Report scope'
            value={allOutlets ? 'all' : 'outlet'}
            onChange={(event) => setAllOutlets(event.target.value === 'all')}
          >
            <option value='outlet'>Selected outlet</option>
            <option value='all'>All outlets</option>
          </Choice>
        </div>
        <ErrorNotice error={error} />
        <Button disabled={report.isFetching || (!allOutlets && !outletId)}>
          Run report
        </Button>
      </form>
      <ErrorNotice error={report.error} />
      {report.isFetching && <p role='status'>Loading channel sales…</p>}
      {report.data && (
        <div className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            {dateTime(report.data.start)} to {dateTime(report.data.end)}{' '}
            (exclusive)
          </p>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='border-b'>
                  <th className='p-2'>Channel</th>
                  <th className='p-2'>Closed sales</th>
                  <th className='p-2'>Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.data.sales.map((sale) => (
                  <tr key={sale.source} className='border-b'>
                    <td className='p-2'>{sale.source}</td>
                    <td className='p-2'>{sale._count}</td>
                    <td className='p-2'>
                      {money(sale._sum.grandTotal, report.data.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!report.data.sales.length && (
            <p>No closed sales in this interval.</p>
          )}
          <h3 className='font-medium'>Recorded delivery adjustments</h3>
          <p className='text-muted-foreground text-sm'>
            These totals combine delivery providers; the report API does not
            allocate adjustments by channel.
          </p>
          <ul className='space-y-2'>
            {report.data.adjustments.map((item) => (
              <li
                key={`${item.kind}:${item.currency}`}
                className='flex justify-between gap-3 text-sm'
              >
                <span>{item.kind}</span>
                <span>{money(item._sum.amount, item.currency)}</span>
              </li>
            ))}
          </ul>
          {!report.data.adjustments.length && (
            <p className='text-sm'>No recorded adjustments.</p>
          )}
          <Notice>{report.data.settlement}</Notice>
        </div>
      )}
    </Panel>
  )
}

export function AdjustmentForm({ orderId }: { orderId: string }) {
  const [kind, setKind] = useState<AdjustmentInput['kind']>('REFUND')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [occurredAt, setOccurredAt] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const keyFor = useIntentKey(`adjustment:${orderId}`)
  const mutation = useDeliveryMutation(
    async () => {
      const input = {
        kind,
        amount,
        reference: reference.trim(),
        occurredAt: new Date(occurredAt).toISOString(),
      }
      if (!/^\d{1,10}(\.\d{1,2})?$/.test(amount))
        throw new Error(
          'Enter a positive decimal amount with up to two decimal places.'
        )
      if (!input.reference) throw new Error('A provider reference is required.')
      return deliveryApi.adjust(orderId, {
        ...input,
        idempotencyKey: await keyFor(input),
      })
    },
    () => setConfirmed(false)
  )
  return (
    <details className='bg-card rounded-md border p-3'>
      <summary className='cursor-pointer font-medium'>
        Record financial adjustment
      </summary>
      <form
        className='mt-4 space-y-3'
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined)
        }}
      >
        <Notice>
          This records confirmed provider activity. It does not initiate a
          refund or payout.
        </Notice>
        <Choice
          label='Adjustment type'
          value={kind}
          onChange={(event) =>
            setKind(event.target.value as AdjustmentInput['kind'])
          }
        >
          {['REFUND', 'FEE', 'SUBSIDY', 'SETTLEMENT'].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Choice>
        <Field
          label='Amount (IDR)'
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode='decimal'
          pattern='[0-9]{1,10}(\.[0-9]{1,2})?'
          required
        />
        <Field
          label='Provider reference'
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          maxLength={256}
          required
        />
        <Field
          label='Occurred at (local time)'
          type='datetime-local'
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
          required
        />
        <label className='flex items-start gap-2 text-sm'>
          <input
            type='checkbox'
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          This activity is confirmed in the provider records.
        </label>
        <ErrorNotice error={mutation.error} />
        {mutation.isSuccess && <p role='status'>Adjustment recorded.</p>}
        <Button disabled={!confirmed || mutation.isPending}>
          Record adjustment
        </Button>
      </form>
    </details>
  )
}
