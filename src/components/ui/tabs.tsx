import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

/** `default` is a segmented control for switching views; `line` is underline navigation for page sections. */
type TabsVariant = 'default' | 'line'

const TabsVariantContext = React.createContext<TabsVariant>('default')

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot='tabs'
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: TabsVariant
}) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        data-slot='tabs-list'
        data-variant={variant}
        className={cn(
          variant === 'line'
            ? 'text-fg-muted inline-flex h-10 w-fit items-stretch gap-5'
            : 'border-divider bg-surface-subtle text-fg-muted inline-flex h-9 w-fit items-stretch gap-0.5 rounded-md border p-0.5',
          className
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsVariantContext)

  return (
    <TabsPrimitive.Trigger
      data-slot='tabs-trigger'
      className={cn(
        variant === 'line'
          ? "hover:text-foreground data-[state=active]:text-foreground data-[state=active]:after:bg-brand focus-visible:outline-ring relative inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          : "hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:ring-divider-strong focus-visible:outline-ring inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] px-3 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:ring-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot='tabs-content'
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
