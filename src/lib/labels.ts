import type { InvoiceLabels, LabelKey } from '../types/invoice'

/**
 * The words printed for one label: what the user typed, or — until they type
 * something — the layout's own wording (`fallback`). An empty string is the
 * user's choice to print nothing, so it is returned as-is, not replaced.
 */
export function resolveLabel(labels: InvoiceLabels | undefined, key: LabelKey, fallback: string): string {
  return labels?.[key] ?? fallback
}

/** What each label is called in the item drawer's heading ("Issue date label"). */
export const LABEL_TITLES: Record<LabelKey, string> = {
  title: 'Title',
  invoiceNumber: 'Invoice number',
  issueDate: 'Issue date',
  dueDate: 'Due date',
  from: 'From',
  billTo: 'Bill to',
  subtotal: 'Subtotal',
  discount: 'Discount',
  tax: 'Tax',
  total: 'Total',
  paymentTerms: 'Payment terms',
  bankDetails: 'Bank details',
  signatureBusiness: 'Business signature',
  signatureClient: 'Client signature',
}
