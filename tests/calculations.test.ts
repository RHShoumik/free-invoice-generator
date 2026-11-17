import { describe, expect, it } from 'vitest'
import { computeTotals, discountAmount, lineItemAmount, subtotal, taxAmount } from '../src/lib/calculations'
import type { LineItem } from '../src/types/invoice'

const items: LineItem[] = [
  { id: '1', description: 'Design', quantity: 2, unitPrice: 100 },
  { id: '2', description: 'Development', quantity: 5, unitPrice: 80 },
]

describe('lineItemAmount', () => {
  it('multiplies quantity by unit price', () => {
    expect(lineItemAmount({ quantity: 3, unitPrice: 50 })).toBe(150)
  })
})

describe('subtotal', () => {
  it('sums all line item amounts', () => {
    expect(subtotal(items)).toBe(2 * 100 + 5 * 80)
  })

  it('returns 0 for an empty list', () => {
    expect(subtotal([])).toBe(0)
  })
})

describe('discountAmount', () => {
  it('applies a percentage discount to the subtotal', () => {
    expect(discountAmount(1000, 10)).toBe(100)
  })

  it('is 0 when discount is 0', () => {
    expect(discountAmount(1000, 0)).toBe(0)
  })
})

describe('taxAmount', () => {
  it('taxes the post-discount amount, not the raw subtotal', () => {
    // subtotal 1000, discount 100 -> taxable 900, 10% tax -> 90
    expect(taxAmount(1000, 100, 10)).toBe(90)
  })
})

describe('computeTotals', () => {
  it('combines subtotal, discount, and tax into a final total', () => {
    const totals = computeTotals({ items, taxRatePct: 10, discountPct: 10 })
    const expectedSubtotal = 600
    const expectedDiscount = 60
    const expectedTax = (expectedSubtotal - expectedDiscount) * 0.1
    expect(totals.subtotal).toBe(expectedSubtotal)
    expect(totals.discountAmount).toBe(expectedDiscount)
    expect(totals.taxAmount).toBeCloseTo(expectedTax)
    expect(totals.total).toBeCloseTo(expectedSubtotal - expectedDiscount + expectedTax)
  })

  it('handles no tax and no discount', () => {
    const totals = computeTotals({ items, taxRatePct: 0, discountPct: 0 })
    expect(totals.total).toBe(subtotal(items))
  })
})
