import type { CSSProperties } from 'react'

/**
 * The merchant's colour as CSS variables for the storefront. Text on the
 * colour is white or ink, whichever contrasts more; when the colour itself is
 * too faint against the page (3:1), lines and accent text use the page's
 * foreground instead.
 */
const INK = '#111418'
const NIGHT = '#0d1117'

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

export function brandStyle(
  primaryColor: string | null | undefined,
  dark = false
): CSSProperties {
  const custom = primaryColor && /^#[0-9a-f]{6}$/i.test(primaryColor)
  const color = custom ? primaryColor : dark ? '#f4f5f7' : INK
  const l = luminance(color)
  const onColor =
    contrast(l, 1) >= contrast(l, luminance(INK)) ? '#ffffff' : INK
  const page = dark ? luminance(NIGHT) : 1
  const accentText = contrast(l, page) >= 3 ? color : dark ? '#ffffff' : INK
  return {
    '--store-accent': color,
    '--store-on-accent': onColor,
    '--store-accent-text': accentText,
  } as CSSProperties
}

/** Buttons in the merchant's colour. */
export const accentButton =
  'bg-[var(--store-accent)] text-[var(--store-on-accent)] hover:bg-[var(--store-accent)] hover:opacity-90 focus-visible:ring-[var(--store-accent)]/40'
