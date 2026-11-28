import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { STATUS_TONE } from '@/lib/status-tone'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Info,
  Loader2,
  MapPin,
} from '@/components/icons'
import {
  outletIssues,
  summarizeHours,
  type IssueCode,
} from '../street-food.logic'
import type {
  LocationMode,
  LocationSharing,
  OnlineStatus,
  OutletSettingsInput,
  PolicyLevel,
  StreetFoodOutlet,
} from '../street-food.types'

const TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB (Asia/Jakarta)' },
  { value: 'Asia/Makassar', label: 'WITA (Asia/Makassar)' },
  { value: 'Asia/Jayapura', label: 'WIT (Asia/Jayapura)' },
]

/**
 * One outlet: whether customers see it, whether it takes orders, when, and how customers find
 * it. The answer to "what do customers see right now?" sits at the top so the owner does not
 * have to work it out from the settings.
 */
export function OutletCard({
  outlet,
  canEdit,
  pending,
  onPublish,
  onSave,
  onEditHours,
}: {
  outlet: StreetFoodOutlet
  canEdit: boolean
  pending: boolean
  onPublish: (enabled: boolean) => void
  onSave: (settings: OutletSettingsInput) => void
  onEditHours: () => void
}) {
  const copy = useCopy()
  // Index 0 = Sunday, as the API counts.
  const names = copy(
    'Min,Sen,Sel,Rab,Kam,Jum,Sab',
    'Sun,Mon,Tue,Wed,Thu,Fri,Sat'
  ).split(',')
  const issues = outletIssues(outlet)
  const hoursText = summarizeHours(outlet.hours, names)
  const disabled = !canEdit || pending

  const statusHelp: Record<OnlineStatus, string> = {
    AUTO: copy('Mengikuti jam buka.', 'Follows your opening hours.'),
    OPEN: copy(
      'Buka sampai Anda mengubahnya, apa pun jam bukanya.',
      'Open until you change it, whatever the hours say.'
    ),
    PAUSED: copy(
      'Tetap terlihat, tetapi tidak menerima pesanan.',
      'Stays visible but takes no orders.'
    ),
    CLOSED: copy('Tutup bagi pelanggan.', 'Closed to customers.'),
  }

  return (
    <li className='bg-card shadow-surface rounded-lg border p-4'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <h3 className='text-base font-semibold'>{outlet.name}</h3>
          <p className='text-fg-muted flex items-center gap-1 truncate text-[13px]'>
            <MapPin size={13} aria-hidden />
            {outlet.address ||
              (outlet.locationMode === 'MOBILE'
                ? copy('Gerai keliling', 'Mobile vendor')
                : copy('Tanpa alamat', 'No address'))}
          </p>
        </div>
        <label className='flex shrink-0 items-center gap-2 text-sm'>
          <span className='font-medium'>
            {outlet.enabled
              ? copy('Tampil di StreetFood', 'Shown on StreetFood')
              : copy('Disembunyikan', 'Hidden')}
          </span>
          <Switch
            checked={outlet.enabled}
            disabled={disabled}
            onCheckedChange={onPublish}
            aria-label={copy(
              `Tampilkan ${outlet.name} di StreetFood`,
              `Show ${outlet.name} on StreetFood`
            )}
          />
        </label>
      </div>

      {outlet.enabled ? (
        <div
          className='mt-3 flex flex-wrap gap-2'
          aria-label={copy('Yang dilihat pelanggan', 'What customers see')}
        >
          <Chip tone={outlet.isOpenNow ? 'success' : 'neutral'}>
            {outlet.isOpenNow
              ? copy('Buka sekarang', 'Open now')
              : copy('Tutup sekarang', 'Closed now')}
          </Chip>
          <Chip tone={outlet.acceptingOrders ? 'success' : 'warning'}>
            {outlet.acceptingOrders
              ? copy('Menerima pesanan', 'Taking orders')
              : copy('Tidak menerima pesanan', 'Not taking orders')}
          </Chip>
        </div>
      ) : (
        <p className='text-fg-muted mt-2 text-[13px]'>
          {copy(
            'Pelanggan tidak melihat outlet ini. Nyalakan untuk menampilkannya.',
            'Customers do not see this outlet. Switch it on to show it.'
          )}
        </p>
      )}

      {issues.length > 0 && (
        <ul className='mt-3 space-y-2'>
          {issues.map((issue) => (
            <li key={issue.code}>
              <IssueNote code={issue.code} tone={issue.tone} />
            </li>
          ))}
        </ul>
      )}

      <div className='mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <p className='text-sm font-medium'>{copy('Pesanan', 'Orders')}</p>
          <SegmentedControl
            aria-label={copy(
              `Status pesanan ${outlet.name}`,
              `Order status of ${outlet.name}`
            )}
            value={outlet.onlineStatus}
            onValueChange={(onlineStatus) => onSave({ onlineStatus })}
            options={[
              { value: 'AUTO', label: copy('Otomatis', 'Auto'), disabled },
              { value: 'OPEN', label: copy('Buka', 'Open'), disabled },
              { value: 'PAUSED', label: copy('Jeda', 'Pause'), disabled },
              { value: 'CLOSED', label: copy('Tutup', 'Closed'), disabled },
            ]}
          />
          <p className='text-fg-muted text-[13px]'>
            {statusHelp[outlet.onlineStatus]}
          </p>
        </div>

        <div className='space-y-1.5'>
          <p className='text-sm font-medium'>
            {copy('Jam buka', 'Opening hours')}
          </p>
          <p className='flex items-center gap-1.5 text-[13px]'>
            <Clock size={13} aria-hidden className='text-fg-muted' />
            {hoursText || copy('Belum diatur', 'Not set')}
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={disabled}
            onClick={onEditHours}
          >
            {copy('Atur jam buka', 'Edit hours')}
          </Button>
        </div>
      </div>

      <CustomerPolicy outlet={outlet} disabled={disabled} onSave={onSave} />

      <MoreSettings
        key={settingsKey(outlet)}
        outlet={outlet}
        disabled={disabled}
        onSave={onSave}
      />
    </li>
  )
}

/** Remount the form when the saved values change, so it never shows a stale draft. */
const settingsKey = (o: StreetFoodOutlet) =>
  [o.prepTimeMinutes, o.timezone, o.locationMode, o.locationSharing].join('|')

const POLICY_LEVELS: PolicyLevel[] = ['NONE', 'CAUTION', 'PREPAY_REQUIRED']

/**
 * What this outlet does about customers the platform labels worrying. Nothing happens unless the
 * owner chooses: the platform tells, the vendor decides.
 */
function CustomerPolicy({
  outlet,
  disabled,
  onSave,
}: {
  outlet: StreetFoodOutlet
  disabled: boolean
  onSave: (settings: OutletSettingsInput) => void
}) {
  const copy = useCopy()
  const level: Record<PolicyLevel, string> = {
    NONE: copy('Tidak ada', 'Nobody'),
    CAUTION: copy('Hati-hati dan lebih berat', 'Caution and worse'),
    PREPAY_REQUIRED: copy('Wajib bayar di muka', 'Prepay required only'),
  }
  const field = (
    id: string,
    label: string,
    value: PolicyLevel,
    save: (next: PolicyLevel) => OutletSettingsInput
  ) => (
    <div className='space-y-1.5'>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(next) => onSave(save(next as PolicyLevel))}
      >
        <SelectTrigger id={id} className='w-full'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {POLICY_LEVELS.map((l) => (
            <SelectItem key={l} value={l}>
              {level[l]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className='mt-4 space-y-3 border-t pt-4'>
      <div>
        <p className='text-sm font-medium'>
          {copy('Pelanggan yang perlu diwaspadai', 'Customers who need care')}
        </p>
        <p className='text-fg-muted text-[13px]'>
          {copy(
            'Setiap pesanan datang dengan label: baru, terpercaya, hati-hati, atau wajib bayar di muka. Tidak ada yang terjadi kecuali Anda memilihnya.',
            'Each order comes with a label: new, reliable, caution or prepay required. Nothing happens unless you choose it.'
          )}
        </p>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        {field(
          `prepay-${outlet.outletId}`,
          copy('Minta bayar di aplikasi untuk', 'Ask to pay in the app'),
          outlet.prepayFrom,
          (prepayFrom) => ({ prepayFrom })
        )}
        {field(
          `refuse-${outlet.outletId}`,
          copy('Tolak pesanan dari', 'Refuse orders from'),
          outlet.refuseFrom,
          (refuseFrom) => ({ refuseFrom })
        )}
      </div>
    </div>
  )
}

function Chip({
  tone,
  children,
}: {
  tone: keyof typeof STATUS_TONE
  children: string
}) {
  return (
    <Badge variant='outline' className={cn(STATUS_TONE[tone])}>
      {children}
    </Badge>
  )
}

function IssueNote({
  code,
  tone,
}: {
  code: IssueCode
  tone: 'danger' | 'warning' | 'info'
}) {
  const copy = useCopy()
  const text: Record<IssueCode, string> = {
    PRICING_INVALID: copy(
      'Pengaturan pajak atau biaya layanan tidak valid, jadi pesanan tidak bisa dihitung. Perbaiki di pengaturan pajak.',
      'Your tax or service charge setting is invalid, so orders cannot be priced. Fix it in your tax settings.'
    ),
    NO_LOCATION: copy(
      'Outlet ini belum punya koordinat peta, jadi tidak muncul di pencarian pelanggan.',
      'This outlet has no map coordinates, so it will not appear in customers’ search.'
    ),
    NO_HOURS: copy(
      'Status Otomatis tanpa jam buka dianggap selalu tutup. Atur jam buka, atau pilih Buka.',
      'Auto with no opening hours counts as always closed. Set your hours, or choose Open.'
    ),
    DAY_NOT_OPEN: copy(
      'Gerai keliling baru muncul di peta setelah staf memulai hari di aplikasi penjual.',
      'A mobile vendor only appears on the map once staff start the day in the vendor app.'
    ),
  }
  return (
    <Alert
      variant={tone === 'danger' ? 'destructive' : 'default'}
      className={cn('py-2', tone === 'warning' && 'border-status-warning/40')}
    >
      {tone === 'info' ? <Info aria-hidden /> : <AlertTriangle aria-hidden />}
      <AlertDescription className='flex flex-wrap items-center gap-x-3'>
        <span>{text[code]}</span>
        {code === 'NO_LOCATION' && (
          <Link to='/outlets' className='underline underline-offset-2'>
            {copy('Buka daftar outlet', 'Open outlets')}
          </Link>
        )}
      </AlertDescription>
    </Alert>
  )
}

function MoreSettings({
  outlet,
  disabled,
  onSave,
}: {
  outlet: StreetFoodOutlet
  disabled: boolean
  onSave: (settings: OutletSettingsInput) => void
}) {
  const copy = useCopy()
  const [open, setOpen] = useState(false)
  const [prep, setPrep] = useState(String(outlet.prepTimeMinutes))
  const [timezone, setTimezone] = useState(outlet.timezone)
  const [mode, setMode] = useState<LocationMode>(outlet.locationMode)
  const [sharing, setSharing] = useState<LocationSharing>(
    outlet.locationSharing
  )

  const minutes = Number(prep)
  const prepValid = Number.isInteger(minutes) && minutes >= 1 && minutes <= 240
  const changed =
    minutes !== outlet.prepTimeMinutes ||
    timezone !== outlet.timezone ||
    mode !== outlet.locationMode ||
    sharing !== outlet.locationSharing
  const zones = TIMEZONES.some((z) => z.value === timezone)
    ? TIMEZONES
    : [...TIMEZONES, { value: timezone, label: timezone }]

  return (
    <Collapsible open={open} onOpenChange={setOpen} className='mt-3'>
      <CollapsibleTrigger asChild>
        <Button type='button' variant='ghost' size='sm' className='-ms-2'>
          <ChevronDown
            size={14}
            className={cn('transition-transform', open && 'rotate-180')}
            aria-hidden
          />
          {copy('Pengaturan lain', 'More settings')}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className='mt-2 space-y-4 rounded-md border p-3'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label htmlFor={`prep-${outlet.outletId}`}>
              {copy('Waktu siap (menit)', 'Preparation time (minutes)')}
            </Label>
            <Input
              id={`prep-${outlet.outletId}`}
              type='number'
              min={1}
              max={240}
              value={prep}
              disabled={disabled}
              onChange={(event) => setPrep(event.target.value)}
              aria-invalid={!prepValid}
            />
            <p
              className={cn(
                'text-[13px]',
                prepValid ? 'text-fg-muted' : 'text-destructive'
              )}
            >
              {prepValid
                ? copy(
                    'Perkiraan yang dilihat pelanggan.',
                    'The estimate customers see.'
                  )
                : copy('Isi 1 sampai 240.', 'Enter 1 to 240.')}
            </p>
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor={`tz-${outlet.outletId}`}>
              {copy('Zona waktu', 'Time zone')}
            </Label>
            <Select
              value={timezone}
              onValueChange={setTimezone}
              disabled={disabled}
            >
              <SelectTrigger id={`tz-${outlet.outletId}`} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='space-y-1.5'>
          <p className='text-sm font-medium'>
            {copy('Jenis outlet', 'Outlet type')}
          </p>
          <SegmentedControl
            aria-label={copy('Jenis outlet', 'Outlet type')}
            value={mode}
            onValueChange={setMode}
            options={[
              {
                value: 'FIXED',
                label: copy('Tempat tetap', 'Fixed place'),
                disabled,
              },
              {
                value: 'MOBILE',
                label: copy('Gerai keliling', 'Mobile cart'),
                disabled,
              },
            ]}
          />
          <p className='text-fg-muted text-[13px]'>
            {mode === 'FIXED'
              ? copy(
                  'Pelanggan melihat alamat outlet di peta.',
                  'Customers see the outlet’s address on the map.'
                )
              : copy(
                  'Posisi berasal dari ponsel staf. Outlet hanya muncul di peta saat hari dibuka.',
                  'The position comes from the staff phone. The outlet only shows on the map while the day is open.'
                )}
          </p>
        </div>

        {mode === 'MOBILE' && (
          <div className='space-y-1.5'>
            <p className='text-sm font-medium'>
              {copy('Yang dilihat pelanggan', 'What customers see')}
            </p>
            <SegmentedControl
              aria-label={copy('Berbagi lokasi', 'Location sharing')}
              value={sharing}
              onValueChange={setSharing}
              options={[
                { value: 'LIVE', label: copy('Langsung', 'Live'), disabled },
                {
                  value: 'SPOT',
                  label: copy('Titik saja', 'Spot only'),
                  disabled,
                },
                {
                  value: 'HIDDEN',
                  label: copy('Sembunyi', 'Hidden'),
                  disabled,
                },
              ]}
            />
            <p className='text-fg-muted text-[13px]'>
              {sharing === 'LIVE'
                ? copy(
                    'Titik bergerak mengikuti posisi gerai.',
                    'A moving dot that follows the cart.'
                  )
                : sharing === 'SPOT'
                  ? copy(
                      'Hanya tempat berjualan hari ini. Posisi GPS tidak dibagikan.',
                      'Only today’s selling spot. Exact GPS is never shared.'
                    )
                  : copy(
                      'Gerai tidak tampil di peta.',
                      'The cart is not shown on the map.'
                    )}
            </p>
          </div>
        )}

        <Button
          type='button'
          size='sm'
          disabled={disabled || !changed || !prepValid}
          onClick={() =>
            onSave({
              prepTimeMinutes: minutes,
              timezone,
              locationMode: mode,
              ...(mode === 'MOBILE' && { locationSharing: sharing }),
            })
          }
        >
          {disabled && <Loader2 className='animate-spin' size={14} />}
          {copy('Simpan pengaturan', 'Save settings')}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  )
}
