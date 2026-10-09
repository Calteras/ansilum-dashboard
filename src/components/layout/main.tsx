import { cn } from '@/lib/utils'
import { useLayout } from '@/context/layout-provider'

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  fluid?: boolean
  padded?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Main({ fixed, className, fluid, ...props }: MainProps) {
  const { padded } = useLayout()

  return (
    <main
      id='main'
      data-layout={fixed ? 'fixed' : 'auto'}
      className={cn(
        'app-main relative isolate px-4 py-7 sm:px-6 lg:px-10 lg:py-10',

        fixed && 'flex grow flex-col overflow-hidden',

        !fluid && padded
          ? '@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl'
          : '',
        className
      )}
      {...props}
    />
  )
}
