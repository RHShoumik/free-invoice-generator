const WHITE = '#ffffff'
const INK = '#0f172a'

/** Relative luminance of `#0f172a` (WCAG), the dark text color used on light backgrounds. */
const INK_LUMINANCE = 0.0088

function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminanceOf(hex: string): number | null {
  const full = /^#([0-9a-f]{3})$/i.test(hex) ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(full)
  if (!match) return null
  const [r, g, b] = [match[1], match[2], match[3]].map((h) => channel(parseInt(h, 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * The text color to put on top of a `#rgb`/`#rrggbb` background — white on a
 * dark one, near-black on a light one, whichever reads with more contrast.
 * Anything that isn't a hex color (a CSS variable, a named color) gets white.
 */
export function onAccentColor(hex: string): typeof WHITE | typeof INK {
  const luminance = luminanceOf(hex)
  if (luminance === null) return WHITE
  const againstWhite = 1.05 / (luminance + 0.05)
  const againstInk = (luminance + 0.05) / (INK_LUMINANCE + 0.05)
  return againstWhite >= againstInk ? WHITE : INK
}
