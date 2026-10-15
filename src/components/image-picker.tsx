import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from '@/components/icons'
import { useCopy } from '@/hooks/use-copy'
import { IMAGE_ACCEPT, validateImageFile } from '@/lib/image-upload'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type ImagePickerProps = {
  /** Stored image URL. Rendered verbatim — the `?v=` cache-buster must stay. */
  src?: string | null
  /** Pending local file; previewed via an object URL while it is set. */
  file?: File | null
  /** Called with a file that passed client-side validation. */
  onSelect: (file: File) => void
  /** Shows a remove button whenever an image is displayed. */
  onRemove?: () => void
  shape?: 'circle' | 'square'
  busy?: boolean
  disabled?: boolean
  alt: string
  /** Shown when there is no image, e.g. initials. */
  fallback?: ReactNode
  uploadLabel?: string
  changeLabel?: string
  removeLabel?: string
  hint?: string
}

export function ImagePicker({
  src,
  file,
  onSelect,
  onRemove,
  shape = 'square',
  busy,
  disabled,
  alt,
  fallback,
  uploadLabel,
  changeLabel,
  removeLabel,
  hint,
}: ImagePickerProps) {
  const copy = useCopy()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  // The object URL is created in the change handler and tied to the file it
  // was made for, so a parent clearing `file` immediately falls back to `src`.
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(
    null
  )

  // Revokes the previous URL on replacement, and the last one on unmount.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  const previewUrl = file && preview?.file === file ? preview.url : null
  const displayed = previewUrl ?? src ?? null
  const inactive = disabled || busy

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-4'>
        <div
          className={cn(
            'bg-muted text-muted-foreground relative flex size-20 shrink-0 items-center justify-center overflow-hidden border',
            shape === 'circle' ? 'rounded-full' : 'rounded-md'
          )}
        >
          {displayed ? (
            <img src={displayed} alt={alt} className='size-full object-cover' />
          ) : (
            (fallback ?? <ImagePlus className='size-6' />)
          )}
          {busy && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/40 text-white'>
              <Loader2 className='size-5 animate-spin' />
            </div>
          )}
        </div>
        <div className='flex flex-wrap gap-2'>
          <input
            ref={inputRef}
            type='file'
            accept={IMAGE_ACCEPT}
            className='hidden'
            onChange={(e) => {
              const selected = e.target.files?.[0]
              // Reset so choosing the same file again still fires onChange.
              e.target.value = ''
              if (!selected) return
              const invalid = validateImageFile(selected)
              setError(invalid)
              if (invalid) return
              setPreview({ file: selected, url: URL.createObjectURL(selected) })
              onSelect(selected)
            }}
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={inactive}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={14} className='mr-1.5' />
            {displayed
              ? (changeLabel ?? copy('Ganti gambar', 'Change image'))
              : (uploadLabel ?? copy('Unggah gambar', 'Upload image'))}
          </Button>
          {onRemove && displayed && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={inactive}
              onClick={() => {
                setError(null)
                onRemove()
              }}
            >
              <Trash2 size={14} className='mr-1.5' />
              {removeLabel ?? copy('Hapus', 'Remove')}
            </Button>
          )}
        </div>
      </div>
      {error ? (
        <p className='text-destructive text-xs' role='alert'>
          {error}
        </p>
      ) : (
        <p className='text-muted-foreground text-xs'>
          {hint ?? copy('JPG, PNG, atau WebP. Maks 10 MB.', 'JPG, PNG or WebP. Max 10 MB.')}
        </p>
      )}
    </div>
  )
}
