import {
  finalizeFrame,
  lerp,
  MODE_FRAMES,
  resolvePreset,
  type Dot,
  type Line,
  type ModeFrame,
  type OrbFrame,
  type OrbSize,
  type OrbState,
} from 'thinking-orbs'

/** How long one orb state takes to morph into the next. */
export const MORPH_MS = 640

/** How far the outgoing shape turns as it hands over to the next (radians). */
const SWIRL = 0.9
/** How far both shapes draw in toward the core at the midpoint of a morph. */
const PINCH = 0.7

export interface OrbMorph {
  from: OrbState
  to: OrbState
  /** performance.now() when the morph began. */
  startedAt: number
}

const easeInOut = (k: number) =>
  k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2

/**
 * One frame part-way from `a` to `b` (`k` from 0 to 1): the outgoing dots draw in
 * and turn away as they fade, the incoming ones bloom out of the core, and the
 * two sets are z-sorted together so the orb reads as one shape changing.
 */
export function mixFrames(
  a: OrbFrame,
  b: OrbFrame,
  k: number,
  size: number
): OrbFrame {
  if (k <= 0) return a
  if (k >= 1) return b
  const center = size / 2
  const move = (scale: number, turn: number) => {
    const cos = Math.cos(turn) * scale
    const sin = Math.sin(turn) * scale
    return (x: number, y: number): [number, number] => {
      const dx = x - center
      const dy = y - center
      return [center + dx * cos - dy * sin, center + dx * sin + dy * cos]
    }
  }
  const place = (
    frame: OrbFrame,
    scale: number,
    turn: number,
    weight: number
  ) => {
    const at = move(scale, turn)
    const dots = frame.dots.map((dot): Dot => {
      const [x, y] = at(dot.x, dot.y)
      return {
        ...dot,
        x,
        y,
        r: dot.r * lerp(0.7, 1, weight),
        a: (dot.a ?? 1) * weight,
      }
    })
    const lines = frame.lines.map((line): Line => {
      const [x1, y1] = at(line.x1, line.y1)
      const [x2, y2] = at(line.x2, line.y2)
      return { ...line, x1, y1, x2, y2, a: (line.a ?? 1) * weight }
    })
    return { dots, lines }
  }
  const outgoing = place(a, lerp(1, PINCH, k), SWIRL * k, 1 - k)
  const incoming = place(b, lerp(PINCH, 1, k), -SWIRL * (1 - k), k)
  return finalizeFrame(
    [...outgoing.dots, ...incoming.dots],
    [...outgoing.lines, ...incoming.lines]
  )
}

/**
 * The `frame` for a ThinkingOrb rendered with `state={morph.to}`: each state is
 * drawn at its own tuned speed, and while the morph runs the two are mixed.
 */
export function morphFrame(morph: OrbMorph, size: OrbSize): ModeFrame {
  const from = resolvePreset(morph.from, size)
  const to = resolvePreset(morph.to, size)
  const draw = (preset: typeof to, seconds: number) =>
    MODE_FRAMES[preset.mode](size, seconds * preset.speed, preset.opts)
  return (_size, t) => {
    // The orb passes t already scaled by the `state` preset's speed.
    const seconds = t / to.speed
    const k =
      morph.from === morph.to
        ? 1
        : easeInOut(
            Math.min(
              1,
              Math.max(0, (seconds * 1000 - morph.startedAt) / MORPH_MS)
            )
          )
    if (k >= 1) return draw(to, seconds)
    return mixFrames(draw(from, seconds), draw(to, seconds), k, size)
  }
}
