import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Check, Copy } from '@/components/icons'

/** Copies text to the clipboard and says so. Tells the user when the browser refuses. */
export function CopyButton({
  value,
  label,
  iconOnly = false,
  variant = 'outline',
  className,
}: {
  value: string
  label?: string
  /** Icon with a hidden label, for tight rows. */
  iconOnly?: boolean
  variant?: 'outline' | 'default' | 'ghost'
  className?: string
}) {
  const copy = useCopy()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      type='button'
      variant={variant}
      size='sm'
      className={className}
      onClick={() => {
        // The clipboard is missing on plain-http pages, so read it inside the promise chain.
        void Promise.resolve()
          .then(() => navigator.clipboard.writeText(value))
          .then(() => setCopied(true))
          .catch(() =>
            toast.error(
              copy(
                'Tidak bisa menyalin. Pilih teksnya lalu salin manual.',
                'Could not copy. Select the text and copy it yourself.'
              )
            )
          )
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span className={iconOnly ? 'sr-only' : undefined}>
        {copied ? copy('Disalin', 'Copied') : (label ?? copy('Salin', 'Copy'))}
      </span>
    </Button>
  )
}
