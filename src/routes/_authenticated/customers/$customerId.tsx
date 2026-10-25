import { createFileRoute } from '@tanstack/react-router'
import { CustomerDetail } from '@/features/loyalty/customers/customer-detail'

export const Route = createFileRoute('/_authenticated/customers/$customerId')({
  component: CustomerDetail,
})
