import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src='/icon_bg.png'
      alt='Ansilum'
      className={cn('size-8 shrink-0 rounded-lg object-cover', className)}
      draggable={false}
      {...props}
    />
  )
}
