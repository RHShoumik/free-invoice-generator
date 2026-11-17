import type { Invoice } from '../../types/invoice'

/**
 * Whether the footer block (payment terms / bank details / notes) should
 * render at all. A section only counts if its toggle is on *and* it has
 * content — an enabled-but-empty field shouldn't leave a blank paragraph.
 */
export function hasFooterContent(
  invoice: Pick<Invoice, 'sections' | 'paymentTerms' | 'bankDetails' | 'notes'>,
): boolean {
  return (
    (invoice.sections.paymentTerms && Boolean(invoice.paymentTerms)) ||
    (invoice.sections.bankDetails && Boolean(invoice.bankDetails)) ||
    (invoice.sections.notes && Boolean(invoice.notes))
  )
}
