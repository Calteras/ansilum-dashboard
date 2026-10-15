import { useId, type ReactNode } from 'react'
import { Inbox } from '@/components/icons'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { providers } from '../delivery.providers'
import type { Provider } from '../delivery.types'

export function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription className='leading-relaxed'>
            {description}
          </CardDescription>
        )}
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
function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className='text-muted-foreground text-xs leading-relaxed'>
      {children}
    </p>
  )
}
export function Field({
  label,
  hint,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; hint?: ReactNode }) {
  const id = useId()
  const hintId = useId()
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-describedby={hint ? hintId : undefined} {...props} />
      {hint && <Hint id={hintId}>{hint}</Hint>}
    </div>
  )
}
export function Choice({
  label,
  hint,
  children,
  ...props
}: React.ComponentProps<'select'> & { label: string; hint?: ReactNode }) {
  const id = useId()
  const hintId = useId()
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        aria-describedby={hint ? hintId : undefined}
        className='border-input bg-background h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 disabled:opacity-50'
        {...props}
      >
        {children}
      </select>
      {hint && <Hint id={hintId}>{hint}</Hint>}
    </div>
  )
}
export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: ReactNode
  checked: boolean
  onChange: (value: boolean) => void
}) {
  const id = useId()
  const hintId = useId()
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='space-y-1'>
        <Label htmlFor={id}>{label}</Label>
        {description && <Hint id={hintId}>{description}</Hint>}
      </div>
      <Switch
        id={id}
        className='mt-0.5'
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={description ? hintId : undefined}
      />
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
  const info = providers[provider]
  return (
    <span className='bg-muted inline-flex items-center gap-2 rounded-lg py-1 pr-2.5 pl-1 text-sm font-semibold'>
      <img src={info.icon} alt='' className='size-5 shrink-0' />
      {info.name}
    </span>
  )
}

/** Official wordmark, swapped for the light or dark theme. */
export function ProviderLogo({
  provider,
  className,
}: {
  provider: Provider
  className?: string
}) {
  const info = providers[provider]
  return (
    <>
      <img
        src={info.logo}
        alt={info.name}
        className={cn('w-auto dark:hidden', className)}
      />
      <img
        src={info.logoOnDark}
        alt={info.name}
        className={cn('hidden w-auto dark:block', className)}
      />
    </>
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

export function JsonDetails({ value }: { value: unknown }) {
  return (
    <pre className='bg-muted max-h-72 overflow-auto rounded-md p-3 text-xs break-all whitespace-pre-wrap'>
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
