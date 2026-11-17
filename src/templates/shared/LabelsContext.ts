import { createContext, useContext } from 'react'
import type { InvoiceLabels } from '../../types/invoice'

/**
 * The user's own wording for the printed labels (`invoice.labels`), for the
 * `Label` primitive. Provided by `InvoicePreview` — the one live render of
 * the invoice, which is also the node every PNG/PDF export captures — and not
 * by design-picker thumbnails, which always print each layout's own wording.
 * Same opt-in-via-context pattern as `CanvasEditContext`.
 */
const LabelsContext = createContext<InvoiceLabels | undefined>(undefined)

export const LabelsProvider = LabelsContext.Provider

export function useLabels(): InvoiceLabels | undefined {
  return useContext(LabelsContext)
}
