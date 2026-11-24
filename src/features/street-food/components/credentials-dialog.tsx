import { useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { AlertTriangle, Eye, EyeOff } from '@/components/icons'
import {
  registrationCurl,
  registrationDetails,
  registrationJson,
} from '../street-food.logic'
import { CopyButton } from './copy-button'

export interface Credentials {
  tenantId: string
  keyId: string
  secret: string
  platformUrl: string
  businessName: string
}

/**
 * The only time the secret is visible. It cannot be dismissed by a stray click or Escape, and
 * "Done" waits until the owner confirms they saved it. What the platform operator needs is
 * one copy away: the details as JSON, or as a ready command.
 */
export function CredentialsDialog({
  credentials,
  rotated,
  defaultPosAddress,
  onDone,
}: {
  credentials: Credentials | null
  /** A new secret for an existing link, not a first connection. */
  rotated: boolean
  defaultPosAddress: string
  onDone: () => void
}) {
  const copy = useCopy()
  const [posAddress, setPosAddress] = useState(defaultPosAddress)
  const [view, setView] = useState<'json' | 'curl'>('json')
  const [reveal, setReveal] = useState(false)
  const [saved, setSaved] = useState(false)

  const details = credentials
    ? registrationDetails({
        name: credentials.businessName,
        tenantId: credentials.tenantId,
        keyId: credentials.keyId,
        secret: credentials.secret,
        posBaseUrl: posAddress,
      })
    : null
  const text =
    details && credentials
      ? rotated || view === 'json'
        ? registrationJson(details)
        : registrationCurl(details, credentials.platformUrl)
      : ''

  return (
    <Dialog open={credentials !== null}>
      <DialogContent
        className='sm:max-w-2xl'
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {rotated
              ? copy('Kunci rahasia baru', 'Your new secret key')
              : copy('Usaha Anda terhubung', 'Your business is connected')}
          </DialogTitle>
          <DialogDescription>
            {rotated
              ? copy(
                  'Kirim rincian ini ke operator StreetFood agar mereka memperbarui koneksi Anda. Sampai itu selesai, outlet Anda tidak tersinkron.',
                  'Send these details to your StreetFood operator so they can update your connection. Until they do, your outlets will not sync.'
                )
              : copy(
                  'Kirim rincian ini ke operator StreetFood agar mereka mendaftarkan usaha Anda. Setelah itu outlet Anda tampil di aplikasi.',
                  'Send these details to your StreetFood operator so they can register your business. After that your outlets appear in the app.'
                )}
          </DialogDescription>
        </DialogHeader>

        {credentials && details && (
          <div className='space-y-4'>
            <Alert>
              <AlertTriangle aria-hidden />
              <AlertTitle>
                {copy('Simpan sekarang', 'Save this now')}
              </AlertTitle>
              <AlertDescription>
                {copy(
                  'Kunci rahasia hanya tampil sekali. Jika hilang, Anda harus membuat yang baru.',
                  'The secret is shown only once. If you lose it you will have to create a new one.'
                )}
              </AlertDescription>
            </Alert>

            <dl className='grid gap-3 sm:grid-cols-2'>
              <Field
                label={copy('ID usaha', 'Business ID')}
                value={credentials.tenantId}
              />
              <Field
                label={copy('ID kunci', 'Key ID')}
                value={credentials.keyId}
              />
              <div className='sm:col-span-2'>
                <dt className='text-fg-muted mb-1 text-[13px]'>
                  {copy('Kunci rahasia', 'Secret key')}
                </dt>
                <dd className='flex items-center gap-2'>
                  <code
                    className='bg-muted min-w-0 flex-1 rounded px-2 py-1.5 text-[13px] break-all'
                    data-testid='secret'
                  >
                    {reveal ? credentials.secret : '•'.repeat(24)}
                  </code>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setReveal((value) => !value)}
                    aria-pressed={reveal}
                  >
                    {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
                    {reveal
                      ? copy('Sembunyikan', 'Hide')
                      : copy('Tampilkan', 'Show')}
                  </Button>
                  <CopyButton value={credentials.secret} />
                </dd>
              </div>
            </dl>

            <div className='space-y-1.5'>
              <Label htmlFor='pos-address'>
                {copy('Alamat POS ini', 'This POS’s address')}
              </Label>
              <Input
                id='pos-address'
                value={posAddress}
                onChange={(event) => setPosAddress(event.target.value)}
                inputMode='url'
                spellCheck={false}
              />
              <p className='text-fg-muted text-[13px]'>
                {copy(
                  'Alamat yang dipakai platform untuk menghubungi POS. Ubah jika berbeda dari yang tertera.',
                  'The address the platform uses to reach this POS. Change it if it is not the right one.'
                )}
              </p>
            </div>

            <div className='space-y-2'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='text-sm font-medium'>
                  {copy(
                    'Untuk operator StreetFood',
                    'For the StreetFood operator'
                  )}
                </p>
                {!rotated && (
                  <SegmentedControl
                    aria-label={copy('Format', 'Format')}
                    value={view}
                    onValueChange={setView}
                    options={[
                      { value: 'json', label: copy('Rincian', 'Details') },
                      { value: 'curl', label: copy('Perintah', 'Command') },
                    ]}
                  />
                )}
              </div>
              <pre
                className='bg-muted max-h-48 overflow-auto rounded-md p-3 text-[12px] leading-5 break-all whitespace-pre-wrap'
                data-testid='registration'
              >
                {text}
              </pre>
              <CopyButton
                variant='default'
                value={text}
                label={
                  rotated || view === 'json'
                    ? copy(
                        'Salin rincian untuk operator',
                        'Copy details for the operator'
                      )
                    : copy('Salin perintah', 'Copy command')
                }
              />
              <p className='text-fg-muted text-[13px]'>
                {rotated
                  ? copy(
                      'Operator memakai rincian ini untuk memperbarui usaha Anda yang sudah terdaftar.',
                      'The operator uses these details to update your already-registered business.'
                    )
                  : copy(
                      'Sudah pernah terdaftar (misalnya Anda menghubungkan ulang)? Operator memperbarui koneksi yang ada, bukan mendaftar lagi.',
                      'Registered before (for example you reconnected)? The operator updates the existing connection instead of registering again.'
                    )}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className='items-center gap-3 sm:justify-between'>
          <Label className='text-sm font-normal'>
            <Checkbox
              checked={saved}
              onCheckedChange={(value) => setSaved(value === true)}
            />
            {copy(
              'Saya sudah menyimpan rincian ini',
              'I have saved these details'
            )}
          </Label>
          <Button
            type='button'
            disabled={!saved}
            onClick={() => {
              setSaved(false)
              setReveal(false)
              onDone()
            }}
          >
            {copy('Selesai', 'Done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className='min-w-0'>
      <dt className='text-fg-muted mb-1 text-[13px]'>{label}</dt>
      <dd className='flex items-center gap-2'>
        <code className='bg-muted min-w-0 flex-1 rounded px-2 py-1.5 text-[13px] break-all'>
          {value}
        </code>
        <CopyButton value={value} />
      </dd>
    </div>
  )
}
