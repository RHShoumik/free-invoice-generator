import type { CSSProperties } from 'react'
import { useMovableSection } from '../SectionOffsetsContext'
import { Label } from './Label'
import type { Invoice } from '../../../types/invoice'

interface SignatureProps {
  invoice: Pick<Invoice, 'from' | 'to'>
  className?: string
  columnClassName?: string
  lineClassName?: string
  lineStyle?: CSSProperties
  nameClassName?: string
  labelClassName?: string
  dateClassName?: string
}

/**
 * A two-party sign-off block: a line to sign above, the printed name below
 * it, and a blank date line. Used identically by every template — only the
 * className/style hooks change to match each design's look.
 */
export function Signature({
  invoice,
  className,
  columnClassName,
  lineClassName,
  lineStyle,
  nameClassName,
  labelClassName,
  dateClassName,
}: SignatureProps) {
  const movable = useMovableSection('signature')
  return (
    <div className={className} style={movable.style} {...movable.attrs}>
      <div className={columnClassName}>
        <div className={lineClassName} style={lineStyle} />
        <p className={nameClassName}>{invoice.from.name || 'Business representative'}</p>
        <p className={labelClassName}>
          <Label id="signatureBusiness">Authorized signature</Label>
        </p>
        <p className={dateClassName}>Date: ______________</p>
      </div>
      <div className={columnClassName}>
        <div className={lineClassName} style={lineStyle} />
        <p className={nameClassName}>{invoice.to.name || 'Client representative'}</p>
        <p className={labelClassName}>
          <Label id="signatureClient">Accepted by</Label>
        </p>
        <p className={dateClassName}>Date: ______________</p>
      </div>
    </div>
  )
}
