import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { useActivityCopy } from '../lib/activity'
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  hexLandPath,
  isPlaced,
  placeLabels,
  project,
  spreadNodes,
  type LocatedOutlet,
} from '../lib/geo'
import { OutletCashflowCard } from './outlet-cashflow-card'

/** Node radius in px: area follows inflow; an outlet with nothing in yet is a small ring. */
const R_EMPTY = 5
const R_MIN = 7
const R_MAX = 18

const LAND_PATH = hexLandPath()

function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width))
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return width
}

interface OutletMapProps {
  outlets: LocatedOutlet[]
  activeId: string | null
  onActiveChange: Dispatch<SetStateAction<string | null>>
  onOpenOutlet: (id: string) => void
  liveWindowMinutes: number
  currentHour: number
  isLoading?: boolean
}

/**
 * Hex-dot map of Indonesia with one node per outlet. The land is SVG; nodes and
 * labels are HTML on top so they keep a constant, legible size at any width.
 */
export function OutletMap({
  outlets,
  activeId,
  onActiveChange,
  onOpenOutlet,
  liveWindowMinutes,
  currentHour,
  isLoading,
}: OutletMapProps) {
  const copy = useCopy()
  const activityCopy = useActivityCopy(liveWindowMinutes)
  const ref = useRef<HTMLDivElement>(null)
  const width = useWidth(ref)
  const height = (width * MAP_HEIGHT) / MAP_WIDTH

  const nodes = useMemo(() => {
    if (!width) return []
    const scale = width / MAP_WIDTH
    // Smaller nodes on a phone-sized map, so one city does not cover a province.
    const size = Math.min(1, Math.max(0.6, width / 640))
    const placed = outlets.filter(isPlaced)
    const max = Math.max(0, ...placed.map(({ outlet }) => outlet.inflow))
    return spreadNodes(
      placed.map(({ outlet, location }) => {
        const point = project(location!.latitude, location!.longitude)
        return {
          id: outlet.outletId,
          text:
            outlet.name.length > 20
              ? `${outlet.name.slice(0, 19)}…`
              : outlet.name,
          weight: outlet.inflow,
          x: point.x * scale,
          y: point.y * scale,
          r:
            size *
            (outlet.inflow > 0 && max > 0
              ? R_MIN + (R_MAX - R_MIN) * Math.sqrt(outlet.inflow / max)
              : R_EMPTY),
          outlet,
          location: location!,
        }
      }),
      { width, height },
      3
    )
  }, [outlets, width, height])

  const labels = useMemo(
    () => placeLabels(nodes, { width, height }, { max: width < 480 ? 3 : 8 }),
    [nodes, width, height]
  )

  return (
    <TooltipPrimitive.Provider delayDuration={60} skipDelayDuration={400}>
      <div
        ref={ref}
        className='relative w-full'
        style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}
      >
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className='absolute inset-0 size-full'
          aria-hidden
        >
          <path d={LAND_PATH} className='fill-divider-strong' />
        </svg>

        {labels.map((label) => {
          const leftOfNode =
            label.x < (nodes.find((n) => n.id === label.id)?.x ?? 0)
          return (
            <span
              key={label.id}
              aria-hidden
              className={cn(
                'text-foreground pointer-events-none absolute truncate text-[11px] leading-4 font-medium transition-opacity [text-shadow:0_0_2px_var(--card),0_0_3px_var(--card),0_0_4px_var(--card)]',
                activeId && activeId !== label.id && 'opacity-30'
              )}
              style={{
                left: label.x,
                top: label.y,
                width: label.width,
                textAlign: leftOfNode ? 'right' : 'left',
              }}
            >
              {label.text}
            </span>
          )
        })}

        {nodes.map((node) => {
          const { outlet } = node
          const active = activeId === node.id
          const filled = outlet.inflow > 0
          return (
            <TooltipPrimitive.Root
              key={node.id}
              // A closing node must not clear the node that just opened.
              onOpenChange={(open) =>
                onActiveChange((current) =>
                  open ? node.id : current === node.id ? null : current
                )
              }
            >
              <TooltipPrimitive.Trigger asChild>
                <button
                  type='button'
                  aria-label={copy(
                    `${outlet.name}, ${activityCopy(outlet.activity).label}, arus kas bersih ${formatMoney(outlet.net)}. Buka penjualan outlet.`,
                    `${outlet.name}, ${activityCopy(outlet.activity).label}, net cashflow ${formatMoney(outlet.net)}. Open outlet sales.`
                  )}
                  onClick={() => onOpenOutlet(node.id)}
                  className={cn(
                    "focus-visible:outline-ring absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full transition-[opacity,box-shadow] duration-150 before:absolute before:-inset-2 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4",
                    filled
                      ? 'bg-series-primary/80 ring-card ring-2'
                      : 'bg-card border-series-neutral border-[1.5px]',
                    active && 'ring-foreground z-10 ring-2',
                    activeId && !active && 'opacity-35'
                  )}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.r * 2,
                    height: node.r * 2,
                  }}
                >
                  {outlet.activity === 'LIVE' && (
                    <span
                      aria-hidden
                      className='border-status-success absolute -inset-0.5 animate-ping rounded-full border-2 [animation-duration:2s] motion-reduce:hidden'
                    />
                  )}
                  {node.location.precision === 'approximate' && (
                    <span
                      aria-hidden
                      className='border-fg-muted absolute -inset-[5px] rounded-full border border-dashed'
                    />
                  )}
                </button>
              </TooltipPrimitive.Trigger>
              <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                  side='right'
                  align='center'
                  sideOffset={12}
                  collisionPadding={12}
                  className='bg-popover text-popover-foreground border-divider-strong shadow-overlay animate-in fade-in-0 zoom-in-95 z-50 rounded-lg border p-3'
                >
                  <OutletCashflowCard
                    outlet={outlet}
                    location={node.location}
                    liveWindowMinutes={liveWindowMinutes}
                    currentHour={currentHour}
                  />
                </TooltipPrimitive.Content>
              </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
          )
        })}

        {isLoading && !nodes.length && (
          <p
            role='status'
            className='text-fg-muted absolute inset-0 flex items-center justify-center text-[13px]'
          >
            {copy('Memuat outlet…', 'Loading outlets…')}
          </p>
        )}
      </div>
    </TooltipPrimitive.Provider>
  )
}

/** Key for the map's encodings, in the order a reader needs them. */
export function OutletMapLegend({
  liveWindowMinutes,
}: {
  liveWindowMinutes: number
}) {
  const copy = useCopy()
  return (
    <ul className='text-fg-secondary flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
      <li className='flex items-center gap-1.5'>
        <span aria-hidden className='flex items-end gap-0.5'>
          <span className='bg-series-primary/80 size-1.5 rounded-full' />
          <span className='bg-series-primary/80 size-2.5 rounded-full' />
        </span>
        {copy('Ukuran = arus masuk hari ini', 'Size = inflow today')}
      </li>
      <li className='flex items-center gap-1.5'>
        <span
          aria-hidden
          className='border-status-success size-2.5 rounded-full border-2'
        />
        {copy(
          `Terjual dalam ${liveWindowMinutes} mnt`,
          `Sold in last ${liveWindowMinutes} min`
        )}
      </li>
      <li className='flex items-center gap-1.5'>
        <span
          aria-hidden
          className='border-series-neutral size-2.5 rounded-full border-[1.5px]'
        />
        {copy('Belum ada penjualan', 'No sales yet')}
      </li>
      <li className='flex items-center gap-1.5'>
        <span
          aria-hidden
          className='border-fg-muted size-2.5 rounded-full border border-dashed'
        />
        {copy('Lokasi dari alamat', 'Location from address')}
      </li>
    </ul>
  )
}
