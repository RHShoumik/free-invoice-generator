import { EditableDate, FieldText, Label } from '../../shared/primitives'
import type { Invoice } from '../../../types/invoice'

interface FreeformMetaBlockProps {
  invoice: Pick<Invoice, 'invoiceNumber' | 'issueDate' | 'dueDate'>
  accent: string
}

/**
 * The "Invoice" title + invoice number + issue/due dates. Like every other
 * layout, the title and the words in front of the dates are labels and the
 * number is a field: clicking one opens the left item drawer on just that. The
 * dates open a calendar on click (`EditableDate`) rather than being typed:
 * a native date input would bake an unfilterable calendar icon into the page,
 * and free text could leave an invalid ISO string for `formatDate()`.
 */
export function FreeformMetaBlock({ invoice, accent }: FreeformMetaBlockProps) {
  return (
    <div className="text-right">
      <p className="text-3xl font-bold uppercase tracking-wide" style={{ color: accent }}>
        <Label id="title">Invoice</Label>
      </p>
      <p className="mt-1 text-right text-sm text-slate-500">
        <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText>
      </p>
      <p className="mt-1 text-xs text-slate-400">
        <Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /> · <Label id="dueDate">Due</Label>{' '}
        <EditableDate value={invoice.dueDate} field="dueDate" />
      </p>
    </div>
  )
}
