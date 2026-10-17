import { cn } from '@/lib/utils'

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  fluid?: boolean
  padded?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Main({ fixed, className, fluid, ...props }: MainProps) {
  return (
    <main
      id='main'
      data-layout={fixed ? 'fixed' : 'auto'}
      className={cn(
        'app-main relative isolate px-4 py-6 sm:px-6',

        fixed && 'flex grow flex-col overflow-hidden',
        className
      )}
      {...props}
    />
  )
}
