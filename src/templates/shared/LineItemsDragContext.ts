import { createContext, useContext } from 'react'

interface LineItemsDragContextValue {
  onReorder: (fromIndex: number, toIndex: number) => void
}

/**
 * Opt-in drag-to-reorder for `LineItemsTable`. `LineItemsTable` renders in
 * two very different places: the one live, store-backed editor preview
 * (`InvoicePreview`), and up to 100 independent, throwaway sample-data
 * thumbnails in the design picker grid (`TemplateThumbnail`) — each with its
 * own local `createSampleInvoice()`, unrelated to whatever the user is
 * actually editing. If `LineItemsTable` reordered items by calling the
 * global store directly, dragging a row in ANY thumbnail card would reorder
 * the *currently-edited* invoice behind the scenes — a real, confusing bug.
 * Context makes drag opt-in per render tree: only `InvoicePreview` provides
 * it, so thumbnails (which never provide it) stay inert previews.
 */
const LineItemsDragContext = createContext<LineItemsDragContextValue | null>(null)

export const LineItemsDragProvider = LineItemsDragContext.Provider

export function useLineItemsDrag(): LineItemsDragContextValue | null {
  return useContext(LineItemsDragContext)
}
