import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { useBlocksQuery, useUnblockMutation } from '../street-food.queries'

/**
 * Customers this business chose not to serve again. Empty means nothing is shown: most
 * businesses never use it. Anyone can add to it from an order; the owner takes people off.
 */
export function BlockedCustomers({
  tenantId,
  canEdit,
}: {
  tenantId: string | undefined
  canEdit: boolean
}) {
  const copy = useCopy()
  const blocks = useBlocksQuery(tenantId, canEdit)
  const unblock = useUnblockMutation(tenantId, {
    failed: copy('Belum berhasil', 'That did not work'),
    saved: copy('Pelanggan bisa memesan lagi', 'This customer can order again'),
  })

  if (!blocks.data || blocks.data.length === 0) return null

  return (
    <section aria-labelledby='sf-blocked' className='space-y-3'>
      <h2 id='sf-blocked' className='text-base font-semibold'>
        {copy('Pelanggan yang tidak dilayani', 'Customers you do not serve')}
      </h2>
      <ul className='bg-card shadow-surface divide-divider divide-y rounded-lg border px-4'>
        {blocks.data.map((blocked) => (
          <li
            key={blocked.id}
            className='flex items-center justify-between gap-3 py-3'
          >
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium'>
                {blocked.customerName || copy('Tanpa nama', 'No name')}
              </p>
              <p className='text-fg-muted text-xs'>
                {copy('Sejak', 'Since')}{' '}
                {new Date(blocked.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={unblock.isPending}
              onClick={() => unblock.mutate(blocked.id)}
            >
              {copy('Layani lagi', 'Serve again')}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
