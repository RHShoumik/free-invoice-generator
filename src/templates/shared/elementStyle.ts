import type { CSSProperties } from 'react'
import type { FreeformElementStyle } from '../../types/invoice'

export const MIN_SCALE = 0.5
export const MAX_SCALE = 3
export const MIN_OPACITY = 0.02

/** What to put on an element so a `FreeformElementStyle` override shows through its hand-styled contents. */
interface StyleOverride {
  /** `data-ov-*` flags — the rules in `index.css` key off these. */
  attrs: Record<string, string>
  /** The CSS variable carrying the color. */
  vars: CSSProperties
  /** Size multiplier (1 = the design's own size). */
  scale: number
  /** An explicit opacity, or undefined to leave the design's own. */
  opacity: number | undefined
}

/**
 * Color, bold and italic are applied as attributes + a CSS variable that
 * `index.css` turns into `!important` rules over the element *and every
 * descendant*. That's what lets one setting reach text the built-in sections
 * style line by line with their own classes (a Tailwind `text-slate-500` or an
 * inline accent color would otherwise beat anything inherited from the block),
 * and why it's not just `style={{ color }}` on the root.
 *
 * Size is a `scale` the caller composes into its own `transform` (see
 * `useMovableSection`, `FreeformBlockWrapper`) rather than a font size, so
 * the block keeps its proportions and, being a transform, never reflows or
 * displaces its neighbors.
 */
export function styleOverride(style: FreeformElementStyle | undefined): StyleOverride {
  const attrs: Record<string, string> = {}
  const vars: Record<string, string> = {}
  if (style?.color) {
    attrs['data-ov-color'] = ''
    vars['--ov-color'] = style.color
  }
  if (style?.bold) attrs['data-ov-bold'] = ''
  if (style?.italic) attrs['data-ov-italic'] = ''
  const scale = style?.scale && Math.abs(style.scale - 1) > 0.001 ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, style.scale)) : 1
  const opacity = style?.opacity === undefined ? undefined : Math.min(1, Math.max(MIN_OPACITY, style.opacity))
  return { attrs, vars: vars as CSSProperties, scale, opacity }
}
