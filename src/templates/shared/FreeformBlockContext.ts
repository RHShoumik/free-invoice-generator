import { createContext, useContext } from 'react'
import type { FreeformElementRect, FreeformElementStyle, FreeformFreeContent, FreeformFreeKind } from '../../types/invoice'

interface FreeformBlockContextValue {
  onMoveOrResize: (id: string, patch: Partial<FreeformElementRect>) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  /** For the 4 "free" element kinds (text/table/image/divider) — their own content, not backed by any `Invoice` field. */
  onUpdateContent: (id: string, patch: Partial<FreeformFreeContent>) => void
  /** `at` is a drop position in canvas px; without it the element lands at a default spot. `content` starts it with something (an uploaded image's data URL). */
  onAddElement: (kind: FreeformFreeKind, at?: { x: number; y: number }, content?: FreeformFreeContent) => void
  /** Font size/color/bold/italic override for the selected "free" element — see the contextual style toolbar. */
  onUpdateStyle: (id: string, patch: Partial<FreeformElementStyle>) => void
}

/**
 * Opt-in drag/resize/select for the Freeform Canvas layout — position and
 * selection state only. Rendering content and editing that content's text
 * is handled by `CanvasEditContext` instead (shared with all 21 layouts);
 * this context stays Freeform-exclusive, consumed only by
 * `FreeformBlockWrapper` and `FreeformTemplate`.
 *
 * Same opt-in-via-context, gate-on-null pattern as `CanvasEditContext` and
 * `LineItemsDragContext`, and for the same reason — `FreeformTemplate`
 * renders inside both the live editor preview and up to 105 independent
 * sample-data thumbnails in the design picker, so this must never leak into
 * a thumbnail (only `InvoicePreview` provides it).
 */
const FreeformBlockContext = createContext<FreeformBlockContextValue | null>(null)

export const FreeformBlockProvider = FreeformBlockContext.Provider

export function useFreeformBlock(): FreeformBlockContextValue | null {
  return useContext(FreeformBlockContext)
}
