import type { MonitorOutlet } from '../api/outlet-monitor.types'
import { HEX_GRID } from './hex-grid'
import { PLACES, PROVINCE_SEATS, type Place } from './places'

/** Hex radius in map units; columns sit √3·R apart and rows 1.5·R apart. */
const R = 6
const COLUMN = Math.sqrt(3) * R
const ROW = 1.5 * R
const PAD = R + 2

export const MAP_WIDTH = PAD * 2 + (HEX_GRID.columns - 0.5) * COLUMN
export const MAP_HEIGHT = PAD * 2 + (HEX_GRID.rows.length - 1) * ROW

interface MapPoint {
  x: number
  y: number
}

/** Equirectangular, matching how the grid was sampled; fine this close to the equator. */
export function project(latitude: number, longitude: number): MapPoint {
  return {
    x: PAD + ((longitude - HEX_GRID.lonMin) / HEX_GRID.colStep) * COLUMN,
    y: PAD + ((HEX_GRID.latMax - latitude) / HEX_GRID.rowStep) * ROW,
  }
}

export function isOnMap({ x, y }: MapPoint) {
  return x >= 0 && x <= MAP_WIDTH && y >= 0 && y <= MAP_HEIGHT
}

/** Every land cell as one path, drawn at `scale` of a full cell to leave gutters. */
export function hexLandPath(scale = 0.78) {
  const r = R * scale
  const w = (Math.sqrt(3) / 2) * r
  const cell = (cx: number, cy: number) =>
    `M${cx.toFixed(2)} ${(cy - r).toFixed(2)}l${w.toFixed(2)} ${(r / 2).toFixed(2)}v${r.toFixed(2)}l${(-w).toFixed(2)} ${(r / 2).toFixed(2)}l${(-w).toFixed(2)} ${(-r / 2).toFixed(2)}v${(-r).toFixed(2)}z`
  let path = ''
  HEX_GRID.rows.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      if (line[col] !== '#') continue
      path += cell(PAD + (col + (row % 2 ? 0.5 : 0)) * COLUMN, PAD + row * ROW)
    }
  })
  return path
}

const normalize = (text: string) =>
  ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `

/**
 * The place an address names. Addresses run from street to province, so the
 * name that ends latest wins, then the longest ("Jakarta Selatan" over
 * "Jakarta", "Kepulauan Riau" over "Riau"); a province alone falls back to
 * its capital.
 */
export function placeFromAddress(address: string | null | undefined) {
  if (!address) return null
  const text = normalize(address)
  const find = (needles: [string, Place][]) => {
    let best: { place: Place; end: number; length: number } | null = null
    for (const [needle, place] of needles) {
      const at = text.lastIndexOf(` ${needle} `)
      if (at < 0) continue
      const end = at + needle.length
      if (
        !best ||
        end > best.end ||
        (end === best.end && needle.length > best.length)
      )
        best = { place, end, length: needle.length }
    }
    return best?.place ?? null
  }
  const cities = PLACES.flatMap((place) =>
    [place.name.toLowerCase(), ...(place.aliases ?? [])].map(
      (needle) => [needle, place] as [string, Place]
    )
  )
  const provinces = Object.entries(PROVINCE_SEATS).flatMap(([needle, seat]) => {
    const place = PLACES.find((p) => p.name === seat)
    return place ? [[needle, place] as [string, Place]] : []
  })
  return find(cities) ?? find(provinces)
}

/** The closest listed place and its distance in km (equirectangular approximation). */
export function nearestPlace(latitude: number, longitude: number) {
  let best = { place: PLACES[0], km: Number.POSITIVE_INFINITY }
  for (const place of PLACES) {
    const dx =
      (place.longitude - longitude) *
      Math.cos((((place.latitude + latitude) / 2) * Math.PI) / 180)
    const dy = place.latitude - latitude
    const km = Math.sqrt(dx * dx + dy * dy) * 111.32
    if (km < best.km) best = { place, km }
  }
  return best
}

export interface OutletLocation {
  latitude: number
  longitude: number
  /** Exact: saved coordinates. Approximate: the centre of the city in the address. */
  precision: 'exact' | 'approximate'
  /** "Bandung, Jawa Barat", or the province alone when no listed city is near. */
  region: string
  province: string
}

export function locateOutlet(outlet: {
  latitude: number | null
  longitude: number | null
  address: string | null
}): OutletLocation | null {
  if (outlet.latitude != null && outlet.longitude != null) {
    const { place, km } = nearestPlace(outlet.latitude, outlet.longitude)
    return {
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      precision: 'exact',
      region: km <= 40 ? `${place.name}, ${place.province}` : place.province,
      province: place.province,
    }
  }
  const place = placeFromAddress(outlet.address)
  if (!place) return null
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    precision: 'approximate',
    region: `${place.name}, ${place.province}`,
    province: place.province,
  }
}

export interface LocatedOutlet {
  outlet: MonitorOutlet
  location: OutletLocation | null
}

/** Has a location, and that location is inside the map. */
export function isPlaced({ location }: LocatedOutlet) {
  return (
    location != null && isOnMap(project(location.latitude, location.longitude))
  )
}

/**
 * Pushes overlapping circles apart so every node stays visible and hoverable,
 * moving each as little as possible, and keeps them inside `bounds`.
 * Coincident nodes fan out deterministically.
 */
export function spreadNodes<T extends MapPoint & { r: number }>(
  nodes: T[],
  bounds: { width: number; height: number },
  gap = 2,
  iterations = 80
): T[] {
  const out = nodes.map((node) => ({ ...node }))
  for (let step = 0; step < iterations; step++) {
    let moved = false
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i]
        const b = out[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let distance = Math.hypot(dx, dy)
        const min = a.r + b.r + gap
        if (distance >= min) continue
        if (distance < 1e-6) {
          const angle = j * 2.399963 // golden angle
          dx = Math.cos(angle)
          dy = Math.sin(angle)
          distance = 1
        }
        const push = (min - Math.min(distance, min)) / 2
        const ux = dx / Math.max(distance, 1e-6)
        const uy = dy / Math.max(distance, 1e-6)
        a.x -= ux * push
        a.y -= uy * push
        b.x += ux * push
        b.y += uy * push
        moved = true
      }
    }
    if (!moved) break
  }
  for (const node of out) {
    node.x = Math.min(bounds.width - node.r, Math.max(node.r, node.x))
    node.y = Math.min(bounds.height - node.r, Math.max(node.r, node.y))
  }
  return out
}

interface MapLabel {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * Names for the largest nodes, beside them where there is room: right, left,
 * above, then below. A label that would cover another label, another node or
 * the edge is dropped; the table and hover card still name every outlet.
 */
export function placeLabels(
  nodes: (MapPoint & { r: number; id: string; text: string; weight: number })[],
  bounds: { width: number; height: number },
  { max = 8, charWidth = 6.4, height = 16, gap = 4 } = {}
): MapLabel[] {
  type Box = { x: number; y: number; width: number; height: number }
  const overlaps = (a: Box, b: Box) =>
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  const nodeBox = (n: MapPoint & { r: number }): Box => ({
    x: n.x - n.r,
    y: n.y - n.r,
    width: n.r * 2,
    height: n.r * 2,
  })
  const taken: Box[] = []
  const labels: MapLabel[] = []
  const ranked = [...nodes].sort((a, b) => b.weight - a.weight).slice(0, max)
  for (const node of ranked) {
    const width = Math.ceil(node.text.length * charWidth) + 4
    const middle = node.y - height / 2
    const candidates: Box[] = [
      { x: node.x + node.r + gap, y: middle, width, height },
      { x: node.x - node.r - gap - width, y: middle, width, height },
      {
        x: node.x - width / 2,
        y: node.y - node.r - gap - height,
        width,
        height,
      },
      { x: node.x - width / 2, y: node.y + node.r + gap, width, height },
    ]
    const fit = candidates.find(
      (box) =>
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= bounds.width &&
        box.y + box.height <= bounds.height &&
        !taken.some((other) => overlaps(box, other)) &&
        !nodes.some((other) => other !== node && overlaps(box, nodeBox(other)))
    )
    if (!fit) continue
    taken.push(fit)
    labels.push({ id: node.id, text: node.text, ...fit })
  }
  return labels
}

/** "-6.2088, 106.8456" as copied from a map app; null when it is not a valid position. */
export function parseCoordinates(text: string) {
  const match = text
    .trim()
    .match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (!match) return null
  const latitude = Number(match[1])
  const longitude = Number(match[2])
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return { latitude, longitude }
}

export function formatCoordinates(latitude: number, longitude: number) {
  return `${Number(latitude.toFixed(6))}, ${Number(longitude.toFixed(6))}`
}
