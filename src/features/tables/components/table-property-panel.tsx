import { CircleDot, RectangleHorizontal, Square, X } from '@/components/icons'
import type { Node } from 'reactflow'
import type {
  TableData,
  TableSection,
  TableShape,
  TableStatus,
} from '../data/types'

interface PropertyPanelProps {
  node: Node<TableData> | null
  onUpdate: (updates: Partial<TableData>) => void
  onSave?: () => void
  onDelete: (id: string) => void
  onClose: () => void
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  node,
  onUpdate,
  onSave,
  onDelete,
  onClose,
}) => {
  if (!node) return null

  const shapes: TableShape[] = ['rectangle', 'square', 'circle']
  const sections: TableSection[] = [
    'Main Hall',
    'Outdoor',
    'VIP Room',
    'Bar Area',
    'Private Dining',
  ]
  const statuses: TableStatus[] = [
    'available',
    'occupied',
    'reserved',
    'cleaning',
  ]

  return (
    <div className='bg-popover text-popover-foreground absolute top-20 right-4 z-50 w-80 rounded-lg border p-4 shadow-overlay'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>Table properties</h3>
        <button
          onClick={onClose}
          className='hover:bg-muted rounded-lg p-1 transition-colors'
        >
          <X className='h-4 w-4' />
        </button>
      </div>

      <div className='space-y-3'>
        <div>
          <label className='text-muted-foreground mb-1 block text-xs font-medium'>
            Name
          </label>
          <input
            type='text'
            value={node.data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className='border-input bg-background w-full rounded-lg border px-3 py-2 text-sm'
          />
        </div>

        <div>
          <label className='text-muted-foreground mb-1 block text-xs font-medium'>
            Capacity
          </label>
          <input
            type='number'
            value={node.data.capacity}
            onChange={(e) =>
              onUpdate({ capacity: parseInt(e.target.value) || 1 })
            }
            className='border-input bg-background w-full rounded-lg border px-3 py-2 text-sm'
            min='1'
            max='20'
          />
        </div>

        <div>
          <label className='text-muted-foreground mb-1 block text-xs font-medium'>
            Shape
          </label>
          <div className='grid grid-cols-3 gap-2'>
            {shapes.map((shape) => (
              <button
                key={shape}
                onClick={() => onUpdate({ shape })}
                className={`rounded-lg border p-3 transition-colors ${
                  node.data.shape === shape
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {shape === 'rectangle' && (
                  <RectangleHorizontal className='mx-auto h-5 w-5' />
                )}
                {shape === 'square' && <Square className='mx-auto h-5 w-5' />}
                {shape === 'circle' && (
                  <CircleDot className='mx-auto h-5 w-5' />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className='text-muted-foreground mb-1 block text-xs font-medium'>
            Status
          </label>
          <select
            value={node.data.status}
            onChange={(e) =>
              onUpdate({ status: e.target.value as TableStatus })
            }
            className='border-input bg-background w-full rounded-lg border px-3 py-2 text-sm'
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='text-muted-foreground mb-1 block text-xs font-medium'>
            Section
          </label>
          <select
            value={node.data.section}
            onChange={(e) =>
              onUpdate({ section: e.target.value as TableSection })
            }
            className='border-input bg-background w-full rounded-lg border px-3 py-2 text-sm'
          >
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>

        {onSave && (
          <button
            onClick={onSave}
            className='bg-primary text-primary-foreground hover:bg-primary/90 mt-4 w-full rounded-lg px-4 py-2 font-medium transition-colors'
          >
            Save table changes
          </button>
        )}
        <button
          onClick={() => onDelete(node.id)}
          className='bg-destructive text-destructive-foreground hover:bg-destructive/90 mt-4 w-full rounded-lg px-4 py-2 font-medium transition-colors'
        >
          Delete Table
        </button>
      </div>
    </div>
  )
}
