import { useState } from 'react'
import { Building2 } from '@/components/icons'
import { useCopy } from '@/hooks/use-copy'
import { ImagePicker } from '@/components/image-picker'
import { useAuth, useHasAnyRole } from '@/features/auth/hooks/use-auth'
import {
  useDeleteTenantLogoMutation,
  useUploadTenantLogoMutation,
} from '@/features/tenants/api/tenants.queries'

export function TenantLogo() {
  const copy = useCopy()
  const { activeTenant } = useAuth()
  // The server rejects logo changes from anyone else with 403, so hide the control.
  const canEdit = useHasAnyRole(['OWNER', 'ADMIN'])
  const uploadMutation = useUploadTenantLogoMutation()
  const deleteMutation = useDeleteTenantLogoMutation()
  // Local preview while the upload is in flight; dropped once the server URL arrives.
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  if (!activeTenant) {
    return (
      <p className='text-muted-foreground text-sm'>
        {copy('Belum ada usaha dipilih.', 'No business selected.')}
      </p>
    )
  }

  return (
    <div className='space-y-2'>
      <h4 className='text-sm font-medium'>
        {copy('Logo usaha', 'Business logo')}
      </h4>
      {canEdit ? (
        <ImagePicker
          src={activeTenant.logo}
          file={pendingFile}
          alt={activeTenant.name}
          fallback={<Building2 className='size-6' />}
          busy={uploadMutation.isPending || deleteMutation.isPending}
          onSelect={(file) => {
            setPendingFile(file)
            uploadMutation.mutate(
              { tenantId: activeTenant.id, file },
              { onSettled: () => setPendingFile(null) }
            )
          }}
          onRemove={
            activeTenant.logo
              ? () => deleteMutation.mutate(activeTenant.id)
              : undefined
          }
          uploadLabel={copy('Unggah logo', 'Upload logo')}
          changeLabel={copy('Ganti logo', 'Change logo')}
        />
      ) : (
        <div className='flex items-center gap-4'>
          <div className='bg-muted text-muted-foreground flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border'>
            {activeTenant.logo ? (
              <img
                src={activeTenant.logo}
                alt={activeTenant.name}
                className='size-full object-cover'
              />
            ) : (
              <Building2 className='size-6' />
            )}
          </div>
          <p className='text-muted-foreground text-sm'>
            {copy(
              'Hanya pemilik dan admin yang dapat mengubah logo.',
              'Only owners and admins can change the logo.'
            )}
          </p>
        </div>
      )}
    </div>
  )
}
