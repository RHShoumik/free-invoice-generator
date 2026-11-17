import { formatCurrency } from '../../lib/currency'
import { lineItemAmount } from '../../lib/calculations'
import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

/** Line items rendered as a vertical timeline instead of a table. */
export function TimelineTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {invoice.sections.logo && (
              <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} />
            )}
            <Movable id="brand">
              <p className="text-lg font-semibold text-slate-900">{invoice.from.name || 'Your Business'}</p>
              <p className="text-sm text-slate-500">{invoice.from.email}</p>
            </Movable>
          </div>
          <Movable id="title" className="text-right">
            <p className="text-3xl font-bold uppercase tracking-wide" style={{ color: accent }}>
              <Label id="title">Invoice</Label>
            </p>
            <p className="mt-1 text-sm text-slate-500"><FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></p>
            <p className="text-xs text-slate-400">
              <Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /> · <Label id="dueDate">Due</Label> <EditableDate value={invoice.dueDate} field="dueDate" />
            </p>
          </Movable>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8">
          {invoice.sections.from && (
            <PartyBlock
              label="From"
              party={invoice.from}
              which="from"
              labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400"
              nameClassName="mt-1 font-semibold text-slate-900"
              lineClassName="text-sm text-slate-500"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              label="Bill To"
              party={invoice.to}
              which="to"
              labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-400"
              nameClassName="mt-1 font-semibold text-slate-900"
              lineClassName="text-sm text-slate-500"
            />
          )}
        </div>

        <Movable id="worklog" as="p" className="mt-10 text-xs font-semibold uppercase tracking-widest text-slate-400">Work log</Movable>
        <Movable id="items" className="relative mt-4 border-l-2 pl-6" style={{ borderColor: `${accent}40` }}>
          {invoice.items.map((item, i) => (
            <div key={item.id} className="relative pb-6 last:pb-0">
              <div
                className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-white"
                style={{ borderColor: accent }}
              />
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium text-slate-800">{item.description || 'Untitled item'}</p>
                <p className="shrink-0 text-sm font-semibold text-slate-900">
                  {formatCurrency(lineItemAmount(item), invoice.currency)}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Step {i + 1} · Qty {item.quantity} × {formatCurrency(item.unitPrice, invoice.currency)}
              </p>
            </div>
          ))}
        </Movable>

        <div className="ml-auto mt-6 w-72">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-sm text-slate-600"
            totalRowClassName="mt-2 flex justify-between border-t-2 pt-2 text-base font-bold text-slate-900"
            totalRowStyle={{ borderColor: accent }}
          />
        </div>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-14 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-500">
            {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
            {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-14 grid grid-cols-2 gap-10"
            lineClassName="h-px w-full bg-slate-300"
            nameClassName="mt-3 text-sm font-semibold text-slate-900"
            labelClassName="text-xs text-slate-400"
            dateClassName="mt-2 text-xs text-slate-400"
          />
        )}
      </div>
    </InvoicePage>
  )
}
