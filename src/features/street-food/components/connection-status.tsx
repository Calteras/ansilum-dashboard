import type { ReactNode } from 'react'
import { STATUS_TONE } from '@/lib/status-tone'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Key,
  Loader2,
  PowerOff,
} from '@/components/icons'
import type { ConnectionState } from '../street-food.logic'
import type { StreetFoodOverview } from '../street-food.types'
import { CopyButton } from './copy-button'

const when = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    : '—'

type Tone = keyof typeof STATUS_TONE

/**
 * One answer to "is this working?": what state the connection is in, in words, and what the
 * owner can do about it. The detail below is for support, collapsed into small print.
 */
export function ConnectionStatus({
  overview,
  state,
  canEdit,
  onNewSecret,
  onDisconnect,
  onReconnect,
  reconnecting = false,
}: {
  overview: StreetFoodOverview
  state: ConnectionState
  canEdit: boolean
  onNewSecret: () => void
  onDisconnect: () => void
  onReconnect: () => void
  reconnecting?: boolean
}) {
  const copy = useCopy()
  const { link, delivery } = overview

  const view: {
    tone: Tone
    icon: ReactNode
    badge: string
    title: string
    body: ReactNode
  } = (() => {
    switch (state) {
      case 'connected':
        return {
          tone: 'success',
          icon: <CheckCircle2 className='text-status-success' aria-hidden />,
          badge: copy('Terhubung', 'Connected'),
          title: copy('Terhubung ke StreetFood', 'Connected to StreetFood'),
          body: copy(
            `Outlet yang Anda tampilkan sudah bisa ditemukan pelanggan. Terakhir diterima platform: ${when(delivery?.lastDeliveredAt ?? null)}.`,
            `Customers can find the outlets you show. The platform last received an update on ${when(delivery?.lastDeliveredAt ?? null)}.`
          ),
        }
      case 'needs_outlet':
        return {
          tone: 'info',
          icon: <Clock className='text-status-info' aria-hidden />,
          badge: copy('Hampir siap', 'Almost ready'),
          title: copy(
            'Pilih outlet yang tampil',
            'Choose which outlets to show'
          ),
          body: copy(
            'Usaha Anda sudah terhubung. Nyalakan minimal satu outlet di bawah agar bisa ditemukan pelanggan.',
            'Your business is connected. Switch on at least one outlet below so customers can find it.'
          ),
        }
      case 'sending':
        return {
          tone: 'info',
          icon: (
            <Loader2 className='text-status-info animate-spin' aria-hidden />
          ),
          badge: copy('Mengirim', 'Sending'),
          title: copy('Mengirim outlet Anda…', 'Sending your outlets…'),
          body: copy(
            'Biasanya hanya beberapa detik. Halaman ini diperbarui sendiri.',
            'This usually takes a few seconds. This page updates by itself.'
          ),
        }
      case 'waiting_registration':
        return {
          tone: 'warning',
          icon: <Clock className='text-status-warning' aria-hidden />,
          badge: copy('Menunggu operator', 'Waiting for the operator'),
          title: copy(
            'Menunggu StreetFood mendaftarkan usaha Anda',
            'Waiting for StreetFood to register your business'
          ),
          body: copy(
            'POS Anda sudah siap, tetapi platform belum mengenali kunci ini. Kirim rincian yang tampil saat Anda menghubungkan ke operator. Sudah dikirim dan masih begini? Kunci rahasia mungkin berbeda, buat yang baru. Halaman ini akan berubah sendiri begitu platform menerima.',
            'Your POS is ready, but the platform does not recognise this key yet. Send the details shown when you connected to the operator. Already sent and still stuck? The secret may differ: create a new one. This page changes by itself once the platform accepts it.'
          ),
        }
      case 'unreachable':
        return {
          tone: 'danger',
          icon: <AlertCircle className='text-status-danger' aria-hidden />,
          badge: copy('Tidak terjangkau', 'Unreachable'),
          title: copy(
            'Platform tidak bisa dihubungi',
            'Can’t reach the platform'
          ),
          body: copy(
            `POS tidak bisa menghubungi ${link?.platformUrl}. Periksa alamatnya dan pastikan platform menyala. Pengiriman diulang otomatis.`,
            `The POS cannot reach ${link?.platformUrl}. Check the address and that the platform is running. Sending is retried automatically.`
          ),
        }
      case 'platform_error':
        return {
          tone: 'danger',
          icon: <AlertCircle className='text-status-danger' aria-hidden />,
          badge: copy('Ada masalah', 'Problem'),
          title: copy(
            'Platform menjawab dengan galat',
            'The platform answered with an error'
          ),
          body: copy(
            `Kode: ${delivery?.lastError}. Pengiriman diulang otomatis. Jika berlanjut, hubungi operator StreetFood.`,
            `Code: ${delivery?.lastError}. Sending is retried automatically. If it continues, contact your StreetFood operator.`
          ),
        }
      case 'key_rejected':
        return {
          tone: 'danger',
          icon: <AlertCircle className='text-status-danger' aria-hidden />,
          badge: copy('Kunci ditolak', 'Key rejected'),
          title: copy(
            'Platform tidak lagi mengenali kunci POS ini',
            'The platform no longer recognises this POS key'
          ),
          body: copy(
            `${delivery?.pending} pembaruan tertahan (${delivery?.lastError}). Biasanya karena kunci rahasia diganti di sini sementara platform masih menyimpan yang lama. Tekan Hubungkan ulang untuk mendaftarkan kunci saat ini ke platform; pembaruan yang tertahan langsung dikirim. Terakhir diterima: ${when(delivery?.lastDeliveredAt ?? null)}.`,
            `${delivery?.pending} updates are held back (${delivery?.lastError}). This usually means the secret was changed here while the platform still holds the old one. Press Reconnect to register the current key at the platform; held-back updates are then sent at once. Last received: ${when(delivery?.lastDeliveredAt ?? null)}.`
          ),
        }
      case 'delayed':
        return {
          tone: 'warning',
          icon: <AlertTriangle className='text-status-warning' aria-hidden />,
          badge: copy('Tertunda', 'Delayed'),
          title: copy('Pembaruan tertunda', 'Updates are delayed'),
          body: copy(
            `${delivery?.pending} pembaruan menunggu dikirim (${delivery?.lastError}). Terakhir diterima: ${when(delivery?.lastDeliveredAt ?? null)}. Diulang otomatis.`,
            `${delivery?.pending} updates are waiting to be sent (${delivery?.lastError}). Last received: ${when(delivery?.lastDeliveredAt ?? null)}. Retrying automatically.`
          ),
        }
      default:
        return {
          tone: 'neutral',
          icon: <PowerOff aria-hidden />,
          badge: copy('Belum terhubung', 'Not connected'),
          title: copy('Belum terhubung', 'Not connected'),
          body: '',
        }
    }
  })()

  return (
    <section
      aria-label={copy('Status koneksi', 'Connection status')}
      className='bg-card shadow-surface rounded-lg border p-4'
    >
      <div className='flex items-start gap-3'>
        <span className='mt-0.5 shrink-0 [&>svg]:size-5'>{view.icon}</span>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-base font-semibold'>{view.title}</h2>
            <Badge variant='outline' className={cn(STATUS_TONE[view.tone])}>
              {view.badge}
            </Badge>
          </div>
          <p className='text-fg-muted mt-1 max-w-prose text-sm' role='status'>
            {view.body}
          </p>
        </div>
      </div>

      {link && (
        <>
          <dl className='mt-4 grid gap-x-6 gap-y-2 border-t pt-3 text-[13px] sm:grid-cols-3'>
            <div className='min-w-0'>
              <dt className='text-fg-muted'>
                {copy('Alamat platform', 'Platform address')}
              </dt>
              <dd className='truncate font-medium'>{link.platformUrl}</dd>
            </div>
            <div className='min-w-0'>
              <dt className='text-fg-muted'>{copy('ID kunci', 'Key ID')}</dt>
              <dd className='flex items-center gap-1'>
                <code className='truncate'>{link.keyId}</code>
                <CopyButton value={link.keyId} variant='ghost' iconOnly />
              </dd>
            </div>
            <div className='min-w-0'>
              <dt className='text-fg-muted'>
                {copy('Terhubung sejak', 'Connected since')}
              </dt>
              <dd className='font-medium'>{when(link.createdAt)}</dd>
            </div>
          </dl>
          {canEdit && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {(state === 'key_rejected' ||
                state === 'waiting_registration') && (
                <Button
                  type='button'
                  size='sm'
                  disabled={reconnecting}
                  onClick={onReconnect}
                >
                  {reconnecting ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : (
                    <Key size={14} />
                  )}
                  {copy('Hubungkan ulang', 'Reconnect')}
                </Button>
              )}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={onNewSecret}
              >
                <Key size={14} />
                {copy('Buat kunci rahasia baru', 'Create a new secret')}
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-destructive'
                onClick={onDisconnect}
              >
                <PowerOff size={14} />
                {copy('Putuskan', 'Disconnect')}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
