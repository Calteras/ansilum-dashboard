import { useEffect, useState, type ReactNode } from 'react'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Check, Copy } from '@/components/icons'

/** A quiet icon button under a message, named by its tooltip. */
export function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={label}
          onClick={onClick}
          className='text-fg-muted size-8 rounded-lg [&_svg]:size-4'
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side='bottom'>{label}</TooltipContent>
    </Tooltip>
  )
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const copy = useCopy()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  const onClick = () => {
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => {
        // The browser refused clipboard access; nothing to undo.
      }
    )
  }

  return (
    <ActionButton
      label={copied ? copy('Disalin', 'Copied') : label}
      onClick={onClick}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </ActionButton>
  )
}
