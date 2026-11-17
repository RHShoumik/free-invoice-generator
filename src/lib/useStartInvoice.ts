import { useNavigate } from 'react-router-dom'
import { useInvoiceStore } from '../store/invoiceStore'

/** The design a "one click" start opens: the first, plain one — everything on it is click-to-edit. */
export const DEFAULT_TEMPLATE_ID = 'classic'

/**
 * Starts a fresh, ready-made invoice on a design (the plain one by default) and
 * opens the editor — what every "create an invoice" button and design card does.
 */
export function useStartInvoice() {
  const navigate = useNavigate()
  const startNewInvoice = useInvoiceStore((s) => s.startNewInvoice)
  return (templateId: string = DEFAULT_TEMPLATE_ID) => {
    startNewInvoice(templateId, true)
    navigate('/editor')
  }
}
