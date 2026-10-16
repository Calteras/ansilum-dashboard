import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { ReceiptLine } from '../layout/receipt-lines'

/**
 * Thermal printers print fixed-width characters, so the paper uses a real
 * monospace font; the app theme maps `font-mono` to its sans font.
 */
const PRINTER_FONT =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"

interface ReceiptPaperProps {
  lines: ReceiptLine[]
  /** Characters per normal line: 32 for 58 mm, 48 for 80 mm. */
  columns: number
  smallColumns: number
  logoUrl?: string | null
  /** Read by screen readers instead of the drawn receipt. */
  label: string
  qrLabel: string
}

/**
 * Draws layout lines the way a thermal printer prints them: monospace, one
 * character per column, large text at double width and the small font scaled
 * so it fills the same width. White paper in both themes, like the real
 * thing.
 */
export function ReceiptPaper({
  lines,
  columns,
  smallColumns,
  logoUrl,
  label,
  qrLabel,
}: ReceiptPaperProps) {
  return (
    <figure
      aria-label={label}
      className='mx-auto border border-neutral-300 bg-white px-4 py-5 text-[12px] leading-[1.4] text-neutral-900'
      style={{
        fontFamily: PRINTER_FONT,
        width: `calc(${columns}ch + 2rem)`,
      }}
    >
      {lines.map((line, index) => {
        switch (line.kind) {
          case 'blank':
            return <div key={index} aria-hidden className='h-[1.4em]' />
          case 'logo':
            return logoUrl ? (
              <img
                key={index}
                src={logoUrl}
                alt=''
                className='mx-auto mb-2 max-h-[6em] max-w-[60%] object-contain grayscale'
              />
            ) : null
          case 'qr':
            return (
              <div
                key={index}
                className='mx-auto my-2 flex size-[8em] items-center justify-center border-2 border-dashed border-neutral-500 text-center text-[0.8em] text-neutral-600'
                title={line.data}
              >
                {qrLabel}
              </div>
            )
          case 'text': {
            const style: CSSProperties | undefined =
              line.style === 'large'
                ? { fontSize: '2em', lineHeight: 1.2 }
                : line.style === 'small'
                  ? { fontSize: `${columns / smallColumns}em` }
                  : undefined
            return (
              <div
                key={index}
                className={cn(
                  'whitespace-pre',
                  (line.style === 'bold' || line.style === 'large') &&
                    'font-bold'
                )}
                style={style}
              >
                {line.text || ' '}
              </div>
            )
          }
        }
      })}
    </figure>
  )
}
