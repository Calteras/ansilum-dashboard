import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
} from '@/components/icons'
import type { ExportFormat } from '../../hooks/use-sales-export'

interface SalesExportMenuProps {
  exporting: ExportFormat | null
  disabled?: boolean
  onExport: (format: ExportFormat) => void
}

export function SalesExportMenu({
  exporting,
  disabled,
  onExport,
}: SalesExportMenuProps) {
  const copy = useCopy()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          disabled={disabled || exporting !== null}
          className='border-divider-strong hover:border-divider-strong hover:bg-surface-hover h-8 gap-1.5 px-2.5 text-[13px] font-medium'
        >
          <Download className='size-4' aria-hidden />
          {exporting
            ? copy('Mengekspor…', 'Exporting…')
            : copy('Ekspor', 'Export')}
          <ChevronDown className='text-fg-muted size-3.5' aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='min-w-52'
      >
        <DropdownMenuItem
          className='text-[13px]'
          onSelect={() => onExport('pdf')}
        >
          <FileText aria-hidden />
          {copy('Laporan PDF', 'PDF report')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className='text-[13px]'
          onSelect={() => onExport('csv')}
        >
          <FileSpreadsheet aria-hidden />
          {copy('Transaksi (CSV)', 'Transactions (CSV)')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
