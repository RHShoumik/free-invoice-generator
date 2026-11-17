import type { CSSProperties } from 'react'
import type { FreeformElementStyle } from '../../../types/invoice'

/**
 * Converts a Freeform element's style override into inline CSS. Always
 * applied as a `style` prop (never a className) on the actual text-bearing
 * node — inline `style` wins over that node's own default classes
 * regardless of specificity, which is what lets one override reliably beat
 * `FreeformTextElement`'s `text-sm text-slate-700` (or a table's default
 * font size) without fighting the cascade.
 *
 * Only includes keys that actually have a value — callers spread this over
 * their own default `style` object (e.g. the table's `fontSize: 13`), and an
 * explicit `fontSize: undefined` key would silently clobber that default
 * rather than leaving it alone.
 */
export function freeformStyleToCss(style?: FreeformElementStyle): CSSProperties {
  const css: CSSProperties = {}
  if (style?.fontSize !== undefined) css.fontSize = style.fontSize
  if (style?.color !== undefined) css.color = style.color
  if (style?.bold) css.fontWeight = 700
  if (style?.italic) css.fontStyle = 'italic'
  return css
}
