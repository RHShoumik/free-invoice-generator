import type { Invoice } from '../../types/invoice'

/**
 * Every template component implements this. It's intentionally the only
 * contract a template has to satisfy — see docs/ADDING_A_TEMPLATE.md.
 */
export interface InvoiceTemplateProps {
  invoice: Invoice
}
