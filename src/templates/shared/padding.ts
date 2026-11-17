import type { CSSProperties } from 'react'
import type { PagePadding } from '../../types/invoice'

/**
 * Converts the user-configurable padding into inline styles for a
 * template's body content wrapper. Deliberately NOT applied by InvoicePage
 * itself — full-bleed elements (a gradient header band, a colored accent
 * bar) need to stay edge-to-edge regardless of this setting, so each
 * template applies it only to its inner content div.
 */
export function paddingStyle(padding: PagePadding): CSSProperties {
  return {
    paddingTop: padding.top,
    paddingRight: padding.right,
    paddingBottom: padding.bottom,
    paddingLeft: padding.left,
  }
}
