import { describe, expect, it } from 'vitest'
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  formatCoordinates,
  isOnMap,
  locateOutlet,
  parseCoordinates,
  placeFromAddress,
  placeLabels,
  project,
  spreadNodes,
} from './geo'
import { HEX_GRID } from './hex-grid'
import { PLACES, PROVINCE_SEATS } from './places'

describe('project', () => {
  it('puts every listed city on a land cell of the grid', () => {
    for (const place of PLACES) {
      const row = Math.round(
        (HEX_GRID.latMax - place.latitude) / HEX_GRID.rowStep
      )
      const col = Math.round(
        (place.longitude - HEX_GRID.lonMin) / HEX_GRID.colStep -
          (row % 2 ? 0.5 : 0)
      )
      const neighbourhood = [-1, 0, 1].flatMap((dr) =>
        [-1, 0, 1].map((dc) => HEX_GRID.rows[row + dr]?.[col + dc])
      )
      expect(neighbourhood, place.name).toContain('#')
      expect(isOnMap(project(place.latitude, place.longitude))).toBe(true)
    }
  })

  it('keeps places outside Indonesia off the map', () => {
    expect(isOnMap(project(35.68, 139.69))).toBe(false) // Tokyo
    expect(isOnMap(project(-33.87, 151.21))).toBe(false) // Sydney
    expect(MAP_WIDTH / MAP_HEIGHT).toBeGreaterThan(2)
  })
})

describe('placeFromAddress', () => {
  it('prefers the most specific and the latest city in the address', () => {
    expect(placeFromAddress('Jl. Sudirman No. 1, Jakarta Selatan')?.name).toBe(
      'Jakarta Selatan'
    )
    expect(
      placeFromAddress('Jl. Medan Merdeka Barat 12, Jakarta Pusat')?.name
    ).toBe('Jakarta Pusat')
    expect(placeFromAddress('Jl. Bandung 5, Malang, Jawa Timur')?.name).toBe(
      'Malang'
    )
    expect(placeFromAddress('Ruko BSD Blok A, Serpong')?.name).toBe(
      'Tangerang Selatan'
    )
  })

  it('falls back to the provincial capital, and to nothing', () => {
    expect(placeFromAddress('Desa Sukamaju, Jawa Barat')?.name).toBe('Bandung')
    expect(placeFromAddress('Kepulauan Riau')?.name).toBe('Batam')
    expect(placeFromAddress('Jl. Mawar No. 3')).toBeNull()
    expect(placeFromAddress(null)).toBeNull()
  })

  it('maps every province shorthand to a listed city', () => {
    for (const seat of Object.values(PROVINCE_SEATS))
      expect(
        PLACES.some((place) => place.name === seat),
        seat
      ).toBe(true)
  })
})

describe('locateOutlet', () => {
  it('uses saved coordinates first and names the nearby city', () => {
    expect(
      locateOutlet({
        latitude: -6.91,
        longitude: 107.61,
        address: 'Surabaya',
      })
    ).toMatchObject({
      precision: 'exact',
      region: 'Bandung, Jawa Barat',
      province: 'Jawa Barat',
    })
  })

  it('estimates from the address otherwise', () => {
    expect(
      locateOutlet({ latitude: null, longitude: null, address: 'Denpasar' })
    ).toMatchObject({ precision: 'approximate', province: 'Bali' })
    expect(
      locateOutlet({ latitude: null, longitude: null, address: '' })
    ).toBeNull()
  })
})

describe('spreadNodes', () => {
  it('separates coincident and overlapping nodes within bounds', () => {
    const nodes = spreadNodes(
      [
        { x: 50, y: 50, r: 10 },
        { x: 50, y: 50, r: 10 },
        { x: 55, y: 52, r: 6 },
      ],
      { width: 200, height: 100 }
    )
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const gap =
          Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) -
          nodes[i].r -
          nodes[j].r
        expect(gap).toBeGreaterThan(1)
      }
      expect(nodes[i].x).toBeGreaterThanOrEqual(nodes[i].r)
      expect(nodes[i].y).toBeLessThanOrEqual(100 - nodes[i].r)
    }
  })
})

describe('placeLabels', () => {
  const node = (id: string, x: number, weight: number) => ({
    id,
    text: id,
    x,
    y: 50,
    r: 8,
    weight,
  })

  it('labels the largest first and never overlaps labels', () => {
    const labels = placeLabels(
      [node('Kemang', 40, 3), node('Braga', 120, 2), node('Darmo', 300, 1)],
      { width: 400, height: 100 }
    )
    expect(labels.map((l) => l.id)).toEqual(['Kemang', 'Braga', 'Darmo'])
    for (let i = 0; i < labels.length; i++)
      for (let j = i + 1; j < labels.length; j++)
        expect(
          labels[i].x + labels[i].width <= labels[j].x ||
            labels[j].x + labels[j].width <= labels[i].x ||
            labels[i].y + labels[i].height <= labels[j].y ||
            labels[j].y + labels[j].height <= labels[i].y
        ).toBe(true)
  })

  it('moves a label to the left at the right edge, and caps the count', () => {
    const [label] = placeLabels([node('Edge', 390, 1)], {
      width: 400,
      height: 100,
    })
    expect(label.x + label.width).toBeLessThanOrEqual(390 - 8)
    expect(
      placeLabels(
        [node('A', 40, 2), node('B', 300, 1)],
        {
          width: 400,
          height: 100,
        },
        { max: 1 }
      )
    ).toHaveLength(1)
  })
})

describe('coordinates', () => {
  it('reads what map apps copy and rejects anything else', () => {
    expect(parseCoordinates('-6.2088, 106.8456')).toEqual({
      latitude: -6.2088,
      longitude: 106.8456,
    })
    expect(parseCoordinates(' -8.67 115.21 ')).toEqual({
      latitude: -8.67,
      longitude: 115.21,
    })
    expect(parseCoordinates('91, 10')).toBeNull()
    expect(parseCoordinates('Jakarta')).toBeNull()
    expect(formatCoordinates(-6.20880001, 106.8456)).toBe('-6.2088, 106.8456')
  })
})
