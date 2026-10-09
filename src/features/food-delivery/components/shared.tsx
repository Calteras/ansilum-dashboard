import { useId, type ReactNode } from 'react'
import { Bike, CircleCheck, CircleDashed, Inbox } from '@/components/icons'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Provider } from '../delivery.types'

export function Panel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>{children}</CardContent>
    </Card>
  )
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <Alert>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
export function ErrorNotice({ error }: { error: Error | null }) {
  return error ? (
    <Alert variant='destructive' role='alert'>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  ) : null
}
export function Field({
  label,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) {
  const id = useId()
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  )
}
export function Choice({
  label,
  children,
  ...props
}: React.ComponentProps<'select'> & { label: string }) {
  const id = useId()
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className='border-input bg-background h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 disabled:opacity-50'
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  const id = useId()
  return (
    <div className='flex items-center justify-between gap-4'>
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
export function Status({ value }: { value: string }) {
  const warning = [
    'UNKNOWN',
    'PENDING',
    'PROCESSING',
    'NEEDS_MAPPING',
    'NEEDS_ITEMS',
  ].includes(value)
  const success = ['SUCCEEDED', 'COMPLETED', 'READY', 'ENABLED', 'OK'].includes(
    value
  )
  return (
    <Badge
      className={cn(
        'text-xs font-medium',
        warning &&
          'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
        success &&
          'border-emerald-200 bg-leaf-soft text-leaf dark:border-emerald-800  '
      )}
      variant={
        value === 'UNKNOWN' || value === 'FAILED' || value.endsWith('REVIEW')
          ? 'destructive'
          : 'secondary'
      }
    >
      {value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^./, (letter) => letter.toUpperCase())}
    </Badge>
  )
}

export function ProviderMark({ provider }: { provider: Provider }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold',
        provider === 'GOFOOD'
          ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
          : 'bg-leaf-soft text-leaf  '
      )}
    >
      <Bike className='size-4' aria-hidden='true' />
      {provider === 'GOFOOD' ? 'GoFood' : 'GrabFood'}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className='flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center'>
      <div className='bg-muted mb-4 rounded-full p-3'>
        <Inbox className='text-muted-foreground size-6' aria-hidden='true' />
      </div>
      <h3 className='font-semibold'>{title}</h3>
      <p className='text-muted-foreground mt-2 max-w-md text-sm'>
        {description}
      </p>
      {children && <div className='mt-5'>{children}</div>}
    </div>
  )
}

export function SetupStep({
  label,
  complete,
  onClick,
}: {
  label: string
  complete: boolean
  onClick?: () => void
}) {
  const Icon = complete ? CircleCheck : CircleDashed
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={!onClick}
      className='bg-card enabled:hover:bg-muted flex items-center gap-3 rounded-lg border p-3 text-left text-sm focus-visible:ring-2'
    >
      <Icon
        className={cn(
          'size-5 shrink-0',
          complete ? 'text-leaf' : 'text-muted-foreground'
        )}
        aria-hidden='true'
      />
      <span>
        {label}
        <span className='text-muted-foreground block text-xs'>
          {complete ? 'Configured' : 'To configure'}
        </span>
      </span>
    </button>
  )
}
export function JsonDetails({ value }: { value: unknown }) {
  return (
    <pre className='bg-muted max-h-72 overflow-auto rounded-md p-3 text-xs break-all whitespace-pre-wrap'>
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
