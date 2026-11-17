import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

/** Newspaper-masthead style — a nameplate, rules, byline-style meta. */
export function EditorialTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font}>
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="text-center">
          <Movable id="brand" as="p" className="text-xs font-bold uppercase tracking-[0.4em] text-slate-400">
            {invoice.from.name || 'Your Business'}
          </Movable>
          <Movable id="title" as="p" className="mt-2 text-6xl font-black uppercase tracking-tight text-slate-900"><Label id="title">Invoice</Label></Movable>
        </div>

        <Movable id="meta" className="mt-4 border-y-4 border-slate-900 py-2">
          <div className="flex justify-center gap-8 text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>
            <span><Label id="invoiceNumber">No.</Label> <FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></span>
            <span><Label id="issueDate">Issued</Label> <EditableDate value={invoice.issueDate} field="issueDate" /></span>
            <span><Label id="dueDate">Due</Label> <EditableDate value={invoice.dueDate} field="dueDate" /></span>
          </div>
        </Movable>

        <div className="mt-8 flex items-start justify-between gap-8 border-b border-slate-300 pb-8">
          {invoice.sections.logo && (
            <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} radius={4} />
          )}
          <div className="grid flex-1 grid-cols-2 gap-8">
            {invoice.sections.from && (
              <PartyBlock
                label="From the desk of"
                party={invoice.from}
                which="from"
                labelClassName="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                nameClassName="mt-1 font-semibold text-slate-900"
                lineClassName="text-sm text-slate-500"
              />
            )}
            {invoice.sections.to && (
              <PartyBlock
                label="Addressed to"
                party={invoice.to}
                which="to"
                labelClassName="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                nameClassName="mt-1 font-semibold text-slate-900"
                lineClassName="text-sm text-slate-500"
              />
            )}
          </div>
        </div>

        <div className="mt-8">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headClassName="border-b-2 border-slate-900"
            headCellClassName="py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500"
            rowClassName="border-b border-slate-200"
            cellClassName="py-3 text-sm text-slate-700"
          />
        </div>

        <div className="ml-auto mt-6 w-72">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-sm text-slate-600"
            totalRowClassName="mt-2 flex justify-between border-t-4 border-slate-900 pt-2 text-base font-bold text-slate-900"
            totalValueStyle={{ color: accent }}
          />
        </div>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-14 space-y-2 border-t border-slate-300 pt-6 text-center text-sm text-slate-500">
            {invoice.sections.paymentTerms && invoice.paymentTerms && <p><FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText></p>}
            {invoice.sections.bankDetails && invoice.bankDetails && <p><FieldText field="bankDetails">{invoice.bankDetails}</FieldText></p>}
            {invoice.sections.notes && invoice.notes && <p className="italic"><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-14 grid grid-cols-2 gap-10"
            lineClassName="h-px w-full bg-slate-400"
            nameClassName="mt-3 text-sm font-semibold text-slate-900"
            labelClassName="text-xs text-slate-400"
            dateClassName="mt-2 text-xs text-slate-400"
          />
        )}
      </div>
    </InvoicePage>
  )
}
