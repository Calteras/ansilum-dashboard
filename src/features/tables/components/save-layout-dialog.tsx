import { useState } from 'react'
import { Check, Copy, Database, LayoutGrid, Users } from '@/components/icons'
import type { Node } from 'reactflow'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import type { TableData } from '../data/types'

// ── Payload types (mirrors the Prisma schema) ─────────────────────────────

export interface TableLayoutRow {
  /** Existing or client-generated stable table ID. */
  id: string
  name: string
  capacity: number
  /** Uppercase to match the Prisma enum */
  shape: 'RECTANGLE' | 'SQUARE' | 'CIRCLE'
  posX: number
  posY: number
  width: number
  height: number
}

export interface SectionPayload {
  name: string
  tables: TableLayoutRow[]
}

export interface LayoutPayload {
  version: 1
  savedAt: string
  /** Total table count across all sections */
  totalTables: number
  sections: SectionPayload[]
}

// ── Builder ───────────────────────────────────────────────────────────────

export function buildPayload(nodes: Node<TableData>[]): LayoutPayload {
  const sectionMap = new Map<string, TableLayoutRow[]>()

  for (const node of nodes) {
    const { data, id, style, position } = node
    if (!sectionMap.has(data.section)) sectionMap.set(data.section, [])
    sectionMap.get(data.section)!.push({
      id,
      name: data.name,
      capacity: data.capacity,
      shape: data.shape.toUpperCase() as TableLayoutRow['shape'],
      posX: Math.round(position.x),
      posY: Math.round(position.y),
      width: typeof style?.width === 'number' ? Math.round(style.width) : 120,
      height: typeof style?.height === 'number' ? Math.round(style.height) : 120,
    })
  }

  const sections = Array.from(sectionMap.entries()).map(([name, tables]) => ({
    name,
    tables,
  }))

  return {
    version: 1,
    savedAt: new Date().toISOString(),
    totalTables: nodes.length,
    sections,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className='border-border bg-muted/50 hover:bg-muted text-muted-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors'
    >
      {copied ? (
        <>
          <Check className='h-3.5 w-3.5 text-leaf' />
          Copied
        </>
      ) : (
        <>
          <Copy className='h-3.5 w-3.5' />
          Copy JSON
        </>
      )}
    </button>
  )
}

function ShapeBadge({ shape }: { shape: TableLayoutRow['shape'] }) {
  const label = shape === 'CIRCLE' ? 'Circle' : shape === 'SQUARE' ? 'Square' : 'Rect'
  return (
    <span className='bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-sans tabular-nums text-xs uppercase tracking-wide'>
      {label}
    </span>
  )
}

function StructureView({ payload }: { payload: LayoutPayload }) {
  return (
    <div className='space-y-4'>
      {payload.sections.map((section) => (
        <div key={section.name} className='border-border rounded-xl border'>
          {/* Section header */}
          <div className='bg-muted/40 flex items-center gap-2 rounded-t-xl border-b px-4 py-2.5'>
            <LayoutGrid className='text-primary h-3.5 w-3.5' />
            <span className='text-foreground text-sm font-semibold'>{section.name}</span>
            <Badge variant='secondary' className='ml-auto text-xs'>
              {section.tables.length} table{section.tables.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Tables list */}
          <div className='divide-border divide-y'>
            {section.tables.map((table) => (
              <div
                key={table.id}
                className='flex items-center gap-3 px-4 py-3 text-sm'
              >
                {/* Name */}
                <span className='text-foreground w-16 font-semibold'>{table.name}</span>

                {/* Shape */}
                <ShapeBadge shape={table.shape} />

                {/* Capacity */}
                <span className='text-muted-foreground flex items-center gap-1'>
                  <Users className='h-3 w-3' />
                  {table.capacity}
                </span>

                {/* Position & size */}
                <span className='text-muted-foreground ml-auto font-sans tabular-nums text-xs'>
                  ({table.posX}, {table.posY}) · {table.width}×{table.height}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function JsonView({ payload }: { payload: LayoutPayload }) {
  const json = JSON.stringify(payload, null, 2)
  return (
    <div className='relative'>
      <div className='absolute top-3 right-3 z-10'>
        <CopyButton text={json} />
      </div>
      <pre className='bg-muted/40 border-border overflow-x-auto rounded-xl border p-4 font-sans tabular-nums text-xs leading-relaxed'>
        {json}
      </pre>
    </div>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────

interface SaveLayoutDialogProps {
  open: boolean
  nodes: Node<TableData>[]
  onConfirm: (payload: LayoutPayload) => void
  onCancel: () => void
}

export function SaveLayoutDialog({
  open,
  nodes,
  onConfirm,
  onCancel,
}: SaveLayoutDialogProps) {
  const payload = buildPayload(nodes)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className='flex max-h-[85vh] max-w-2xl flex-col gap-0 p-0'>
        {/* Header */}
        <DialogHeader className='border-border border-b px-6 py-5'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg'>
              <Database className='text-primary h-4 w-4' />
            </div>
            <div>
              <DialogTitle className='text-base'>Save Floor Layout</DialogTitle>
              <DialogDescription className='text-xs'>
                {payload.totalTables} table{payload.totalTables !== 1 ? 's' : ''} across{' '}
                {payload.sections.length} section
                {payload.sections.length !== 1 ? 's' : ''} · v{payload.version}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <Tabs defaultValue='structure' className='flex min-h-0 flex-1 flex-col'>
          <div className='border-border border-b px-6'>
            <TabsList className='h-10 bg-transparent p-0'>
              <TabsTrigger
                value='structure'
                className='data-[state=active]:border-primary data-[state=active]:text-primary h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 text-sm font-medium shadow-none'
              >
                Layout Structure
              </TabsTrigger>
              <TabsTrigger
                value='json'
                className='data-[state=active]:border-primary data-[state=active]:text-primary h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 text-sm font-medium shadow-none'
              >
                JSON Payload
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='structure' className='mt-0 min-h-0 flex-1'>
            <ScrollArea className='h-[400px] px-6 py-4'>
              <StructureView payload={payload} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value='json' className='mt-0 min-h-0 flex-1'>
            <ScrollArea className='h-[400px] px-6 py-4'>
              <JsonView payload={payload} />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Footer */}
        <DialogFooter className='px-6 py-4'>
          <Button variant='outline' onClick={onCancel}>
            Keep Editing
          </Button>
          <Button onClick={() => onConfirm(payload)} className='gap-2'>
            <Database className='h-4 w-4' />
            Save Layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
