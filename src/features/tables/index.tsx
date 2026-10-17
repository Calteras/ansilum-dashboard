import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Check,
  Edit2,
  LayoutGrid,
  Plus,
  RefreshCw,
  Save,
  Users,
} from '@/components/icons'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { DataPanel } from '@/components/data-display/data-panel'
import { Metric, MetricGroup } from '@/components/data-display/metric'
import { PageHeader } from '@/components/layout/page-header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDashboardOutletsQuery } from '@/features/dashboard/api/dashboard.queries'
import {
  useReleaseTableMutation,
  useSaveTableLayoutMutation,
  useTableLayoutQuery,
  useTableMonitoringQuery,
  useUpdateTableStatusMutation,
} from './api/tables.queries'
import type {
  TableLayoutResponse,
  TableMonitoring,
  TableStatus,
} from './api/tables.types'
import { SaveLayoutDialog, type buildPayload } from './components/save-layout-dialog'
import { TableFormDialog } from './components/table-form-dialog'
import { TableNode } from './components/table-node'
import type { TableData, TableSection, TableStatus as LocalTableStatus } from './data/types'

const nodeTypes = { table: TableNode }
const statusLabels: Record<TableStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  CLEANING: 'Cleaning',
}

function toLocalStatus(status: TableStatus): LocalTableStatus {
  return status.toLowerCase() as LocalTableStatus
}

function toLocalShape(shape: string): TableData['shape'] {
  return shape.toLowerCase() as TableData['shape']
}

function layoutToNodes(layout: TableLayoutResponse): Node<TableData>[] {
  if (!Array.isArray(layout.sections)) {
    throw new Error('The table layout response is missing a sections array.')
  }

  return layout.sections.flatMap((section) =>
    section.tables.map((table) => ({
      id: table.id,
      type: 'table',
      position: { x: table.posX, y: table.posY },
      data: {
        name: table.name,
        capacity: table.capacity,
        status: toLocalStatus(table.status),
        section: section.name as TableSection,
        shape: toLocalShape(table.shape),
      },
      style: { width: table.width, height: table.height },
    }))
  )
}

function StatusBadge({ status }: { status: TableStatus }) {
  const styles: Record<TableStatus, string> = {
    AVAILABLE: 'border-status-success/30 bg-leaf/10 text-leaf ',
    OCCUPIED: 'border-status-danger/30 bg-status-danger/10 text-status-danger',
    RESERVED: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
    CLEANING: 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
  }
  return <Badge variant='outline' className={styles[status]}>{statusLabels[status]}</Badge>
}

function MonitoringTableCard({
  table,
  outletId,
  onRefresh,
}: {
  table: TableMonitoring
  outletId: string
  onRefresh: () => void
}) {
  const statusMutation = useUpdateTableStatusMutation()
  const releaseMutation = useReleaseTableMutation()
  const nextStatus: TableStatus = table.status === 'AVAILABLE' ? 'CLEANING' : 'AVAILABLE'
  const busy = statusMutation.isPending || releaseMutation.isPending

  const changeStatus = () => {
    if (table.activeTransaction && nextStatus === 'AVAILABLE' &&
        !window.confirm('This table has an active order. Make it available anyway?')) return
    statusMutation.mutate(
      { outletId, tableId: table.id, status: nextStatus },
      { onSuccess: onRefresh }
    )
  }

  return (
    <Card className='group overflow-hidden transition-shadow shadow-none'>
      <CardContent className='p-0'>
        <div className='flex items-start justify-between border-b p-4'>
          <div>
            <p className='text-base font-semibold'>{table.name}</p>
            <p className='text-muted-foreground mt-1 flex items-center gap-1 text-xs'>
              <Users className='size-3.5' /> {table.capacity} seats · {table.section.name}
            </p>
          </div>
          <StatusBadge status={table.status} />
        </div>
        <div className='space-y-3 p-4'>
          {table.activeTransaction ? (
            <div className='bg-muted/50 rounded-lg p-3'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-muted-foreground'>Active order</span>
                <span className='font-sans tabular-nums font-medium'>{table.activeTransaction.transactionNo}</span>
              </div>
              <p className='mt-1 text-right text-sm font-semibold'>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(table.activeTransaction.grandTotal)}
              </p>
            </div>
          ) : (
            <p className='text-muted-foreground text-xs'>No active order</p>
          )}
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' className='flex-1' disabled={busy} onClick={changeStatus}>
              {table.status === 'AVAILABLE' ? 'Mark cleaning' : 'Mark available'}
            </Button>
            {table.activeTransaction && (
              <Button variant='ghost' size='sm' disabled={busy} onClick={() => {
                if (window.confirm('Release this table for a new party?')) {
                  releaseMutation.mutate({ outletId, tableId: table.id }, { onSuccess: onRefresh })
                }
              }}>
                Release
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TableManagement(): React.JSX.Element {
  const { data: outletsData } = useDashboardOutletsQuery()
  const outlets = useMemo(() => outletsData?.data ?? [], [outletsData?.data])
  const [selectedOutletId, setSelectedOutletId] = useState('')
  const [view, setView] = useState<'manage' | 'monitor'>('manage')
  const [isEditMode, setIsEditMode] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node<TableData> | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>('All')
  const outletId = selectedOutletId || outlets[0]?.id || ''
  const layoutQuery = useTableLayoutQuery(outletId)
  const monitoringQuery = useTableMonitoringQuery(outletId)
  const saveMutation = useSaveTableLayoutMutation()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableData>['data']>([])
  const [edges, , onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (layoutQuery.data && !isEditMode) {
      const serverNodes = layoutToNodes(layoutQuery.data)
      setNodes(serverNodes)
    }
  }, [layoutQuery.data, isEditMode, setNodes])
  const sections = useMemo(() => Array.from(new Set(nodes.map((node) => node.data.section))), [nodes])
  const visibleNodes = nodes.filter((node) => selectedSection === 'All' || node.data.section === selectedSection)
  const stats = {
    total: visibleNodes.length,
    available: visibleNodes.filter((node) => node.data.status === 'available').length,
    unavailable: visibleNodes.filter((node) => node.data.status !== 'available').length,
  }
  const displayNodes = nodes.map((node) => ({ ...node, hidden: selectedSection !== 'All' && node.data.section !== selectedSection }))

  const addTable = () => {
    if (!outletId) return
    setIsEditMode(true)
    setShowAddDialog(true)
  }

  const saveLayout = (payload: ReturnType<typeof buildPayload>) => {
    if (!outletId) return
    const duplicate = payload.sections.find((section) => {
      const names = section.tables.map((table) => table.name.trim().toLowerCase())
      return new Set(names).size !== names.length || section.tables.some((table) => !table.name.trim() || table.capacity < 1)
    })
    if (duplicate) {
      toast.error('Check the layout', { description: 'Table names must be unique within a section and capacities must be positive.' })
      return
    }

    saveMutation.mutate({ outletId, data: payload }, {
      onSuccess: () => {
        setShowSaveDialog(false)
        setIsEditMode(false)
        setSelectedNode(null)
      },
    })
  }

  const applyTableForm = (values: {
    name: string
    capacity: number
    shape: TableData['shape']
    section: TableSection
    posX: number
    posY: number
    width: number
    height: number
  }) => {
    if (selectedNode) {
      setNodes((current) =>
        current.map((node) =>
          node.id === selectedNode.id
            ? {
                ...node,
                position: { x: values.posX, y: values.posY },
                data: {
                  ...node.data,
                  name: values.name,
                  capacity: values.capacity,
                  shape: values.shape,
                  section: values.section,
                },
                style: { width: values.width, height: values.height },
              }
            : node
        )
      )
      setSelectedNode(null)
      return
    }

    const node: Node<TableData> = {
      id: crypto.randomUUID(),
      type: 'table',
      position: { x: values.posX, y: values.posY },
      data: {
        name: values.name,
        capacity: values.capacity,
        status: 'available',
        section: values.section,
        shape: values.shape,
      },
      style: { width: values.width, height: values.height },
    }
    setNodes((current) => [...current, node])
    setShowAddDialog(false)
  }

  return (
    <Main fixed>
      <AppHeader />
      <section className='flex min-h-full flex-col gap-6'>
        <PageHeader
          title='Tables'
          description='Floor layout and live table status by outlet'
          actions={
            <Select value={outletId} onValueChange={setSelectedOutletId}>
              <SelectTrigger size='sm' aria-label='Outlet' className='h-8 w-56 text-[13px]'><SelectValue placeholder='Select outlet' /></SelectTrigger>
              <SelectContent>{outlets.map((outlet) => <SelectItem key={outlet.id} value={outlet.id}>{outlet.name}</SelectItem>)}</SelectContent>
            </Select>
          }
        />
        <div className='border-divider flex items-center justify-between border-b'>
          <Tabs value={view} onValueChange={(value) => setView(value as typeof view)}>
            <TabsList variant='line' aria-label='Table views'>
              <TabsTrigger value='manage'>Table management</TabsTrigger>
              <TabsTrigger value='monitor'>Live monitoring</TabsTrigger>
            </TabsList>
          </Tabs>
          {view === 'monitor' && <Button variant='ghost' size='sm' onClick={() => monitoringQuery.refetch()} disabled={monitoringQuery.isFetching}><RefreshCw className={monitoringQuery.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh</Button>}
        </div>

        {!outletId ? (
          <Card><CardContent className='text-muted-foreground flex items-center gap-2 p-8 text-sm'><AlertCircle className='size-4' /> Add an outlet to configure tables.</CardContent></Card>
        ) : view === 'monitor' ? (
          <div className='space-y-6'>
            {monitoringQuery.data && <DataPanel aria-label='Table status summary' className='overflow-hidden'>
              <MetricGroup className='grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'>
                {([['tables', 'Tables'], ['AVAILABLE', 'Available'], ['OCCUPIED', 'Occupied'], ['RESERVED', 'Reserved'], ['CLEANING', 'Cleaning']] as const).map(([key, label]) => (
                  <Metric key={key} label={label} value={key === 'tables' ? monitoringQuery.data.totals.tables : monitoringQuery.data.totals.byStatus[key]} />
                ))}
              </MetricGroup>
            </DataPanel>}
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {(monitoringQuery.data?.tables ?? []).map((table) => <MonitoringTableCard key={table.id} table={table} outletId={outletId} onRefresh={() => monitoringQuery.refetch()} />)}
            </div>
          </div>
        ) : (
          <>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <dl className='flex flex-wrap gap-x-6 gap-y-1 text-[13px]'>
                {[
                  ['total', stats.total, 'Tables'],
                  ['available', stats.available, 'Available'],
                  ['unavailable', stats.unavailable, 'In service'],
                ].map(([key, value, label]) => (
                  <div key={key} className='flex items-baseline gap-1.5'>
                    <dd className='font-semibold tabular-nums'>{value}</dd>
                    <dt className='text-fg-muted'>{label}</dt>
                  </div>
                ))}
              </dl>
              <div className='flex gap-2'>
                <Button variant='outline' onClick={() => { setIsEditMode((current) => !current); setSelectedNode(null) }}>{isEditMode ? <Check /> : <Edit2 />} {isEditMode ? 'Editing' : 'Edit layout'}</Button>
                {isEditMode && (
                  <Button onClick={() => setShowSaveDialog(true)} disabled={saveMutation.isPending}>
                    <Save /> Save layout
                  </Button>
                )}
                <Button onClick={addTable}>
                  <Plus /> Add table
                </Button>
              </div>
            </div>
            <div className='flex items-center gap-1 overflow-x-auto border-b'>
              <button onClick={() => setSelectedSection('All')} className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm ${selectedSection === 'All' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}><LayoutGrid className='size-4' /> All areas</button>
              {sections.map((section) => <button key={section} onClick={() => setSelectedSection(section)} className={`border-b-2 px-3 py-2 text-sm ${selectedSection === section ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>{section}</button>)}
            </div>
            <Card className='min-h-[560px] flex-1 overflow-hidden'>
              <CardHeader className='border-b py-3'><CardTitle className='text-sm font-medium'>{layoutQuery.isLoading ? 'Loading layout…' : `${stats.total} tables in ${selectedSection === 'All' ? 'all areas' : selectedSection}`}</CardTitle></CardHeader>
              <CardContent className='relative h-[560px] p-0'>
                <ReactFlow nodes={displayNodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={(_, node) => isEditMode && setSelectedNode(node as Node<TableData>)} nodeTypes={nodeTypes} nodesDraggable={isEditMode} nodesConnectable={false} elementsSelectable={isEditMode} fitView>
                  <Background variant={BackgroundVariant.Dots} gap={24} size={1} color='var(--border)' /><Controls showInteractive={false} /><MiniMap nodeColor={(node) => node.data.status === 'available' ? 'var(--success)' : 'var(--destructive)'} /><Panel position='bottom-left' className='bg-popover rounded-lg px-3 py-1 text-xs shadow-overlay'>{isEditMode ? 'Drag tables or select one to edit' : 'Switch to edit layout to make changes'}</Panel>
                </ReactFlow>
              </CardContent>
            </Card>
          </>
        )}
      </section>
      <SaveLayoutDialog open={showSaveDialog} nodes={nodes} onConfirm={saveLayout} onCancel={() => setShowSaveDialog(false)} />
      <TableFormDialog
        key={`add-${showAddDialog}`}
        open={showAddDialog}
        mode='add'
        defaultSection={(selectedSection === 'All' ? sections[0] : selectedSection) as TableSection ?? 'Main Hall'}
        onOpenChange={setShowAddDialog}
        onSubmit={applyTableForm}
      />
      <TableFormDialog
        key={`edit-${selectedNode?.id ?? 'none'}`}
        open={!!selectedNode}
        mode='edit'
        node={selectedNode}
        defaultSection='Main Hall'
        onOpenChange={(open) => {
          if (!open) setSelectedNode(null)
        }}
        onSubmit={applyTableForm}
      />
    </Main>
  )
}
