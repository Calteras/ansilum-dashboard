import { ChevronDown, Plus, Download, Upload, FileText } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function WelcomeSection() {
  return (
    <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-6'>
      <div className='space-y-2 sm:space-y-5'>
        <h2 className='text-lg leading-relaxed font-semibold sm:text-[22px]'>
          Welcome Back, John!
        </h2>
        <p className='text-muted-foreground text-sm sm:text-base'>
          Today you have{' '}
          <span className='text-foreground font-medium'>3 new leads</span>,{' '}
          <span className='text-foreground font-medium'>2 follow-ups due</span>
        </p>
      </div>

      <div className='flex items-center gap-2 sm:gap-3'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-8 gap-2 text-xs sm:h-9 sm:gap-3 sm:text-sm'
            >
              <span className='xs:inline hidden'>Import/Export</span>
              <span className='xs:hidden'>
                <Download className='size-4' />
              </span>
              <ChevronDown className='text-muted-foreground size-3 sm:size-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem>
              <Upload className='mr-2 size-4' />
              Import CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Upload className='mr-2 size-4' />
              Import Excel
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className='mr-2 size-4' />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className='mr-2 size-4' />
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size='sm'
          className='from-foreground to-foreground/90 text-background h-8 gap-2 bg-linear-to-b text-xs sm:h-9 sm:gap-3 sm:text-sm'
        >
          <Plus className='size-3 sm:size-4' />
          <span className='xs:inline hidden'>Create New</span>
          <span className='xs:hidden'>New</span>
        </Button>
      </div>
    </div>
  )
}
