import { useState, type ReactNode } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Link } from '@tanstack/react-router'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  Eye,
  RotateCcw,
  Star,
  UserCheck,
  UserPen,
  UserX,
  CircleOff,
} from '@/components/icons'
import { useCustomerStatusMutation } from '../api/loyalty.queries'
import type { Customer } from '../api/loyalty.types'
import { useCustomerPermissions } from '../hooks'
import { customerStatus } from '../lib/loyalty'
import {
  AdjustPointsDialog,
  BanCustomerDialog,
  CustomerFormDialog,
} from './customer-dialogs'

export type CustomerDialog =
  | 'edit'
  | 'adjust'
  | 'ban'
  | 'unban'
  | 'archive'
  | 'restore'

/** The dialogs for one customer, opened by `open`. */
export function CustomerDialogs({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer
  open: CustomerDialog | null
  onOpenChange: (open: CustomerDialog | null) => void
}) {
  const copy = useCopy()
  const status = useCustomerStatusMutation()
  const close = (next: boolean) => !next && onOpenChange(null)
  const confirm = (kind: 'unban' | 'archive' | 'restore') => async () => {
    try {
      await status.mutateAsync({ kind, id: customer.id })
      onOpenChange(null)
    } catch {
      // Toast shown by the mutation
    }
  }

  return (
    <>
      {open === 'edit' && (
        <CustomerFormDialog customer={customer} open onOpenChange={close} />
      )}
      {open === 'adjust' && (
        <AdjustPointsDialog customer={customer} open onOpenChange={close} />
      )}
      {open === 'ban' && (
        <BanCustomerDialog customer={customer} open onOpenChange={close} />
      )}
      <ConfirmDialog
        open={open === 'unban'}
        onOpenChange={close}
        title={copy(
          `Cabut blokir ${customer.name}?`,
          `Lift the ban on ${customer.name}?`
        )}
        desc={copy(
          'Pelanggan aktif kembali dan bisa mengumpulkan serta menukar poin. Poin yang sudah dihanguskan tidak kembali.',
          'They become an active member again and can earn and redeem points. Forfeited points are not returned.'
        )}
        confirmText={copy('Cabut blokir', 'Lift ban')}
        cancelBtnText={copy('Batal', 'Cancel')}
        isLoading={status.isPending}
        handleConfirm={confirm('unban')}
      />
      <ConfirmDialog
        open={open === 'archive'}
        onOpenChange={close}
        title={copy(
          `Nonaktifkan ${customer.name}?`,
          `Deactivate ${customer.name}?`
        )}
        desc={copy(
          'Pelanggan disembunyikan dari kasir dan tidak mendapat poin. Riwayatnya tetap tersimpan, dan pemilik usaha bisa mengaktifkannya kembali.',
          "They're hidden from registers and stop earning points. Their history is kept, and an owner can restore them."
        )}
        confirmText={copy('Nonaktifkan', 'Deactivate')}
        cancelBtnText={copy('Batal', 'Cancel')}
        destructive
        isLoading={status.isPending}
        handleConfirm={confirm('archive')}
      />
      <ConfirmDialog
        open={open === 'restore'}
        onOpenChange={close}
        title={copy(
          `Aktifkan kembali ${customer.name}?`,
          `Restore ${customer.name}?`
        )}
        desc={copy(
          'Pelanggan bisa dipilih di kasir dan mengumpulkan poin lagi.',
          'They can be selected at the register and earn points again.'
        )}
        confirmText={copy('Aktifkan', 'Restore')}
        cancelBtnText={copy('Batal', 'Cancel')}
        isLoading={status.isPending}
        handleConfirm={confirm('restore')}
      />
    </>
  )
}

/** Menu entries that apply to the customer's current status. */
export function CustomerActionItems({
  customer,
  onSelect,
}: {
  customer: Customer
  onSelect: (dialog: CustomerDialog) => void
}) {
  const copy = useCopy()
  const { canManage, canRestore } = useCustomerPermissions()
  const state = customerStatus(customer)
  if (!canManage) return null

  const item = (
    dialog: CustomerDialog,
    label: string,
    icon: ReactNode,
    danger = false
  ) => (
    <DropdownMenuItem
      key={dialog}
      onClick={() => onSelect(dialog)}
      className={danger ? 'text-status-danger!' : undefined}
    >
      {label}
      <DropdownMenuShortcut>{icon}</DropdownMenuShortcut>
    </DropdownMenuItem>
  )

  return (
    <>
      {item('edit', copy('Ubah data', 'Edit details'), <UserPen size={16} />)}
      {state !== 'banned' &&
        item(
          'adjust',
          copy('Sesuaikan poin', 'Adjust points'),
          <Star size={16} />
        )}
      <DropdownMenuSeparator />
      {state === 'banned'
        ? item(
            'unban',
            copy('Cabut blokir', 'Lift ban'),
            <UserCheck size={16} />
          )
        : item('ban', copy('Blokir', 'Ban'), <UserX size={16} />, true)}
      {state === 'active' &&
        item(
          'archive',
          copy('Nonaktifkan', 'Deactivate'),
          <CircleOff size={16} />,
          true
        )}
      {state === 'inactive' &&
        canRestore &&
        item(
          'restore',
          copy('Aktifkan kembali', 'Restore'),
          <RotateCcw size={16} />
        )}
    </>
  )
}

/**
 * Row menu for the directory. The cell must stop click propagation: menu and
 * dialog events bubble through their portals to the clickable row.
 */
export function CustomerRowActions({ customer }: { customer: Customer }) {
  const copy = useCopy()
  const [open, setOpen] = useState<CustomerDialog | null>(null)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>{copy('Buka menu', 'Open menu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[180px]'>
          <DropdownMenuItem asChild>
            <Link
              to='/customers/$customerId'
              params={{ customerId: customer.id }}
            >
              {copy('Lihat profil', 'View profile')}
              <DropdownMenuShortcut>
                <Eye size={16} />
              </DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <CustomerActionItems customer={customer} onSelect={setOpen} />
        </DropdownMenuContent>
      </DropdownMenu>
      <CustomerDialogs customer={customer} open={open} onOpenChange={setOpen} />
    </>
  )
}
