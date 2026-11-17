import type { CSSProperties } from 'react'
import { computeTotals } from '../../../lib/calculations'
import { formatCurrency } from '../../../lib/currency'
import { useMovableSection } from '../SectionOffsetsContext'
import { Label } from './Label'
import type { Invoice } from '../../../types/invoice'

interface TotalsProps {
  invoice: Pick<Invoice, 'items' | 'taxRatePct' | 'discountPct' | 'currency'>
  className?: string
  rowClassName?: string
  labelClassName?: string
  valueClassName?: string
  totalRowClassName?: string
  totalLabelClassName?: string
  totalValueClassName?: string
  /** For dynamic (user-chosen) accent colors, which can't be expressed as static Tailwind classes. */
  totalRowStyle?: CSSProperties
  totalValueStyle?: CSSProperties
}

/**
 * Renders subtotal / discount / tax / total. Discount and tax rows only
 * appear when they're non-zero, so a plain invoice doesn't show "Tax: 0%".
 */
export function Totals({
  invoice,
  className,
  rowClassName,
  labelClassName,
  valueClassName,
  totalRowClassName,
  totalLabelClassName,
  totalValueClassName,
  totalRowStyle,
  totalValueStyle,
}: TotalsProps) {
  const totals = computeTotals(invoice)
  const { currency } = invoice
  const movable = useMovableSection('totals')

  return (
    <div className={className} style={movable.style} {...movable.attrs}>
      <div className={rowClassName}>
        <span className={labelClassName}>
          <Label id="subtotal">Subtotal</Label>
        </span>
        <span className={valueClassName}>{formatCurrency(totals.subtotal, currency)}</span>
      </div>
      {invoice.discountPct > 0 && (
        <div className={rowClassName}>
          <span className={labelClassName}>
            <Label id="discount">Discount</Label> ({invoice.discountPct}%)
          </span>
          <span className={valueClassName}>-{formatCurrency(totals.discountAmount, currency)}</span>
        </div>
      )}
      {invoice.taxRatePct > 0 && (
        <div className={rowClassName}>
          <span className={labelClassName}>
            <Label id="tax">Tax</Label> ({invoice.taxRatePct}%)
          </span>
          <span className={valueClassName}>{formatCurrency(totals.taxAmount, currency)}</span>
        </div>
      )}
      <div className={totalRowClassName} style={totalRowStyle}>
        <span className={totalLabelClassName}>
          <Label id="total">Total</Label>
        </span>
        <span className={totalValueClassName} style={totalValueStyle}>
          {formatCurrency(totals.total, currency)}
        </span>
      </div>
    </div>
  )
}
