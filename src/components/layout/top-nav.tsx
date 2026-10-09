import { Link } from '@tanstack/react-router'
import { Menu } from '@/components/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  links: {
    title: string
    href: string
    isActive: boolean
    disabled?: boolean
  }[]
  onLinkClick?: (title: string) => void
}

export function TopNav({ className, links, onLinkClick, ...props }: TopNavProps) {
  const handleClick = (e: React.MouseEvent, title: string, disabled?: boolean) => {
    if (disabled) return
    if (onLinkClick) {
      e.preventDefault()
      onLinkClick(title)
    }
  }

  return (
    <>
      <div className='lg:hidden'>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size='icon' variant='outline' className='md:size-7'>
              <Menu />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side='bottom' align='start'>
            {links.map(({ title, href, isActive, disabled }) => (
              <DropdownMenuItem key={`${title}-${href}`} asChild>
                <Link
                  to={href}
                  className={!isActive ? 'text-muted-foreground' : ''}
                  disabled={disabled}
                  onClick={(e) => handleClick(e, title, disabled)}
                >
                  {title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav
        className={cn(
          'hidden items-center space-x-4 lg:flex lg:space-x-4 xl:space-x-6',
          className
        )}
        {...props}
      >
        {links.map(({ title, href, isActive, disabled }) => (
          <Link
            key={`${title}-${href}`}
            to={href}
            disabled={disabled}
            className={`hover:text-primary text-sm font-medium transition-colors ${isActive ? '' : 'text-muted-foreground'} ${disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            onClick={(e) => handleClick(e, title, disabled)}
          >
            {title}
          </Link>
        ))}
      </nav>
    </>
  )
}
