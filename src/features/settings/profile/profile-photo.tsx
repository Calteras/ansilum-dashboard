import { useState } from 'react'
import { useCopy } from '@/hooks/use-copy'
import { ImagePicker } from '@/components/image-picker'
import {
  useDeleteProfileImageMutation,
  useUploadProfileImageMutation,
} from '@/features/auth/api/auth.queries'
import { useAuth } from '@/features/auth/hooks/use-auth'

export function ProfilePhoto() {
  const copy = useCopy()
  const { user } = useAuth()
  const uploadMutation = useUploadProfileImageMutation()
  const deleteMutation = useDeleteProfileImageMutation()
  // Local preview while the upload is in flight; dropped once the server URL arrives.
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className='space-y-2'>
      <h4 className='text-sm font-medium'>
        {copy('Foto profil', 'Profile photo')}
      </h4>
      <ImagePicker
        shape='circle'
        src={user?.image}
        file={pendingFile}
        alt={user?.name ?? ''}
        fallback={<span className='text-lg font-medium'>{initials}</span>}
        busy={uploadMutation.isPending || deleteMutation.isPending}
        onSelect={(file) => {
          setPendingFile(file)
          uploadMutation.mutate(file, {
            onSettled: () => setPendingFile(null),
          })
        }}
        onRemove={user?.image ? () => deleteMutation.mutate() : undefined}
        uploadLabel={copy('Unggah foto', 'Upload photo')}
        changeLabel={copy('Ganti foto', 'Change photo')}
      />
    </div>
  )
}
