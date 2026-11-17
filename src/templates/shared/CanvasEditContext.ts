import { createContext, useContext } from 'react'
import type { Invoice, LineItem, LineItemColumns, Party } from '../../types/invoice'
import type { TextTarget } from './ItemTarget'

interface CanvasEditContextValue {
  updateFrom: (patch: Partial<Party>) => void
  updateTo: (patch: Partial<Party>) => void
  updateField: <K extends keyof Invoice>(key: K, value: Invoice[K]) => void
  updateItem: (id: string, patch: Partial<Omit<LineItem, 'id'>>) => void
  addItem: () => void
  removeItem: (id: string) => void
  setColumnLabel: (column: keyof LineItemColumns, label: string) => void
  setCustomColumnLabel: (id: string, label: string) => void
  setItemCustomValue: (itemId: string, columnId: string, value: string) => void
  setLogo: (dataUrl: string | null) => void
  /**
   * Write what the user typed into a piece of text on the page (a label, the
   * invoice number, a footer paragraph…) — see `ItemText`, which edits it in
   * place. `undefined` is only ever sent for a label and means "back to the
   * layout's own wording". Optional: without it, an `ItemText` is plain text.
   */
  editText?: (target: TextTarget, text: string | undefined) => void
  /**
   * The invoice's accent color, for editing chrome that floats *outside* the
   * invoice page (the date picker's calendar is portaled to the document, so
   * it can't inherit the page's styles). Optional: without it the chrome
   * falls back to the editor's own brand color.
   */
  accentColor?: string
}

/**
 * Opt-in click-to-edit for the shared primitives every one of the 105
 * designs is built from — `PartyBlock`, `LineItemsTable`, `Logo`. Same
 * "opt-in via context, gate on null" pattern as `LineItemsDragContext` and
 * `FreeformBlockContext`, and for the identical reason: these primitives
 * render inside both the one live, store-backed editor preview
 * (`InvoicePreview`) and up to 105 independent sample-data thumbnails in the
 * design picker (`TemplateThumbnail`, each with its own local
 * `createSampleInvoice()`). If a primitive called the global store directly,
 * clicking into a *thumbnail* would silently edit whatever the user is
 * actually working on. Only `InvoicePreview` provides this; thumbnails never
 * do, so every consumer must render read-only when `useCanvasEdit()` is null.
 *
 * Deliberately separate from `FreeformBlockContext` (position/selection) —
 * that state is meaningless to `PartyBlock`/`LineItemsTable`/`Logo`, which
 * are shared by all 21 layouts, not just Freeform Canvas. Bundling the two
 * would leak a Freeform-only concept into files that should have zero
 * awareness of it.
 */
const CanvasEditContext = createContext<CanvasEditContextValue | null>(null)

export const CanvasEditProvider = CanvasEditContext.Provider

export function useCanvasEdit(): CanvasEditContextValue | null {
  return useContext(CanvasEditContext)
}
