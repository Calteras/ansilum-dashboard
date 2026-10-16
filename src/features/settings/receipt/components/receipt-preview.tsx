import { useMemo, useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Outlet } from '@/features/outlets/api/outlets.types'
import { SAMPLE_RECEIPT } from '../layout/receipt-document'
import { PAPER_58, PAPER_80, ReceiptLayout } from '../layout/receipt-layout'
import type { ReceiptTemplate } from '../layout/receipt-template'
import { ReceiptPaper } from './receipt-paper'

interface ReceiptPreviewProps {
  template: ReceiptTemplate
  businessName: string
  logoUrl?: string | null
  outlets: Outlet[]
}

/**
 * The sample sale laid out with the template being edited, at 58 or 80 mm,
 * with the details of the chosen outlet. The same layout the POS app prints.
 */
export function ReceiptPreview({
  template,
  businessName,
  logoUrl,
  outlets,
}: ReceiptPreviewProps) {
  const copy = useCopy()
  const [paperWidth, setPaperWidth] = useState<'58' | '80'>('58')
  const [outletId, setOutletId] = useState<string | undefined>()
  const outlet = outlets.find((o) => o.id === outletId) ?? outlets[0]
  const paper = paperWidth === '58' ? PAPER_58 : PAPER_80

  const lines = useMemo(
    () =>
      new ReceiptLayout(paper).receipt(
        SAMPLE_RECEIPT,
        {
          businessName,
          outletName: outlet?.name,
          address: outlet?.address,
          phone: outlet?.phone,
          hasLogo: Boolean(logoUrl),
        },
        template
      ),
    [paper, businessName, outlet, logoUrl, template]
  )

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h4 className='text-base font-medium'>
          {copy('Pratinjau', 'Preview')}
        </h4>
        <Tabs
          value={paperWidth}
          onValueChange={(value) => setPaperWidth(value as '58' | '80')}
        >
          <TabsList aria-label={copy('Ukuran kertas', 'Paper size')}>
            <TabsTrigger value='58'>58 mm</TabsTrigger>
            <TabsTrigger value='80'>80 mm</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {outlets.length > 1 && (
        <Select value={outlet?.id} onValueChange={setOutletId}>
          <SelectTrigger
            className='w-full'
            aria-label={copy('Outlet untuk pratinjau', 'Outlet to preview')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {outlets.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className='bg-muted/50 overflow-x-auto rounded-md border p-4'>
        <ReceiptPaper
          lines={lines}
          columns={paper.columns}
          smallColumns={paper.smallColumns}
          logoUrl={logoUrl}
          label={copy(
            `Pratinjau struk ${paper.widthMm} mm`,
            `${paper.widthMm} mm receipt preview`
          )}
          qrLabel={copy('Kode QR', 'QR code')}
        />
      </div>
      <p className='text-muted-foreground text-xs'>
        {copy(
          'Contoh penjualan. Struk asli mengikuti ukuran kertas printer di setiap perangkat kasir.',
          'A sample sale. Real receipts follow the paper size of the printer on each register.'
        )}
      </p>
    </div>
  )
}
