import { useId, type ReactNode } from 'react'
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
import { DataPanel } from '@/components/data-display/data-panel'
import { EmptyState as SharedEmptyState } from '@/components/data-display/data-states'
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
          'border-status-warning/30 bg-status-warning/10 text-status-warning',
        success &&
          'border-status-success/30 bg-leaf-soft text-leaf  '
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
    <DataPanel>
      <SharedEmptyState
        title={title}
        description={description}
        action={children}
        className='min-h-56'
      />
    </DataPanel>
  )
}

export function JsonDetails({ value }: { value: unknown }) {
  return (
    <pre className='bg-muted max-h-72 overflow-auto rounded-md p-3 text-xs break-all whitespace-pre-wrap'>
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
