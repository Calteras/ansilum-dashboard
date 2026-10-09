import { createFileRoute } from '@tanstack/react-router'
import { Cogs } from '@/features/cogs'

export const Route = createFileRoute('/_authenticated/cogs/')({
  component: Cogs,
})
