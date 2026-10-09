import { Info } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function AuthFlowDemo() {
  return (
    <Alert className='border-border/50 bg-primary/10'>
      <Info className='h-4 w-4 text-muted-foreground' />
      <AlertTitle>Demo Authentication Flow</AlertTitle>
      <AlertDescription className='space-y-2 text-xs'>
        <div className='text-muted-foreground bg-muted/50 rounded-md text-xs'>
          <br />
          Email: admin@terrapos.com <br /> Password: admin123
        </div>
        <p>
          This implements the industry-standard authentication architecture:
        </p>
        <ol className='ml-2 list-inside list-decimal space-y-1'>
          <li>
            <strong>UI Layer</strong> - Form component (presentation only)
          </li>
          <li>
            <strong>Hooks Layer</strong> - useLogin hook (validation & business
            logic)
          </li>
          <li>
            <strong>API Layer</strong> - TanStack Query mutations (HTTP calls)
          </li>
          <li>
            <strong>Store Layer</strong> - Zustand store (global state)
          </li>
        </ol>
        <p className='pt-2'>
          <strong>Try it:</strong> Use credentials above to see the complete
          flow in action!
        </p>
      </AlertDescription>
    </Alert>
  )
}
