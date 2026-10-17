import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  TrendingDown,
  XCircle,
  ArrowUpDown,
} from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StockMovementDialog } from '@/features/stock-movements/components/stock-movement-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOutletsQuery } from '@/features/outlets/api/outlets.queries'
import { useOutletInventoryQuery } from '../api/ingredients.queries'
import type { OutletInventory } from '../api/ingredients.types'

// ── Stock status helpers ──────────────────────────────────────────────────

type StockStatus = 'critical' | 'low' | 'healthy'

function getStockStatus(item: OutletInventory): StockStatus {
  const qty = parseFloat(item.quantityOnHand)
  const reorder = parseFloat(item.reorderPoint)
  const minStock = parseFloat(item.ingredient.minimumStock)

  if (qty < 0) return 'critical'
  if (reorder > 0 && qty <= reorder) return 'critical'
  if (qty < minStock) return 'low'
  return 'healthy'
}

const statusConfig: Record<
  StockStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  critical: {
    label: 'Critical',
    icon: XCircle,
    className:
      'border-destructive/30 bg-destructive/10 text-destructive',
  },
  low: {
    label: 'Low Stock',
    icon: AlertTriangle,
    className: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  },
  healthy: {
    label: 'Healthy',
    icon: CheckCircle2,
    className: 'border-status-success/30 bg-status-success/10 text-status-success',
  },
}

// ── Formatting helpers ────────────────────────────────────────────────────

function fmtQty(raw: string, unit: string) {
  const n = parseFloat(raw)
  return `${n.toLocaleString('id-ID')} ${unit}`
}

function fmtCurrency(raw: string) {
  const n = parseFloat(raw)
  if (n === 0) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtRelative(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

// ── KPI summary cards ─────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  count: number
  icon: React.ElementType
  className: string
}

function KpiCard({ label, count, icon: Icon, className }: KpiCardProps) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${className}`}>
      <Icon className='h-5 w-5 shrink-0' />
      <div>
        <div className='text-xl font-semibold tabular-nums'>{count}</div>
        <div className='text-xs opacity-80'>{label}</div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function OutletInventoryTab() {
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)

  const { data: outletsData, isLoading: isLoadingOutlets } = useOutletsQuery()
  const outlets = outletsData?.data ?? []

  // Auto-select first outlet once loaded
  useEffect(() => {
    if (outlets.length > 0 && !selectedOutletId) {
      setSelectedOutletId(outlets[0].id)
    }
  }, [outlets, selectedOutletId])

  const { data: inventoryData, isLoading: isLoadingInventory } =
    useOutletInventoryQuery(selectedOutletId)
  const inventory = inventoryData?.data ?? []

  // Client-side search filter
  const filtered = search.trim()
    ? inventory.filter(
        (item) =>
          item.ingredient.name.toLowerCase().includes(search.toLowerCase()) ||
          item.ingredient.code.toLowerCase().includes(search.toLowerCase())
      )
    : inventory

  // KPI counts
  const criticalCount = inventory.filter(
    (i) => getStockStatus(i) === 'critical'
  ).length
  const lowCount = inventory.filter((i) => getStockStatus(i) === 'low').length
  const healthyCount = inventory.filter(
    (i) => getStockStatus(i) === 'healthy'
  ).length

  const isLoading = isLoadingOutlets || (!!selectedOutletId && isLoadingInventory)

  return (
    <div className='space-y-4'>
      {/* ── Controls row ─────────────────────────────────────── */}
      <div className='flex flex-wrap items-center gap-3'>
        <Select
          value={selectedOutletId}
          onValueChange={setSelectedOutletId}
          disabled={isLoadingOutlets || outlets.length === 0}
        >
          <SelectTrigger className='h-9 w-[220px] text-sm'>
            <SelectValue
              placeholder={isLoadingOutlets ? 'Loading outlets…' : 'Select outlet'}
            />
          </SelectTrigger>
          <SelectContent>
            {outlets.map((outlet) => (
              <SelectItem key={outlet.id} value={outlet.id}>
                {outlet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className='relative flex-1 sm:max-w-xs'>
          <Search className='text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search ingredient…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9 pl-8 text-sm'
          />
        </div>

        <span className='text-muted-foreground text-xs'>
          {filtered.length} of {inventory.length} items
        </span>

        <Button
          size='sm'
          className='ml-auto'
          disabled={!selectedOutletId}
          onClick={() => setMovementDialogOpen(true)}
        >
          <ArrowUpDown className='mr-1.5 h-3.5 w-3.5' />
          Add Movement
        </Button>
      </div>

      <StockMovementDialog
        open={movementDialogOpen}
        onOpenChange={setMovementDialogOpen}
        initialOutletId={selectedOutletId || undefined}
      />

      {/* ── KPI summary ──────────────────────────────────────── */}
      {!isLoading && inventory.length > 0 && (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          <KpiCard
            label='Total Items'
            count={inventory.length}
            icon={TrendingDown}
            className='border-border bg-card text-foreground'
          />
          <KpiCard
            label='Critical'
            count={criticalCount}
            icon={XCircle}
            className='border-destructive/30 bg-destructive/5 text-destructive'
          />
          <KpiCard
            label='Low Stock'
            count={lowCount}
            icon={AlertTriangle}
            className='border-status-warning/30 bg-status-warning/5 text-status-warning'
          />
          <KpiCard
            label='Healthy'
            count={healthyCount}
            icon={CheckCircle2}
            className='border-status-success/30 bg-status-success/5 text-status-success'
          />
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────── */}
      <div className='border-border rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/40 hover:bg-muted/40'>
              <TableHead className='w-28'>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className='w-16 text-center'>Unit</TableHead>
              <TableHead className='w-32 text-right'>Qty on Hand</TableHead>
              <TableHead className='w-28 text-right'>Min Stock</TableHead>
              <TableHead className='w-28 text-right'>Reorder At</TableHead>
              <TableHead className='w-32 text-right'>Avg WAC</TableHead>
              <TableHead className='w-24 text-center'>Status</TableHead>
              <TableHead className='w-36 text-right'>Last Movement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}>
                      <div className='bg-muted h-4 animate-pulse rounded' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !selectedOutletId ? (
              <TableRow>
                <TableCell colSpan={9} className='text-muted-foreground py-12 text-center text-sm'>
                  Select an outlet to view inventory
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='text-muted-foreground py-12 text-center text-sm'>
                  {search ? 'No ingredients match your search.' : 'No inventory data for this outlet.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const status = getStockStatus(item)
                const cfg = statusConfig[status]
                const StatusIcon = cfg.icon
                const qty = parseFloat(item.quantityOnHand)
                const isNegative = qty < 0

                return (
                  <TableRow key={item.id} className='text-sm'>
                    {/* Code */}
                    <TableCell>
                      <span className='text-muted-foreground font-sans tabular-nums text-xs'>
                        {item.ingredient.code}
                      </span>
                    </TableCell>

                    {/* Name */}
                    <TableCell className='font-medium'>
                      {item.ingredient.name}
                    </TableCell>

                    {/* Unit */}
                    <TableCell className='text-center'>
                      <Badge variant='secondary' className='px-2 py-0.5 text-xs'>
                        {item.ingredient.unit}
                      </Badge>
                    </TableCell>

                    {/* Qty on Hand */}
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${
                        isNegative
                          ? 'text-destructive'
                          : status === 'low'
                            ? 'text-status-warning'
                            : 'text-foreground'
                      }`}
                    >
                      {fmtQty(item.quantityOnHand, item.ingredient.unit)}
                    </TableCell>

                    {/* Min Stock */}
                    <TableCell className='text-muted-foreground text-right tabular-nums'>
                      {fmtQty(item.ingredient.minimumStock, item.ingredient.unit)}
                    </TableCell>

                    {/* Reorder Point */}
                    <TableCell className='text-muted-foreground text-right tabular-nums'>
                      {parseFloat(item.reorderPoint) > 0
                        ? fmtQty(item.reorderPoint, item.ingredient.unit)
                        : <span className='opacity-40'>—</span>}
                    </TableCell>

                    {/* Avg WAC */}
                    <TableCell className='text-right tabular-nums'>
                      {fmtCurrency(item.avgCostPerUnit)}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell className='text-center'>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}
                      >
                        <StatusIcon className='h-3 w-3' />
                        {cfg.label}
                      </span>
                    </TableCell>

                    {/* Last Movement */}
                    <TableCell className='text-muted-foreground text-right text-xs'>
                      {fmtRelative(item.lastMovementAt)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
