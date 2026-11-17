import type { Invoice, LineItem } from '../types/invoice'

/** Pure math only — this is the one module invoice correctness depends on. */

export function lineItemAmount(item: Pick<LineItem, 'quantity' | 'unitPrice'>): number {
  return item.quantity * item.unitPrice
}

export function subtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + lineItemAmount(item), 0)
}

export function discountAmount(subtotalValue: number, discountPct: number): number {
  return subtotalValue * (discountPct / 100)
}

export function taxAmount(subtotalValue: number, discountValue: number, taxRatePct: number): number {
  return (subtotalValue - discountValue) * (taxRatePct / 100)
}

export interface InvoiceTotals {
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
}

export function computeTotals(invoice: Pick<Invoice, 'items' | 'taxRatePct' | 'discountPct'>): InvoiceTotals {
  const sub = subtotal(invoice.items)
  const discount = discountAmount(sub, invoice.discountPct)
  const tax = taxAmount(sub, discount, invoice.taxRatePct)
  const total = sub - discount + tax
  return { subtotal: sub, discountAmount: discount, taxAmount: tax, total }
}
