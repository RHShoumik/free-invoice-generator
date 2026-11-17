import { FreeformDividerElement } from './FreeformDividerElement'
import { FreeformDrawingElement } from './FreeformDrawingElement'
import { FreeformImageElement } from './FreeformImageElement'
import { FreeformTableElement } from './FreeformTableElement'
import { FreeformTextElement } from './FreeformTextElement'
import type { FreeformElement } from '../../../types/invoice'

/**
 * Renders one of the "free" element kinds (text/table/image/divider/drawing).
 * Shared by Freeform Canvas (which lays every element out itself) and by the
 * free-element overlay `InvoicePreview` draws on top of the 20 fixed
 * layouts, so a Text box looks and behaves identically in both. Returns
 * `null` for the "bound" kinds — those render from `Invoice` fields instead.
 */
export function FreeformFreeElement({ element }: { element: FreeformElement }) {
  switch (element.kind) {
    case 'text':
      return <FreeformTextElement element={element} />
    case 'table':
      return <FreeformTableElement element={element} />
    case 'image':
      return <FreeformImageElement element={element} />
    case 'divider':
      return <FreeformDividerElement style={element.style} />
    case 'drawing':
      return <FreeformDrawingElement element={element} />
    default:
      return null
  }
}
