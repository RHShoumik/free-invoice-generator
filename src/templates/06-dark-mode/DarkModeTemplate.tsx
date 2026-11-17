import type { InvoiceTemplateProps } from '../shared/InvoiceTemplateProps'
import { EditableDate, FieldText, InvoicePage, Label, LineItemsTable, Logo, Movable, PartyBlock, Signature, Totals } from '../shared/primitives'
import { paddingStyle } from '../shared/padding'
import { hasFooterContent } from '../shared/sectionVisibility'

export function DarkModeTemplate({ invoice }: InvoiceTemplateProps) {
  const accent = invoice.theme.accentColor

  return (
    <InvoicePage font={invoice.theme.font} background="#0b1120" color="#e2e8f0">
      <div style={paddingStyle(invoice.theme.padding)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {invoice.sections.logo && (
              <Logo logoDataUrl={invoice.logoDataUrl} businessName={invoice.from.name} accentColor={accent} />
            )}
            <Movable id="brand">
              <p className="text-lg font-semibold text-white">{invoice.from.name || 'Your Business'}</p>
              <p className="text-sm text-slate-400">{invoice.from.email}</p>
            </Movable>
          </div>
          <Movable id="title" className="text-right">
            <p className="text-3xl font-bold uppercase tracking-wide" style={{ color: accent }}>
              <Label id="title">Invoice</Label>
            </p>
            <p className="mt-1 text-sm text-slate-400"><FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></p>
          </Movable>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8">
          {invoice.sections.from && (
            <PartyBlock
              label="From"
              party={invoice.from}
              which="from"
              labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-500"
              nameClassName="mt-1 font-semibold text-white"
              lineClassName="text-sm text-slate-400"
            />
          )}
          {invoice.sections.to && (
            <PartyBlock
              label="Bill To"
              party={invoice.to}
              which="to"
              labelClassName="text-xs font-semibold uppercase tracking-wider text-slate-500"
              nameClassName="mt-1 font-semibold text-white"
              lineClassName="text-sm text-slate-400"
            />
          )}
        </div>

        <Movable id="meta" className="mt-8 grid grid-cols-3 gap-4 rounded-lg bg-white/5 p-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500"><Label id="invoiceNumber">Invoice #</Label></p>
            <p className="mt-1 text-slate-200"><FieldText field="invoiceNumber">{invoice.invoiceNumber}</FieldText></p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500"><Label id="issueDate">Issue Date</Label></p>
            <p className="mt-1 text-slate-200"><EditableDate value={invoice.issueDate} field="issueDate" /></p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500"><Label id="dueDate">Due Date</Label></p>
            <p className="mt-1 text-slate-200"><EditableDate value={invoice.dueDate} field="dueDate" /></p>
          </div>
        </Movable>

        <div className="mt-10">
          <LineItemsTable
            items={invoice.items}
            currency={invoice.currency}
            columns={invoice.lineItemColumns}
            customColumns={invoice.customColumns}
            headClassName="border-b border-white/20"
            headCellClassName="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
            rowClassName="border-b border-white/10"
            cellClassName="py-3 text-sm text-slate-200"
          />
        </div>

        <Movable id="totals" className="ml-auto mt-6 w-72 rounded-lg bg-white/5 p-4">
          <Totals
            invoice={invoice}
            rowClassName="flex justify-between py-1 text-sm text-slate-400"
            totalRowClassName="mt-2 flex justify-between border-t border-white/20 pt-2 text-base font-bold"
            totalValueStyle={{ color: accent }}
          />
        </Movable>

        {hasFooterContent(invoice) && (
          <Movable id="footer" className="mt-14 space-y-3 border-t border-white/10 pt-6 text-sm text-slate-400">
            {invoice.sections.paymentTerms && invoice.paymentTerms && (
              <p>
                <span className="font-semibold text-slate-200"><Label id="paymentTerms">Payment Terms</Label>: </span>
                <FieldText field="paymentTerms">{invoice.paymentTerms}</FieldText>
              </p>
            )}
            {invoice.sections.bankDetails && invoice.bankDetails && (
              <p>
                <span className="font-semibold text-slate-200"><Label id="bankDetails">Bank Details</Label>: </span>
                <FieldText field="bankDetails">{invoice.bankDetails}</FieldText>
              </p>
            )}
            {invoice.sections.notes && invoice.notes && <p><FieldText field="notes">{invoice.notes}</FieldText></p>}
          </Movable>
        )}

        {invoice.sections.signature && (
          <Signature
            invoice={invoice}
            className="mt-16 grid grid-cols-2 gap-10"
            lineClassName="h-px w-full bg-white/20"
            nameClassName="mt-3 text-sm font-semibold text-white"
            labelClassName="text-xs text-slate-400"
            dateClassName="mt-2 text-xs text-slate-400"
          />
        )}
      </div>
    </InvoicePage>
  )
}
