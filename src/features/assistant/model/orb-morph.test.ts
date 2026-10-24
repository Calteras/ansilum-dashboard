import { MODE_FRAMES, resolvePreset } from 'thinking-orbs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mixFrames, morphFrame, MORPH_MS } from './orb-morph'

const frameOf = (state: 'breathing' | 'working' | 'composing', t = 1.3) => {
  const preset = resolvePreset(state, 64)
  return MODE_FRAMES[preset.mode](64, t, preset.opts)
}

afterEach(() => vi.restoreAllMocks())

describe('mixFrames', () => {
  it('starts on the outgoing shape and ends on the incoming one', () => {
    const a = frameOf('breathing')
    const b = frameOf('working')
    expect(mixFrames(a, b, 0, 64)).toBe(a)
    expect(mixFrames(a, b, 1, 64)).toBe(b)
  })

  it('draws both shapes part-way, faded by how far the morph has gone', () => {
    const a = frameOf('breathing')
    const b = frameOf('composing')
    const mid = mixFrames(a, b, 0.5, 64)
    expect(mid.dots.length).toBeGreaterThan(
      Math.max(a.dots.length, b.dots.length)
    )
    for (const dot of mid.dots) {
      expect(dot.a).toBeLessThanOrEqual(0.5 + 1e-9)
      // Both shapes are drawn in toward the core, never outside the canvas.
      expect(dot.x).toBeGreaterThan(0)
      expect(dot.x).toBeLessThan(64)
    }
    // One z-sorted list, so the two shapes interleave in depth.
    const depths = mid.dots.map((dot) => dot.z)
    expect(depths).toEqual([...depths].sort((x, y) => x - y))
  })
})

describe('morphFrame', () => {
  it('runs the morph over MORPH_MS from when it started', () => {
    const to = resolvePreset('working', 64)
    const morph = {
      from: 'breathing' as const,
      to: 'working' as const,
      startedAt: 10_000,
    }
    const frame = morphFrame(morph, 64)
    // The orb hands the frame its clock already scaled by the target's speed.
    const at = (ms: number) => frame(64, (ms / 1000) * to.speed, to.opts)
    // Each state runs at its own tuned speed (computed as the frame does).
    const own = (state: 'breathing' | 'working', ms: number) =>
      frameOf(
        state,
        (((ms / 1000) * to.speed) / to.speed) * resolvePreset(state, 64).speed
      )

    expect(at(9_999)).toEqual(own('breathing', 9_999))
    expect(at(10_001 + MORPH_MS)).toEqual(own('working', 10_001 + MORPH_MS))
    const halfway = 10_000 + MORPH_MS / 2
    expect(at(halfway).dots.length).toBeGreaterThan(
      own('working', halfway).dots.length
    )
  })

  it('draws a settled state as is', () => {
    const preset = resolvePreset('composing', 64)
    const frame = morphFrame(
      { from: 'composing', to: 'composing', startedAt: 0 },
      64
    )
    expect(frame(64, 2, preset.opts)).toEqual(
      MODE_FRAMES[preset.mode](64, 2, preset.opts)
    )
  })
})
