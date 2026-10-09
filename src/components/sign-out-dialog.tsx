import { ConfirmDialog } from '@/components/confirm-dialog'
import { useLogout } from '@/features/auth/hooks/use-logout'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const { logout, isLoading } = useLogout()

  const handleSignOut = () => {
    logout()
    onOpenChange(false)
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText={isLoading ? 'Signing out...' : 'Sign out'}
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
